import {Client,Account} from 'node-appwrite';
import {CONFIG} from './config.mjs';
import {Store} from './store.mjs';
import {validPassword} from './learning.mjs';
import {dispatch} from './domain.mjs';
import {Problem,requireThat,text} from './policy.mjs';
export default async ({req,res,error})=>{
 try{
  requireThat(req.method==='POST','POST required.',405);
  const jwt=req.headers['x-appwrite-user-jwt'];requireThat(jwt,'Please sign in.',401);
  const userClient=new Client().setEndpoint(CONFIG.endpoint).setProject(CONFIG.project).setJWT(jwt);
  const account=new Account(userClient);const identity=await account.get();
  requireThat(identity.status!==false,'Account disabled.');
  const key=req.headers['x-appwrite-key'];requireThat(key,'Server configuration is incomplete.',503);
  const store=new Store(new Client().setEndpoint(CONFIG.endpoint).setProject(CONFIG.project).setKey(key));
  const actor=await store.profile(identity.$id);requireThat(actor,'Your account has not been enrolled. Contact the administrator.');
  requireThat(actor.role!=='admin'||identity.labels.includes('hfadmin'),'Administrator label is missing.');
  const body=req.bodyJson;requireThat(body&&typeof body.action==='string','Invalid request.',400);
  const action=body.action,input=body.input||{};
  if(action==='changePassword'){
   const password=input.password;requireThat(validPassword(password),'Use 8–128 characters, at least one capital letter and one number.',400);
   requireThat(typeof input.current==='string'&&input.current.length>0&&input.current.length<=256,'Enter your current password.',400);
   try{await account.updatePassword({password,oldPassword:input.current});}catch(e){if(e.code===401)throw new Problem('Your current password was not accepted. Enter the password for the account shown at the top of this page, or use Forgot password.',400);if(e.code===400)throw new Problem(e.message||'The new password does not meet the account security settings.',400);throw e;}
   await store.setProfile({...actor,mustChange:false});return res.json({ok:true});
  }
  if(action==='me')return res.json({...await dispatch(store,actor,action,input),verified:identity.emailVerification});
  requireThat(identity.emailVerification,'Please verify your email address first. Use the My account screen.',403);
  return res.json(await dispatch(store,actor,action,input));
 }catch(e){
  const code=e instanceof Problem?e.code:(e.code===409?409:e.code===401?401:500);
  if(code===500)error('HF API request failed: '+(e.type||e.constructor.name));
  return res.json({error:e instanceof Problem?e.message:code===409?'This record already has a decision or signature. Refresh the page.':code===401?'Please sign in again.':'The operation could not be completed. Check the service setup and try again.'},code);
 }
};
