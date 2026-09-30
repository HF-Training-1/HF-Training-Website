// Shared pure rules: dates are calendar dates in the academy's London timezone.
export const londonDate=()=>new Date().toLocaleDateString('en-CA',{timeZone:'Europe/London'});
export const reviewDays=course=>course==='nvq6008'?84:28;
export function addDays(day,days){if(!/^\d{4}-\d{2}-\d{2}$/.test(day||''))return '';const d=new Date(day+'T12:00:00Z');if(Number.isNaN(+d))return '';d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10);}
export function nextReview(p,records=[],today=londonDate()){
 const reviews=records.filter(r=>r.kind==='review'&&r.payload.date<=today).sort((a,b)=>b.payload.date.localeCompare(a.payload.date)||b.created.localeCompare(a.created));
 const latest=reviews[0];const date=latest?(latest.payload.nextDate||addDays(latest.payload.date,reviewDays(p.course))):addDays(p.start,reviewDays(p.course));
 return {date,days:reviewDays(p.course),status:!date?'Start date needed':date<today?'Overdue':date===today?'Due today':date<=addDays(today,7)?'Due within 7 days':'Scheduled'};
}
export function passwordChecks(value){return {length:typeof value==='string'&&value.length>=8&&value.length<=128,capital:/[A-Z]/.test(value||''),number:/[0-9]/.test(value||'')};}
export const validPassword=value=>Object.values(passwordChecks(value)).every(Boolean);
export function latestFramework(frameworks,unit){return frameworks.filter(f=>f.payload.unit===unit).sort((a,b)=>b.created.localeCompare(a.created)||b.id.localeCompare(a.id))[0];}
export function attendanceDays(records){const map=new Map();for(const r of [...records].filter(r=>r.kind==='attendance').sort((a,b)=>(a.created||'').localeCompare(b.created||'')))map.set(r.payload.date,r);return [...map.values()].sort((a,b)=>b.payload.date.localeCompare(a.payload.date));}
export function unitProgress(unit,frameworks,records){
 const f=latestFramework(frameworks,unit),matched=new Set();if(!f)return {total:0,count:0,percent:0,complete:false,framework:null};
 const verified=id=>records.some(r=>r.kind==='iqa'&&r.ref===id&&r.payload.outcome==='verified'&&r.payload.signature);
 for(const a of records.filter(r=>r.kind==='assessment'&&r.payload.outcome==='achieved'&&r.payload.signature&&verified(r.id))){
  const p=records.find(r=>r.kind==='practical'&&r.id===a.ref&&r.payload.signature);if(!p)continue;
  for(const m of a.payload.criteria||[]){const claim=(p.payload.criteria||[]).find(c=>c.unit===unit&&c.frameworkId===f.id);if(m.unit!==unit||m.frameworkId!==f.id||!claim)continue;for(const check of m.checks)if(claim.checks.includes(check)&&f.payload.criteria[Number(check)]!==undefined)matched.add(check);}
 }
 const total=f.payload.criteria.length,count=matched.size;
 const complete=records.some(r=>r.kind==='unitSignoff'&&r.payload.unit===unit&&r.payload.frameworkId===f.id&&r.payload.evidenceVerified===true&&r.payload.signature&&verified(r.id));
 return {total,count,percent:total?Math.floor(100*count/total):0,complete,framework:f.id,checks:[...matched]};
}
export function weekStart(day){const d=new Date(day+'T12:00:00Z');return addDays(day,-((d.getUTCDay()+6)%7));}
export function placementDays(records){const map=new Map();for(const r of records.filter(r=>r.kind==='placement').sort((a,b)=>(a.created||'').localeCompare(b.created||'')))map.set(r.payload.date,r);return [...map.values()];}
export function placementWeek(records,day){const start=weekStart(day),end=addDays(start,6);const logs=placementDays(records).filter(r=>r.payload.date>=start&&r.payload.date<=end);const days=new Map();for(const r of logs)days.set(r.payload.date,(days.get(r.payload.date)||0)+r.payload.minutes);const qualifying=[...days.values()].filter(m=>m>=360).length;return {start,end,days:days.size,qualifying,hours:[...days.values()].reduce((a,b)=>a+b,0)/60,met:qualifying>=3};}
