import {z} from 'zod';
import {DomainError,uid,now} from './model.ts';
import type {State,Store} from './model.ts';
import {transact,journal,say} from './engine.ts';

export const services={
 restaurant:{label:'Restaurant',name:'Second Take Bistro',capacity:12,duration:90},
 appointment:{label:'Appointment',name:'Second Take Studio',capacity:1,duration:60},
 event:{label:'Event',name:'Second Take Evening',capacity:12,duration:120}
} as const;
export type ServiceKind=keyof typeof services;
export interface ReservationDetails {service:ServiceKind;venue:string;location:string;date:string;time:string;timeZone:string;people:number;}
export interface Reservation extends ReservationDetails {id:string;version:number;active:boolean;createdBy:string;updatedBy:string;}
export interface BookingDraft {service:ServiceKind;venue?:string;location?:string;date?:string;time?:string;timeZone:string;people?:number;reservationId?:string;expectedVersion?:number;}
export interface ServicePlan {id:string;revision:string;requestKey:string;intentKey:string;type:'create'|'update'|'cancel';status:'awaiting_approval'|'approved'|'completed'|'superseded'|'conflict';createdAt:string;expiresAt:string;approvedAt?:string;completedAt?:string;reservationId:string;expectedVersion?:number;before?:Reservation;details:ReservationDetails;error?:string;}

