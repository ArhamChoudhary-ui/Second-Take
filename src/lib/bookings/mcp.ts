import type {Store} from './model.ts';
import {toolDefinitions,callTool} from './tools.ts';
import {checkOrigin,response} from './security.ts';
const protocol='2025-11-25';
function rpcError(id:unknown,code:number,message:string,status=200){return response({jsonrpc:'2.0',id:id??null,error:{code,message}},status);}
/** Minimal stateless MCP Streamable HTTP transport. JSON responses; GET/SSE is optional. */
export async function handleMcp(req:Request,store:Store):Promise<Response>{
 try{checkOrigin(req);}catch{return rpcError(null,-32000,'Origin is not allowed.',403);}
 if(req.method==='GET'||req.method==='DELETE')return new Response(null,{status:405,headers:{Allow:'POST'}});
 if(req.method!=='POST')return new Response(null,{status:405,headers:{Allow:'POST'}});
 const accept=req.headers.get('accept')??'';if(!accept.includes('application/json')||!accept.includes('text/event-stream'))return rpcError(null,-32600,'Accept must include application/json and text/event-stream.',406);
 if(!req.headers.get('content-type')?.includes('application/json'))return rpcError(null,-32600,'Expected application/json.',415);
 let body;try{const raw=await req.text();if(raw.length>16384)return rpcError(null,-32600,'Message is too large.',413);body=JSON.parse(raw);}catch{return rpcError(null,-32700,'Invalid JSON.',400);}
 if(!body||Array.isArray(body)||body.jsonrpc!=='2.0'||typeof body.method!=='string'||('id' in body&&typeof body.id!=='string'&&typeof body.id!=='number'))return rpcError(null,-32600,'Invalid JSON-RPC request.',400);
 const id=body.id;const version=req.headers.get('mcp-protocol-version');if(version&&version!==protocol)return rpcError(id,-32600,'Unsupported MCP protocol version.',400);
 if(body.method!=='initialize'&&!version)return rpcError(id,-32600,'Send MCP-Protocol-Version: 2025-11-25 after initialization.',400);
 if(id===undefined){if(!body.method.startsWith('notifications/'))return rpcError(null,-32600,'Tool requests require an id.',400);return new Response(null,{status:202});}
 if(body.method==='initialize'){
  if(typeof body.params?.protocolVersion!=='string'||!body.params?.clientInfo||!body.params?.capabilities)return rpcError(id,-32602,'Initialization requires protocolVersion, clientInfo, and capabilities.');
  return response({jsonrpc:'2.0',id,result:{protocolVersion:protocol,capabilities:{tools:{listChanged:false}},serverInfo:{name:'second-take',version:'0.2.0'},instructions:'Use preview tools, then review and approve in the browser. These are isolated workshop, restaurant, appointment and event simulators. No real providers, purchases or external calendar writes.'}});
 }
 if(body.method==='ping')return response({jsonrpc:'2.0',id,result:{}});
 if(body.method==='tools/list')return response({jsonrpc:'2.0',id,result:{tools:toolDefinitions}});
 if(body.method!=='tools/call')return rpcError(id,-32601,'Method not found.');
 const name=body.params?.name;if(!toolDefinitions.some(t=>t.name===name))return rpcError(id,-32602,'Unknown tool.');
 try{const data=await callTool(store,name,body.params.arguments??{});return response({jsonrpc:'2.0',id,result:{content:[{type:'text',text:JSON.stringify(data)}],structuredContent:data,isError:false}});}catch(error){const e=error as Error&{code?:string};if(e.name==='ZodError')return rpcError(id,-32602,'Tool arguments do not match the input schema.');return response({jsonrpc:'2.0',id,result:{content:[{type:'text',text:e.code?e.message:'The service is temporarily unavailable.'}],isError:true}});}
}
