// No dependencies: exercise the actual HTTP transport, not a proprietary tool endpoint.
import assert from 'node:assert/strict';
const base=process.env.SECOND_TAKE_URL??'http://127.0.0.1:3000';
const session=await fetch(`${base}/api/state`);assert.equal(session.status,200,'App must be reachable. Private hosting may require a browser sign-in.');
const cookie=process.env.SECOND_TAKE_COOKIE??session.headers.get('set-cookie')?.split(';')[0];assert.ok(cookie,'A session cookie is required.');
let id=0;
async function rpc(method,params={}){const r=await fetch(`${base}/api/mcp`,{method:'POST',headers:{'content-type':'application/json',accept:'application/json, text/event-stream','MCP-Protocol-Version':'2025-11-25',cookie},body:JSON.stringify({jsonrpc:'2.0',id:++id,method,params})});assert.equal(r.status,200);const j=await r.json();assert.ok(!j.error,JSON.stringify(j.error));return j.result;}
assert.equal((await rpc('initialize',{protocolVersion:'2025-11-25',capabilities:{},clientInfo:{name:'second-take-smoke',version:'1.0'}})).protocolVersion,'2025-11-25');
assert.equal((await rpc('tools/list')).tools.length,10);
assert.equal((await rpc('tools/call',{name:'list_workshops',arguments:{}})).isError,false);
const plan=await rpc('tools/call',{name:'preview_booking',arguments:{workshopId:'photography',seats:2,camera:true,calendar:true,requestKey:crypto.randomUUID()}});
assert.equal(plan.isError,false);
const blocked=await rpc('tools/call',{name:'execute_approved_plan',arguments:{operationId:plan.structuredContent.operation.id}});assert.equal(blocked.isError,true);assert.match(blocked.content[0].text,/approve/i);
console.log('PASS: initialization, tool discovery, catalogue, preview, and approval rejection.');
