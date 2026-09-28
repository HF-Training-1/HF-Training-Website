import {TablesDB,Query,Storage,Users,ID} from 'node-appwrite';
import {InputFile} from 'node-appwrite/file';
import {CONFIG} from './config.mjs';
export class Store {
 constructor(client){this.db=new TablesDB(client);this.storage=new Storage(client);this.users=new Users(client);}
 args(table){return {databaseId:CONFIG.database,tableId:table};}
 async rawGet(table,id){try{return await this.db.getRow({...this.args(table),rowId:id});}catch(e){if(e.code===404)return null;throw e;}}
 unpack(r){return r&&{id:r.$id,created:r.$createdAt,...r,...(r.payload?{payload:JSON.parse(r.payload)}:{})};}
 async list(table,filters=[]){const rows=[];let cursor;do{const page=await this.db.listRows({...this.args(table),queries:[...filters.map(([key,val])=>Query.equal(key,[val])),Query.limit(100),Query.orderAsc('$id'),...(cursor?[Query.cursorAfter(cursor)]:[])],ttl:0});rows.push(...page.rows);if(page.rows.length<100)break;cursor=page.rows.at(-1).$id;}while(rows.length<10000);if(rows.length>=10000)throw Error('Result limit exceeded. Add pagination before further growth.');return rows.map(r=>this.unpack(r));}
 async profile(id){const r=await this.rawGet(CONFIG.profiles,id);return r?{...JSON.parse(r.payload),id:r.$id}:null;}
 async profiles(){return (await this.list(CONFIG.profiles)).map(r=>({...r.payload,id:r.id}));}
 async setProfile(p){const data={payload:JSON.stringify(p)};if(await this.rawGet(CONFIG.profiles,p.id))return this.db.updateRow({...this.args(CONFIG.profiles),rowId:p.id,data});return this.db.createRow({...this.args(CONFIG.profiles),rowId:p.id,data,permissions:[]});}
 async record(id){return this.unpack(await this.rawGet(CONFIG.records,id));}
 async records(learner){return this.list(CONFIG.records,learner?[['learner',learner]]:[]);}
 async add(r,id=ID.unique()){const data={kind:r.kind,learner:r.learner||'',ref:r.ref||'',actor:r.actor,academy:r.academy||'',payload:JSON.stringify(r.payload)};if(data.payload.length>14000)throw Error('Record too large.');return this.unpack(await this.db.createRow({...this.args(CONFIG.records),rowId:id,data,permissions:[]}));}
 async academies(){return (await this.list(CONFIG.academies)).map(r=>({id:r.id,name:r.name}));}
 async academy(name){return this.db.createRow({...this.args(CONFIG.academies),rowId:ID.unique(),data:{name},permissions:[]});}
 async putFile(id,buffer,name){return this.storage.createFile({bucketId:CONFIG.bucket,fileId:id,file:InputFile.fromBuffer(buffer,name),permissions:[]});}
 async file(id){return this.storage.getFileDownload({bucketId:CONFIG.bucket,fileId:id});}
 async deleteFile(id){return this.storage.deleteFile({bucketId:CONFIG.bucket,fileId:id});}
}