export const detailsSchema=z.object({service:z.enum(['restaurant','appointment','event']),venue:z.string().trim().min(1).max(100),location:z.string().trim().min(1).max(100),date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),time:z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/),timeZone:z.string().min(1).max(80),people:z.number().int().min(1).max(12)}).strict();
export const serviceBookingSchema=detailsSchema.extend({requestKey:z.string().min(8).max(120),reservationId:z.string().uuid().optional(),expectedVersion:z.number().int().positive().optional()}).strict();
export function localDate(timeZone:string,at=new Date()){
 const parts=new Intl.DateTimeFormat('en-CA',{timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(at);
 const get=(n:string)=>parts.find(p=>p.type===n)!.value;
 return {date:`${get('year')}-${get('month')}-${get('day')}`,time:`${get('hour')}:${get('minute')}`};
}
export function reservationInstant(d:Pick<ReservationDetails,'date'|'time'|'timeZone'>){
 const requested=d.date+'T'+d.time;const naive=Date.parse(requested+':00Z');let instant=naive;
 for(let i=0;i<4;i++){const local=localDate(d.timeZone,new Date(instant));const represented=Date.parse(local.date+'T'+local.time+':00Z');const delta=naive-represented;if(!delta)break;instant+=delta;}
 const matches=(value:number)=>{const local=localDate(d.timeZone,new Date(value));return local.date+'T'+local.time===requested;};
 if(!matches(instant))throw new DomainError('VALIDATION','That local time does not exist because the clock changes. Choose another time.');
 if([-7200000,-3600000,-1800000,1800000,3600000,7200000].some(offset=>matches(instant+offset)))throw new DomainError('VALIDATION','That local time occurs twice because the clock changes. Choose an unambiguous time.');
 return instant;
}
export function validateDetails(details:ReservationDetails,at=new Date()){
 detailsSchema.parse(details);
 let clock;try{clock=localDate(details.timeZone,at);}catch{throw new DomainError('VALIDATION','Choose a valid IANA time zone, such as Asia/Kolkata.');}
 const date=new Date(details.date+'T12:00:00Z');
 if(!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==details.date)throw new DomainError('VALIDATION','That date does not exist. Use YYYY-MM-DD.');
 if(reservationInstant(details)<=at.getTime())throw new DomainError('VALIDATION','Choose a future date and time in the displayed time zone.');
 if(details.people>services[details.service].capacity)throw new DomainError('CAPACITY',details.service==='appointment'?'Appointments are for one person in this simulator.':'This simulator supports up to 12 people.');
}
function capacity(s:State,d:ReservationDetails,exclude?:string){
 const start=reservationInstant(d),duration=services[d.service].duration*60000;
 const matches=(s.reservations??[]).filter(r=>r.active&&r.id!==exclude&&r.service===d.service&&r.venue.toLowerCase()===d.venue.toLowerCase()&&r.location.toLowerCase()===d.location.toLowerCase()&&reservationInstant(r)<start+duration&&start<reservationInstant(r)+duration);
 if(matches.reduce((n,r)=>n+r.people,0)+d.people>services[d.service].capacity)throw new DomainError('CAPACITY','That simulated time slot is full. Choose another time or fewer people.');
}
function locate(s:State,id:string){const r=s.reservations?.find(r=>r.id===id&&r.active);if(!r)throw new DomainError('NOT_FOUND','That active reservation was not found in this workspace.');return r;}
function getPlan(s:State,id:string){const p=s.servicePlans?.find(p=>p.id===id);if(!p)throw new DomainError('NOT_FOUND','That reservation plan was not found in this workspace.');return p;}
function stage(s:State,type:ServicePlan['type'],details:ReservationDetails,key:string,before?:Reservation){
 s.servicePlans??=[];const intentKey=JSON.stringify([type,details,before?.id??null,before?.version??null]);
 const prior=s.servicePlans.find(p=>p.requestKey===key);if(prior){if(prior.intentKey!==intentKey)throw new DomainError('KEY_REUSED','This request key was used for another plan.');return prior;}
 if(s.servicePlans.length>=150)throw new DomainError('DEMO_LIMIT','This workspace has reached its plan limit. Export its receipt before resetting.');
 for(const p of s.servicePlans)if(['awaiting_approval','approved'].includes(p.status))p.status='superseded';
 const p:ServicePlan={id:uid(),revision:uid(),requestKey:key,intentKey,type,details:structuredClone(details),before:before?structuredClone(before):undefined,reservationId:before?.id??uid(),expectedVersion:before?.version,status:'awaiting_approval',createdAt:now(),expiresAt:new Date(Date.now()+15*60*1000).toISOString()};
 s.servicePlans.push(p);s.servicePlanFocus=p.id;
 journal(s,'Reservation preview ready',`${services[details.service].label}: ${type}. Simulated service; approval is required.`);
 say(s,'assistant',`Review this ${type==='cancel'?'cancellation':type==='update'?'change':'reservation'} before approving. This is a simulated ${details.service}; no real provider is contacted.`);
 return p;
}
export async function previewServiceBooking(store:Store,input:unknown){
 const {requestKey,reservationId,expectedVersion,...details}=serviceBookingSchema.parse(input);validateDetails(details);
 return transact(store,s=>{
  const existing=s.servicePlans?.find(p=>p.requestKey===requestKey);
  if(existing){const expected=JSON.stringify([reservationId?'update':'create',details,reservationId??null,expectedVersion??null]);if(existing.intentKey!==expected)throw new DomainError('KEY_REUSED','This request key was used for another plan.');return existing;}
  const before=reservationId?locate(s,reservationId):undefined;
  if(before&&(before.version!==expectedVersion||before.service!==details.service))throw new DomainError('CONFLICT','This reservation changed. Open its latest details before editing.');
  capacity(s,details,reservationId);
  if(!before&&(s.reservations??[]).some(r=>r.active&&Object.entries(details).every(([k,v])=>r[k as keyof Reservation]===v)))throw new DomainError('DUPLICATE','An identical reservation already exists. Use Change on that reservation instead.');
  s.bookingDraft={...details,...(before?{reservationId:before.id,expectedVersion:before.version}:{})};
  return stage(s,before?'update':'create',details,requestKey,before);
 });
}
export async function previewServiceCancellation(store:Store,id:string,key:string){return transact(store,s=>{
 const old=s.servicePlans?.find(p=>p.requestKey===key);if(old){if(old.type!=='cancel'||old.reservationId!==id)throw new DomainError('KEY_REUSED','This request key was used for another plan.');return old;}
 const before=locate(s,id);const {service,venue,location,date,time,timeZone,people}=before;
 return stage(s,'cancel',{service,venue,location,date,time,timeZone,people},key,before);
});}
export async function approveServicePlan(store:Store,id:string,revision:string){return transact(store,s=>{
 const p=getPlan(s,id);if(p.revision!==revision)throw new DomainError('STALE_PLAN','Review the current revision before approving.');
 if(p.status==='completed')return p;
 if(!['awaiting_approval','approved'].includes(p.status)||Date.parse(p.expiresAt)<Date.now())throw new DomainError('STALE_PLAN','This preview is no longer active. Create a fresh one.');
 p.status='approved';p.approvedAt??=now();journal(s,'Reservation plan approved',`Approval recorded for revision ${revision.slice(0,8)}.`);return p;
});}
export async function executeServicePlan(store:Store,id:string){return transact(store,s=>{
 const p=getPlan(s,id);if(p.status==='completed')return p;
 if(p.status!=='approved'||!p.approvedAt)throw new DomainError('APPROVAL_REQUIRED','Approve this exact reservation plan first.');
 if(Date.parse(p.expiresAt)<Date.now())throw new DomainError('EXPIRED','This approved preview expired. Create a new one.');
 s.reservations??=[];const record=s.reservations.find(r=>r.id===p.reservationId);
 if(p.type!=='create'&&(!record||!record.active||record.version!==p.expectedVersion)){
  p.status='conflict';p.error='The reservation changed after this preview. Reopen its current details.';journal(s,'Reservation change protected',p.error,'warning');return p;
 }
 if(p.type!=='cancel'){validateDetails(p.details);capacity(s,p.details,p.type==='update'?p.reservationId:undefined);}
 if(p.type==='create'){s.reservations.push({...p.details,id:p.reservationId,version:1,active:true,createdBy:p.id,updatedBy:p.id});}
 else if(record){if(p.type==='cancel')record.active=false;else Object.assign(record,p.details);record.version++;record.updatedBy=p.id;}
 p.status='completed';p.completedAt=now();s.reservationFocus=p.reservationId;delete s.bookingDraft;
 journal(s,p.type==='cancel'?'Simulated reservation cancelled':p.type==='update'?'Simulated reservation changed':'Simulated reservation saved',`${p.details.venue} · ${p.details.date} ${p.details.time} ${p.details.timeZone}`,'success');
 say(s,'assistant',p.type==='cancel'?'The selected simulated reservation is cancelled. Other bookings are unchanged.':`Your simulated ${p.details.service} ${p.type==='update'?'change':'reservation'} is saved. No real provider has been contacted.`);return p;
});}
function reopenDraft(s:State,details:ReservationDetails,record?:Reservation){
 for(const plan of s.servicePlans??[])if(['awaiting_approval','approved'].includes(plan.status))plan.status='superseded';
 s.bookingDraft={service:details.service,venue:details.venue,location:details.location,date:details.date,time:details.time,timeZone:details.timeZone,people:details.people,...(record?{reservationId:record.id,expectedVersion:record.version}:{})};
 delete s.servicePlanFocus;
 return s.bookingDraft;
}
export async function editServiceDraft(store:Store,id:string){return transact(store,s=>{const r=locate(s,id);s.reservationFocus=id;return reopenDraft(s,r,r);});}
export async function reviseServicePlan(store:Store,id:string){return transact(store,s=>{
 const plan=getPlan(s,id);
 if(plan.status==='completed'||plan.type==='cancel')throw new DomainError('VALIDATION','Use the saved reservation card to change a completed booking or review its cancellation.');
 const current=plan.type==='update'?locate(s,plan.reservationId):undefined;
 return reopenDraft(s,current??plan.details,current);
});}
