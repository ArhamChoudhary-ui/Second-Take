import {DatabaseSync} from 'node:sqlite';
import {initialState,now} from '../lib/second-take/model.ts';
import type {Store,State,Snapshot} from '../lib/second-take/model.ts';
export class SqliteStore implements Store{
 db:DatabaseSync;id:string;
 constructor(file=':memory:',id='test'){this.id=id;this.db=new DatabaseSync(file);this.db.exec('CREATE TABLE IF NOT EXISTS workspaces(id TEXT PRIMARY KEY,data TEXT NOT NULL,version INTEGER NOT NULL DEFAULT 0,updated_at TEXT NOT NULL)');this.db.prepare('INSERT OR IGNORE INTO workspaces VALUES(?,?,0,?)').run(id,JSON.stringify(initialState()),now());}
 async read():Promise<Snapshot>{const row=this.db.prepare('SELECT data,version FROM workspaces WHERE id=?').get(this.id) as {data:string;version:number};return {data:JSON.parse(row.data),version:row.version};}
 async compareAndSwap(v:number,s:State){return this.db.prepare('UPDATE workspaces SET data=?,version=version+1,updated_at=? WHERE id=? AND version=?').run(JSON.stringify(s),now(),this.id,v).changes===1;}
 close(){this.db.close();}
}
