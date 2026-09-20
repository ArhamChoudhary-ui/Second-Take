"use client";
import {ArrowRight,CheckCircle2,ShieldCheck,Unplug,RotateCcw,Download,Check,Database,MessageSquare} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {operationEvidence} from '@/lib/bookings/evidence';
import type {State,Operation,RecordItem,Scenario} from '@/lib/bookings/model';

export const stories=[
 {id:'lost_reply',icon:Unplug,title:'The missing confirmation',description:'The camera is saved. Its reply disappears. Can we finish without booking twice?',takeaway:'Check before retrying.'},
 {id:'manual_edit',icon:ShieldCheck,title:'The edit that stays yours',description:'You change your calendar. Then you cancel the camera. Your own words should survive.',takeaway:'Respect the newer edit.'},
 {id:'cancellation',icon:RotateCcw,title:'The unfinished cancellation',description:'The calendar updates, but cancelling the camera fails. Continue from that exact point.',takeaway:'Resume only what remains.'}
] as const;

type Props={state:State;busy:boolean;onStart:(s:Scenario)=>void;onPreview:()=>void;onReview:(o:Operation)=>void;onResume:(o:Operation)=>void;onEdit:(r:RecordItem)=>void;onChange:(o:Operation)=>void;onExport:()=>void};
export function RecoveryStory({state,busy,onStart,onPreview,onReview,onResume,onEdit,onChange,onExport}:Props){
 const scenario=state.rehearsal?.scenario;
 const story=stories.find(s=>s.id===scenario);
 const booking=state.operations.find(o=>o.kind==='booking');
 const correction=state.operations.findLast(o=>o.sourceId===booking?.id);
 const event=state.records.find(r=>r.kind==='calendar'&&r.active&&r.createdBy===booking?.id);
 const evidence=correction?operationEvidence(state,correction):undefined;
 let step=0;let title='Choose a recovery story';let detail='Each example uses separate practice data. Your workspace stays available.';
 let cta='';let invoke:()=>void=()=>{};let complete=false;
 if(story){
  title='Start with one request';detail='Preview two workshop places, one camera, and a calendar event. No reservation is created by the preview.';cta='Preview the three actions';invoke=onPreview;
  if(booking){
   step=1;title='Review the exact plan';detail='Check the three actions below, then approve the booking.';cta='Review booking';invoke=()=>onReview(booking);
   if(booking.status==='awaiting_resolution'){
    step=2;title='Saved by the service. Unconfirmed by the assistant.';detail='The camera record exists, but its response was deliberately dropped. Look at the two views below, then check the original reservation.';cta='Check & resume';invoke=()=>onResume(booking);
   }else if(booking.status==='completed'||booking.status==='superseded'){
    if(scenario==='lost_reply')complete=true;
    else if(scenario==='manual_edit'&&event?.updatedBy!=='manual'&&!correction){
     step=2;title='Add a detail only you know';detail='Edit your event to include a meeting point. This saves a newer version the assistant must respect.';cta='Write my calendar edit';invoke=()=>event&&onEdit(event);
    }else if(!correction){
     step=2;title=scenario==='manual_edit'?'Now change your mind':'Let one cancellation fail';
     detail=scenario==='manual_edit'?'Your calendar has changed. Ask to remove the camera and watch the assistant detect the newer version.':'The next plan updates the calendar, then deliberately pauses before cancelling the camera.';
     cta='Preview removing the camera';invoke=()=>onChange(booking);
    }else if(correction.actions.some(a=>a.status==='conflict')){
     step=3;title='Your words are protected';detail='The calendar is newer than the assistant’s copy. Choose “Keep my calendar edit” below, then approve the remaining cancellation.';cta='Review the conflict';invoke=()=>onReview(correction);
    }else if(correction.status==='awaiting_resolution'){
     step=3;title='One change finished. One still needs work.';detail='The calendar update is already saved. Resume the camera cancellation without repeating the completed update.';cta='Resume the cancellation';invoke=()=>onResume(correction);
    }else if(correction.status==='completed')complete=true;
    else{step=3;title='Approve only these changes';detail='The workshop stays. Review exactly which other records this plan changes.';cta='Review correction';invoke=()=>onReview(correction);}
   }
  }
 }
 if(complete&&scenario==='lost_reply'&&!(booking?.fault==='after'&&booking.faultUsed&&booking.actions.some(a=>a.kind==='equipment'&&a.attempts>1))){complete=false;step=0;title='Try the missing-confirmation example';detail='This plan did not exercise a lost camera reply. Restart the example and use its three-action preview to see recovery.';cta='Restart this example';invoke=()=>onStart('lost_reply');}
 if(complete){step=4;title=scenario==='lost_reply'?'One camera. A recovered plan.':scenario==='manual_edit'?'Your edit survived the change.':'Finished from where it stopped.';
  detail=scenario==='lost_reply'?'The original camera record was found. The remaining calendar action completed. Check the evidence and export the receipt.':scenario==='manual_edit'?'The camera was cancelled after fresh approval. The workshop and your manually edited calendar remain.':'The calendar was updated once; the camera cancellation retried and completed. The workshop remains.';
  cta='Download this story’s receipt';invoke=onExport;
  if(scenario==='manual_edit'&&!evidence?.protectedRecords.some(r=>r.unchanged)){
   title='Your reviewed change is complete.';
   detail='You chose which calendar version to include in the correction. The receipt shows what was changed and what was preserved.';
  }
 }
 return <section className="recovery-stories" aria-label="Guided recovery stories">
  <div className="story-heading"><div><p className="eyebrow">TRY THE MOMENT THINGS GO WRONG</p><h2>Three ways to keep control.</h2></div><p>Controlled failures.<br/>Actual saved demo actions.</p></div>
  <div className="story-choices">{stories.map(s=>{const Icon=s.icon;return <button key={s.id} aria-pressed={scenario===s.id} disabled={busy} onClick={()=>onStart(s.id)} className={scenario===s.id?'selected':''}><Icon size={22}/><strong>{s.title}</strong><p>{s.description}</p><span>{scenario===s.id?'Restart this example':'Start this example'} <ArrowRight size={15}/></span></button>;})}</div>
  <p className="practice-note">Starting an example replaces practice data only. <a href="/">Return to your workspace <ArrowRight size={13}/></a></p>
  {story&&<div className={`story-coach ${complete?'done':''}`} aria-live="polite"><div className="coach-icon">{complete?<CheckCircle2 size={25}/>:<span>{step+1}</span>}</div><div className="coach-content"><p className="small-label">{story.title} · {complete?'Complete':'Your next step'}</p><h3>{title}</h3><p>{detail}</p><div className="story-progress" aria-label={complete?'Example complete':`Step ${step+1} of 5`}>{[0,1,2,3,4].map(i=><span key={i} className={i<=step?'filled':''}/>)}</div></div><Button disabled={busy} onClick={invoke}>{complete?<Download size={16}/>:null}{cta}{!complete&&<ArrowRight size={16}/>}</Button></div>}
  {complete&&booking&&<div className="proof-strip"><Proof value={String(state.records.filter(r=>r.kind==='equipment'&&r.createdBy===booking.id).length)} label="camera record created"/><Proof value={String(operationEvidence(state,booking).duplicateRecords)} label="duplicate records"/><Proof value={scenario==='manual_edit'?String(evidence?.protectedRecords.filter(r=>r.unchanged).length??0):String((correction??booking).actions.filter(a=>a.attempts===1).length)} label={scenario==='manual_edit'?'manual edit preserved':'actions needing no retry'}/><p><Check size={17}/>Computed from this practice run’s saved records.</p></div>}
 </section>;
}
function Proof({value,label}:{value:string;label:string}){return <div><strong>{value}</strong><span>{label}</span></div>}

