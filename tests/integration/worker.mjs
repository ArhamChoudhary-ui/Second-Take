import {createRequire} from 'node:module';
import {readFileSync,readdirSync} from 'node:fs';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);const workerRequire=createRequire(require.resolve('wrangler/package.json'));const {Miniflare}=workerRequire('miniflare');
const paths=readdirSync('dist/server',{recursive:true}).filter(p=>/\.m?js$/.test(p)).sort((a,b)=>a==='index.js'?-1:b==='index.js'?1:0);
const mf=new Miniflare({modules:paths.map(p=>({type:'ESModule',path:resolve('dist/server',p)})),modulesRoot:resolve('dist/server'),compatibilityDate:'2026-05-15',compatibilityFlags:['nodejs_compat'],d1Databases:['DB'],cf:false});
try{
 const db=await mf.getD1Database('DB');await db.prepare(readFileSync('src/server/database/migrations/0000_skinny_brother_voodoo.sql','utf8')).run();
 const init=await mf.dispatchFetch('http://localhost/api/state');assert.equal(init.status,200,await init.clone().text());let state=(await init.json()).state;assert.equal(state.workshops.length,3);const cookie=init.headers.get('set-cookie').split(';')[0];
 async function post(path,data,extra={}){const r=await mf.dispatchFetch(`http://localhost${path}`,{method:'POST',headers:{cookie,origin:'http://localhost','content-type':'application/json',...extra},body:JSON.stringify(data)});const j=await r.json();assert.equal(r.status,200,JSON.stringify(j));return j;}
 const rpc=async(method,params={})=>(await post('/api/mcp',{jsonrpc:'2.0',id:crypto.randomUUID(),method,params},{Accept:'application/json, text/event-stream','MCP-Protocol-Version':'2025-11-25'})).result;
 assert.equal((await rpc('initialize',{protocolVersion:'2025-11-25',capabilities:{},clientInfo:{name:'worker-test',version:'1'}})).protocolVersion,'2025-11-25');assert.equal((await rpc('tools/list')).tools.length,10);
 const command=await post('/api/command',{text:'Book two places in the photography workshop, reserve a camera, and put it on my calendar.',requestKey:crypto.randomUUID()});assert.equal(command.tool,'preview_booking');
 const preview=await rpc('tools/call',{name:command.tool,arguments:command.args});assert.equal(preview.isError,false);const op=preview.structuredContent.operation;
 const blocked=await rpc('tools/call',{name:'execute_approved_plan',arguments:{operationId:op.id}});assert.equal(blocked.isError,true);
 const approved=await post('/api/action',{type:'approve',operationId:op.id,revision:op.revision},{'X-Second-Take-Action':'review'});assert.equal(approved.state.records.length,0);
 const executed=await rpc('tools/call',{name:'execute_approved_plan',arguments:{operationId:op.id}});assert.equal(executed.structuredContent.operation.status,'completed');
 const refreshed=await mf.dispatchFetch('http://localhost/api/state',{headers:{cookie}});state=(await refreshed.json()).state;assert.equal(state.records.filter(r=>r.active).length,3);
 const isolated=await mf.dispatchFetch('http://localhost/api/state');assert.equal((await isolated.json()).state.records.length,0);
 const forbidden=await mf.dispatchFetch('http://localhost/api/action',{method:'POST',headers:{cookie,origin:'https://evil.test','content-type':'application/json'},body:'{}'});assert.equal(forbidden.status,403);
 // Rehearsal routes must never reset or mutate the main workspace.
 const rejected=await mf.dispatchFetch('http://localhost/api/action',{method:'POST',headers:{cookie,origin:'http://localhost','content-type':'application/json','X-Second-Take-Action':'review'},body:JSON.stringify({type:'start_rehearsal',scenario:'lost_reply'})});assert.equal(rejected.status,403);
 const practicePost=(path,data)=>post(path+'?workspace=rehearsal',data,{'X-Second-Take-Action':'review'});
 const practiceTool=async(name,args={})=>{
  const r=await post('/api/mcp?workspace=rehearsal',{jsonrpc:'2.0',id:crypto.randomUUID(),method:'tools/call',params:{name,arguments:args}},{Accept:'application/json, text/event-stream','MCP-Protocol-Version':'2025-11-25'});
  assert.equal(r.result.isError,false,JSON.stringify(r));return r.result.structuredContent;
 };
 for(const scenario of ['lost_reply','manual_edit','cancellation']){
  const started=await practicePost('/api/action',{type:'start_rehearsal',scenario});assert.equal(started.state.records.length,0);
  const booking=(await practiceTool('preview_booking',{workshopId:'photography',seats:2,camera:true,calendar:true,requestKey:crypto.randomUUID()})).operation;
  await practicePost('/api/action',{type:'approve',operationId:booking.id,revision:booking.revision});
  let result=(await practiceTool('execute_approved_plan',{operationId:booking.id})).operation;
  if(scenario==='lost_reply'){
   assert.equal(result.status,'awaiting_resolution');const e=(await practiceTool('get_operation',{operationId:booking.id})).evidence;
   assert.equal(e.actions.find(a=>a.kind==='equipment').savedState,'active');assert.equal(e.actions.find(a=>a.kind==='equipment').status,'unknown');
   result=(await practiceTool('reconcile_operation',{operationId:booking.id})).operation;assert.equal(result.status,'completed');
   assert.deepEqual(result.actions.map(a=>a.attempts),[1,2,1]);
  }else{
   if(scenario==='manual_edit'){
    const event=result.actions.find(a=>a.kind==='calendar').after;
    await practicePost('/api/action',{type:'edit_calendar',recordId:event.id,title:'Photography with Maya',note:'Meet at the side entrance.',version:event.version});
   }else await practicePost('/api/action',{type:'fault',fault:'compensation'});
   let correction=(await practiceTool('preview_change',{mode:'remove_camera',sourceId:booking.id,requestKey:crypto.randomUUID()})).operation;
   if(scenario==='manual_edit'){
    assert.ok(correction.actions.some(a=>a.status==='conflict'));const r=await practicePost('/api/action',{type:'resolve',operationId:correction.id,choice:'preserve'});correction=r.state.operations.find(o=>o.id===correction.id);
   }
   await practicePost('/api/action',{type:'approve',operationId:correction.id,revision:correction.revision});
   result=(await practiceTool('execute_approved_plan',{operationId:correction.id})).operation;
   if(scenario==='cancellation'){
    assert.equal(result.status,'awaiting_resolution');result=(await practiceTool('reconcile_operation',{operationId:correction.id})).operation;assert.deepEqual(result.actions.map(a=>a.attempts),[1,2]);
   }else assert.equal((await practiceTool('get_operation',{operationId:correction.id})).evidence.protectedRecords[0].unchanged,true);
   assert.equal(result.status,'completed');
  }
 }
 const mainAfter=await mf.dispatchFetch('http://localhost/api/state',{headers:{cookie}});
 const unchanged=(await mainAfter.json()).state;assert.equal(unchanged.records.length,3);assert.equal(unchanged.operations.length,1);assert.equal(unchanged.rehearsal,undefined);
 console.log('PASS: all three rehearsal flows through compiled HTTP/MCP routes, evidence, approval and main-workspace isolation.');
 // Reproduce the reported restaurant request through the same command -> MCP -> approval path as the browser.
 let restaurantCommand=await post('/api/command',{text:'Book a restaurant',requestKey:crypto.randomUUID(),timeZone:'Asia/Kolkata'});assert.match(restaurantCommand.reply,/Which city/);
 for(const text of ['Jaipur','tomorrow at 7 pm','2 people'])restaurantCommand=await post('/api/command',{text,requestKey:crypto.randomUUID(),timeZone:'Asia/Kolkata'});
 assert.equal(restaurantCommand.tool,'preview_service_booking');
 let restaurantPreview=(await rpc('tools/call',{name:restaurantCommand.tool,arguments:restaurantCommand.args})).structuredContent.servicePlan;
 assert.equal(restaurantPreview.details.location,'Jaipur');assert.equal(restaurantPreview.details.people,2);
 assert.equal((await rpc('tools/call',{name:'execute_service_plan',arguments:{planId:restaurantPreview.id}})).isError,true);
 await post('/api/action',{type:'approve_service',planId:restaurantPreview.id,revision:restaurantPreview.revision},{'X-Second-Take-Action':'review'});
 const revised=await post('/api/action',{type:'revise_service',planId:restaurantPreview.id},{'X-Second-Take-Action':'review'});assert.equal(revised.state.bookingDraft.location,'Jaipur');
 assert.equal((await rpc('tools/call',{name:'execute_service_plan',arguments:{planId:restaurantPreview.id}})).isError,true);
 restaurantPreview=(await rpc('tools/call',{name:'preview_service_booking',arguments:{...restaurantCommand.args,requestKey:crypto.randomUUID()}})).structuredContent.servicePlan;
 await post('/api/action',{type:'approve_service',planId:restaurantPreview.id,revision:restaurantPreview.revision},{'X-Second-Take-Action':'review'});
 assert.equal((await rpc('tools/call',{name:'execute_service_plan',arguments:{planId:restaurantPreview.id}})).structuredContent.servicePlan.status,'completed');
 const editCommand=await post('/api/command',{text:'actually make it four people',requestKey:crypto.randomUUID(),timeZone:'Asia/Kolkata'});
 const editPreview=(await rpc('tools/call',{name:editCommand.tool,arguments:editCommand.args})).structuredContent.servicePlan;
 assert.equal(editPreview.details.people,4);await post('/api/action',{type:'approve_service',planId:editPreview.id,revision:editPreview.revision},{'X-Second-Take-Action':'review'});
 await rpc('tools/call',{name:'execute_service_plan',arguments:{planId:editPreview.id}});
 const cancelCommand=await post('/api/command',{text:'cancel the restaurant reservation',requestKey:crypto.randomUUID(),timeZone:'Asia/Kolkata'});
 const cancelPreview=(await rpc('tools/call',{name:cancelCommand.tool,arguments:cancelCommand.args})).structuredContent.servicePlan;
 await post('/api/action',{type:'approve_service',planId:cancelPreview.id,revision:cancelPreview.revision},{'X-Second-Take-Action':'review'});
 await rpc('tools/call',{name:'execute_service_plan',arguments:{planId:cancelPreview.id}});
 const finalState=(await (await mf.dispatchFetch('http://localhost/api/state',{headers:{cookie}})).json()).state;
 assert.equal(finalState.reservations.length,1);assert.equal(finalState.reservations[0].active,false);assert.equal(finalState.records.filter(r=>r.active).length,3);
 console.log('PASS: reported restaurant request, multi-turn details, exact approval, preview revision, edit, cancellation and existing workshop preservation through compiled APIs.');
 console.log('PASS: built Worker + D1 initialization, guided request, real MCP preview, rejected unapproved execution, approval, execution, reload, session isolation, and cross-origin rejection.');
}finally{await mf.dispose();}
