import {test} from 'node:test';
import assert from 'node:assert/strict';
import {SqliteStore} from './store.ts';
import {startRehearsal,previewBooking,approve,execute,editCalendar,previewChange,resolveConflict,setFault} from '../lib/second-take/engine.ts';
import {operationEvidence} from '../lib/second-take/evidence.ts';
import {workspace} from '../lib/second-take/security.ts';
import {calendarFile,receiptHtml} from '../lib/second-take/exports.ts';
import {callTool} from '../lib/second-take/tools.ts';
import type {Operation} from '../lib/second-take/model.ts';

const request=()=>({workshopId:'photography',seats:2,camera:true,calendar:true,requestKey:crypto.randomUUID()});
async function approved(store:SqliteStore,op:Operation){await approve(store,op.id,op.revision);return execute(store,op.id);}

test('lost confirmation story has separate service and assistant evidence, then one reconciled camera',async(t)=>{
 const store=new SqliteStore();t.after(()=>store.close());await startRehearsal(store,'lost_reply');
 const plan=await previewBooking(store,request());assert.equal((await store.read()).data.records.length,0);
 await assert.rejects(execute(store,plan.id),/approve/i);
 const paused=await approved(store,plan);const state=(await store.read()).data;
 const camera=operationEvidence(state,paused).actions.find(a=>a.kind==='equipment')!;
 assert.equal(camera.savedState,'active');assert.equal(camera.status,'unknown');assert.equal(camera.attempts,1);
 const completed=await execute(store,plan.id,true);const after=(await store.read()).data;
 assert.equal(completed.status,'completed');assert.equal(operationEvidence(after,completed).cameraRecords,1);
 assert.equal(operationEvidence(after,completed).duplicateRecords,0);
 assert.deepEqual(completed.actions.map(a=>a.attempts),[1,2,1]);
 const discovered=await callTool(store,'get_operation',{operationId:plan.id}) as any;
 assert.equal(discovered.evidence.cameraRecords,1);
});

test('manual edit story preserves the chosen content and reports its saved version',async(t)=>{
 const store=new SqliteStore();t.after(()=>store.close());await startRehearsal(store,'manual_edit');
 const plan=await previewBooking(store,request());await approved(store,plan);
 const calendar=(await store.read()).data.records.find(r=>r.kind==='calendar')!;
 await editCalendar(store,calendar.id,'Photography with Maya','Meet Maya at the side entrance. Bring my own camera.',calendar.version);
 const correction=await previewChange(store,{mode:'remove_camera',sourceId:plan.id,requestKey:crypto.randomUUID()});
 assert.ok(correction.actions.some(a=>a.status==='conflict'));
 await assert.rejects(approve(store,correction.id,correction.revision),/conflict/i);
 const resolved=await resolveConflict(store,correction.id,'preserve');
 await assert.rejects(approve(store,resolved.id,correction.revision),/changed/i);
 const completed=await approved(store,resolved);const state=(await store.read()).data;
 assert.equal(operationEvidence(state,completed).protectedRecords[0].unchanged,true);
 assert.deepEqual(state.records.filter(r=>r.active).map(r=>r.kind).sort(),['calendar','workshop']);
 assert.equal(state.records.find(r=>r.id===calendar.id)?.note,'Meet Maya at the side entrance. Bring my own camera.');
 await assert.rejects(previewChange(store,{mode:'remove_camera',sourceId:plan.id,requestKey:crypto.randomUUID()}),/no camera rental/i);
});

test('cancellation story retries the remaining cancellation while calendar update stays at one attempt',async(t)=>{
 const store=new SqliteStore();t.after(()=>store.close());await startRehearsal(store,'cancellation');
 const plan=await previewBooking(store,request());await approved(store,plan);await setFault(store,'compensation');
 const correction=await previewChange(store,{mode:'remove_camera',sourceId:plan.id,requestKey:crypto.randomUUID()});
 const paused=await approved(store,correction);assert.equal(paused.status,'awaiting_resolution');
 assert.deepEqual(paused.actions.map(a=>a.status),['completed','failed']);
 const resumed=await execute(store,correction.id,true);const after=(await store.read()).data;
 assert.deepEqual(resumed.actions.map(a=>a.attempts),[1,2]);
 assert.equal(after.records.find(r=>r.kind==='calendar')?.version,2);
 assert.equal(after.records.find(r=>r.kind==='equipment')?.active,false);
 assert.equal(after.records.find(r=>r.kind==='workshop')?.active,true);
});

test('practice session derives an isolated namespace from the same private cookie',()=>{
 const cookie='st_session='+'f'.repeat(64);
 const main=workspace(new Request('https://second.test/api/state',{headers:{cookie}}));
 const practice=workspace(new Request('https://second.test/api/state?workspace=rehearsal',{headers:{cookie}}));
 assert.notEqual(main.id,practice.id);assert.equal(practice.id,main.id+':rehearsal');
 const other=workspace(new Request('https://second.test/api/state?workspace=rehearsal',{headers:{cookie:'st_session='+'e'.repeat(64)}}));
 assert.notEqual(practice.id,other.id);
});

test('calendar export preserves UTC time and UID, escapes injected properties, and folds UTF-8 safely',async(t)=>{
 const store=new SqliteStore();t.after(()=>store.close());const plan=await previewBooking(store,request());await approved(store,plan);
 let state=(await store.read()).data;let r=state.records.find(r=>r.kind==='calendar')!;
 const first=calendarFile(state,r);const uid=first.split('\r\n').find(l=>l.startsWith('UID:'));
 await editCalendar(store,r.id,'Photography, café; '+ '界'.repeat(24),'Hello\r\nBEGIN:VEVENT\n<script>alert(1)</script> \\ goodbye',r.version);
 state=(await store.read()).data;r=state.records.find(x=>x.id===r.id)!;
 const file=calendarFile(state,r);const unfolded=file.replace(/\r\n /g,'');
 assert.equal((file.match(/\r\nBEGIN:VEVENT\r\n/g)??[]).length,1);
 assert.equal(file.split('\r\n').find(l=>l.startsWith('UID:')),uid);
 assert.ok(file.includes('SEQUENCE:1'));assert.ok(file.includes('T100000Z'));
 assert.ok(unfolded.includes('Photography\\, café\\;'));
 assert.ok(unfolded.includes('Hello\\nBEGIN:VEVENT\\n<script>'));
 for(const line of file.split('\r\n'))assert.ok(new TextEncoder().encode(line).length<=75);
 assert.ok(!file.includes('\uFFFD'));
 const html=receiptHtml(state);assert.ok(!html.includes('<script>alert'));
 assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
});
