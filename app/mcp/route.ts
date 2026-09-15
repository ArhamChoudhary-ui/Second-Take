import {makeStore} from '@/lib/second-take/store';
import {workspace,failure,checkOrigin} from '@/lib/second-take/security';
import {handleMcp} from '@/lib/second-take/mcp';
export const dynamic='force-dynamic';
export async function POST(req:Request){try{checkOrigin(req);return await handleMcp(req,makeStore(workspace(req).id));}catch(e){return failure(e);}}
export async function GET(req:Request){try{checkOrigin(req);return new Response(null,{status:405,headers:{Allow:'POST'}});}catch(e){return failure(e);}}
export const DELETE=GET;
