export type Trace={reachability:number[];is_filtered:number[];robust_reachability?:number[]};
export const frameAt=(time:number,fps:number,count:number)=>Math.max(0,Math.min(count-1,Math.round(time*fps)));
export const timeAt=(frame:number,fps:number,count:number)=>Math.max(0,Math.min(count-1,Math.round(frame)))/fps;
export const filterColor=(trace:Trace,frame:number,color:string)=>trace.is_filtered[frame]===1?color:'#222222';
// Small drift is corrected without seeking, which would interrupt video decoding.
export function companionAdjustment(master:number,companion:number,speed:number,fps:number){
 const drift=companion-master;
 return Math.abs(drift)>Math.max(.2,2/fps)?{seek:master,rate:speed}:{seek:null,rate:Math.abs(drift)<.012?speed:speed*Math.max(.95,Math.min(1.05,1-drift*.5))};
}
export function nextRandom(current:number,count:number,random=Math.random){return count<2?current:(current+1+Math.floor(random()*(count-1)))%count;}
