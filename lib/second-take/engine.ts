import {DomainError,uid,now,initialState} from './model.ts';
import type {State,Store,Operation,Action,Kind,RecordItem,Fault,Scenario} from './model.ts';
export function journal(s:State,title:string,detail:string,level:'info'|'success'|'warning'|'error'='info',operationId?:string){s.timeline.push({id:uid(),at:now(),title,detail,level,operationId});}
export function say(s:State,role:'user'|'assistant',text:string,operationId?:string){s.messages.push({id:uid(),at:now(),role,text,operationId});}
export async function transact<T>(store:Store,fn:(s:State)=>T):Promise<T>{
 for(let i=0;i<12;i++){const snap=await store.read();const s=structuredClone(snap.data);const result=fn(s);if(await store.compareAndSwap(snap.version,s))return result;}
 throw new DomainError('BUSY','Another request is changing this workspace. Please try again.');
}
export const available=(s:State,id:string,kind:Kind)=>{const w=s.workshops.find(w=>w.id===id);if(!w)throw new DomainError('NOT_FOUND','That workshop is unavailable.');return (kind==='workshop'?w.capacity:w.cameras)-s.records.filter(r=>r.active&&r.workshopId===id&&r.kind===kind).reduce((n,r)=>n+r.quantity,0);};
function lookup(s:State,id:string){const op=s.operations.find(o=>o.id===id);if(!op)throw new DomainError('NOT_FOUND','This operation was not found in your workspace.');return op;}
function liveBooking(s:State,sourceId?:string){const op=sourceId?lookup(s,sourceId):[...s.operations].reverse().find(o=>o.kind==='booking'&&s.records.some(r=>r.active&&r.createdBy===o.id));if(!op||op.kind!=='booking')throw new DomainError('NO_BOOKING','Create and approve a booking first.');return op;}
function expirePrior(s:State){for(const op of s.operations)if(op.status==='awaiting_approval'||op.status==='approved'){op.status='superseded';journal(s,'Preview replaced','A newer plan needs its own approval.','info',op.id);}}
function makePlan(s:State,kind:Operation['kind'],title:string,request:string,key:string,intentKey:string,sourceId?:string){
 if(s.operations.length>=150)throw new DomainError('DEMO_LIMIT','This demo workspace is full. Export the receipt and start a fresh demo.');
 expirePrior(s);const op:Operation={id:uid(),revision:uid(),requestKey:key,intentKey,kind,title,request,sourceId,createdAt:now(),expiresAt:new Date(Date.now()+15*60*1000).toISOString(),status:'awaiting_approval',fault:s.fault,faultUsed:false,actions:[]};s.operations.push(op);return op;
}
function prior(s:State,key:string,intentKey:string){const op=s.operations.find(o=>o.requestKey===key);if(op&&op.intentKey!==intentKey)throw new DomainError('KEY_REUSED','This request key belongs to different arguments.');return op;}
function action(op:Operation,type:Action['type'],kind:Kind,workshopId:string,quantity:number,title:string,record?:RecordItem,note=''){
 const id=uid();const a:Action={id,type,kind,workshopId,quantity,title,recordId:record?.id??`${op.id}:${kind}`,expectedVersion:record?.version??null,afterNote:note,status:'pending',attempts:0,dependencies:op.actions.length?[op.actions[op.actions.length-1].id]:[],before:record?structuredClone(record):undefined};op.actions.push(a);return a;
}
export async function previewBooking(store:Store,args:{workshopId:string;seats:number;camera:boolean;calendar:boolean;requestKey:string;request?:string}){
 if(!Number.isInteger(args.seats)||args.seats<1||args.seats>8)throw new DomainError('VALIDATION','Choose between one and eight places.');
 const intentKey=JSON.stringify([args.workshopId,args.seats,args.camera,args.calendar]);
 return transact(store,s=>{const old=prior(s,args.requestKey,intentKey);if(old)return old;
 const w=s.workshops.find(w=>w.id===args.workshopId);if(!w)throw new DomainError('NOT_FOUND','Choose a workshop from the catalogue.');
 if(w.date<now().slice(0,10))throw new DomainError('EXPIRED','This workshop date has passed. Start a fresh demo for upcoming dates.');
 if(available(s,w.id,'workshop')<args.seats)throw new DomainError('CAPACITY','There are not enough places left for that request.');
 if(args.camera&&available(s,w.id,'equipment')<1)throw new DomainError('CAPACITY','No cameras are available. You can still book without a rental.');
 const op=makePlan(s,'booking','Your day, sorted',args.request??`Book ${args.seats} places in ${w.title}`,args.requestKey,intentKey);
 action(op,'reserve','workshop',w.id,args.seats,w.title);
 if(args.camera)action(op,'reserve','equipment',w.id,1,'Mirrorless camera');
 if(args.calendar)action(op,'reserve','calendar',w.id,1,w.title,undefined,args.camera?'Collect camera at reception 15 minutes before the workshop.':'Bring your own camera.');
 journal(s,'Preview ready',`${op.actions.length} proposed actions. Nothing has been reserved.`,'info',op.id);say(s,'assistant','Here’s the plan. Review the details, then approve when you’re ready. Availability is checked again at approval.',op.id);return op;
 });
}
export async function previewChange(store:Store,args:{mode:'remove_camera'|'undo_keep_workshop'|'undo_all';sourceId?:string;preserveCalendar?:boolean;requestKey:string;request?:string}){
 return transact(store,s=>{const intentKey=JSON.stringify([args.mode,args.sourceId??null,!!args.preserveCalendar]);const old=prior(s,args.requestKey,intentKey);if(old)return old;
 const source=liveBooking(s,args.sourceId);
 if(source.status==='executing')throw new DomainError('BUSY','Let this booking finish before changing it.');
 if(source.actions.some(a=>a.status==='unknown'))throw new DomainError('RECONCILE_FIRST','Check the uncertain reservation before creating a change.');
 const records=s.records.filter(r=>r.createdBy===source.id&&r.active);
 if(!records.length)throw new DomainError('NO_BOOKING','This booking has no active reservations.');
 if(args.mode==='remove_camera'&&!records.some(r=>r.kind==='equipment'))throw new DomainError('NOTHING_TO_CHANGE','This booking has no camera rental left to remove.');
 const title=args.mode==='remove_camera'?'Your camera. Same plans.':args.mode==='undo_keep_workshop'?'Keep the workshop. Undo the rest.':'Cancel this booking';
 const op=makePlan(s,args.mode==='remove_camera'?'change':'reversal',title,args.request??title,args.requestKey,intentKey,source.id);
 // Reverse dependency order: calendar before equipment before seats.
 const calendar=records.find(r=>r.kind==='calendar');
 if(calendar&&!args.preserveCalendar){
  // Detect edits since the assistant last wrote this resource, including edits BEFORE preview.
  const expected=[...s.operations].reverse().flatMap(o=>[...o.actions].reverse()).find(a=>a.recordId===calendar.id&&a.status==='completed'&&a.after)?.after;
  const a=action(op,args.mode==='remove_camera'?'update':'cancel','calendar',calendar.workshopId,1,calendar.title,calendar,'Bring your own camera.');
  if(expected)a.expectedVersion=expected.version;
 }
 const equipment=records.find(r=>r.kind==='equipment');if(equipment)action(op,'cancel','equipment',equipment.workshopId,equipment.quantity,equipment.title,equipment);
 const workshop=records.find(r=>r.kind==='workshop');if(workshop&&args.mode==='undo_all')action(op,'cancel','workshop',workshop.workshopId,workshop.quantity,workshop.title,workshop);
 if(!op.actions.length)throw new DomainError('NOTHING_TO_CHANGE','There is nothing left to change for that request.');
 for(const a of op.actions){if(a.before&&a.expectedVersion!==a.before.version){a.status='conflict';a.error='Your calendar was edited after the assistant last changed it.';}}
 journal(s,'Change preview ready',args.preserveCalendar?'Your manually edited calendar will be preserved.':'Review exactly what stays and what changes.','info',op.id);
 say(s,'assistant',op.actions.some(a=>a.status==='conflict')?'Your calendar has a newer edit. I’ll preserve it unless you explicitly choose to include the current version.':'I’ve prepared the correction. Nothing changes until you approve.',op.id);return op;
 });
}
export async function approve(store:Store,id:string,revision:string){return transact(store,s=>{const op=lookup(s,id);if(op.revision!==revision)throw new DomainError('STALE_PLAN','The preview changed. Please review it again.');if(op.status==='approved'||op.status==='executing'||op.status==='completed')return op;
 if(op.status!=='awaiting_approval')throw new DomainError('STALE_PLAN','This preview is no longer active.');
 if(Date.parse(op.expiresAt)<Date.now())throw new DomainError('EXPIRED','This preview expired. Create a fresh preview.');
 if(op.actions.some(a=>a.status==='conflict'))throw new DomainError('CONFLICT','Resolve the calendar conflict before approving.');
 op.status='approved';op.approvedAt=now();journal(s,'Plan approved',`Approval is bound to revision ${op.revision.slice(0,8)}.`,'info',id);return op;});}