const kindLabel={workshop:'Workshop',equipment:'Camera',calendar:'Calendar'};
const knownLabel={pending:'Not attempted',completed:'Confirmed',unknown:'No confirmation',conflict:'Newer edit detected',failed:'Attempt failed'};
export function EvidencePanel({state,operation}:{state:State;operation:Operation}){
 const evidence=operationEvidence(state,operation);
 return <details className="evidence-panel" open={operation.status==='awaiting_resolution'||state.rehearsal?true:undefined}><summary><Database size={17}/><span>What actually happened</span><span className="evidence-hint">Saved evidence</span></summary><div className="evidence-content"><p className="evidence-caption">A saved record and a received confirmation are different facts. This view reads both from our sample service.</p><div className="evidence-table-wrap"><table><thead><tr><th>Action</th><th><Database size={13}/> Service now</th><th><MessageSquare size={13}/> Assistant result</th><th>Attempts</th></tr></thead><tbody>{evidence.actions.map(a=><tr key={a.id} className={a.status==='unknown'?'uncertain':''}><th scope="row">{kindLabel[a.kind]}<small>{a.type==='reserve'?'Reserve':a.type==='cancel'?'Cancel':'Update'}</small></th><td>{a.savedState==='active'?'Saved · active':a.savedState==='cancelled'?'Cancelled':'No record'}{a.currentVersion&&<small>Version {a.currentVersion}</small>}</td><td>{knownLabel[a.status]}</td><td>{a.attempts}</td></tr>)}</tbody></table></div>{evidence.protectedRecords.map(r=><div className="preserved-evidence" key={r.id}><ShieldCheck size={17}/><div><strong>{r.unchanged?'Your edit is still intact':'Your edit was preserved at review'}</strong><p>{r.title}</p><blockquote>{r.note}</blockquote><small>Preserved version {r.version}</small></div></div>)}<p className="evidence-footer">{evidence.approvedAt?'Execution authorized by your approved preview.':'No approval recorded for this preview.'} Record details are included in the downloadable receipt.</p></div></details>;
}
