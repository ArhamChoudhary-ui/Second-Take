import {DomainError} from './model.ts';
export function checkOrigin(req:Request,required=false){const origin=req.headers.get('origin');if((required&&!origin)||(origin&&origin!==new URL(req.url).origin))throw new DomainError('FORBIDDEN','This request must come from the application.');if(req.headers.get('sec-fetch-site')==='cross-site')throw new DomainError('FORBIDDEN','Cross-site requests are not allowed.');}
export function workspace(req:Request,create=false){
 const cookie=req.headers.get('cookie')??'';const match=cookie.match(/(?:^|;\s*)st_session=([a-f0-9]{64})(?:;|$)/);
 const suffix=new URL(req.url).searchParams.get('workspace')==='rehearsal'?':rehearsal':'';
 if(match)return {id:match[1]+suffix,cookie:undefined};
 if(!create)throw new DomainError('UNAUTHENTICATED','Open the app to start your isolated demo session.');
 const bytes=crypto.getRandomValues(new Uint8Array(32));const id=Array.from(bytes,x=>x.toString(16).padStart(2,'0')).join('');
 return {id:id+suffix,cookie:`st_session=${id}; HttpOnly; SameSite=Strict; Path=/; Max-Age=2592000${new URL(req.url).protocol==='https:'?'; Secure':''}`};
}
export async function jsonBody(req:Request){if(!req.headers.get('content-type')?.includes('application/json'))throw new DomainError('VALIDATION','Expected JSON.');const raw=await req.text();if(raw.length>16384)throw new DomainError('VALIDATION','Request is too large.');try{return JSON.parse(raw);}catch{throw new DomainError('VALIDATION','Invalid JSON.');}}
export function response(value:unknown,status=200,cookie?:string){return Response.json(value,{status,headers:{'Cache-Control':'no-store',...(cookie?{'Set-Cookie':cookie}:{})}});}
export function failure(error:unknown){const e=error as DomainError;const status=e.code==='UNAUTHENTICATED'?401:e.code==='FORBIDDEN'?403:e.code==='NOT_FOUND'?404:e.code?409:503;if(!e.code)console.error('Second Take request failed',e.message);return response({error:e.code?e.message:'The service is temporarily unavailable. Your input is safe; please retry.',code:e.code??'UNAVAILABLE'},status);}
