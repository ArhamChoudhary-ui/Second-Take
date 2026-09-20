import type {BookingDraft,Reservation,ServicePlan} from './services.ts';
export type Kind = 'workshop' | 'equipment' | 'calendar';
export type Fault = 'none' | 'before' | 'after' | 'compensation';
export type Scenario = 'lost_reply' | 'manual_edit' | 'cancellation';
export type ActionStatus = 'pending' | 'completed' | 'unknown' | 'conflict' | 'failed';
export type OperationStatus = 'awaiting_approval' | 'approved' | 'executing' | 'completed' | 'awaiting_resolution' | 'superseded' | 'expired';
export interface Workshop { id:string; title:string; date:string; time:string; endTime:string; description:string; category:string; capacity:number; cameras:number; }
export interface RecordItem { id:string; kind:Kind; workshopId:string; quantity:number; title:string; note:string; version:number; active:boolean; createdBy:string; updatedBy:string; }
export interface Action { id:string; type:'reserve'|'cancel'|'update'; kind:Kind; workshopId:string; quantity:number; title:string; recordId:string; expectedVersion:number|null; afterNote:string; status:ActionStatus; attempts:number; dependencies:string[]; error?:string; before?:RecordItem; after?:RecordItem; }
export interface Operation { id:string; revision:string; requestKey:string; intentKey:string; kind:'booking'|'change'|'reversal'; title:string; request:string; sourceId?:string; createdAt:string; expiresAt:string; approvedAt?:string; completedAt?:string; status:OperationStatus; fault:Fault; faultUsed:boolean; actions:Action[]; preserved?:RecordItem[]; }
export interface Entry { id:string; at:string; title:string; detail:string; level:'info'|'success'|'warning'|'error'; operationId?:string; }
export interface Message { id:string; role:'user'|'assistant'; text:string; at:string; operationId?:string; }
export interface State { schemaVersion:1; bookingDraft?:BookingDraft; reservations?:Reservation[]; servicePlans?:ServicePlan[]; reservationFocus?:string; servicePlanFocus?:string; workshops:Workshop[]; records:RecordItem[]; operations:Operation[]; timeline:Entry[]; messages:Message[]; fault:Fault; rehearsal?:{scenario:Scenario;startedAt:string}; }
export interface Snapshot { data:State; version:number; }
export interface Store { read():Promise<Snapshot>; compareAndSwap(version:number,state:State):Promise<boolean>; }
export class DomainError extends Error { code:string; constructor(code:string,message:string){super(message);this.code=code;} }
export const uid = ()=>crypto.randomUUID();
export const now = ()=>new Date().toISOString();
export function initialState(date=new Date()):State {
 const saturday=new Date(date);saturday.setUTCHours(0,0,0,0);let delta=(6-saturday.getUTCDay()+7)%7;if(!delta)delta=7;saturday.setUTCDate(saturday.getUTCDate()+delta);
 const next=new Date(saturday);next.setUTCDate(next.getUTCDate()+1);
 return {schemaVersion:1,workshops:[
 {id:'photography',title:'The art of seeing',date:saturday.toISOString().slice(0,10),time:'10:00',endTime:'12:00',description:'A hands-on photography workshop. Find a new perspective on everyday things.',category:'Photography',capacity:8,cameras:3},
 {id:'street',title:'Stories on the street',date:saturday.toISOString().slice(0,10),time:'14:00',endTime:'16:00',description:'Explore the neighbourhood through your lens with a small group.',category:'Street photography',capacity:6,cameras:2},
 {id:'light',title:'Chasing the light',date:next.toISOString().slice(0,10),time:'09:00',endTime:'11:00',description:'Learn natural light, composition, and a slower way of looking.',category:'Photography',capacity:8,cameras:3}
 ],records:[],operations:[],timeline:[],messages:[],fault:'none'};
}
