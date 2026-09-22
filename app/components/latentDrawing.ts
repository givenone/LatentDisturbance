import { actions, actionColor, colors, outcomes, outcomePoint, oodRegions, type OODRegion } from '../data/content';
type Context = CanvasRenderingContext2D;

function manifold(c: Context) {
  c.moveTo(23,135);
  c.bezierCurveTo(12,76,77,28,149,23);
  c.bezierCurveTo(211,19,218,51,279,50);
  c.bezierCurveTo(352,44,388,104,371,171);
  c.bezierCurveTo(362,210,327,218,312,250);
  c.bezierCurveTo(283,301,205,297,147,276);
  c.bezierCurveTo(94,257,28,256,19,208);
  c.bezierCurveTo(12,175,29,164,23,135);c.closePath();
}
function ellipse(c: Context, action: number, radius=1) {
  const { rx, ry, angle } = actions[action-1].ellipse;
  c.ellipse(200,150,rx*radius,ry*radius,angle,0,Math.PI*2);c.closePath();
}
function regionPath(c:Context,r:OODRegion,scale=1) {
  const points=r.points.map(([x,y])=>[r.cx+scale*(x*Math.cos(r.angle)-y*Math.sin(r.angle)),r.cy+scale*(x*Math.sin(r.angle)+y*Math.cos(r.angle))]);
  const last=points[points.length-1],first=points[0];
  c.moveTo((last[0]+first[0])/2,(last[1]+first[1])/2);
  points.forEach((p,i)=>{const next=points[(i+1)%points.length];c.quadraticCurveTo(p[0],p[1],(p[0]+next[0])/2,(p[1]+next[1])/2);});c.closePath();
}
function methodRegionPath(c:Context,r:OODRegion,scale=1) {
  const shrink=.58;
  const points=r.points.map(([x,y])=>[
    200+((r.cx-200)+scale*(x*Math.cos(r.angle)-y*Math.sin(r.angle)))*shrink,
    150+((r.cy-150)+scale*(x*Math.sin(r.angle)+y*Math.cos(r.angle)))*shrink,
  ]);
  const last=points[points.length-1],first=points[0];
  c.moveTo((last[0]+first[0])/2,(last[1]+first[1])/2);
  points.forEach((p,i)=>{const next=points[(i+1)%points.length];c.quadraticCurveTo(p[0],p[1],(p[0]+next[0])/2,(p[1]+next[1])/2);});c.closePath();
}
function drawOOD(c:Context,action:number,score=false,boundaryScale=1) {
  oodRegions(action).forEach(r=>{
    if(score){
      for(let i=5;i>=1;i--){c.beginPath();regionPath(c,r,1+i*.13);c.fillStyle='#b888ce15';c.fill();}
      c.beginPath();regionPath(c,r,1.15);c.fillStyle='#bd94d487';c.fill();
    }else{
      c.beginPath();regionPath(c,r,boundaryScale);c.fillStyle=colors.ood;c.fill();
      c.lineWidth=1.5;c.strokeStyle='#fff';c.stroke();
    }
  });
}
function greenSet(c:Context,action:number,boundaryScale=1) {
  c.save();
  // Intersect the complement of each patch separately, avoiding XOR overlaps.
  oodRegions(action).forEach(r=>{c.beginPath();c.rect(0,0,400,300);regionPath(c,r,boundaryScale);c.clip('evenodd');});
  c.beginPath();ellipse(c,action,actions[action-1].ellipse.radius);
  c.fillStyle='#2ac8a3';c.fill();c.strokeStyle='#008c70';c.lineWidth=2;c.stroke();c.restore();
}
function drawMethodOOD(c:Context,score=false,boundaryScale=1) {
  oodRegions(1).forEach(r=>{
    if(score){
      for(let i=5;i>=1;i--){c.beginPath();methodRegionPath(c,r,1+i*.13);c.fillStyle='#b888ce15';c.fill();}
      c.beginPath();methodRegionPath(c,r,1.15);c.fillStyle='#bd94d487';c.fill();
    }else{
      c.beginPath();methodRegionPath(c,r,boundaryScale);c.fillStyle=colors.ood;c.fill();
      c.lineWidth=1.5;c.strokeStyle='#fff';c.stroke();
    }
  });
}
function methodEllipse(c:Context,radius=1){c.ellipse(200,150,110*radius,38*radius,-.28,0,Math.PI*2);c.closePath();}
function methodGreenSet(c:Context,boundaryScale=1){
  c.save();
  oodRegions(1).forEach(r=>{c.beginPath();c.rect(0,0,400,300);methodRegionPath(c,r,boundaryScale);c.clip('evenodd');});
  c.beginPath();methodEllipse(c,.76);c.fillStyle='#2ac8a3';c.fill();c.strokeStyle='#008c70';c.lineWidth=2;c.stroke();c.restore();
}
function density(c: Context,x:number,y:number,rx:number,ry:number,opacity:number,angle=0) {
  c.save();c.translate(x,y);c.rotate(angle);c.scale(rx,ry);
  const g=c.createRadialGradient(0,0,.04,0,0,1);
  g.addColorStop(0,`rgba(0,112,238,${opacity})`);
  g.addColorStop(.5,`rgba(24,142,249,${opacity*.9})`);
  g.addColorStop(.82,`rgba(65,165,255,${opacity*.65})`);
  g.addColorStop(1,'rgba(80,168,250,0)');
  c.fillStyle=g;c.beginPath();c.arc(0,0,1,0,2*Math.PI);c.fill();c.restore();
}
function dot(c:Context,x:number,y:number,color:string,radius=6){c.beginPath();c.arc(x,y,radius,0,Math.PI*2);c.fillStyle=color;c.fill();c.strokeStyle='#171717';c.lineWidth=2.2;c.stroke();}
export function drawObservation(c:Context,action:number) {
  c.save();c.scale(400/494,300/332);
  actions.forEach(a=>{c.strokeStyle=a.id===action?actionColor(action):'#ffffff';c.lineWidth=a.id===action?4:2;c.stroke(new Path2D(a.path));});c.restore();
}
export function drawUncertainty(c: Context, action:number) {
  const {rx,ry,angle}=actions[action-1].ellipse;
  c.save();c.beginPath();ellipse(c,action);c.fillStyle='#edf5fc';c.fill();
  density(c,200,150,rx,ry,.88,angle);
  greenSet(c,action);drawOOD(c,action);
  outcomes.forEach(o=>{const point=outcomePoint(action,o.id);dot(c,point[0]*400,point[1]*300,o.color);});
  c.restore();
}
function arrow(c:Context,x:number,y:number,progress:number,color:string,width:number,bend=-25) {
  if(progress<=0)return;
  const point=(t:number)=>{const u=1-t;return [u*u*u*48+3*u*u*t*78+3*u*t*t*(x-55)+t*t*t*x,u*u*u*165+3*u*u*t*165+3*u*t*t*(y+bend)+t*t*t*y];};
  c.beginPath();c.moveTo(48,165);
  const segments=60;for(let i=1;i<=segments;i++){const p=point(progress*i/segments);c.lineTo(p[0],p[1]);}
  c.lineWidth=width;c.lineCap='round';c.strokeStyle=color;c.stroke();
  const tip=point(progress),before=point(Math.max(0,progress-.015));
  const angle=Math.atan2(tip[1]-before[1],tip[0]-before[0]);
  c.beginPath();c.moveTo(tip[0],tip[1]);
  c.lineTo(tip[0]-10*Math.cos(angle-.43),tip[1]-10*Math.sin(angle-.43));
  c.lineTo(tip[0]-10*Math.cos(angle+.43),tip[1]-10*Math.sin(angle+.43));c.closePath();c.fillStyle=color;c.fill();
}
export type SceneProgress={arrow:number;distribution:number;zoom:number};
export function animationProgress(elapsed:number):SceneProgress {
  const ramp=(start:number,duration:number)=>Math.max(0,Math.min(1,(elapsed-start)/duration));
  const ease=(t:number)=>1-Math.pow(1-t,3);
  return {arrow:ease(ramp(0,650)),distribution:ease(ramp(650,400)),zoom:ease(ramp(1050,700))};
}
export function drawLatentScene(c: Context,action:number,progress:SceneProgress={arrow:1,distribution:1,zoom:1}) {
  const selected=actions[action-1];const x=selected.latent[0]*400,y=selected.latent[1]*300;
  const {rx,ry,angle}=selected.ellipse;
  const dx=600-x,dy=150-y,cos=Math.cos(angle),sin=Math.sin(angle);
  const ux=(dx*cos+dy*sin)/rx,uy=(-dx*sin+dy*cos)/ry;
  const distance=Math.hypot(ux,uy),along=(.23-1)/distance,across=Math.sqrt(1-along*along);
  const tangents=[-1,1].map(sign=>{
    const nx=along*ux/distance-sign*across*uy/distance,ny=along*uy/distance+sign*across*ux/distance;
    const ex=rx*nx*cos-ry*ny*sin,ey=rx*nx*sin+ry*ny*cos;
    const source=[x+.23*ex,y+.23*ey];
    return {source,target:[source[0]+(600+ex-source[0])*progress.zoom,source[1]+(150+ey-source[1])*progress.zoom]};
  });
  c.save();c.translate(0,45);
  c.beginPath();manifold(c);c.fillStyle='#eff0f1';c.fill();c.strokeStyle='#b6bec4';c.lineWidth=1.2;c.stroke();
  if(progress.zoom>0){
    c.save();c.globalAlpha=progress.zoom;
    const [upper,lower]=tangents;
    c.beginPath();c.moveTo(upper.source[0],upper.source[1]);c.lineTo(upper.target[0],upper.target[1]);c.lineTo(lower.target[0],lower.target[1]);c.lineTo(lower.source[0],lower.source[1]);c.closePath();c.fillStyle='#c7cfe996';c.fill();
    c.strokeStyle='#929fbe';c.lineWidth=1;
    tangents.forEach(t=>{c.beginPath();c.moveTo(t.source[0],t.source[1]);c.lineTo(t.target[0],t.target[1]);c.stroke();});c.restore();
  }
  if(progress.distribution>0){
    c.save();c.globalAlpha=progress.distribution;
    const grow=.65+.35*progress.distribution;
    density(c,x,y,rx*.23*grow,ry*.23*grow,.96,angle);
    c.beginPath();c.ellipse(x,y,rx*.23*grow,ry*.23*grow,angle,0,Math.PI*2);c.strokeStyle=colors.nominal;c.lineWidth=1.5;c.stroke();c.restore();
  }
  arrow(c,x,y,progress.arrow,colors.nominal,3.6,action===1?40:-25);
  dot(c,48,165,'#222');
  if(progress.zoom>0){
    c.save();c.globalAlpha=progress.zoom;
    c.translate(x+(600-x)*progress.zoom,y+(150-y)*progress.zoom);
    const scale=.23+.77*progress.zoom;c.scale(scale,scale);c.translate(-200,-150);
    drawUncertainty(c,action);c.restore();
  }
  c.restore();
  c.beginPath();c.moveTo(48,210);c.lineTo(120,390);c.setLineDash([2,4]);c.strokeStyle='#777';c.lineWidth=1.2;c.stroke();c.setLineDash([]);
  if(progress.zoom===1){
    outcomes.forEach((o,i)=>{const p=outcomePoint(action,o.id),end=outcomeLabels[i];
      c.beginPath();c.moveTo(400+p[0]*400,45+p[1]*300);c.lineTo(end[0],end[1]);c.setLineDash([2,4]);c.strokeStyle='#555';c.lineWidth=1;c.stroke();c.setLineDash([]);
    });
  }
}
export const outcomeLabels=[[600,18],[480,372],[718,372]];
export function methodAnnotations(stage:number){
  const r=oodRegions(1)[0];
  return [
    {src:'z_t.png',label:'Current State',color:'#333',point:[148,265],image:[65,52],show:true},
    {src:'z_t+1_1.png',label:'Next State',color:colors.nominal,point:[272,229],image:[278,52],show:true},
    {src:'z_t+1_2.png',label:'Next State',color:colors.nominal,point:[324,271],image:[495,52],show:true},
    {src:'z_ood.png',label:'Out-of-Distribution State',color:colors.ood,point:[300+(r.cx-200)*.58,250+(r.cy-150)*.58],image:[160,463],show:stage>=1},
    {src:'z_pessimistic.png',label:'Worst-Case Next State',color:colors.ours,point:[371,245],image:[440,463],show:stage===4},
  ].filter(a=>a.show);
}
export function drawMethodWithLeaders(c:Context,stage:number,progress:number){
  c.save();c.translate(100,100);drawMethod(c,stage,progress);c.restore();
  methodAnnotations(stage).forEach(a=>{
    const endY=a.image[1]<100?103:415;
    c.beginPath();c.moveTo(a.point[0],a.point[1]);c.lineTo(a.image[0],endY);c.strokeStyle='#555';c.lineWidth=1.2;c.setLineDash([2,4]);c.stroke();c.setLineDash([]);
    dot(c,a.point[0],a.point[1],a.color);
  });
}
export function drawMethod(c:Context,stage:number,progress=1){
  c.beginPath();manifold(c);c.fillStyle='#f0f1f2';c.fill();c.strokeStyle='#bbc2c7';c.lineWidth=1;c.stroke();
  const emergence=stage===0?Math.max(0,Math.min(1,(progress-.55)/.45)):1;
  if(emergence>0)density(c,200,150,110,38,.9*emergence,-.28);
  if(stage===1){c.save();c.globalAlpha=progress;drawMethodOOD(c,true);c.restore();}
  if(stage===2){
    c.beginPath();methodEllipse(c,1+progress*(.76-1));c.fillStyle='#2ac8a3';c.fill();c.strokeStyle='#008c70';c.lineWidth=2.7;c.stroke();
    drawMethodOOD(c,true);
  }
  if(stage>=3){
    const boundaryScale=stage===3?1.4-.4*progress:1;
    methodGreenSet(c,boundaryScale);drawMethodOOD(c,false,boundaryScale);
  }
  arrow(c,171,150,stage===0?Math.min(1,progress/.55):1,colors.nominal,3.5);
  dot(c,48,165,'#222');
}
