import hardwareImaginations from './hardware-imaginations.json';
// Prefix for files in public/, so the site also works when served from a sub-path (GitHub Pages).
export const asset=(path:string)=>`${process.env.NEXT_PUBLIC_BASE_PATH??''}${path}`;
export const metadata = {
 title: 'Modeling Latent Disturbances for Robust Decision-Making in World Models',
 authors: [{name:'Junwon Seo',href:'https://junwon.me/'},{name:'Andrea Bajcsy',href:'https://www.cs.cmu.edu/~abajcsy/'}],
 description: 'We model latent disturbances as perturbations to learned world-model dynamics, inducing pessimistic yet plausible imaginations for robust safety filtering and policy steering.',
 // Public URL of the deployed site (e.g. https://example.github.io/). Enables canonical, Open Graph, and sitemap URLs.
 siteUrl: 'https://junwon-vision.github.io/LatentDisturbance/',
 keywords: ['world models','robust optimization','latent disturbance','latent safety filter','policy steering','robot learning','uncertainty set','conformal prediction','safe robot manipulation'],
 resources: [{label:'arXiv',href:null},{label:'Code',href:null}] as {label:string;href:string|null}[],
 affiliations: 'Carnegie Mellon University',
 intro: 'Robust decision-making in world models, with latent-space disturbances modeled as perturbations to the learned latent dynamics that induce pessimistic yet plausible imaginations.',
 takeaways: [
  {tag:'Method',text:'Latent disturbances perturb the learned dynamics within a <strong>calibrated uncertainty set</strong> of plausible transitions, solved via <strong>efficient game-theoretic optimization</strong>.'},
  {tag:'Robust Runtime Policy Steering',text:'<strong>54%→15% failure rate</strong> with a robust latent safety filter and <strong>35%→70% success rate</strong> with sample-and-verify in contact-rich manipulation.'},
  {tag:'Robust Optimization in World Model Latent Space',text:'<strong>Robust decision-making directly in the latent space of world models</strong>, validated against ground-truth robust solutions when system dynamics and disturbances are known.'},
  {tag:'Benchmarks',text:'Three vision-based tasks in simulation and the real world: Dubins car, block pouring, and egg serving with a Franka robot.'},
 ],
};
export const colors = { nominal: '#0048a6', ours: '#ff9500', ood: '#740cad', teal: '#0d948f', base: '#777777' };
export const actions = [
  { id: 1, label: 'Action 1', result:'fail', end:[340.5,150.5], path:'M220 130.5C232.5 128.5 261.4 125.7 277 130.5C296.5 136.5 321 142 340.5 150.5', latent:[.34,.23], ellipse:{rx:184,ry:72,angle:-.28,radius:.70} },
  { id: 2, label: 'Action 2', result:'success', end:[389,166], path:'M221.5 125C234.167 118.833 264.6 108 285 114C310.5 121.5 349 133 357.5 142C366 151 372 161 389 166', latent:[.59,.29], ellipse:{rx:173,ry:119,angle:.24,radius:.80} },
  { id: 3, label: 'Action 3', result:'success', end:[355,177.5], path:'M221 134C229.167 131.833 248.7 128.8 261.5 134C277.5 140.5 273.5 137 293 147.5C312.5 158 306.5 164.5 317 172.5C325.4 178.9 345.833 178.5 355 177.5', latent:[.80,.41], ellipse:{rx:176,ry:74,angle:.32,radius:.63} },
  { id: 4, label: 'Action 4', result:'success', end:[327.5,191], path:'M224 139C245.2 142.2 260.5 155.333 265.5 161.5C267.5 165 274.1 173.3 284.5 178.5C294.9 183.7 317.5 189 327.5 191', latent:[.79,.65], ellipse:{rx:167,ry:88,angle:-.34,radius:.76} },
  { id: 5, label: 'Action 5', result:'fail', end:[351,77.5], path:'M220 121.5C226.167 110.834 243.4 87.1002 263 77.5002C287.5 65.5002 304 64.5002 319.5 65.5002C331.9 66.3002 345.667 73.8335 351 77.5002', latent:[.55,.82], ellipse:{rx:180,ry:69,angle:.36,radius:.68} },
  { id: 6, label: 'Action 6', result:'fail', end:[409,224], path:'M220 139C222.333 146.167 231.8 163 251 173C275 185.5 290 197 320.5 206C351 215 363.5 228 378 229C389.6 229.8 403.5 226 409 224', latent:[.32,.78], ellipse:{rx:157,ry:109,angle:-.20,radius:.77} },
  { id: 7, label: 'Action 7', result:'success', end:[422,190], path:'M220.5 137C232.5 139.167 260.9 145.9 278.5 155.5C300.5 167.5 303 179.5 340.5 187.5C378 195.5 391.5 196 403.5 195C413.1 194.2 419.833 191.333 422 190', latent:[.49,.54], ellipse:{rx:172,ry:84,angle:.12,radius:.71} },
];
export const actionColor=(action:number)=>actions[action-1].result==='success'?colors.ours:colors.nominal;
export const outcomes = [
  { id: 'nominal', label: 'Nominal', short: 'Nominal imagination', color: colors.nominal, point: [.50,.50], description: 'The world model’s predicted outcome.' },
  { id: 'ood', label: 'OOD', short: 'Out-of-distribution imagination', color: colors.ood, point: [.73,.77], description: 'An implausible imagination excluded by the OOD constraint.' },
  { id: 'ours', label: 'Pessimistic', short: 'Pessimistic imagination', color: colors.ours, point: [.76,.40], description: 'A worst-case imagination within the calibrated set.' },
] as const;
export type Outcome = typeof outcomes[number]['id'];
const actionFolder=(action:number)=>asset(`/front_figure/${action}_${actions[action-1].result}`);
export const demo = { initial:asset('/front_figure/initial.png'), original:(action:number)=>`${actionFolder(action)}/current.mp4`, video:(action:number,outcome:Outcome)=>`${actionFolder(action)}/${outcome==='ours'?'pessimistic':outcome}.mp4` };
export const trajectoryRoots={robust:asset('/filtering_results/robust'),nominal:asset('/filtering_results/nominal'),simulation:asset('/sim_results/final_qualitative_results')};
export const experimentMedia={
  hardwareImagination:hardwareImaginations.map((item,i)=>({
    ...item,title:`Example ${i+1}`,cameraLayout:'side-by-side' as const,
    left:{src:asset(item.nominal),label:'Nominal imagination'},
    right:{src:asset(item.pessimistic),label:'Pessimistic imagination'},
  })),
  stochasticity:asset('/sim_results/processed/task_intro.mp4'),
  ood:{title:'Imagination using latent disturbance optimized without in-distribution constraints',fps:30,nSteps:93,left:{src:asset('/sim_results/processed/ood/real_1.mp4'),label:'Executed in simulation'},right:{src:asset('/sim_results/processed/ood/ood_1.mp4'),label:'OOD imagination'}},
  imagination:[1,2].map(i=>({title:`Imagination ${i}`,fps:30,nSteps:i===1?518:411,left:{src:asset(`/sim_results/processed/imagination/nominal_${i}.mp4`),label:'Nominal imagination'},right:{src:asset(`/sim_results/processed/imagination/pessimistic_${i}.mp4`),label:'Pessimistic imagination'}})),
};
export const steps = [
  { title: 'Dynamics-aware similarity', color: colors.nominal, text: 'Construct a KL ball around the predicted next-state distribution.', detail: 'KL divergence from the predicted next-state distribution' },
  { title: 'In-distribution constraint', color: colors.ood, text: 'Exclude out-of-distribution latent states using an OOD score.', detail: 'Light purple: OOD score' },
  { title: 'Calibrate the radius', color: colors.teal, text: 'Calibrate the uncertainty radius around the prediction.', detail: 'Calibrated dynamics-aware radius' },
  { title: 'Calibrate the OOD boundary', color: colors.teal, text: 'Calibrate the OOD threshold; retain the green region.', detail: 'Calibrated uncertainty set' },
  { title: 'Find the worst-case disturbance', color: colors.ours, text: 'Find the most adverse latent disturbance within the set.', detail: 'Worst-case latent disturbance' },
];
export const methodNames = ['Base Policy', 'Nominal', 'Worst-of-10', 'CVaR (0.1)', 'Without OOD', 'Ours'];
export const methodColors = [colors.base, colors.nominal, '#0091ff', '#0091ff', colors.ood, colors.ours];

