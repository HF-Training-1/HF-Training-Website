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
test('password change accepts an existing short password and enforces the new policy server-side',async()=>{
 const {MockAgent,setGlobalDispatcher,getGlobalDispatcher}=await import('undici');const previous=getGlobalDispatcher(),mock=new MockAgent();mock.disableNetConnect();setGlobalDispatcher(mock);const pool=mock.get('https://fra.cloud.appwrite.io');const rowPath='/v1/tablesdb/6ab99eb9001702599541/tables/hfprofiles/rows/student';const profile={id:'student',role:'learner',active:true,mustChange:true,academies:[],learners:[]};const headers={'content-type':'application/json'};
 const identify=()=>{pool.intercept({path:'/v1/account',method:'GET'}).reply(200,{$id:'student',status:true,labels:[],emailVerification:true},{headers});pool.intercept({path:rowPath,method:'GET'}).reply(200,{$id:'student',payload:JSON.stringify(profile)},{headers});};
 try{identify();pool.intercept({path:'/v1/account/password',method:'PATCH',body:b=>{const d=JSON.parse(b);return d.oldPassword==='old-pass-11'&&d.password===' Abcdef1 ';}}).reply(200,{}, {headers});pool.intercept({path:rowPath,method:'GET'}).reply(200,{$id:'student',payload:JSON.stringify(profile)},{headers});pool.intercept({path:rowPath,method:'PATCH',body:b=>JSON.parse(JSON.parse(b).data.payload).mustChange===false}).reply(200,{}, {headers});const req={method:'POST',headers:{'x-appwrite-user-jwt':'fake-test-jwt','x-appwrite-key':'fake-test-key'},bodyJson:{action:'changePassword',input:{current:'old-pass-11',password:' Abcdef1 '}}};assert.equal((await call(req)).status,200);identify();req.bodyJson.input.password='abcdefgh';const bad=await call(req);assert.equal(bad.status,400);assert.match(bad.body.error,/capital/);mock.assertNoPendingInterceptors();}finally{setGlobalDispatcher(previous);await mock.close();}
});
