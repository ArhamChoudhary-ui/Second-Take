import {makeStore} from '@/lib/second-take/store';
import {workspace,response,failure,checkOrigin,jsonBody} from '@/lib/second-take/security';
import {approve,resolveConflict,setFault,editCalendar,resetDemo,startRehearsal} from '@/lib/second-take/engine';
import {z} from 'zod';
import {approveServicePlan,editServiceDraft,reviseServicePlan} from '@/lib/second-take/services';
const schema=z.discriminatedUnion('type',[
 z.object({type:z.literal('approve_service'),planId:z.string().uuid(),revision:z.string().uuid()}).strict(),
 z.object({type:z.literal('edit_service'),reservationId:z.string().uuid()}).strict(),
 z.object({type:z.literal('revise_service'),planId:z.string().uuid()}).strict(),
 z.object({type:z.literal('start_rehearsal'),scenario:z.enum(['lost_reply','manual_edit','cancellation'])}).strict(),
 z.object({type:z.literal('approve'),operationId:z.string().uuid(),revision:z.string().uuid()}).strict(),
 z.object({type:z.literal('resolve'),operationId:z.string().uuid(),choice:z.enum(['preserve','include_current'])}).strict(),
 z.object({type:z.literal('fault'),fault:z.enum(['none','before','after','compensation'])}).strict(),
 z.object({type:z.literal('edit_calendar'),recordId:z.string().max(100),title:z.string().max(120),note:z.string().max(500),version:z.number().int()}).strict(),
 z.object({type:z.literal('reset'),confirm:z.literal('RESET_DEMO')}).strict()
]);
export async function POST(req:Request){try{checkOrigin(req,true);if(req.headers.get('x-second-take-action')!=='review')return response({error:'Use the review controls in the app.'},403);const a=schema.parse(await jsonBody(req));const store=makeStore(workspace(req).id);
 if(a.type==='start_rehearsal'){if(new URL(req.url).searchParams.get('workspace')!=='rehearsal')return response({error:'Practice examples require the separate rehearsal workspace.'},403);await startRehearsal(store,a.scenario);}
 if(a.type==='approve_service')await approveServicePlan(store,a.planId,a.revision);
 if(a.type==='edit_service')await editServiceDraft(store,a.reservationId);
 if(a.type==='revise_service')await reviseServicePlan(store,a.planId);
 if(a.type==='approve')await approve(store,a.operationId,a.revision);
 if(a.type==='resolve')await resolveConflict(store,a.operationId,a.choice);
 if(a.type==='fault')await setFault(store,a.fault);
 if(a.type==='edit_calendar')await editCalendar(store,a.recordId,a.title,a.note,a.version);
 if(a.type==='reset')await resetDemo(store);
 return response({state:(await store.read()).data});
 }catch(e){if((e as Error).name==='ZodError')return response({error:'These action details are invalid.'},400);return failure(e);}}