export type OODRegion = { cx:number; cy:number; rx:number; ry:number; angle:number; points:number[][] };
// Seeded layouts stay stable when selecting outcomes or replaying the animation.
function makeOOD(action:number): OODRegion[] {
  let seed=action*173+51;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const count=[2,3,3,2,3,2,4][action-1], e=actions[action-1].ellipse;
  const offset=random()*Math.PI*2;
  return Array.from({length:count},(_,i)=>{
    const theta=offset+i*Math.PI*2/count+(random()-.5)*.25;
    const larger=action===2 && i<2;
    const [inner, spread]=action===1 ? [.59,.04] : action===2 ? [.60,.08] : [.46,.06];
    const distance=inner+random()*spread;
    const lx=e.rx*Math.cos(theta)*distance,ly=e.ry*Math.sin(theta)*distance;
    const cx=Math.max(54,Math.min(346,200+lx*Math.cos(e.angle)-ly*Math.sin(e.angle)));
    const cy=Math.max(49,Math.min(251,150+lx*Math.sin(e.angle)+ly*Math.cos(e.angle)));
    let rx=larger ? 42+random()*12 : 28+random()*16;
    let ry=larger ? 30+random()*10 : 20+random()*13;
    const angle=random()*Math.PI;
    const dx=200-cx,dy=150-cy;
    const centerDistance=Math.hypot((dx*Math.cos(angle)+dy*Math.sin(angle))/rx,(-dx*Math.sin(angle)+dy*Math.cos(angle))/ry);
    const shrink=Math.min(1,centerDistance/1.4);rx*=shrink;ry*=shrink;
    const points=Array.from({length:10},(_,j)=>{
      const t=j*Math.PI*2/10;
      const scale=j%3===1 ? .50+random()*.16 : .92+random()*.30;
      return [Math.cos(t)*rx*scale,Math.sin(t)*ry*scale];
    });
    return {cx,cy,rx,ry,angle,points};
  });
}
const layouts=actions.map(a=>makeOOD(a.id));
export const oodRegions=(action:number)=>layouts[action-1];
export function outsideOOD(action:number,x:number,y:number) {
  return oodRegions(action).every(r=>{
    const dx=x-r.cx,dy=y-r.cy;
    const u=(dx*Math.cos(r.angle)+dy*Math.sin(r.angle))/(r.rx*1.25);
    const v=(-dx*Math.sin(r.angle)+dy*Math.cos(r.angle))/(r.ry*1.25);
    return u*u+v*v>1;
  });
}
export function outcomePoint(action: number, outcome: Outcome): readonly number[] {
  if(outcome==='nominal')return [.5,.5];
  if(outcome==='ood'){const r=oodRegions(action)[0];return [r.cx/400,r.cy/300];}
  const { rx, ry, angle, radius } = actions[action - 1].ellipse;
  for(let i=0;i<32;i++){
    const t=-.2+i*Math.PI*2/32;
    const x=rx*radius*.73*Math.cos(t),y=ry*radius*.73*Math.sin(t);
    const px=200+x*Math.cos(angle)-y*Math.sin(angle),py=150+x*Math.sin(angle)+y*Math.cos(angle);
    if(outsideOOD(action,px,py))return [px/400,py/300];
  }
  return [.5,.5];
}
