import {makeStore} from '@/lib/second-take/store';
import {workspace,response,failure,checkOrigin} from '@/lib/second-take/security';
import {env} from 'cloudflare:workers';
export const dynamic='force-dynamic';
export async function GET(req:Request){try{checkOrigin(req);const session=workspace(req,true);const snap=await makeStore(session.id).read();const e=env as unknown as Record<string,string|undefined>;return response({state:snap.data,version:snap.version,mode:e.AWS_BEARER_TOKEN_BEDROCK&&e.BEDROCK_MODEL_ID&&e.AWS_REGION?'bedrock':'guided'},200,session.cookie);}catch(e){return failure(e);}}
