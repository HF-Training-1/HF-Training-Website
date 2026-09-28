import test from 'node:test';import assert from 'node:assert/strict';
import handler from '../server/main.mjs';
const call=req=>handler({req,res:{json:(body,status=200)=>({body,status})},error:()=>{}});
test('function refuses requests without an authenticated user JWT',async()=>{const r=await call({method:'POST',headers:{'x-appwrite-user-id':'owner'},bodyJson:{action:'workspace'}});assert.equal(r.status,401);});
test('function refuses GET requests',async()=>{const r=await call({method:'GET',headers:{}});assert.equal(r.status,405);});
test('unverified account cannot request student records; lookup uses JWT account ID',async()=>{
 const {MockAgent,setGlobalDispatcher,getGlobalDispatcher}=await import('undici');
 const previous=getGlobalDispatcher(),mock=new MockAgent();mock.disableNetConnect();setGlobalDispatcher(mock);
 const pool=mock.get('https://fra.cloud.appwrite.io');
 pool.intercept({path:'/v1/account',method:'GET'}).reply(200,{$id:'real-user',status:true,labels:[],emailVerification:false},{headers:{'content-type':'application/json'}});
 pool.intercept({path:'/v1/tablesdb/6ab99eb9001702599541/tables/hfprofiles/rows/real-user',method:'GET'}).reply(200,{$id:'real-user',payload:JSON.stringify({id:'real-user',role:'learner',active:true,academies:[],learners:[]})},{headers:{'content-type':'application/json'}});
 try{const r=await call({method:'POST',headers:{'x-appwrite-user-jwt':'test-jwt','x-appwrite-user-id':'forged-admin','x-appwrite-key':'test-only'},bodyJson:{action:'workspace'}});assert.equal(r.status,403);assert.match(r.body.error,/verify/);mock.assertNoPendingInterceptors();}finally{setGlobalDispatcher(previous);await mock.close();}
});
