import {test} from 'node:test';
import assert from 'node:assert/strict';
import {SqliteStore} from '../helpers/sqlite-store.ts';
import {serviceCommand} from '../../src/lib/bookings/service-conversation.ts';
import {previewServiceBooking,previewServiceCancellation,approveServicePlan,executeServicePlan,localDate,validateDetails,reservationInstant} from '../../src/lib/bookings/services.ts';
import {resetDemo,previewBooking,approve,execute} from '../../src/lib/bookings/engine.ts';
import {receiptHtml} from '../../src/lib/bookings/exports.ts';
import type {ServicePlan,ReservationDetails} from '../../src/lib/bookings/services.ts';
const key=()=>crypto.randomUUID();
function tomorrow(){const d=new Date();d.setUTCDate(d.getUTCDate()+1);return d.toISOString().slice(0,10);}
const details=(extra:Partial<ReservationDetails>={})=>({service:'restaurant' as const,venue:'Second Take Bistro',location:'Jaipur',date:tomorrow(),time:'19:00',timeZone:'Asia/Kolkata',people:2,...extra});
async function finish(store:SqliteStore,p:ServicePlan){await approveServicePlan(store,p.id,p.revision);return executeServicePlan(store,p.id);}

test('exact restaurant request and typo collect details across replies, then return an MCP preview',async(t)=>{
 const s=new SqliteStore();t.after(()=>s.close());let r:any=await serviceCommand(s,'Book a restaurant',key(),'Asia/Kolkata');
 assert.match(r.reply,/Which city/);assert.equal((await s.read()).data.reservations,undefined);
 r=await serviceCommand(s,'Jaipur',key(),'Asia/Kolkata');assert.match(r.reply,/Which date/);
 r=await serviceCommand(s,'tomorrow at 7 pm',key(),'Asia/Kolkata');assert.match(r.reply,/how many people/);
 r=await serviceCommand(s,'2 people',key(),'Asia/Kolkata');assert.equal(r.tool,'preview_service_booking');assert.equal(r.args.location,'Jaipur');assert.equal(r.args.time,'19:00');
 const p=await previewServiceBooking(s,r.args);assert.equal(p.status,'awaiting_approval');await assert.rejects(executeServicePlan(s,p.id),/Approve/);
 await finish(s,p);assert.equal((await s.read()).data.reservations?.length,1);
 r=await serviceCommand(s,'make reservation for restauran t',key(),'Asia/Kolkata');assert.match(r.reply,/Which city/);assert.equal((await s.read()).data.bookingDraft?.service,'restaurant');
});
test('complete restaurant request, correction, approval and cancellation preserve unrelated workshop',async(t)=>{
 const s=new SqliteStore();t.after(()=>s.close());const w=await previewBooking(s,{workshopId:'photography',seats:2,camera:true,calendar:true,requestKey:key()});await approve(s,w.id,w.revision);await execute(s,w.id);
 let r:any=await serviceCommand(s,'Book a restaurant in Jaipur tomorrow at 7 pm for 2 people',key(),'Asia/Kolkata');assert.equal(r.tool,'preview_service_booking');
 let p=await previewServiceBooking(s,r.args);await finish(s,p);const id=p.reservationId;
 r=await serviceCommand(s,'actually make it four people',key(),'Asia/Kolkata');assert.equal(r.args.people,4);assert.equal(r.args.reservationId,id);
 p=await previewServiceBooking(s,r.args);assert.equal((await s.read()).data.reservations?.[0].people,2);await finish(s,p);assert.equal((await s.read()).data.reservations?.[0].people,4);
 r=await serviceCommand(s,'Cancel the restaurant reservation',key(),'Asia/Kolkata');assert.equal(r.tool,'preview_service_cancellation');p=await previewServiceCancellation(s,id,r.args.requestKey);await finish(s,p);
 const state=(await s.read()).data;assert.equal(state.reservations?.[0].active,false);assert.equal(state.records.filter(r=>r.active).length,3);
});
test('editing an unfinished draft supersedes its earlier preview without creating a booking',async(t)=>{
 const s=new SqliteStore();t.after(()=>s.close());let r:any=await serviceCommand(s,'Book a restaurant in Jaipur tomorrow at 7 pm for two people',key(),'Asia/Kolkata');const first=await previewServiceBooking(s,r.args);
 r=await serviceCommand(s,'make it four people',key(),'Asia/Kolkata');await assert.rejects(approveServicePlan(s,first.id,first.revision),/no longer active/);const next=await previewServiceBooking(s,r.args);await finish(s,next);
 assert.equal((await s.read()).data.reservations?.length,1);assert.equal((await s.read()).data.reservations?.[0].people,4);
});
test('details supplied in the form are retained for later conversational corrections',async(t)=>{
 const s=new SqliteStore();t.after(()=>s.close());await serviceCommand(s,'Book a restaurant',key(),'Asia/Kolkata');
 await previewServiceBooking(s,{...details(),requestKey:key()});
 const r:any=await serviceCommand(s,'make it four people',key(),'Asia/Kolkata');
 assert.equal(r.tool,'preview_service_booking');assert.equal(r.args.location,'Jaipur');assert.equal(r.args.people,4);assert.equal(r.args.time,'19:00');
});
test('retries and simultaneous execution create one record; expired or wrong approvals fail',async(t)=>{
 const s=new SqliteStore();t.after(()=>s.close());const args={...details(),requestKey:key()};const p=await previewServiceBooking(s,args);assert.equal((await previewServiceBooking(s,args)).id,p.id);
 await assert.rejects(previewServiceBooking(s,{...args,people:3}),/another plan/);await assert.rejects(approveServicePlan(s,p.id,key()),/current revision/);
 await approveServicePlan(s,p.id,p.revision);await Promise.all([executeServicePlan(s,p.id),executeServicePlan(s,p.id)]);assert.equal((await s.read()).data.reservations?.length,1);
 const snap=await s.read();const other=await previewServiceBooking(s,{...details({time:'22:00'}),requestKey:key()});const update=await s.read();update.data.servicePlans!.find(x=>x.id===other.id)!.expiresAt='2000-01-01T00:00:00Z';await s.compareAndSwap(update.version,update.data);await assert.rejects(approveServicePlan(s,other.id,other.revision),/no longer active/);
});
test('slot capacity, duplicates, old resource versions and ownership are checked',async(t)=>{
 const s=new SqliteStore(),other=new SqliteStore();t.after(()=>{s.close();other.close();});const p=await previewServiceBooking(s,{...details({people:10}),requestKey:key()});await finish(s,p);
 await assert.rejects(previewServiceBooking(s,{...details({people:3,time:'19:30'}),requestKey:key()}),/slot is full/);
 await assert.rejects(previewServiceBooking(s,{...details({people:10}),requestKey:key()}),/slot is full|identical/);
 await assert.rejects(executeServicePlan(other,p.id),/not found/);
 await assert.rejects(previewServiceBooking(s,{...details({people:4}),reservationId:p.reservationId,expectedVersion:9,requestKey:key()}),/changed/);
 const change=await previewServiceBooking(s,{...details({people:4}),reservationId:p.reservationId,expectedVersion:1,requestKey:key()});await approveServicePlan(s,change.id,change.revision);
 const snap=await s.read();snap.data.reservations![0].version++;await s.compareAndSwap(snap.version,snap.data);assert.equal((await executeServicePlan(s,change.id)).status,'conflict');assert.equal((await s.read()).data.reservations![0].people,10);
});
test('appointment and event requests use the same approved reservation flow',async(t)=>{
 const s=new SqliteStore();t.after(()=>s.close());for(const [request,type] of [['Book an appointment in Jaipur tomorrow at 10 am','appointment'],['Book an event in Jaipur tomorrow at 8 pm for three people','event']]){
  const r:any=await serviceCommand(s,request,key(),'Asia/Kolkata');assert.equal(r.tool,'preview_service_booking');assert.equal(r.args.service,type);const p=await previewServiceBooking(s,r.args);await finish(s,p);
 }assert.equal((await s.read()).data.reservations!.length,2);
 const ambiguous:any=await serviceCommand(s,'cancel it',key());assert.match(ambiguous.reply,/Which booking/);
 const html=receiptHtml((await s.read()).data);assert.match(html,/Simulated service reservations/);await resetDemo(s);assert.equal((await s.read()).data.reservations,undefined);
});
test('invalid dates, time zones and DST gaps or repetitions are rejected',()=>{
 assert.throws(()=>validateDetails(details({date:'2030-02-30'})),/does not exist/);
 assert.throws(()=>validateDetails(details({date:'2000-01-01'})),/future/);
 assert.throws(()=>validateDetails(details({timeZone:'Invalid/Zone'})),/time zone/);
 assert.throws(()=>reservationInstant({date:'2030-03-10',time:'02:30',timeZone:'America/New_York'}),/does not exist/);
 assert.throws(()=>reservationInstant({date:'2030-11-03',time:'01:30',timeZone:'America/New_York'}),/occurs twice/);
 assert.equal(reservationInstant({date:'2030-01-01',time:'19:00',timeZone:'Asia/Kolkata'}),Date.parse('2030-01-01T13:30:00Z'));
});
test('capacity accounts for reservations crossing midnight and timezone aliases',async(t)=>{
 const s=new SqliteStore();t.after(()=>s.close());const d=tomorrow();const next=new Date(d+'T12:00:00Z');next.setUTCDate(next.getUTCDate()+1);
 const p=await previewServiceBooking(s,{...details({date:d,time:'23:30',people:12}),requestKey:key()});await finish(s,p);
 await assert.rejects(previewServiceBooking(s,{...details({date:next.toISOString().slice(0,10),time:'00:15',people:1,timeZone:'Asia/Calcutta'}),requestKey:key()}),/slot is full/);
});
