import {test} from 'node:test';
import assert from 'node:assert/strict';
import {jsonFetch} from '../../src/lib/bookings/client.ts';
import {readFileSync} from 'node:fs';
test('browser API parser rejects hosting HTML with a specific connection error',async(t)=>{
 t.mock.method(globalThis,'fetch',async()=>new Response('<html>Gateway</html>',{status:200,headers:{'content-type':'text/html'}}));
 await assert.rejects(jsonFetch('/api/mcp'),/unexpected response \(HTTP 200\)/);
});
test('browser API parser preserves structured authorization and domain errors',async(t)=>{
 t.mock.method(globalThis,'fetch',async()=>Response.json({error:'Review this plan first.'},{status:403}));
 await assert.rejects(jsonFetch('/api/action'),/Review this plan first/);
});
test('browser MCP calls use the application route, separate from the host MCP gateway',()=>{
 const page=readFileSync('src/components/workspace/workspace.tsx','utf8');
 assert.ok(page.includes("jsonFetch(api('/api/mcp'"));
 assert.ok(page.includes("fetch(api('/api/mcp'"));
 assert.ok(!page.includes("fetch('/mcp'"));
});
