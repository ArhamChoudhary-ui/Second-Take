import {z} from 'zod';
import type {State} from './model.ts';
export type Intent={type:'book';workshopId:'photography'|'street'|'light';seats:number;camera:boolean;calendar:boolean}|{type:'change';mode:'remove_camera'|'undo_keep_workshop'|'undo_all'}|{type:'clarify';message:string};
const intentSchema=z.discriminatedUnion('type',[
 z.object({type:z.literal('book'),workshopId:z.enum(['photography','street','light']),seats:z.number().int().min(1).max(8),camera:z.boolean(),calendar:z.boolean()}).strict(),
 z.object({type:z.literal('change'),mode:z.enum(['remove_camera','undo_keep_workshop','undo_all'])}).strict(),
 z.object({type:z.literal('clarify'),message:z.string().min(1).max(500)}).strict()
]);
export function guidedIntent(text:string):Intent{
 const t=text.toLowerCase().trim();
 if(/(?:undo|cancel|remove).*(?:all|everything|whole booking)/.test(t))return {type:'change',mode:'undo_all'};
 if(/undo/.test(t)&&/keep.*(?:workshop|booking|places)/.test(t))return {type:'change',mode:'undo_keep_workshop'};
 if(/(?:own camera|remove.*(?:camera|rental)|cancel.*(?:camera|rental)|don.t need.*camera)/.test(t))return {type:'change',mode:'remove_camera'};
 if(/\b(?:book|reserve)\b/.test(t)&&/\b(?:workshop|photography|street|light|seeing)\b/.test(t)){
  if(/\b(?:monday|tuesday|wednesday|thursday|friday|tomorrow|today|next week)\b/.test(t)||/\d{4}-\d{2}-\d{2}/.test(t))return {type:'clarify',message:'Guided demo supports the catalogue dates shown on the right. Choose a workshop card to set the exact date.'};
  const nums:Record<string,number>={one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8};const m=t.match(/\b(\d+|one|two|three|four|five|six|seven|eight)\s+(?:places?|seats?|people|spots?)\b/);if(!m)return {type:'clarify',message:'How many places? Try “Book two places in the photography workshop, reserve a camera, and add it to my calendar.”'};
  const seats=nums[m[1]]??Number(m[1]);if(seats<1||seats>8)return {type:'clarify',message:'The demo supports one to eight places. Choose a smaller group.'};
  const workshopId=/street/.test(t)?'street':/chasing|light|sunday/.test(t)?'light':'photography';
  return {type:'book',workshopId,seats,camera:/camera|rental/.test(t)&&!/without.*(?:camera|rental)|no (?:camera|rental)/.test(t),calendar:/calendar/.test(t)&&!/no calendar|without.*calendar/.test(t)};
 }
 return {type:'clarify',message:'I can help with simulated restaurant reservations, appointments, events, and workshop bookings. Try “Book a restaurant” or choose a booking type. Real providers are not connected.'};
}
export interface AIConfig {region?:string;model?:string;token?:string;}
export async function interpret(text:string,state:State,config:AIConfig):Promise<{intent:Intent;mode:string}>{
 if(!config.region||!config.model||!config.token)return {intent:guidedIntent(text),mode:'guided'};
 if(!/^[a-z]{2}-[a-z]+-\d$/.test(config.region))throw new Error('Invalid AWS region.');
 const system=`You interpret requests for Second Take, a booking assistant. Return only one JSON object. No markdown. Valid shapes: {"type":"book","workshopId":"photography"|"street"|"light","seats":1..8,"camera":boolean,"calendar":boolean}; {"type":"change","mode":"remove_camera"|"undo_keep_workshop"|"undo_all"}; or {"type":"clarify","message":"one concise clarification"}. Never assume consent, execute actions, or invent workshops. Ask if date, workshop, or quantity is ambiguous. Current UTC date: ${new Date().toISOString().slice(0,10)}. Catalogue: ${JSON.stringify(state.workshops)}. Active bookings: ${JSON.stringify(state.records.filter(r=>r.active).map(r=>({kind:r.kind,title:r.title})))}.`;
 const res=await fetch(`https://bedrock-runtime.${config.region}.amazonaws.com/model/${encodeURIComponent(config.model)}/converse`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${config.token}`},body:JSON.stringify({system:[{text:system}],messages:[{role:'user',content:[{text}]}],inferenceConfig:{maxTokens:500,temperature:0}}),signal:AbortSignal.timeout(20000)});
 if(!res.ok)throw new Error(`Bedrock is unavailable (${res.status}). Check the configured model and key.`);
 const result=await res.json() as {output?:{message?:{content?:{text?:string}[]}}};const content=result.output?.message?.content?.map(c=>c.text??'').join('')??'';const intent=intentSchema.parse(JSON.parse(content));return {intent,mode:'bedrock'};
}
