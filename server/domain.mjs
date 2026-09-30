import {sheetFramework,markSummary,CONSULTATION,CONTRA} from './assessment-sheets.mjs';
import {randomBytes,createHash} from 'node:crypto';
import {nextReview,latestFramework,unitProgress,attendanceDays,placementDays,londonDate,addDays,reviewDays} from './learning.mjs';
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
 const add=async(kind,p,payload,ref='',id)=>{const signedPayload={...payload,actorName:actor.name};requireThat(JSON.stringify(signedPayload).length<=14000,'This record is too long. Shorten the notes or split the evidence across submissions.',400);return store.add({kind,learner:p?.id||'',academy:p?.academy||'',actor:actor.id,ref,payload:signedPayload},id);};
 const get=async(id,kind)=>{const r=await store.record(id);requireThat(r&&(!kind||r.kind===kind));await learner(r.learner);return r;};
 const signature=()=>{requireThat(input.declaration===true,'Please confirm the signature declaration.',400);return {name:text(input.signature,150),userId:actor.id,role:actor.role,signedAt:new Date().toISOString()};};
 if(action==='me')return {user:actor,courses:COURSES};
 if(action==='passwordChanged'){throw new Problem('Use the password endpoint.',400);}
 if(action==='workspace'){
  const ps=await store.profiles();const students=ps.filter(p=>hasAccess(actor,p));
  const academies=(await store.academies()).filter(a=>['admin','iqa'].includes(actor.role)||actor.academies.includes(a.id)||students.some(p=>p.academy===a.id));
  const studentViews=[];for(const p of students)studentViews.push({...visibleProfile(actor,p),review:nextReview(p,await store.records(p.id))});
  return {students:studentViews,academies,people:actor.role==='admin'?ps.map(p=>visibleProfile(actor,p)):[],courses:COURSES};
 }
 if(action==='contactUpdate'){
  requireThat(actor.role==='learner');const details={...actor.details};for(const key of ['phone','emergencyName','emergencyPhone'])details[key]=text(input[key],400);await store.setProfile({...actor,details});return {ok:true};
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
  if(role==='learner')requireThat(date(input.signup||londonDate())<=londonDate(),'Sign-up date cannot be in the future.',400);
  const optionalUnits=Array.isArray(input.optionalUnits)?input.optionalUnits:[];
  requireThat(optionalUnits.every(x=>(COURSES[course]?.optional||[]).some(u=>u[0]===x)),'Invalid optional unit.',400);
  const assigned=Array.isArray(input.learners)?input.learners:[];
  for(const id of assigned)requireThat((await store.profile(id))?.role==='learner','Invalid learner assignment.',400);
  const tutors=role==='learner'&&Array.isArray(input.tutors)?[...new Set(input.tutors)]:[];for(const id of tutors){const t=await store.profile(id);requireThat(t?.role==='tutor'&&t.active!==false&&(t.academies||[]).includes(academy),'Choose tutors from this academy.',400);}
  const uid=unique(),password='A1'+randomBytes(18).toString('base64url');
  const p={id:uid,name:first+' '+last,email,role,academy:role==='learner'?academy:'',academies:role==='tutor'?[academy]:[],learners:role==='employer'?assigned:[],course:role==='learner'?course:'',optionalUnits,...(role==='learner'?{tutors}:{}),start:role==='learner'?date(input.start):'',signup:role==='learner'?date(input.signup||londonDate()):'',createdAt:new Date().toISOString(),details,active:true,mustChange:true};
  await store.users.create({userId:uid,email,password,name:p.name});
  try{await store.setProfile(p);if(role==='admin')await store.users.updateLabels({userId:uid,labels:['hfadmin']});}
  catch(e){await store.users.updateStatus({userId:uid,status:false});throw e;}
  await add('audit',null,{action:'Account created',target:uid,role});
  return {id:uid,email,password};
 }
 if(action==='enrolmentUpdate'){
  admin();const p=await store.profile(input.id);requireThat(p?.role==='learner');
  const signup=date(input.signup),start=date(input.start);requireThat(signup<=londonDate(),'Sign-up date cannot be in the future.',400);
  requireThat(Array.isArray(input.tutors),'Choose assigned tutors.',400);const tutors=[...new Set(input.tutors)];
  for(const id of tutors){const t=await store.profile(id);requireThat(t?.role==='tutor'&&t.active!==false&&(t.academies||[]).includes(p.academy),'Assign tutors from this academy only.',400);}
  await store.setProfile({...p,signup,start,tutors});await add('audit',null,{action:'Enrolment dates and tutors updated',target:p.id,signup,start,tutors});return {ok:true};
 }
 if(action==='personDisable'){admin();requireThat(input.id!==actor.id&&input.id!==CONFIG.owner,'The owner and your own account cannot be disabled here.',400);const p=await store.profile(input.id);requireThat(p);await store.users.updateStatus({userId:p.id,status:false});await store.setProfile({...p,active:false});await add('audit',null,{action:'Account disabled',target:p.id});return {ok:true};}
 if(action==='assign'){
  admin();const p=await store.profile(input.id);requireThat(p);const aids=(await store.academies()).map(a=>a.id);
  if(p.role==='learner'){requireThat(aids.includes(input.academy),'Choose an academy.',400);if(p.academy!==input.academy)p.tutors=[];p.academy=input.academy;}
  else if(p.role==='tutor'){requireThat(Array.isArray(input.ids)&&input.ids.every(x=>aids.includes(x)),'Invalid academy list.',400);p.academies=input.ids;}
  else if(p.role==='employer'){requireThat(Array.isArray(input.ids),'Choose learners.',400);for(const id of input.ids)requireThat((await store.profile(id))?.role==='learner');p.learners=input.ids;}
  else throw new Problem('This role does not need assignments.');
  await store.setProfile(p);await add('audit',null,{action:'Assignment updated',target:p.id});return {ok:true};
 }
 if(action==='learner'){
  const p=await learner(input.id);const records=(await store.records(p.id)).filter(r=>visibleRecord(actor,r));
  const frameworks=(await store.list(CONFIG.records,[['kind','framework']])).filter(r=>r.payload.course===p.course);
  const resources=(await store.list(CONFIG.records,[['kind','resource']])).filter(r=>r.payload.course===p.course);return {student:visibleProfile(actor,p),units:unitsFor(p),records,frameworks,resources,review:nextReview(p,records)};
 }
 if(action==='framework'){
  admin();requireThat(COURSES[input.course],'Invalid course.',400);const all=[...COURSES[input.course].units,...(COURSES[input.course].optional||[])];requireThat(all.some(u=>u[0]===input.unit),'Invalid unit.',400);
  if(input.sheetPreset===true){requireThat(input.course==='vrq','These supplied sheets are VRQ only.',400);const preset=sheetFramework(input.unit,input.knowledgeMethod==='online'?'online':'tasks');requireThat(preset,'No photographed practical sheet for this unit.',400);requireThat(input.confirmed===true,'Confirm the transcription matches your sheet.',400);return add('framework',null,{course:'vrq',unit:input.unit,...preset,confirmed:true,unitCompletionReady:false});}
  const criteria=text(input.criteria,6500).split('\n').map(s=>s.trim()).filter(Boolean);requireThat(criteria.length>0&&criteria.length<=100,'Maximum 100 checklist entries.',400);
  requireThat(input.confirmed===true,'Confirm the checklist matches your approved handbook.',400);
  return add('framework',null,{course:input.course,unit:input.unit,source:text(input.source,600),criteria,confirmed:true});
 }
 if(action==='fileUpload'||action==='resourceImage'){
  const isResource=action==='resourceImage';if(isResource){admin();requireThat(COURSES[input.course],'Choose a course.',400);}
  const p=isResource?null:await learner(input.learner);requireThat(actor.role!=='employer');requireThat(actor.role!=='iqa','IQA can read evidence but cannot add learner evidence.');
  const name=text(input.name,150).replace(/[^\w. -]/g,'_'),b64=text(input.base64,1500000);const buf=Buffer.from(b64,'base64');requireThat(buf.length>0&&buf.length<=1024*1024,'Each file must be at most 1 MB.',400);
  const ext=name.split('.').at(-1).toLowerCase();const valid=(ext==='pdf'&&buf.subarray(0,5).toString()==='%PDF-')||(['jpg','jpeg'].includes(ext)&&buf[0]===255&&buf[1]===216&&buf[2]===255)||(ext==='png'&&buf.subarray(0,8).toString('hex')==='89504e470d0a1a0a');requireThat(valid,'Upload a PDF, JPG or PNG file.',400);
  const id=unique();await store.putFile(id,buf,name);try{return await add(isResource?'resourceImage':'file',p,{name,size:buf.length,fileId:id,...(isResource?{course:input.course}:{})});}catch(e){await store.deleteFile(id);throw e;}
 }
 if(action==='resourceImageDownload'){
  const r=await store.record(input.id);requireThat(r?.kind==='resourceImage');requireThat(actor.role!=='employer');const profiles=await store.profiles();requireThat(['admin','iqa'].includes(actor.role)||profiles.some(p=>p.course===r.payload.course&&hasAccess(actor,p)));const raw=await store.file(r.payload.fileId);return {name:r.payload.name,base64:Buffer.from(raw).toString('base64')};
 }
 if(action==='fileDownload'){requireThat(actor.role!=='employer');const r=await get(input.id,'file');const raw=await store.file(r.payload.fileId);return {name:r.payload.name,base64:Buffer.from(raw).toString('base64')};}
 if(action==='practical'){
  const p=await learner(input.learner);requireThat(actor.id===p.id,'Learners submit their own practical records.');
  const units=[...new Set(Array.isArray(input.units)?input.units:[input.unit])];requireThat(units.length>0&&units.length<=20&&units.every(u=>unitsFor(p).some(x=>x[0]===u)),'Unit is not enrolled.',400);
  const frameworks=(await store.list(CONFIG.records,[['kind','framework']])).filter(r=>r.payload.course===p.course),criteria=[];
  for(const unit of units){const f=latestFramework(frameworks,unit),claim=(input.criteria||[]).find(c=>c.unit===unit);
   if(!f){requireThat(!claim?.checks?.length,'No approved checklist for this unit.',400);continue;}
   requireThat(claim?.frameworkId===f.id,'A checklist has changed. Refresh the page and choose your criteria again.',409);
   const checks=[...new Set(claim.checks||[])];requireThat(checks.every(c=>typeof c==='string'&&/^(0|[1-9][0-9]*)$/.test(c)&&Number(c)<f.payload.criteria.length),'Invalid criterion.',400);
   criteria.push({unit,frameworkId:f.id,checks});
  }
  const files=Array.isArray(input.files)?input.files:[];requireThat(files.length<=10,'Choose up to 10 files.',400);for(const id of files){const r=await get(id,'file');requireThat(r.learner===p.id);}
  const consultationPlan={};const plan=input.consultationPlan||{};for(const [key,[label,choices]] of Object.entries(CONSULTATION)){const values=plan[key]||[];requireThat(Array.isArray(values)&&values.every(v=>choices.includes(v)),'Invalid consultation selection: '+label,400);consultationPlan[key]=[...new Set(values)];}const contraindications=plan.contraindications||[];requireThat(Array.isArray(contraindications)&&contraindications.length<=CONTRA.length&&contraindications.every(v=>['Yes','No','Not assessed'].includes(v)),'Invalid consultation answers.',400);consultationPlan.contraindications=CONTRA.map((_,i)=>contraindications[i]||'Not assessed');for(const key of ['clientRef','aftercare','treatment','conditioner','otherService'])consultationPlan[key]=text(plan[key]||'',600,false);
  const consultationChecks=Array.isArray(input.consultationChecks)?input.consultationChecks:[];requireThat(consultationChecks.every(x=>['goals','hair','safety','plan','aftercare'].includes(x)),'Invalid consultation check.',400);
  return add('practical',p,{unit:units[0],units,criteria,date:date(input.date),consultation:text(input.consultation||'',4000,!(units.length===1&&units[0]==='202')),consultationChecks,consultationPlan,service:text(input.service),reflection:text(input.reflection),ranges:text(input.ranges||'',2000,false),files,signature:signature()});
 }
 if(action==='assessment'){
  const r=await get(input.id,'practical'),p=await learner(r.learner);requireThat(canAssess(actor,p));requireThat(['achieved','returned'].includes(input.outcome),'Choose an outcome.',400);
  const criteria=[];for(const claim of r.payload.criteria||[]){const selected=(input.criteria||[]).find(c=>c.unit===claim.unit&&c.frameworkId===claim.frameworkId);const checks=[...new Set(selected?.checks||[])];requireThat(checks.every(c=>claim.checks.includes(c)),'Only learner-signed criteria can be confirmed.',400);criteria.push({...claim,checks});}
  requireThat((input.criteria||[]).every(c=>criteria.some(m=>m.unit===c.unit&&m.frameworkId===c.frameworkId)),'Invalid assessment checklist.',400);
  const marking=[];for(const claim of r.payload.criteria||[]){const f=await store.record(claim.frameworkId);if(!f?.payload.marking)continue;const m=f.payload.marking;const supplied=(input.marking||[]).find(x=>x.frameworkId===f.id),marks={};for(const [key,value] of Object.entries(supplied?.marks||{})){requireThat(claim.checks.includes(key)&&Number.isInteger(value)&&value>=0&&value<=m.maxMarks[Number(key)],'Invalid mark or criterion not claimed by learner.',400);marks[key]=value;}const confirmed=criteria.find(x=>x.frameworkId===f.id);for(const key of confirmed?.checks||[])requireThat(marks[key]>0,'Enter a positive assessor mark for each confirmed criterion.',400);marking.push({unit:claim.unit,frameworkId:f.id,marks,summary:markSummary(m,marks)});}
  return add('assessment',p,{unit:r.payload.unit,units:r.payload.units||[r.payload.unit],criteria,marking,outcome:input.outcome,feedback:text(input.feedback),signature:signature()},r.id,'a'+r.id);
 }
 if(action==='unitSignoff'){
  const p=await learner(input.learner);requireThat(canAssess(actor,p));requireThat(unitsFor(p).some(u=>u[0]===input.unit));
  const f=await store.record(input.framework);requireThat(f?.kind==='framework'&&f.payload.course===p.course&&f.payload.unit===input.unit,'Choose the approved checklist.',400);
  requireThat(f.payload.unitCompletionReady!==false,'This is a practical observation sheet only. Publish the complete approved unit requirements, including knowledge and any missing pages, before final unit sign-off.',400);
  const latest=latestFramework((await store.list(CONFIG.records,[['kind','framework']])).filter(x=>x.payload.course===p.course),input.unit);requireThat(latest?.id===f.id,'The checklist was updated. Refresh before signing.',409);
  requireThat(Array.isArray(input.checks)&&f.payload.criteria.every((_,i)=>input.checks.includes(String(i))),'Complete every checklist item.',400);
  const all=await store.records(p.id);const progress=unitProgress(input.unit,[f],all);requireThat(progress.total>0&&progress.count===progress.total,'Every criterion needs learner-signed evidence, assessor confirmation and independent IQA verification first.',400);
  const snap={evidenceVerified:true,unit:input.unit,framework:f.payload,frameworkId:f.id,checks:input.checks,evidence:text(input.evidence,3000),signature:signature()};return add('unitSignoff',p,{...snap,digest:hash(snap)});
 }
 if(action==='iqa'){
  requireThat(['admin','iqa'].includes(actor.role));const r=await get(input.id);requireThat(['assessment','unitSignoff'].includes(r.kind));requireThat(r.actor!==actor.id,'The IQA must be independent of this assessor.');
  if(r.kind==='unitSignoff'){const all=await store.records(r.learner);requireThat(!all.some(a=>a.kind==='assessment'&&a.actor===actor.id&&(a.payload.units||[a.payload.unit]).includes(r.payload.unit)&&a.payload.outcome==='achieved'),'The IQA must be independent of the evidence assessors.');}
  requireThat(['verified','action_required'].includes(input.outcome),'Choose a result.',400);requireThat(input.authentic===true&&input.sufficient===true&&input.fair===true||input.outcome==='action_required','Complete the sampling checklist.',400);
  return add('iqa',await learner(r.learner),{outcome:input.outcome,feedback:text(input.feedback),sampleReason:text(input.sampleReason,1000),checks:{authentic:input.authentic===true,sufficient:input.sufficient===true,fair:input.fair===true},signature:signature()},r.id,'q'+r.id);
 }
 if(action==='attendanceBatch'){
  requireThat(['admin','tutor'].includes(actor.role));requireThat(Array.isArray(input.entries)&&input.entries.length>0&&input.entries.length<=100,'Choose 1–100 students.',400);const day=date(input.date);requireThat(day<=londonDate(),'Attendance cannot be recorded in advance.',400);
  const seen=new Set(),entries=[];
  for(const e of input.entries){requireThat(!seen.has(e.learner),'Duplicate student.',400);seen.add(e.learner);const p=await learner(e.learner);requireThat(canAssess(actor,p));const minutes=Number(e.minutes);requireThat(['present','late','absent','authorised'].includes(e.status)&&Number.isInteger(minutes)&&minutes>=0&&minutes<=1440,'Check attendance status and minutes.',400);entries.push({p,payload:{date:day,status:e.status,minutes:['absent','authorised'].includes(e.status)?0:minutes,note:text(e.note||'',1000,false)}});}
  const saved=[],failed=[];for(const e of entries){try{await add('attendance',e.p,e.payload);saved.push(e.p.id);}catch{failed.push(e.p.id);}}return {saved,failed};
 }
 if(action==='checkin'){
  const p=await learner(actor.id);requireThat(actor.role==='learner');const day=londonDate();return add('checkin',p,{date:day,note:text(input.note||'',1000,false),status:'Awaiting tutor confirmation'},'', 'c'+hash([p.id,day]).slice(0,30));
 }
 if(action==='attendance'){
  const p=await learner(input.learner);requireThat(canAssess(actor,p));requireThat(['present','late','absent','authorised'].includes(input.status));const minutes=Number(input.minutes);requireThat(Number.isInteger(minutes)&&minutes>=0&&minutes<=1440,'Enter minutes between 0 and 1440.',400);const day=date(input.date);requireThat(day<=londonDate(),'Attendance cannot be recorded in advance.',400);
  return add('attendance',p,{date:day,status:input.status,minutes:['absent','authorised'].includes(input.status)?0:minutes,note:text(input.note||'',1000,false)});
 }
 if(action==='placement'){
  const p=await learner(input.learner);requireThat(actor.id===p.id,'Students sign their own work experience logs.');const day=date(input.date);requireThat(day<=londonDate(),'Record placement after attending.',400);const minutes=Number(input.minutes);requireThat(Number.isInteger(minutes)&&minutes>0&&minutes<=1440,'Enter 1–1440 minutes.',400);
  const prior=placementDays(await store.records(p.id)).find(r=>r.payload.date===day);if(prior)requireThat((await store.records(p.id)).some(d=>d.kind==='placementDecision'&&d.ref===prior.id&&d.payload.outcome==='returned'),'A log already exists for this day. Your tutor must return it before a replacement can be submitted.',409);
  return add('placement',p,{replaces:prior?.id||'',date:day,minutes,employer:text(input.employer,300),activity:text(input.activity,2000),reflection:text(input.reflection,2000),signature:signature()},'', 'w'+hash([p.id,day,prior?.id||'']).slice(0,30));
 }
 if(action==='placementDecision'){
  const r=await get(input.id,'placement'),p=await learner(r.learner);requireThat(canAssess(actor,p));requireThat(['approved','returned'].includes(input.outcome),'Choose a result.',400);return add('placementDecision',p,{outcome:input.outcome,feedback:text(input.feedback),signature:signature()},r.id,'d'+r.id);
 }
 if(action==='hours'){
  const p=await learner(input.learner);requireThat(actor.id===p.id||canAssess(actor,p));const minutes=Number(input.minutes);requireThat(Number.isInteger(minutes)&&minutes>0&&minutes<=1440,'Enter 1–1440 minutes.',400);requireThat(['academy','workplace','independent'].includes(input.category));return add('hours',p,{date:date(input.date),minutes,category:input.category,activity:text(input.activity,2000),reflection:text(input.reflection,2000)});
 }
 if(action==='review'){
  const p=await learner(input.learner);requireThat(canAssess(actor,p));const all=await store.records(p.id);const snapshot={date:date(input.date),nextDate:date(input.nextDate||addDays(input.date,reviewDays(p.course))),progress:text(input.progress),actions:text(input.actions),assessorFeedback:text(input.assessorFeedback),attendance:attendanceDays(all).map(r=>({id:r.id,...r.payload})),signature:signature(),employerRequired:input.employerRequired===true};requireThat(snapshot.nextDate>snapshot.date,'Next review must be later.',400);
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
  let image='';if(input.image){const r=await store.record(input.image);requireThat(r?.kind==='resourceImage'&&r.payload.course===input.course,'Invalid resource attachment.',400);image=r.id;}
  return add('resource',null,{image,course:input.course,title:text(input.title,150),body:text(input.body,4000),url});
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
