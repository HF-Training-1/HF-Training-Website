import {Client,TablesDB,Users,Storage,Functions,Permission,Role} from 'node-appwrite';
import {InputFile} from 'node-appwrite/file';
import {execFileSync} from 'node:child_process';
import {CONFIG} from '../server/config.mjs';
import {Store} from '../server/store.mjs';
const key=process.env.APPWRITE_SETUP_KEY;if(!key)throw Error('Add APPWRITE_SETUP_KEY as a GitHub Actions repository secret.');
const client=new Client().setEndpoint(CONFIG.endpoint).setProject(CONFIG.project).setKey(key);
const db=new TablesDB(client),users=new Users(client),storage=new Storage(client),fn=new Functions(client),store=new Store(client);
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function ensure(get,create,label){try{const r=await get();console.log(label+': exists');return r;}catch(e){if(e.code!==404)throw e;const r=await create();console.log(label+': created');return r;}}
await db.get({databaseId:CONFIG.database});
const academy=await db.getTable({databaseId:CONFIG.database,tableId:CONFIG.academies});
if(!academy.columns.some(c=>c.key==='name'))throw Error('Academies table must have a name column.');
const owner=await users.get({userId:CONFIG.owner});
if(owner.email.toLowerCase()!==CONFIG.email.toLowerCase()||!owner.labels.includes('hfadmin'))throw Error('Owner email or hfadmin label does not match.');
for(const [table,name,columns] of [[CONFIG.profiles,'HF profiles',[['payload','text']]],[CONFIG.records,'HF records',[['kind',32],['learner',36],['ref',36],['actor',36],['academy',36],['payload','text']]]]){
 const base={databaseId:CONFIG.database,tableId:table};
 const t=await ensure(()=>db.getTable(base),()=>db.createTable({...base,name,permissions:[],rowSecurity:false}),name);
 if(t.$permissions.length)throw Error(name+' must have no direct browser permissions. Review it before rerunning.');
 for(const [column,size] of columns){
  await ensure(()=>db.getColumn({...base,key:column}),()=>size==='text'?db.createTextColumn({...base,key:column,required:true}):db.createVarcharColumn({...base,key:column,size,required:true}),name+'.'+column);
 }
 for(let tries=0;;tries++){
  const current=await db.getTable(base);if(current.columns.every(c=>c.status==='available'))break;
  if(tries>40||current.columns.some(c=>c.status==='failed'))throw Error('Columns are not ready. Inspect the table in Appwrite.');await pause(1500);
 }
 if(table===CONFIG.records)for(const c of ['kind','learner']){
   await ensure(()=>db.getIndex({...base,key:'by_'+c}),()=>db.createIndex({...base,key:'by_'+c,type:'key',columns:[c]}),'Index '+c);
   for(let n=0;;n++){const idx=await db.getIndex({...base,key:'by_'+c});if(idx.status==='available')break;if(n>40||idx.status==='failed')throw Error('Index not available: '+c);await pause(1500);}
  }
}
const b=await ensure(()=>storage.getBucket({bucketId:CONFIG.bucket}),()=>storage.createBucket({bucketId:CONFIG.bucket,name:'HF private documents',permissions:[],fileSecurity:false,maximumFileSize:1048576,allowedFileExtensions:['pdf','jpg','jpeg','png'],encryption:true,antivirus:true}),'Private documents');
if(b.$permissions.length||b.fileSecurity)throw Error('Document bucket must be server-only. Review its permissions.');
if(!await store.profile(CONFIG.owner))await store.setProfile({id:CONFIG.owner,name:owner.name,email:owner.email,role:'admin',active:true,mustChange:false,academy:'',academies:[],learners:[],course:'',start:'',details:{},optionalUnits:[]});
const scopes=['users.read','users.write','rows.read','rows.write','files.read','files.write'];
const spec={functionId:CONFIG.function,name:'HF Training API',runtime:'node-22',execute:[Role.users()],events:[],schedule:'',timeout:60,enabled:true,logging:false,entrypoint:'main.mjs',commands:'npm ci --omit=dev',scopes};
await ensure(()=>fn.get({functionId:CONFIG.function}),()=>fn.create(spec),'HF API');
// Reconcile function permissions/scopes on every explicit deployment.
await fn.update(spec);
execFileSync('tar',['-czf','hf-api.tar.gz','-C','server','.']);
const deployment=await fn.createDeployment({functionId:CONFIG.function,code:InputFile.fromPath('hf-api.tar.gz','hf-api.tar.gz'),activate:true,entrypoint:'main.mjs',commands:'npm ci --omit=dev'});
console.log('Deployment submitted. Waiting for Appwrite build.');
for(let n=0;n<90;n++){
 const d=await fn.getDeployment({functionId:CONFIG.function,deploymentId:deployment.$id});
 if(d.status==='ready'){console.log('Backend deployed. Browser permission and workflow checks are still required before real enrolment.');process.exit(0);}
 if(d.status==='failed')throw Error('Appwrite function build failed. Check its build log in Appwrite.');await pause(4000);
}
throw Error('Build still running. Check Functions > HF Training API > Deployments. Do not rerun until checked.');
