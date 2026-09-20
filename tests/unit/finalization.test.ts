import {test} from 'node:test';
import assert from 'node:assert/strict';
import {SqliteStore} from '../helpers/sqlite-store.ts';
import {previewServiceBooking,approveServicePlan,executeServicePlan,reviseServicePlan,editServiceDraft,previewServiceCancellation} from '../../src/lib/bookings/services.ts';
import {serviceCommand} from '../../src/lib/bookings/service-conversation.ts';
import {reservationCalendarFile} from '../../src/lib/bookings/exports.ts';
const key=()=>crypto.randomUUID();
const details={service:'restaurant' as const,venue:'Café; '+ '界'.repeat(25),location:'Jaipur',date:'2030-01-01',time:'23:30',timeZone:'Asia/Kolkata',people:2};

test('reopening an approved preview revokes old execution and requires a new approval',async(t)=>{
 const s=new SqliteStore();t.after(()=>s.close());const p=await previewServiceBooking(s,{...details,requestKey:key()});await approveServicePlan(s,p.id,p.revision);
 const draft=await reviseServicePlan(s,p.id);assert.equal(draft.location,'Jaipur');assert.equal(draft.reservationId,undefined);
 await assert.rejects(executeServicePlan(s,p.id),/Approve/);assert.equal((await s.read()).data.reservations,undefined);
 const fresh=await previewServiceBooking(s,{...details,people:4,requestKey:key()});await assert.rejects(executeServicePlan(s,fresh.id),/Approve/);await approveServicePlan(s,fresh.id,fresh.revision);await executeServicePlan(s,fresh.id);
 assert.equal((await s.read()).data.reservations!.length,1);assert.equal((await s.read()).data.reservations![0].people,4);
 await assert.rejects(reviseServicePlan(s,fresh.id),/saved reservation/);
});
test('editing a saved reservation supersedes an approved cancellation and uses the current version',async(t)=>{
 const s=new SqliteStore();t.after(()=>s.close());const p=await previewServiceBooking(s,{...details,requestKey:key()});await approveServicePlan(s,p.id,p.revision);await executeServicePlan(s,p.id);
 const cancellation=await previewServiceCancellation(s,p.reservationId,key());await approveServicePlan(s,cancellation.id,cancellation.revision);
 const draft=await editServiceDraft(s,p.reservationId);assert.equal(draft.expectedVersion,1);await assert.rejects(executeServicePlan(s,cancellation.id),/Approve/);
 assert.equal((await s.read()).data.reservations![0].active,true);
 const update=await previewServiceBooking(s,{...details,time:'22:00',reservationId:p.reservationId,expectedVersion:1,requestKey:key()});
 const snapshot=await s.read();snapshot.data.reservations![0].version=2;snapshot.data.reservations![0].people=3;await s.compareAndSwap(snapshot.version,snapshot.data);
 const reopened=await reviseServicePlan(s,update.id);assert.equal(reopened.people,3);assert.equal(reopened.time,'23:30');assert.equal(reopened.expectedVersion,2);
});
test('negated actions leave the booking unchanged and day after tomorrow is parsed accurately',async(t)=>{
 const s=new SqliteStore();t.after(()=>s.close());const p=await previewServiceBooking(s,{...details,requestKey:key()});await approveServicePlan(s,p.id,p.revision);await executeServicePlan(s,p.id);
 for(const text of ["Don't cancel the restaurant",'Do not remove the camera','Never book a restaurant']){
  const reply:any=await serviceCommand(s,text,key());assert.match(reply.reply,/No changes made/);assert.equal(reply.tool,undefined);
 }assert.equal((await s.read()).data.reservations![0].active,true);
 const next=new Date();next.setUTCDate(next.getUTCDate()+2);
 const command:any=await serviceCommand(s,'Book a restaurant in Jaipur day after tomorrow at 7 pm for two people',key(),'UTC');
 assert.equal(command.args.date,next.toISOString().slice(0,10));assert.equal(command.args.location,'Jaipur');
});
test('reservation calendar snapshots preserve identity, timezone, duration and escaped properties',async(t)=>{
 const s=new SqliteStore();t.after(()=>s.close());const p=await previewServiceBooking(s,{...details,location:'Jaipur\r\nBEGIN:VEVENT',requestKey:key()});await approveServicePlan(s,p.id,p.revision);await executeServicePlan(s,p.id);
 const r=(await s.read()).data.reservations![0];const file=reservationCalendarFile(r,new Date('2029-01-01T00:00:00Z'));const unfolded=file.replace(/\r\n /g,'');
 assert.match(file,/DTSTART:20300101T180000Z/);assert.match(file,/DTEND:20300101T193000Z/);assert.equal(file.match(/\r\nBEGIN:VEVENT\r\n/g)?.length,1);
 assert.ok(unfolded.includes('Café\\;'));assert.ok(unfolded.includes('LOCATION:Jaipur\\nBEGIN:VEVENT'));assert.match(unfolded,/No real provider/);assert.match(unfolded,/do not sync automatically/);
 for(const line of file.split('\r\n'))assert.ok(new TextEncoder().encode(line).length<=75);
 const updated=reservationCalendarFile({...r,version:2,time:'22:00'});assert.equal(updated.match(/UID:.+/)?.[0],file.match(/UID:.+/)?.[0]);assert.match(updated,/SEQUENCE:1/);
 assert.throws(()=>reservationCalendarFile({...r,active:false}),/Only active/);
});
