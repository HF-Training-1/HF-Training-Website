// Transcribed from the eight blank sheet photographs supplied by the academy on 29 September 2026.
// These VRQ sheets are not NVQ criteria. Missing content is deliberately not inferred.
const sheet=(unit,source,ranges,criteria,stars,bands,complete=true)=>({unit,source,ranges,criteria,stars,bands,complete});
export const SHEETS={
 '203':sheet('203','Supplied Unit 203 VRQ practical observation sheet, page 34; edition not shown',['Shampooing and conditioning','Styling service','One other service'],[
 'Communicate in a manner that creates confidence, trust and maintains goodwill',
 'Establish client requirements for products and services using appropriate communication techniques',
 'Consult client',
 'Identify factors that may limit or prevent the choice of services or products',
 'Advise the client on factors which may limit, prevent or affect their choice of service or product',
 'Provide the client with clear recommendations for referral when required',
 'Recommend and agree a service or product',
 'Complete client records',
 'Follow safe and hygienic working practices'],[0,1,6],[[9,10,'Pass'],[11,13,'Merit'],[14,15,'Distinction']]),
 '204':sheet('204','Supplied Unit 204 VRQ practical observation sheet, page 46; edition not shown',['Dry hair','Product build-up / oily hair','Normal hair'],[
 'Prepare self, the client and work area for shampooing and conditioning services',
 'Identify the condition of the hair and scalp using suitable consultation techniques',
 'Select and use products, tools and equipment suitable for the client’s hair and scalp condition',
 'Use and adapt massage techniques to meet the needs of the client',
 'Adapt water temperature and flow to the hair, scalp and comfort; leave hair clean and free of products',
 'Disentangle hair without causing damage to the hair or scalp',
 'Follow safe and hygienic working practices',
 'Provide suitable aftercare advice',
 'Communicate and behave in a professional manner'],[1,3,7,8],[[9,10,'Pass'],[11,14,'Merit'],[15,17,'Distinction']]),
 '211':sheet('211','Supplied Unit 211 VRQ practical observation sheet, page 9; edition not shown',['Tapered beardline','Full beard outline','Moustache only'],[
 'Prepare self, the client and work area for facial hair services',
 'Use suitable consultation techniques to identify service objectives',
 'Assess the potential of the hair to achieve the desired look by identifying influencing factors',
 'Select and use cutting equipment to achieve the desired look',
 'Establish and accurately follow guidelines to achieve the required look',
 'Use cutting techniques that take into account identified factors',
 'Position self and the client appropriately throughout the service',
 'Check the cut regularly to ensure accurate distribution of balance, weight and shape',
 'Remove unwanted hair outside the outline shape',
 'Create a finished cut that is to the satisfaction of the client',
 'Follow safe and hygienic working practices',
 'Provide suitable aftercare advice',
 'Communicate and behave in a professional manner'],[1,2,4,11,12],[[13,15,'Pass'],[16,20,'Merit'],[21,23,'Distinction']]),
 '210':sheet('210','Supplied Unit 210 VRQ practical observation sheet, page 9 and supplied continuation; edition not shown',['Uniform layered look','Graduated look'],[
 'Prepare self, the client and work area for cutting services',
 'Use suitable consultation techniques to identify service objectives',
 'Assess the potential of the hair to achieve the desired look by identifying influencing factors',
 'Select and use cutting tools and equipment to achieve the desired look, taking account of identified factors',
 'Establish and follow guidelines to accurately achieve the required look',
 'Use cutting techniques that take into account the identified factors',
 'Create neckline shapes that are accurate and take into account the natural hairline',
 'Position self and the client appropriately throughout the service',
 'Cross-check the cut to ensure even balance and weight distribution',
 'Remove unwanted hair outside the desired outline shape',
 'Create balanced and shaped sideburns that suit the required look',
 'Create a finished cut that is to the satisfaction of the client',
 'Follow safe and hygienic working practices',
 'Provide suitable aftercare advice',
 'Communicate and behave in a professional manner'],[1,2,4,13,14],[[15,17,'Pass'],[18,22,'Merit'],[23,25,'Distinction']])
};
export function sheetFramework(unit,method='tasks'){if(unit==='202'){const criteria=method==='online'?['Approved online knowledge test completed and passed']:['Task 1a: chart completed and passed','Task 1b: poster completed and passed','Task 1c: leaflet completed and passed','Task 1d: chart completed and passed'];return {criteria,source:'Supplied Unit 202 assignment mark sheet, page 20; task briefs not supplied',marking:{source:'Unit 202 knowledge completion record',rows:criteria.length,ranges:['Knowledge completion'],maxMarks:criteria.map(()=>1),bands:[[criteria.length,criteria.length,'Pass']],complete:true,knowledge:true,method}};}const s=SHEETS[unit];if(!s)return null;return {criteria:s.ranges.flatMap(range=>s.criteria.map((text,i)=>`${range} · ${i+1}. ${text}`)),marking:{source:s.source,rows:s.criteria.length,ranges:s.ranges,maxMarks:s.ranges.flatMap(()=>s.criteria.map((_,i)=>s.stars.includes(i)?3:1)),bands:s.bands,complete:s.complete},source:s.source};}
export function markSummary(marking,marks){return marking.ranges.map((range,index)=>{const values=Array.from({length:marking.rows},(_,i)=>marks[String(index*marking.rows+i)]);const recorded=values.filter(v=>Number.isInteger(v)).length;const total=values.reduce((a,b)=>a+(Number.isInteger(b)?b:0),0);const grade=!marking.complete?'Awaiting missing sheet':recorded!==marking.rows?'Incomplete':values.some(v=>v===0)?'Not yet achieved':marking.bands.find(([lo,hi])=>total>=lo&&total<=hi)?.[2]||'Check marks';return {range,recorded,total,grade};});}
export const CONSULTATION={
 clientType:['Client type',['New','Regular']],
 porosity:['Porosity',['Porous','Non-porous','Resistant','Not tested']],
 elasticity:['Elasticity',['Strong','Weak','Not tested']],
 texture:['Texture',['Fine','Medium','Coarse']],
 density:['Density',['Sparse','Average','Abundant']],
 classification:['Hair classification',['Straight (type 1)','Wavy (type 2)','Curly (type 3)','Very curly (type 4)']],
 hairCondition:['Hair condition',['Damaged','Product build-up','Normal','Oily','Dry']],
 scalpCondition:['Scalp condition',['Dandruff','Oily','Dry','Product build-up','Normal']],
 growth:['Hair growth patterns',['Cowlick','Double crown','Nape whorl','Widow’s peak']],
 length:['Hair length / shape',['Above shoulder','With fringe','Layered','One length']],
 products:['Products',['Gels','Lotions','Sprays','Styling powder','Oil','Wax','Heat protector','Creams','Hair tonic']],
 face:['Head / face shape',['Oval','Heart','Oblong','Square','Round']],
 facialTools:['Facial hair tools',['Scissors','Clippers','Clipper attachments','Trimmers']],
 facialLooks:['Facial hair looks',['Full beard outline','Moustache','Eyebrow shape','Tapered beardline','Partial beard']],
 facialTechniques:['Facial hair techniques',['Clippers with attachments','Scissor over comb','Clipper over comb','Freehand','Fading']],
 cuttingTools:['Cutting tools',['Scissors','Clippers','Clipper attachments','Razors','Trimmers']],
 cuttingLooks:['Cutting looks',['Square layer','Flat top','Over ear','With fade','Eyebrow trim','Uniform layer','Graduation','Fringe','Parting','Around the ear']],
 cuttingTechniques:['Cutting techniques',['Club cutting','Scissor over comb','Freehand','Thinning','Fading','Clipper over comb','Razor cutting','Disconnecting']],
 neckline:['Neckline shapes',['Tapered','Squared','Full neckline','Skin fade']],
 outline:['Outline shapes',['Natural','Created','Tapered','Straight lines','Curved','Repeated / hair line']],
 styling:['Styling techniques',['Round brush','Finger drying','Flat brush','Electrical equipment']],
 finish:['Finished looks',['Straightening','Smoothing','Creating volume','Creating movement','Creating texture']]
};
export const CONTRA=['Cuts or abrasions','Skin sensitivities','Product / known allergies','Incompatible products','Evident heat damage','Recent scar tissue / injury to treatment area','Previous allergic reaction to colour products','Scalp / skin disorders or diseases','Medical advice or instruction','Male pattern baldness'];
