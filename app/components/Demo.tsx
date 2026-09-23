'use client';
import { useEffect, useRef, useState } from 'react';
import {VideoPlayer} from './VideoPlayer';
import { actions, actionColor, asset, demo, outcomes, outcomePoint, steps, type Outcome } from '../data/content';
import { drawLatentScene, drawMethodWithLeaders, methodAnnotations, outcomeLabels, animationProgress } from './latentDrawing';

function Drawing({kind,action,stage=0,replay=0}:{kind:'scene'|'method';action:number;stage?:number;replay?:number}){
 const ref=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{
  const canvas=ref.current!,ctx=canvas.getContext('2d');if(!ctx)return;
  const width=kind==='scene'?800:600,height=kind==='scene'?400:530;canvas.width=width*2;canvas.height=height*2;
  const scene=canvas.closest('.latent-scene') as HTMLElement|null;const motion=window.matchMedia?.('(prefers-reduced-motion: reduce)');let frame=0;const duration=kind==='scene'?1750:1100;
  const render=(elapsed:number)=>{ctx.setTransform(2,0,0,2,0,0);ctx.clearRect(0,0,width,height);if(kind==='scene'){const p=animationProgress(elapsed);drawLatentScene(ctx,action,p);if(scene)scene.dataset.zoomReady=String(p.zoom===1);}else drawMethodWithLeaders(ctx,stage,Math.min(1,elapsed/duration));};
  const finish=()=>{window.cancelAnimationFrame?.(frame);render(duration);};
  if(motion?.matches||!window.requestAnimationFrame)finish();else{const start=performance.now();const animate=(now:number)=>{render(now-start);if(now-start<duration)frame=window.requestAnimationFrame(animate);};render(0);frame=window.requestAnimationFrame(animate);}
  motion?.addEventListener('change',finish);return()=>{window.cancelAnimationFrame?.(frame);motion?.removeEventListener('change',finish);};
 },[action,kind,stage,replay]);return <canvas ref={ref} className="diagram-canvas" aria-hidden="true"/>;
}

