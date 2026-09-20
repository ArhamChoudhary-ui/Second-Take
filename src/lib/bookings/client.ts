/** Never mistake a hosting/login HTML response for a successful API call. */
export async function jsonFetch(url:string,options:RequestInit={}):Promise<any>{
 const res=await fetch(url,{credentials:'same-origin',...options});
 if(res.redirected||res.status===401||res.status===403){
  // Prefer the app's own structured error when it is available.
  if(res.headers.get('content-type')?.includes('application/json')){
   const data=await res.json() as any;
   if(typeof data.error==='string')throw new Error(data.error);
  }
  throw new Error('This request could not be authenticated. Reopen Second Take and sign in, then try again.');
 }
 if(!res.headers.get('content-type')?.includes('application/json')){
  throw new Error(`The booking connection returned an unexpected response (HTTP ${res.status}). Reload Second Take and retry the request.`);
 }
 let data:any;try{data=await res.json();}catch{throw new Error('The booking service returned an incomplete response. Reload your workspace before retrying.');}
 if(!res.ok)throw new Error(typeof data.error==='string'?data.error:'The booking service is temporarily unavailable. Please retry.');
 return data;
}
