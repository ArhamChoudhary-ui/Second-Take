import type {State,Store} from './model.ts';
import {transact,say} from './engine.ts';
import {localDate,services,validateDetails} from './services.ts';
import type {ServiceKind,BookingDraft,ReservationDetails} from './services.ts';

const numbers:Record<string,number>={one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,eleven:11,twelve:12};
const number=(s:string)=>numbers[s.toLowerCase()]??Number(s);
export const normalizeRequest=(s:string)=>s.trim().replace(/’/g,"'").replace(/restauran\s+t\b|resturant\b|restraunt\b|restuarant\b/gi,'restaurant').replace(/\s+/g,' ');
function serviceIn(text:string):ServiceKind|undefined{
 if(/\b(restaurant|dinner|lunch|table|bistro)\b/i.test(text))return 'restaurant';
 if(/\b(appointment|dentist|doctor|salon|haircut)\b/i.test(text))return 'appointment';
 if(/\b(event|concert|cinema|movie|tickets?)\b/i.test(text))return 'event';
}
export function missingField(d:BookingDraft){return !d.location?'location':!d.date?'date':!d.time?'time':!d.people?'people':null;}
function question(d:BookingDraft){
 const examples={location:'Which city or area? For example: Jaipur.',date:'Which date? Say tomorrow, a weekday, or YYYY-MM-DD.',time:`What time in ${d.timeZone}? For example: 7 pm or 19:00.`,people:'For how many people? For example: 2 people.'};
 return examples[missingField(d)??'location'];
}
function nextDate(shift:number,timeZone:string){const d=new Date(localDate(timeZone).date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+shift);return d.toISOString().slice(0,10);}
function fields(text:string,d:BookingDraft):{patch:Partial<BookingDraft>;error?:string}{
 const t=text.toLowerCase();const patch:Partial<BookingDraft>={};
 if(/-\d+(?:\.\d+)?\s*(?:people|persons?|guests?|seats?|tickets?)/.test(t))return {patch,error:'The number of people must be a positive whole number.'};
 const location=text.match(/\b(?:in|near)\s+(.+?)(?=\s+(?:for|on|at|day after tomorrow|tomorrow|today|tonight|next|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b|[,.;]|$)/i);if(location)patch.location=location[1].trim();
 const venue=text.match(/\b(?:at|named|called)\s+([a-z][\w '&-]*?)(?=\s+(?:in|near|for|on|at|day after tomorrow|tomorrow|today|tonight|next|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b|[,.;]|$)/i);
 if(venue&&!/^(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s*(?:am|pm)$/i.test(venue[1]))patch.venue=venue[1].trim();
 const iso=t.match(/\b(\d{4}-\d{2}-\d{2})\b/);
 if(iso){const date=new Date(iso[1]+'T12:00:00Z');if(!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==iso[1])return {patch,error:'That date does not exist. Please use a valid YYYY-MM-DD date.'};patch.date=iso[1];}
 else if(/\bday after tomorrow\b/.test(t))patch.date=nextDate(2,d.timeZone);
 else if(/\btomorrow\b/.test(t))patch.date=nextDate(1,d.timeZone);
 else if(/\b(today|tonight)\b/.test(t))patch.date=nextDate(0,d.timeZone);
 else{const weekdays=['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];const day=weekdays.findIndex(x=>new RegExp('\\b'+x+'\\b').test(t));if(day>=0){const today=new Date(localDate(d.timeZone).date+'T12:00:00Z');patch.date=nextDate((day-today.getUTCDay()+7)%7||7,d.timeZone);}}
 const time=t.match(/\b(\d{1,2}|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)(?::(\d{2}))?\s*(am|pm)\b/);
 const military=t.match(/\b(\d{1,2}):(\d{2})\b/);
 if(time){let hour=number(time[1]);const min=Number(time[2]??0);if(hour<1||hour>12||min>59)return {patch,error:'Use a valid time such as 7 pm or 19:00.'};hour=hour%12+(time[3]==='pm'?12:0);patch.time=`${String(hour).padStart(2,'0')}:${String(min).padStart(2,'0')}`;}
 else if(military){if(Number(military[1])>23||Number(military[2])>59)return {patch,error:'Use a valid time such as 7 pm or 19:00.'};patch.time=military[1].padStart(2,'0')+':'+military[2];}
 const people=t.match(/\b(?:for|party of|make it)\s+(-?\d+(?:\.\d+)?|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)(?![\d.:])\b(?!\s*(?:am|pm)\b)/)??t.match(/\b(-?\d+(?:\.\d+)?|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s+(?:people|persons?|guests?|seats?|tickets?)\b/);
 if(people)patch.people=number(people[1]);
 else if(/^(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)$/i.test(text)&&missingField(d)==='people')patch.people=number(text);
 if(patch.people!==undefined&&(!Number.isInteger(patch.people)||patch.people<1||patch.people>services[d.service].capacity))return {patch:{...patch,people:undefined},error:d.service==='appointment'?'This appointment simulator accepts one person per booking.':'Choose a whole number from 1 to 12 people.'};
 if(!Object.keys(patch).length&&missingField(d)==='location'&&/^[\p{L}][\p{L}\s,.'-]{1,99}$/u.test(text)&&! /\b(book|reserve|reservation|restaurant|appointment|event|help|yes|no|tomorrow|today)\b/i.test(text))patch.location=text.trim();
 return {patch};
}
function draftFrom(r:NonNullable<State['reservations']>[number]):BookingDraft{return {service:r.service,venue:r.venue,location:r.location,date:r.date,time:r.time,timeZone:r.timeZone,people:r.people,reservationId:r.id,expectedVersion:r.version};}
export async function serviceCommand(store:Store,raw:string,requestKey:string,timeZone='UTC'){
 const text=normalizeRequest(raw);const t=text.toLowerCase();const kind=serviceIn(text);const snapshot=(await store.read()).data;
 if(/\b(?:do not|don't|never)\s+(?:book|reserve|cancel|remove|undo|change|reschedule)\b/.test(t))return transact(store,s=>{const reply='No changes made. Tell me what you want to keep or change, or use the controls on the exact reservation.';say(s,'user',raw);say(s,'assistant',reply);return {mode:'guided',reply,service:!!kind||!!s.bookingDraft};});
 const cameraChange=/(?:cancel|remove)\s+(?:the\s+)?(?:camera|rental)/.test(t)||/own camera/.test(t);
 if(cameraChange&&!/(?:cancel|remove)\s+(?:the\s+)?(?:restaurant|dinner|table)/.test(t))return null;
 const workshop=/\b(workshop|photography|camera|rental)\b/.test(t);
 if(workshop&&!kind)return null;
 const active=(snapshot.reservations??[]).filter(r=>r.active);
 const cancel=/\b(cancel|remove|undo)\b/.test(t);
 const change=/\b(change|reschedule|move|update|actually|instead)\b|make it/.test(t);
 if(!kind&&!snapshot.bookingDraft&&!(active.length&&(cancel||change))&&!/^(?:help|what can you do)[?!.]*$/.test(t))return null;
 try{localDate(timeZone);}catch{return transact(store,s=>{say(s,'user',raw);say(s,'assistant','Use a valid IANA time zone in the reservation form, such as Asia/Kolkata.');return {service:true,mode:'guided',reply:'Invalid time zone.'};});}
 return transact(store,s=>{
  const reply=(message:string)=>{say(s,'user',raw);say(s,'assistant',message);return {reply:message,mode:'guided',service:true};};
  if(workshop&&kind)return reply('Please plan one service at a time so each change can be reviewed. I can help with simulated restaurants, appointments, events, and workshops.');
  if(/^(?:help|what can you do)[?!.]*$/.test(t))return reply('I support simulated restaurant reservations, appointments, events, and workshop bookings. Try “Book a restaurant” or use the booking controls. No real provider is connected.');
  if(/^(?:never ?mind|start over|discard(?: draft)?|cancel draft)[.!]*$/.test(t)){
   delete s.bookingDraft;delete s.servicePlanFocus;for(const p of s.servicePlans??[])if(['approved','awaiting_approval'].includes(p.status))p.status='superseded';return reply('The unfinished reservation draft is discarded. Saved reservations have not changed.');
  }
  const candidates=(s.reservations??[]).filter(r=>r.active&&(!kind||r.service===kind));
  if(cancel){
   if(s.bookingDraft&&candidates.length&&/^(?:cancel|undo)(?: it| that)?[.!]*$/.test(t))return reply('There is an unfinished draft and a saved reservation. Say “discard draft” to abandon the draft, or use Cancel on the saved reservation card.');
   if(!kind&&candidates.length+s.records.filter(r=>r.active&&r.kind==='workshop').length>1)return reply('Which booking should I cancel? Use Cancel on the exact reservation card. No bookings have changed.');
   if(/\b(all|everything)\b/.test(t)&&(candidates.length+s.records.filter(r=>r.active&&r.kind==='workshop').length)>1)return reply('There is more than one booking. Use Cancel on the exact reservation card so you can review its cancellation. No bookings have changed.');
   if(!candidates.length&&s.bookingDraft){delete s.bookingDraft;delete s.servicePlanFocus;for(const p of s.servicePlans??[])if(['approved','awaiting_approval'].includes(p.status))p.status='superseded';return reply('Your unconfirmed draft is discarded. No reservation was made.');}
   if(candidates.length!==1)return reply(candidates.length?'Which reservation should I cancel? Use Cancel on its card to choose it precisely.':'There is no matching saved reservation to cancel.');
   say(s,'user',raw);return {service:true,mode:'guided',tool:'preview_service_cancellation',args:{reservationId:candidates[0].id,requestKey}};
  }
  let draft=s.bookingDraft;
  const fresh=!!kind&&(/\b(book|reserve|reservation)\b/.test(t)&&!change||!draft&&!change);
  if(fresh){draft={service:kind!,timeZone,people:kind==='appointment'?1:undefined};delete s.servicePlanFocus;}
  else if(change&&!draft){
   if(candidates.length!==1)return reply(candidates.length?'Which reservation should I change? Use Change on its card.':'Book a reservation first, or tell me which service you want.');
   draft=draftFrom(candidates[0]);delete s.servicePlanFocus;
  }
  if(!draft)return reply('Try “Book a restaurant”, “Book an appointment”, or “Book an event”. I’ll ask for the details. These are simulated reservations.');
  const parsed=fields(text,draft);const hasChanges=Object.keys(parsed.patch).length>0;
  Object.assign(draft,parsed.patch);s.bookingDraft=draft;
  if(fresh||hasChanges||parsed.error){delete s.servicePlanFocus;for(const p of s.servicePlans??[])if(['awaiting_approval','approved'].includes(p.status))p.status='superseded';}
  if(parsed.error)return reply(parsed.error);
  if(missingField(draft))return reply((fresh?`I can help with a simulated ${draft.service} reservation. No real provider is contacted. `:'')+question(draft));
  if(!fresh&&!hasChanges)return reply('Tell me what to change, such as “make it four people” or “tomorrow at 8 pm”, or review the details in the form.');
  const details:ReservationDetails={service:draft.service,venue:draft.venue||services[draft.service].name,location:draft.location!,date:draft.date!,time:draft.time!,timeZone:draft.timeZone,people:draft.people!};
  try{validateDetails(details);}catch(e){return reply((e as Error).message);}
  say(s,'user',raw);
  if(/\bcalendar\b/.test(t))say(s,'assistant','This preview covers the simulated reservation only. After approval, you can download a demo calendar snapshot from the reservation card. Linked calendar actions are available for workshops.');
  return {service:true,mode:'guided',tool:'preview_service_booking',args:{...details,requestKey,...(draft.reservationId?{reservationId:draft.reservationId,expectedVersion:draft.expectedVersion}:{})}};
 });
}
