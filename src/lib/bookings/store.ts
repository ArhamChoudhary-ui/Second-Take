import { env } from 'cloudflare:workers';
import { initialState,now } from './model.ts';
import type {Store,State,Snapshot} from './model.ts';
export function makeStore(id:string):Store{
 const db=env.DB;if(!db)throw new Error('Persistent database is unavailable.');
 return {async read():Promise<Snapshot>{
  let row=await db.prepare('SELECT data, version FROM workspaces WHERE id = ?').bind(id).first<{data:string;version:number}>();
  if(!row){await db.prepare('INSERT OR IGNORE INTO workspaces (id,data,version,updated_at) VALUES (?,?,0,?)').bind(id,JSON.stringify(initialState()),now()).run();row=await db.prepare('SELECT data,version FROM workspaces WHERE id=?').bind(id).first<{data:string;version:number}>();}
  if(!row)throw new Error('Unable to initialize workspace.');return {data:JSON.parse(row.data),version:row.version};
 },async compareAndSwap(version:number,state:State){const r=await db.prepare('UPDATE workspaces SET data=?,version=version+1,updated_at=? WHERE id=? AND version=?').bind(JSON.stringify(state),now(),id,version).run();return r.meta.changes===1;}};
}