export async function resolveConflict(store:Store,id:string,choice:'preserve'|'include_current'){
 return transact(store,s=>{const op=lookup(s,id);if(!['awaiting_approval','awaiting_resolution'].includes(op.status))throw new DomainError('STALE_PLAN','This plan cannot be changed now.');
 const conflicts=op.actions.filter(a=>a.status==='conflict');if(!conflicts.length)throw new DomainError('NO_CONFLICT','There is no conflict to resolve.');
 if(choice==='preserve'){op.preserved=conflicts.map(a=>structuredClone(s.records.find(r=>r.id===a.recordId)!)).filter(Boolean);op.actions=op.actions.filter(a=>a.status!=='conflict');}else for(const a of conflicts){const r=s.records.find(r=>r.id===a.recordId);if(!r)throw new DomainError('NOT_FOUND','The changed record is no longer available.');a.before=structuredClone(r);a.expectedVersion=r.version;a.status='pending';delete a.error;}
 // Rebuild the remaining action chain; never leave a dangling dependency after preserving a record.
 op.actions.forEach((a,i)=>{a.dependencies=i?[op.actions[i-1].id]:[];});op.revision=uid();op.status='awaiting_approval';delete op.approvedAt;op.expiresAt=new Date(Date.now()+15*60*1000).toISOString();
 if(!op.actions.length){op.status='completed';op.completedAt=now();}
 journal(s,'Conflict resolved',choice==='preserve'?'Your manual calendar edit stays. Approve the remaining changes.':'The preview now includes the current calendar version. Fresh approval required.','info',id);return op;});
}
function doAction(s:State,op:Operation,a:Action):'continue'|'stop'{
 a.attempts++;
 const existing=s.records.find(r=>r.id===a.recordId);
 if(a.type==='reserve'&&existing){if(!existing.active){a.status='failed';a.error='This reservation was already cancelled.';op.status='awaiting_resolution';return 'stop';}a.status='completed';a.after=structuredClone(existing);delete a.error;journal(s,'Reservation reconciled',`${a.title} already exists. No duplicate was created.`,'success',op.id);return 'continue';}
 if(a.kind==='equipment'&&!op.faultUsed&&op.fault==='before'&&a.type==='reserve'){
 op.faultUsed=true;a.status='unknown';a.error='Equipment service timed out before responding.';op.status='awaiting_resolution';journal(s,'Response not received','Workshop places are held. Camera status needs checking.','warning',op.id);return 'stop';}
 if(a.type==='reserve'){
 if(a.kind!=='calendar'&&available(s,a.workshopId,a.kind)<a.quantity){a.status='failed';a.error='Availability changed since preview.';op.status='awaiting_resolution';journal(s,'Availability changed',a.error,'warning',op.id);return 'stop';}
 const w=s.workshops.find(w=>w.id===a.workshopId)!;if(w.date<now().slice(0,10)){a.status='failed';a.error='The workshop date has passed.';op.status='awaiting_resolution';return 'stop';}
 const r:RecordItem={id:a.recordId,kind:a.kind,workshopId:a.workshopId,quantity:a.quantity,title:a.title,note:a.afterNote,version:1,active:true,createdBy:op.id,updatedBy:op.id};s.records.push(r);
 if(a.kind==='equipment'&&!op.faultUsed&&op.fault==='after'){op.faultUsed=true;a.status='unknown';a.error='The service response was lost. Check the reservation before retrying.';op.status='awaiting_resolution';journal(s,'Response lost','Camera confirmation is unknown to the assistant. The service record can be reconciled.','warning',op.id);return 'stop';}
 a.after=structuredClone(r);
 }else{
 if(!existing){a.status='failed';a.error='The record is missing.';op.status='awaiting_resolution';return 'stop';}
 if(existing.updatedBy===op.id){a.status='completed';a.after=structuredClone(existing);return 'continue';}
 if(existing.version!==a.expectedVersion){a.status='conflict';a.error='This record has a newer manual edit.';op.status='awaiting_resolution';journal(s,'Manual change protected',a.error,'warning',op.id);return 'stop';}
 if(a.type==='cancel'&&op.fault==='compensation'&&!op.faultUsed){op.faultUsed=true;a.status='failed';a.error='The cancellation service is temporarily unavailable.';op.status='awaiting_resolution';journal(s,'Cancellation paused','Completed changes are recorded. Retry only the remaining actions.','warning',op.id);return 'stop';}
 if(a.type==='cancel')existing.active=false;else existing.note=a.afterNote;existing.version++;existing.updatedBy=op.id;a.after=structuredClone(existing);
 }
 a.status='completed';delete a.error;journal(s,a.type==='reserve'?'Reservation confirmed':a.type==='cancel'?'Reservation cancelled':'Calendar updated',a.title,'success',op.id);return 'continue';
}
export async function execute(store:Store,id:string,resume=false){
 await transact(store,s=>{const op=lookup(s,id);if(op.status==='completed')return;
 if(!op.approvedAt)throw new DomainError('APPROVAL_REQUIRED','Review and approve this exact plan in the app before execution.');
 if(op.status==='approved'&&Date.parse(op.expiresAt)<Date.now())throw new DomainError('EXPIRED','The approval expired before execution. Create a fresh preview.');
 if(!['approved','executing',...(resume?['awaiting_resolution']:[])].includes(op.status))throw new DomainError('NOT_READY','This operation needs your review.');
 if(op.actions.some(a=>a.status==='conflict'))throw new DomainError('CONFLICT','Resolve the manual edit first.');
 if(op.sourceId){const source=lookup(s,op.sourceId);if(source.status==='executing'||source.actions.some(a=>a.status==='unknown'))throw new DomainError('BUSY','Reconcile the original booking before changing it.');source.status='superseded';}
 op.status='executing';});
 for(let i=0;i<10;i++){
 const stop=await transact(store,s=>{const op=lookup(s,id);if(op.status==='completed'||op.status!=='executing')return true;
 const a=op.actions.find(a=>a.status!=='completed');
 if(!a){op.status='completed';op.completedAt=now();journal(s,op.kind==='booking'?'Your plan is confirmed':'Your changes are complete','Every action has a confirmed result.','success',op.id);say(s,'assistant',op.kind==='booking'?'All set. Your reservations and calendar are saved. You can change your mind whenever you need to.':'Done. I changed only the actions in your approved plan.',op.id);return true;}
 if(a.dependencies.some(id=>!op.actions.some(x=>x.id===id&&x.status==='completed')))throw new DomainError('DEPENDENCY','A previous action needs resolution.');
 return doAction(s,op,a)==='stop';});
 if(stop)break;
 }
 return (await store.read()).data.operations.find(o=>o.id===id)!;
}
export async function setFault(store:Store,fault:Fault){if(!['none','before','after','compensation'].includes(fault))throw new DomainError('VALIDATION','Unknown scenario.');return transact(store,s=>{s.fault=fault;journal(s,'Demo scenario selected',fault==='none'?'Services respond normally.':`Next preview uses the ${fault} failure scenario.`);return fault;});}
export async function editCalendar(store:Store,id:string,title:string,note:string,expectedVersion:number){
 if(!title.trim()||title.length>120||note.length>500)throw new DomainError('VALIDATION','Use a title under 120 characters and notes under 500 characters.');
 return transact(store,s=>{const r=s.records.find(r=>r.id===id&&r.kind==='calendar'&&r.active);if(!r)throw new DomainError('NOT_FOUND','This calendar event was not found.');if(r.version!==expectedVersion)throw new DomainError('CONFLICT','The event changed. Reload it before editing.');r.title=title.trim();r.note=note.trim();r.version++;r.updatedBy='manual';journal(s,'Calendar edited by you','Future assistant changes must respect this version.');return r;});
}
export async function resetDemo(store:Store){return transact(store,s=>{delete s.bookingDraft;delete s.reservations;delete s.servicePlans;delete s.reservationFocus;delete s.servicePlanFocus;Object.assign(s,initialState());delete s.rehearsal;return true;});}
export async function startRehearsal(store:Store,scenario:Scenario){return transact(store,s=>{
 delete s.bookingDraft;delete s.reservations;delete s.servicePlans;delete s.reservationFocus;delete s.servicePlanFocus;Object.assign(s,initialState());
 s.rehearsal={scenario,startedAt:now()};s.fault=scenario==='lost_reply'?'after':'none';
 journal(s,'Practice started','Controlled example in a separate workspace. All bookings still require your approval.');
 return s;
});}
export function publicState(s:State){return s;}
