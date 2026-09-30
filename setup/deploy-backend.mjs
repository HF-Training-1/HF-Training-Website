// Updates the existing HF API only. Does not create or modify tables, users or buckets.
import {Client,Functions} from 'node-appwrite';
import {InputFile} from 'node-appwrite/file';
import {execFileSync} from 'node:child_process';
import {CONFIG} from '../server/config.mjs';
const key=process.env.APPWRITE_DEPLOY_KEY;
if(!key)throw Error('Add the temporary APPWRITE_DEPLOY_KEY repository secret first.');
const fn=new Functions(new Client().setEndpoint(CONFIG.endpoint).setProject(CONFIG.project).setKey(key));
const current=await fn.get({functionId:CONFIG.function});
console.log('Updating existing function: '+current.name);
console.log('Previous deployment (retain for rollback): '+(current.deploymentId||current.deployment||'Check the Appwrite Deployments tab'));
execFileSync('tar',['--exclude=node_modules','-czf','hf-api-update.tar.gz','-C','server','.']);
const deployment=await fn.createDeployment({functionId:CONFIG.function,code:InputFile.fromPath('hf-api-update.tar.gz','hf-api-update.tar.gz'),activate:true,entrypoint:'main.mjs',commands:'npm ci --omit=dev'});
console.log('New deployment: '+deployment.$id);
for(let attempt=0;attempt<90;attempt++){
 const d=await fn.getDeployment({functionId:CONFIG.function,deploymentId:deployment.$id});
 if(d.status==='ready'){console.log('Backend build ready. Confirm this deployment is active in Appwrite, then upload the new index.html.');process.exit(0);}
 if(d.status==='failed')throw Error('Build failed. Inspect this deployment in Appwrite; keep the current frontend until resolved.');
 await new Promise(resolve=>setTimeout(resolve,4000));
}
throw Error('Build is still running. Check Appwrite before attempting another update.');
