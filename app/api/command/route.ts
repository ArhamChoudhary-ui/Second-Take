import {makeStore} from '@/lib/second-take/store';
import {workspace,response,failure,checkOrigin,jsonBody} from '@/lib/second-take/security';
import {serviceCommand} from '@/lib/second-take/service-conversation';
import {interpret} from '@/lib/second-take/intent';
import {transact,say} from '@/lib/second-take/engine';
import {env} from 'cloudflare:workers';
import {z} from 'zod';
export async function POST(req:Request){try{checkOrigin(req,true);const {text,requestKey,timeZone}=z.object({timeZone:z.string().max(80).default('UTC'),text:z.string().trim().min(1).max(1000),requestKey:z.string().min(8).max(120)}).strict().parse(await jsonBody(req));const store=makeStore(workspace(req).id);const serviceResult=await serviceCommand(store,text,requestKey,timeZone);if(serviceResult)return response(serviceResult);const s=(await store.read()).data;const e=env as unknown as Record<string,string|undefined>;const result=await interpret(text,s,{token:e.AWS_BEARER_TOKEN_BEDROCK,model:e.BEDROCK_MODEL_ID,region:e.AWS_REGION});await transact(store,s=>{say(s,'user',text);if(result.intent.type==='clarify')say(s,'assistant',result.intent.message);});
 if(result.intent.type==='clarify')return response({reply:result.intent.message,mode:result.mode});
 if(result.intent.type==='book'){await transact(store,s=>{delete s.bookingDraft;delete s.servicePlanFocus;});const {type,...args}=result.intent;return response({tool:'preview_booking',args:{...args,requestKey,request:text},mode:result.mode});}
 return response({tool:'preview_change',args:{mode:result.intent.mode,requestKey,request:text},mode:result.mode});
 }catch(e){if((e as Error).name==='ZodError')return response({error:'Use a request under 1,000 characters.'},400);return failure(e);}}
