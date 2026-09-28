import {randomBytes,createHash} from 'node:crypto';
import {CONFIG,COURSES} from './config.mjs';
import {Problem,requireThat,text,date,hasAccess,canAssess,visibleProfile,visibleRecord,unitsFor} from './policy.mjs';
const roles=['admin','tutor','iqa','learner','employer'];
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const unique=()=>randomBytes(12).toString('hex');
export async function dispatch(store,actor,action,input={}){
 requireThat(actor&&actor.active!==false,'Account is disabled.');
 requireThat(!actor.mustChange||['me','passwordChanged'].includes(action),'Change your temporary password before continuing.');
 const admin=()=>requireThat(actor.role==='admin');
 const learner=async id=>{const p=await store.profile(id);requireThat(p&&hasAccess(actor,p));return p;};
 const add=async(kind,p,payload,ref='',id)=>store.add({kind,learner:p?.id||'',academy:p?.academy||'',actor:actor.id,ref,payload:{...payload,actorName:actor.name}},id);
 const get=async(id,kind)=>{const r=await store.record(id);requireThat(r&&(!kind||r.kind===kind));await learner(r.learner);return r;};
 const signature=()=>{requireThat(input.declaration===true,'Please confirm the signature declaration.',400);return {name:text(input.signature,150),userId:actor.id,role:actor.role,signedAt:new Date().toISOString()};};
 if(action==='me')return {user:actor,courses:COURSES};
 if(action==='passwordChanged'){throw new Problem('Use the password endpoint.',400);}
 if(action==='workspace'){
  const ps=await store.profiles();const students=ps.filter(p=>hasAccess(actor,p));
  const academies=(await store.academies()).filter(a=>['admin','iqa'].includes(actor.role)||actor.academies.includes(a.id)||students.some(p=>p.academy===a.id));
  return {students:students.map(p=>visibleProfile(actor,p)),academies,people:actor.role==='admin'?ps.map(p=>visibleProfile(actor,p)):[],courses:COURSES};
 }
 if(action==='academyCreate'){admin();return store.academy(text(input.name,200));}
 if(action==='personCreate'){
  admin();const role=text(input.role,20);requireThat(roles.includes(role),'Invalid role.',400);
  const first=text(input.first,100),last=text(input.last,100),email=text(input.email,254).toLowerCase();requireThat(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),'Enter a valid email.',400);
  const aids=(await store.academies()).map(a=>a.id);const academy=input.academy||'';
  requireThat(!['learner','tutor'].includes(role)||aids.includes(academy),'Choose an academy.',400);
  const course=input.course||'';requireThat(role!=='learner'||COURSES[course],'Choose a course.',400);
  const details={};for(const key of ['phone','address','postcode','emergencyName','emergencyPhone','guardianName','guardianEmail','employerName'])details[key]=text(input[key]||'',400,false);
  if(role==='learner'){
   details.dob=date(input.dob);const age=(Date.now()-new Date(details.dob).getTime())/(365.2425*86400000);requireThat(age>=16&&age<110,'This enrolment is for learners aged 16 and over.',400);
   requireThat(details.emergencyName&&details.emergencyPhone,'Enter an emergency contact.',400);
  }
  const optionalUnits=Array.isArray(input.optionalUnits)?input.optionalUnits:[];
  requireThat(optionalUnits.every(x=>(COURSES[course]?.optional||[]).some(u=>u[0]===x)),'Invalid optional unit.',400);
  const assigned=Array.isArray(input.learners)?input.learners:[];
  for(const id of assigned)requireThat((await store.profile(id))?.role==='learner','Invalid learner assignment.',400);
  const uid=unique(),password=randomBytes(18).toString('base64url');
  const p={id:uid,name:first+' '+last,email,role,academy:role==='learner'?academy:'',academies:role==='tutor'?[academy]:[],learners:role==='employer'?assigned:[],course:role==='learner'?course:'',optionalUnits,start:role==='learner'?date(input.start):'',details,active:true,mustChange:true};
  await store.users.create({userId:uid,email,password,name:p.name});
  try{await store.setProfile(p);if(role==='admin')await store.users.updateLabels({userId:uid,labels:['hfadmin']});}
  catch(e){await store.users.updateStatus({userId:uid,status:false});throw e;}
  await add('audit',null,{action:'Account created',target:uid,role});
  return {id:uid,email,password};
 }
 if(action==='personDisable'){admin();requireThat(input.id!==actor.id&&input.id!==CONFIG.owner,'The owner and your own account cannot be disabled here.',400);const p=await store.profile(input.id);requireThat(p);await store.users.updateStatus({userId:p.id,status:false});await store.setProfile({...p,active:false});await add('audit',null,{action:'Account disabled',target:p.id});return {ok:true};}
 if(action==='assign'){
  admin();const p=await store.profile(input.id);requireThat(p);const aids=(await store.academies()).map(a=>a.id);
  if(p.role==='learner'){requireThat(aids.includes(input.academy),'Choose an academy.',400);p.academy=input.academy;}
  else if(p.role==='tutor'){requireThat(Array.isArray(input.ids)&&input.ids.every(x=>aids.includes(x)),'Invalid academy list.',400);p.academies=input.ids;}
  else if(p.role==='employer'){requireThat(Array.isArray(input.ids),'Choose learners.',400);for(const id of input.ids)requireThat((await store.profile(id))?.role==='learner');p.learners=input.ids;}
  else throw new Problem('This role does not need assignments.');
  await store.setProfile(p);await add('audit',null,{action:'Assignment updated',target:p.id});return {ok:true};
 }
 if(action==='learner'){
  const p=await learner(input.id);const records=(await store.records(p.id)).filter(r=>visibleRecord(actor,r));
  const frameworks=(await store.list(CONFIG.records,[['kind','framework']])).filter(r=>r.payload.course===p.course);
  const resources=(await store.list(CONFIG.records,[['kind','resource']])).filter(r=>r.payload.course===p.course);return {student:visibleProfile(actor,p),units:unitsFor(p),records,frameworks,resources};
 }
 if(action==='framework'){
  admin();requireThat(COURSES[input.course],'Invalid course.',400);const all=[...COURSES[input.course].units,...(COURSES[input.course].optional||[])];requireThat(all.some(u=>u[0]===input.unit),'Invalid unit.',400);
  const criteria=text(input.criteria,6500).split('\n').map(s=>s.trim()).filter(Boolean);requireThat(criteria.length<=100,'Maximum 100 checklist entries.',400);
  requireThat(input.confirmed===true,'Confirm the checklist matches your approved handbook.',400);
  return add('framework',null,{course:input.course,unit:input.unit,source:text(input.source,600),criteria,confirmed:true});
 }
 if(action==='fileUpload'){
  const p=await learner(input.learner);requireThat(actor.role!=='employer');requireThat(actor.role!=='iqa','IQA can read evidence but cannot add learner evidence.');
  const name=text(input.name,150).replace(/[^\w. -]/g,'_'),b64=text(input.base64,1500000);const buf=Buffer.from(b64,'base64');requireThat(buf.length>0&&buf.length<=1024*1024,'Each file must be at most 1 MB.',400);
  const ext=name.split('.').at(-1).toLowerCase();const valid=(ext==='pdf'&&buf.subarray(0,5).toString()==='%PDF-')||(['jpg','jpeg'].includes(ext)&&buf[0]===255&&buf[1]===216&&buf[2]===255)||(ext==='png'&&buf.subarray(0,8).toString('hex')==='89504e470d0a1a0a');requireThat(valid,'Upload a PDF, JPG or PNG file.',400);
  const id=unique();await store.putFile(id,buf,name);try{return await add('file',p,{name,size:buf.length,fileId:id});}catch(e){await store.deleteFile(id);throw e;}
 }
 if(action==='fileDownload'){requireThat(actor.role!=='employer');const r=await get(input.id,'file');const raw=await store.file(r.payload.fileId);return {name:r.payload.name,base64:Buffer.from(raw).toString('base64')};}
 if(action==='practical'){
  const p=await learner(input.learner);requireThat(actor.id===p.id,'Learners submit their own practical records.');requireThat(unitsFor(p).some(u=>u[0]===input.unit),'Unit is not enrolled.',400);
  const files=Array.isArray(input.files)?input.files:[];requireThat(files.length<=10,'Choose up to 10 files.',400);for(const id of files){const r=await get(id,'file');requireThat(r.learner===p.id);}
  return add('practical',p,{unit:input.unit,date:date(input.date),consultation:text(input.consultation),service:text(input.service),reflection:text(input.reflection),ranges:text(input.ranges,2000,false),files,signature:signature()});
 }
 if(action==='assessment'){
  const r=await get(input.id,'practical'),p=await learner(r.learner);requireThat(canAssess(actor,p));requireThat(['achieved','returned'].includes(input.outcome),'Choose an outcome.',400);
  return add('assessment',p,{unit:r.payload.unit,outcome:input.outcome,feedback:text(input.feedback),signature:signature()},r.id,'a'+r.id);
 }
 if(action==='unitSignoff'){
  const p=await learner(input.learner);requireThat(canAssess(actor,p));requireThat(unitsFor(p).some(u=>u[0]===input.unit));
  const f=await store.record(input.framework);requireThat(f?.kind==='framework'&&f.payload.course===p.course&&f.payload.unit===input.unit,'Choose the approved checklist.',400);
  const latest=(await store.list(CONFIG.records,[['kind','framework']])).filter(x=>x.payload.course===p.course&&x.payload.unit===input.unit).sort((a,b)=>b.created.localeCompare(a.created))[0];requireThat(latest?.id===f.id,'The checklist was updated. Refresh before signing.',409);
  requireThat(Array.isArray(input.checks)&&f.payload.criteria.every((_,i)=>input.checks.includes(String(i))),'Complete every checklist item.',400);
  const all=await store.records(p.id);requireThat(all.some(x=>x.kind==='assessment'&&x.payload.unit===input.unit&&x.payload.outcome==='achieved'),'Record an achieved assessment first.',400);
  const snap={unit:input.unit,framework:f.payload,frameworkId:f.id,checks:input.checks,evidence:text(input.evidence,3000),signature:signature()};return add('unitSignoff',p,{...snap,digest:hash(snap)});
 }
 if(action==='iqa'){
  requireThat(['admin','iqa'].includes(actor.role));const r=await get(input.id);requireThat(['assessment','unitSignoff'].includes(r.kind));requireThat(r.actor!==actor.id,'The IQA must be independent of this assessor.');
  requireThat(['verified','action_required'].includes(input.outcome),'Choose a result.',400);requireThat(input.authentic===true&&input.sufficient===true&&input.fair===true||input.outcome==='action_required','Complete the sampling checklist.',400);
  return add('iqa',await learner(r.learner),{outcome:input.outcome,feedback:text(input.feedback),sampleReason:text(input.sampleReason,1000),checks:{authentic:input.authentic===true,sufficient:input.sufficient===true,fair:input.fair===true},signature:signature()},r.id,'q'+r.id);
 }
 if(action==='attendance'){
  const p=await learner(input.learner);requireThat(canAssess(actor,p));requireThat(['present','late','absent','authorised'].includes(input.status));const minutes=Number(input.minutes);requireThat(Number.isInteger(minutes)&&minutes>=0&&minutes<=1440,'Enter minutes between 0 and 1440.',400);
  return add('attendance',p,{date:date(input.date),status:input.status,minutes,note:text(input.note||'',1000,false)});
 }
 if(action==='hours'){
  const p=await learner(input.learner);requireThat(actor.id===p.id||canAssess(actor,p));const minutes=Number(input.minutes);requireThat(Number.isInteger(minutes)&&minutes>0&&minutes<=1440,'Enter 1–1440 minutes.',400);requireThat(['academy','workplace','independent'].includes(input.category));return add('hours',p,{date:date(input.date),minutes,category:input.category,activity:text(input.activity,2000),reflection:text(input.reflection,2000)});
 }
 if(action==='review'){
  const p=await learner(input.learner);requireThat(canAssess(actor,p));const all=await store.records(p.id);const snapshot={date:date(input.date),nextDate:date(input.nextDate),progress:text(input.progress),actions:text(input.actions),assessorFeedback:text(input.assessorFeedback),attendance:all.filter(r=>r.kind==='attendance').map(r=>({id:r.id,...r.payload})),signature:signature(),employerRequired:input.employerRequired===true};requireThat(snapshot.nextDate>snapshot.date,'Next review must be later.',400);
  const digest=hash(snapshot);return add('review',p,{...snapshot,digest});
 }
 if(action==='reviewSign'){
  const r=await get(input.id,'review'),p=await learner(r.learner);requireThat(['learner','employer'].includes(actor.role));requireThat(actor.role!=='learner'||actor.id===p.id);
  requireThat(!(await store.records(p.id)).some(x=>x.kind==='approval'&&x.ref===r.id),'This review is closed. Ask the tutor to create a new review.',409);const sig=signature();return add('signature',p,{reviewDigest:r.payload.digest,feedback:text(input.feedback),signature:sig},r.id,'s'+hash([r.id,actor.role]).slice(0,30));
 }
 if(action==='reviewApprove'){
  admin();const r=await get(input.id,'review'),p=await learner(r.learner),all=await store.records(p.id);const sigs=all.filter(s=>s.kind==='signature'&&s.ref===r.id&&s.payload.reviewDigest===r.payload.digest);
  requireThat(['approved','returned'].includes(input.outcome));if(input.outcome==='approved'){requireThat(sigs.some(s=>s.payload.signature.role==='learner'),'Student signature is required.',400);requireThat(!r.payload.employerRequired||sigs.some(s=>s.payload.signature.role==='employer'),'Employer signature is required.',400);}
  return add('approval',p,{outcome:input.outcome,feedback:text(input.feedback),reviewDigest:r.payload.digest,signature:signature()},r.id,'v'+r.id);
 }
 if(action==='consent'){
  const p=await learner(input.learner);requireThat(actor.id===p.id,'The student records their own consent.');requireThat(['yes','no'].includes(input.teaching)&&['yes','no'].includes(input.marketing));
  return add('consent',p,{teaching:input.teaching,marketing:input.marketing,wording:'I choose separately whether Hairforce1 may use my image for teaching and for public marketing. I can withdraw permission by contacting the academy. Refusing marketing does not affect my training.',version:'HF-photo-1',signature:signature()});
 }
 if(action==='resource'){
  admin();requireThat(COURSES[input.course]);const url=text(input.url||'',600,false);requireThat(!url||url.startsWith('https://'),'Links must start with https://.',400);
  return add('resource',null,{course:input.course,title:text(input.title,150),body:text(input.body,4000),url});
 }
 if(action==='exam'){
  const p=await learner(input.learner);requireThat(canAssess(actor,p));requireThat(unitsFor(p).some(u=>u[0]===input.unit));requireThat(['pass','refer','pending'].includes(input.outcome));
  return add('exam',p,{unit:input.unit,date:date(input.date),outcome:input.outcome,reference:text(input.reference,500),notes:text(input.notes||'',2000,false)});
 }
 if(action==='hoursDecision'){
  const r=await get(input.id,'hours'),p=await learner(r.learner);requireThat(canAssess(actor,p));requireThat(['approved','returned'].includes(input.outcome));return add('hoursDecision',p,{outcome:input.outcome,feedback:text(input.feedback),signature:signature()},r.id,'h'+r.id);
 }
 if(action==='export'){admin();const p=await learner(input.learner);return {student:p,records:await store.records(p.id),exported:new Date().toISOString()};}
 throw new Problem('Unknown operation.',404);
}
