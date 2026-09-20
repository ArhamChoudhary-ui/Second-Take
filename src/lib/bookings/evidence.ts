import type {State,Operation} from './model.ts';

export function operationEvidence(state:State,operation:Operation){
 const root=operation.sourceId??operation.id;
 const records=state.records.filter(r=>r.createdBy===root);
 const protectedRecords=(operation.preserved??[]).map(before=>{
  const current=state.records.find(r=>r.id===before.id);
  return {id:before.id,title:before.title,note:before.note,version:before.version,
   unchanged:!!current&&current.active===before.active&&current.version===before.version&&current.title===before.title&&current.note===before.note};
 });
 return {
  operationId:operation.id,revision:operation.revision,status:operation.status,
  approvedAt:operation.approvedAt??null,
  completedAt:operation.completedAt??null,
  activeRecords:records.filter(r=>r.active).length,
  cameraRecords:records.filter(r=>r.kind==='equipment').length,
  duplicateRecords:records.length-new Set(records.map(r=>r.kind)).size,
  protectedRecords,
  actions:operation.actions.map(a=>{
   const record=state.records.find(r=>r.id===a.recordId);
   return {id:a.id,kind:a.kind,type:a.type,title:a.title,status:a.status,attempts:a.attempts,
    recordId:a.recordId,savedState:record?(record.active?'active':'cancelled'):'not_created',
    currentVersion:record?.version??null,expectedVersion:a.expectedVersion,
    savedTitle:record?.title??null,savedNote:record?.note??null,
    before:a.before??null,after:a.after??null};
  })
 };
}