export function Demo(){
 const [action,setAction]=useState(1),[selected,setSelected]=useState(false),[outcome,setOutcome]=useState<Outcome>('ours'),[replay,setReplay]=useState(0),[playRequest,setPlayRequest]=useState(0),[currentDone,setCurrentDone]=useState(false);
 const selectAction=(id:number)=>{setAction(id);setSelected(true);setCurrentDone(false);setReplay(n=>n+1);setPlayRequest(n=>n+1);};
 // Start with a random trajectory selected (after mount, so server and client render the same markup).
 useEffect(()=>{const frame=window.requestAnimationFrame(()=>selectAction(1+Math.floor(Math.random()*actions.length)));return()=>window.cancelAnimationFrame(frame);},[]);
 const chosen=outcomes.find(o=>o.id===outcome)!;
 return <div className="demo-shell integrated-demo">
  <div className="demo-topline"><h2>Latent-Space Disturbance for Robust Optimization in World Models</h2></div>
  <div className="demo-workspace">
   <div className="trajectory-selection"><p className="demo-task"><em>Serve a sunny-side-up egg without flipping it.</em></p><div className="action-observation"><img src={demo.initial} alt="Egg on the spatula before serving"/><svg viewBox="0 0 494 332" aria-label="Select a trajectory"><g transform="translate(0 -7)">{[...actions.filter(a=>a.id!==action),actions[action-1]].map(a=><g key={a.id}>
    <path d={a.path} fill="none" stroke={selected&&a.id===action?'#1c232b':'#eef0f2'} strokeOpacity={selected&&a.id===action?.55:.18} strokeWidth={selected&&a.id===action?4.5:2.6} strokeLinecap="round"/>
    <path d={a.path} fill="none" stroke={selected&&a.id===action?actionColor(a.id):'#e5e8eb'} strokeOpacity={selected&&a.id===action?1:.9} strokeWidth={selected&&a.id===action?2.8:1.8} strokeLinecap="round"/>
    <path d={a.path} className="trajectory-hit" fill="none" stroke="transparent" strokeWidth="14" role="button" tabIndex={0} aria-label={`Select action ${a.id}`} aria-pressed={selected&&a.id===action} onClick={()=>selectAction(a.id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selectAction(a.id);}}}/>
   </g>)}</g></svg></div><p className="demo-instruction">Click a trajectory to explore its imagined outcome.</p><p className="demo-verdict" style={{color:actionColor(action)}} aria-live="polite">{selected&&(actions[action-1].result==='success'?'Robust decision: remains successful even under the plausible worst-case outcome.':'Non-robust decision: the plausible worst-case outcome leads to failure.')}</p></div>
   <div className="demo-explorer">
    <div className="region-legend demo-top-legend"><span><i className="blue-swatch"/>Predicted next latent state distribution</span><span><i className="green-swatch"/>Calibrated uncertainty set</span><span><i className="purple-swatch"/>Out-of-distribution</span></div>
    <div className="latent-panel"><div className="figure-headings"><h3>World Model Latent Space</h3><h3>Uncertainty Set of Latent Dynamics</h3></div><div className="latent-scene"><Drawing kind="scene" action={action} replay={replay}/>
    {outcomes.map((o,i)=><div key={o.id}><button className={`outcome-point ${o.id===outcome?'selected':''}`} style={{left:`${50+outcomePoint(action,o.id)[0]*50}%`,top:`${(outcomePoint(action,o.id)[1]*300+45)/4}%`}} onClick={()=>setOutcome(o.id)} aria-label={`Show ${o.label} outcome`} aria-pressed={o.id===outcome}/><button className="outcome-label" style={{left:`${outcomeLabels[i][0]/8}%`,top:`${outcomeLabels[i][1]/4}%`,color:o.color}} onClick={()=>setOutcome(o.id)} aria-pressed={o.id===outcome}>{o.short}</button></div>)}
    </div><div className="schematic-caption"><button onClick={()=>setReplay(n=>n+1)} aria-label="Replay latent-space animation">↻ Replay</button><span className="sr-only demo-explanation" aria-live="polite">ACTION {action} / {chosen.label.toUpperCase()}</span></div>
   </div>
   <div className="demo-players"><div className="current-state-player"><h3>Current state</h3><VideoPlayer key={`${action}-${playRequest}`} src={demo.original(action)} autoPlay={selected} loop={false} playbackRate={3} disabled={!selected} onEnded={()=>{if(selected)setCurrentDone(true);}} label="Current state"/></div><div className="imagined-state-player"><h3>WM imaginations</h3><VideoPlayer key={`${demo.video(action,outcome)}-${playRequest}-${currentDone}`} src={demo.video(action,outcome)} label={`Action ${action}, ${chosen.short}`} color={chosen.color} autoPlay={selected&&currentDone} loop={false} disabled={!selected}/><div className="imagination-selector" aria-label="Select WM imagination">{(['nominal','ours','ood'] as const).map(id=>{const option=outcomes.find(o=>o.id===id)!;return <button key={id} onClick={()=>setOutcome(id)} aria-pressed={outcome===id} style={{'--outcome-color':option.color} as React.CSSProperties}>{option.label}</button>;})}</div></div></div>
   </div>
  </div>
 </div>;
}
export function Method(){
 const [stage,setStage]=useState(0);
 return <section id="method" className="section"><div className="section-intro"><h2>How to construct an uncertainty set over latent dynamics?</h2></div><div className="method-layout"><div className="method-steps">{steps.map((s,i)=><button key={s.title} onClick={()=>setStage(i)} aria-pressed={stage===i} className={stage===i?'active':''} style={{'--step-color':s.color} as React.CSSProperties}><span className="step-number">{i+1}</span><span><strong>{s.title}</strong>{stage===i&&<span className="step-copy">{s.text}</span>}</span><span className="step-plus">{stage===i?'−':'+'}</span></button>)}</div><div className="method-visual"><div className="diagram method-diagram"><Drawing kind="method" action={1} stage={stage}/>{methodAnnotations(stage).map(a=><span className="latent-thumbnail" key={a.src} style={{left:`${a.image[0]/6}%`,top:`${a.image[1]/5.3}%`,'--image-color':a.color} as React.CSSProperties}><img src={asset(`/front_figure/${a.src}`)} alt={a.label}/><small>{a.label}</small></span>)}</div><p aria-live="polite">{steps[stage].detail}</p><div className="step-progress">{steps.map((s,i)=><button key={s.title} aria-label={`Method step ${i+1}`} onClick={()=>setStage(i)} aria-current={stage===i?'step':undefined} className={i===stage?'active':''}/>)}</div></div></div></section>;
}
