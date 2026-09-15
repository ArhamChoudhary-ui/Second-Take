import type {State,RecordItem} from './model.ts';
import {operationEvidence} from './evidence.ts';
import {services,reservationInstant} from './services.ts';
import type {Reservation} from './services.ts';

const textValue=(value:string)=>value.replace(/\\/g,'\\\\').replace(/\r\n|\r|\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,').replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g,'');
function fold(line:string){
 const encoder=new TextEncoder();const lines:string[]=[];let current='';let bytes=0;
 for(const char of line){const size=encoder.encode(char).length;if(bytes+size>75){lines.push(current);current=' ';bytes=1;}current+=char;bytes+=size;}
 lines.push(current);return lines.join('\r\n');
}
export function calendarFile(state:State,record:RecordItem,date=new Date()){
 if(record.kind!=='calendar'||!record.active)throw new Error('Only active calendar events can be exported.');
 const workshop=state.workshops.find(w=>w.id===record.workshopId);if(!workshop)throw new Error('Workshop not found.');
 const utc=(time:string)=>workshop.date.replaceAll('-','')+'T'+time.replace(':','')+'00Z';
 const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Second Take//Demo Calendar//EN','CALSCALE:GREGORIAN',
  'BEGIN:VEVENT','UID:'+textValue(record.id)+'@second-take.demo','DTSTAMP:'+date.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,''),
  'DTSTART:'+utc(workshop.time),'DTEND:'+utc(workshop.endTime),'SEQUENCE:'+Math.max(0,record.version-1),
  'SUMMARY:'+textValue('[Demo] '+record.title),'DESCRIPTION:'+textValue('Second Take sample event. No real workshop reservation.\n\n'+record.note),
  'STATUS:CONFIRMED','TRANSP:TRANSPARENT','END:VEVENT','END:VCALENDAR'];
 return lines.map(fold).join('\r\n')+'\r\n';
}
export function reservationCalendarFile(record:Reservation,date=new Date()){
 if(!record.active)throw new Error('Only active reservations can be exported.');
 const start=reservationInstant(record);
 const stamp=(value:number)=>new Date(value).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
 const description=`Second Take simulated ${record.service} reservation. No real provider has been contacted.\n${record.people} ${record.people===1?'person':'people'}. Original time: ${record.date} ${record.time} ${record.timeZone}.\nThis is a snapshot. Later changes or cancellations do not sync automatically. Remove or update your imported event yourself.`;
 return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Second Take//Simulated Reservations//EN','CALSCALE:GREGORIAN',
  'BEGIN:VEVENT','UID:'+textValue(record.id)+'@second-take.demo','DTSTAMP:'+stamp(date.getTime()),
  'DTSTART:'+stamp(start),'DTEND:'+stamp(start+services[record.service].duration*60000),
  'SEQUENCE:'+Math.max(0,record.version-1),'SUMMARY:'+textValue('[Demo] '+record.venue),
  'LOCATION:'+textValue(record.location),'DESCRIPTION:'+textValue(description),
  'STATUS:CONFIRMED','TRANSP:TRANSPARENT','END:VEVENT','END:VCALENDAR'].map(fold).join('\r\n')+'\r\n';
}
const escape=(v:unknown)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export function receiptHtml(state:State,date=new Date()){
 const operations=state.operations.map(operation=>{
  const e=operationEvidence(state,operation);
  return `<section><h2>${escape(operation.title)}</h2><p>${escape(operation.request)}</p><p class="meta">${escape(operation.id)} · ${escape(operation.status)}<br>Approved: ${escape(operation.approvedAt??'Not approved')}<br>Revision: ${escape(operation.revision)}</p><table><thead><tr><th>Action</th><th>Assistant result</th><th>Current saved record</th><th>Attempts</th></tr></thead><tbody>${e.actions.map(a=>`<tr><td>${escape(a.type)} ${escape(a.kind)}<br><small>${escape(a.recordId)}</small></td><td>${escape(a.status)}</td><td>${escape(a.savedState)}${a.currentVersion?' · v'+a.currentVersion:''}</td><td>${a.attempts}</td></tr>`).join('')}</tbody></table>${e.protectedRecords.map(r=>`<p class="protected">Preserved at review: <strong>${escape(r.title)}</strong><br>${escape(r.note)}<br>Version ${r.version}; ${r.unchanged?'still unchanged':'changed since that review'}.</p>`).join('')}</section>`;
 }).join('');
 return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src 'none'; base-uri 'none'; form-action 'none'"><title>Second Take — action receipt</title><style>body{font:16px/1.6 system-ui,sans-serif;max-width:1000px;margin:40px auto;padding:0 24px;color:#17243a}h1{font-size:38px;letter-spacing:-1px}h2{font-size:23px}header{border-bottom:4px solid #2459ed;padding-bottom:22px}section{margin:32px 0;border-bottom:1px solid #dce3ee;padding-bottom:24px;break-inside:avoid}table{border-collapse:collapse;width:100%;font-size:14px}th,td{padding:12px;border:1px solid #dce3ee;text-align:left;vertical-align:top;overflow-wrap:anywhere}small,.meta{color:#52647d;font-size:13px;overflow-wrap:anywhere}.protected{background:#eef7f4;padding:14px}li{margin:12px 0}footer{color:#52647d}@media print{body{margin:0}h1{font-size:28px}table{font-size:11px}}</style></head><body><header><p>SECOND TAKE / ACTION RECEIPT</p><h1>What changed. What stayed.</h1><p>Exported ${escape(date.toISOString())}. ${state.rehearsal?'Practice example: '+escape(state.rehearsal.scenario)+'.':''}</p><p>Saved sample-service results, captured at export time. This is a readable record, not independent or tamper-proof certification. Calendar downloads are snapshots, not live synchronization.</p></header><section><h2>Current service records</h2>${state.records.map(r=>`<p><strong>${escape(r.title)}</strong> · ${escape(r.kind)} · ${r.active?'active':'cancelled'} · v${r.version}<br>${escape(r.note)}<br><small>${escape(r.id)}</small></p>`).join('')||'<p>No saved records.</p>'}</section>${(state.reservations??[]).length?`<section><h2>Simulated service reservations</h2>${state.reservations!.map(r=>`<p><strong>${escape(r.venue)}</strong> · ${escape(r.service)} · ${r.active?'active':'cancelled'} · v${r.version}<br>${escape(r.location)} · ${escape(r.date)} ${escape(r.time)} ${escape(r.timeZone)} · ${r.people} people<br><small>${escape(r.id)}</small></p>`).join('')}<p>No real provider was contacted.</p></section>`:''}${(state.servicePlans??[]).map(p=>`<section><h2>${escape(p.details.venue)} · ${escape(p.type)}</h2><p>${escape(p.status)} · ${escape(p.id)}</p><p>Approved: ${escape(p.approvedAt??'Not approved')}<br>Revision: ${escape(p.revision)}<br>Reservation: ${escape(p.reservationId)}</p></section>`).join('')}${operations||'<p>No workshop plans yet.</p>'}<section><h2>Activity</h2><ol>${state.timeline.map(t=>`<li><strong>${escape(t.title)}</strong> <small>${escape(t.at)}</small><br>${escape(t.detail)}</li>`).join('')}</ol></section><footer>Alexa+ experience simulation. Controlled failures affect our own demo database. No real purchases or external booking services.</footer></body></html>`;
}
