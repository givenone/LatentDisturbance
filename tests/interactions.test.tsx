import assert from 'node:assert/strict';
import test from 'node:test';
import React, {act} from 'react';
import {JSDOM} from 'jsdom';
import {Demo, Method} from '../app/components/Demo';
import {SyncedPlayer} from '../app/components/TrajectoryPlayer';
import {VideoPlayer} from '../app/components/VideoPlayer';
import {PaperPage} from '../app/components/PaperPage';
import {renderToStaticMarkup} from 'react-dom/server';
import {Results} from '../app/components/Results';
import {Formulation} from '../app/components/Formulation';
import {demo} from '../app/data/content';
import {frameAt,timeAt,filterColor,nextRandom,companionAdjustment} from '../app/data/playback';
const dom=new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>',{url:'http://localhost/'});
Object.assign(globalThis,{window:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement,HTMLCanvasElement:dom.window.HTMLCanvasElement,MutationObserver:dom.window.MutationObserver,ResizeObserver:class{observe(){}disconnect(){}},React,IS_REACT_ACT_ENVIRONMENT:true});
const {createRoot}=await import('react-dom/client');
const context=new Proxy({}, {get(_target,key){return key==='createRadialGradient'?()=>({addColorStop(){}}):()=>{};},set(){return true;}});
Object.defineProperty(dom.window.HTMLCanvasElement.prototype,'getContext',{value:function(){const thisCanvas=this;return new Proxy(context,{get(target,key){if(key==='canvas')return thisCanvas; if(key==='measureText')return (value:string)=>({width:String(value).length*6});return Reflect.get(target,key);}});}});
let present=false;globalThis.fetch=async()=>new Response(null,{status:present?200:404,headers:{'content-type':present?'video/mp4':'text/html'}});
const host=document.getElementById('root')!;
const click=async(selector:string)=>{const button=host.querySelector(selector) as HTMLButtonElement;assert.ok(button,selector);await act(async()=>button.dispatchEvent(new dom.window.MouseEvent('click',{bubbles:true})));};
test('all 21 action/outcome combinations preserve selection without action buttons',async()=>{
 const root=createRoot(host);await act(async()=>{root.render(<Demo/>);});
 assert.equal(host.querySelectorAll('.trajectory-hit[aria-pressed=true]').length,0);
 assert.equal(host.querySelectorAll('.action-observation path[stroke="#e5e8eb"]').length,7);
 assert.equal(host.querySelector('.trajectory-caption'),null);
 for(const action of [1,2,3,4,5,6,7]){
  await click(`[aria-label="Select action ${action}"]`);
  for(const outcome of ['Nominal','OOD','Pessimistic']){
   await click(`[aria-label="Show ${outcome} outcome"]`);
   assert.match(host.querySelector('.demo-explanation')!.textContent!,new RegExp(`ACTION ${action} / ${outcome.toUpperCase()}`));
   assert.equal(host.querySelector(`[aria-label="Show ${outcome} outcome"]`)!.getAttribute('aria-pressed'),'true');
   assert.equal(host.querySelector('.imagined-state-player video')!.getAttribute('src'),demo.video(action,outcome==='Nominal'?'nominal':outcome==='OOD'?'ood':'ours'));
   assert.equal(host.querySelectorAll('video').length,2);
   assert.equal(host.querySelectorAll('.action-selector button').length,0);
  }
 }
 await click('[aria-label="Select action 1"]');
 assert.match(host.querySelector('.demo-explanation')!.textContent!,/ACTION 1 \/ PESSIMISTIC/);
 await act(async()=>root.unmount());
});
test('method steps expose each explanation',async()=>{
 const root=createRoot(host);await act(async()=>root.render(<Method/>));
 assert.equal(host.querySelectorAll('.latent-thumbnail').length,3);
 assert.ok(host.querySelector('img[src="/front_figure/z_t.png"]'));
 assert.ok(host.querySelector('img[src="/front_figure/z_t+1_1.png"]'));
 assert.ok(host.querySelector('img[src="/front_figure/z_t+1_2.png"]'));
 for(let i=1;i<=5;i++) {await click(`[aria-label="Method step ${i}"]`);assert.equal(host.querySelector(`[aria-label="Method step ${i}"]`)!.getAttribute('aria-current'),'step');assert.ok(host.querySelector('.step-copy')!.textContent!.length>20);}
 assert.ok(host.querySelector('img[src="/front_figure/z_ood.png"]'));
 assert.ok(host.querySelector('img[src="/front_figure/z_pessimistic.png"]'));
 await act(async()=>root.unmount());
});

test('shared playback seeks all four videos and both plots to the same frame',async()=>{
 let plays=0;
 dom.window.HTMLMediaElement.prototype.play=async function(){plays++;Object.defineProperty(this,'paused',{configurable:true,value:false});};
 dom.window.HTMLMediaElement.prototype.pause=function(){Object.defineProperty(this,'paused',{configurable:true,value:true});};
 const root=createRoot(host);
 const trace={reachability:[.3,.1,-.2,.4],is_filtered:[0,0,1,0]};
 const panels=[{label:'Nominal',videos:['/n1.mp4','/n2.mp4'],trace,color:'#0048a6'},{label:'Robust',videos:['/r1.mp4','/r2.mp4'],trace,color:'#ff9500'}];
 await act(async()=>root.render(<SyncedPlayer autoPlay={false} panels={panels} fps={10} nSteps={4}/>));
 assert.equal((host.querySelector('.timeline-controls button') as HTMLButtonElement).disabled,true);
 const clips=[...host.querySelectorAll('video')];
 await act(async()=>{clips.forEach(v=>{Object.defineProperty(v,'readyState',{configurable:true,value:4});v.dispatchEvent(new dom.window.Event('loadeddata',{bubbles:true}));});});
 await click('[aria-label="Play synchronized videos"]');assert.equal(plays,4);
 await click('[aria-label="Stop synchronized videos"]');
 assert.equal(host.querySelector('input[type=range]'),null);
 const plot=host.querySelector('.value-plot')!;
 await act(async()=>{for(let i=0;i<2;i++)plot.dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));plot.dispatchEvent(new dom.window.KeyboardEvent('keyup',{key:'ArrowRight',bubbles:true}));});
 assert.equal(host.querySelectorAll('.camera-pair[data-filtered=true]').length,2);
 assert.equal(host.querySelectorAll('.filter-badge').length,2);
 assert.match(host.textContent!,/Camera 1/);assert.doesNotMatch(host.textContent!,/Wrist Camera|Front Camera/);
 clips.forEach(v=>assert.equal(v.currentTime,.2));
 assert.equal(host.querySelectorAll('.value-readout').length,0);
 assert.equal(host.querySelectorAll('.plot-cursor').length,2);
 assert.equal(host.querySelectorAll('.camera-pair')[0].getAttribute('style'),'border-color: rgb(0, 72, 166);');
 assert.equal(host.querySelectorAll('.camera-pair')[1].getAttribute('style'),'border-color: rgb(255, 149, 0);');
 await click('.timeline-controls button:nth-child(3)');clips.forEach(v=>assert.equal(v.currentTime,0));
 await act(async()=>root.unmount());
});
test('time mapping, recorded filtering flags, and shuffle preserve alignment',()=>{
 assert.equal(frameAt(.124,20,100),2);assert.equal(frameAt(100,20,100),99);
 assert.equal(timeAt(999,10,60),5.9);assert.equal(timeAt(-1,20,60),0);
 const trace={reachability:[-.5,.5],is_filtered:[0,1]};
 assert.equal(filterColor(trace,0,'orange'),'#222222');assert.equal(filterColor(trace,1,'orange'),'orange');
 for(let i=0;i<10;i++)assert.notEqual(nextRandom(i,10,()=>.5),i);
});

test('animation restarts on action changes and replay; pending frames cancel on unmount',async()=>{
 const frames=new Map<number,FrameRequestCallback>();let next=1;
 dom.window.requestAnimationFrame=callback=>{const id=next++;frames.set(id,callback);return id;};
 dom.window.cancelAnimationFrame=id=>{frames.delete(id);};
 const root=createRoot(host);await act(async()=>root.render(<Demo/>));
 assert.equal(host.querySelector('.latent-scene')!.getAttribute('data-zoom-ready'),'false');
 assert.equal(frames.size,1);
 const tick=async(offset:number)=>{await act(async()=>{const callbacks=[...frames.values()];frames.clear();callbacks.forEach(cb=>cb(performance.now()+offset));});};
 await tick(1800);assert.equal(host.querySelector('.latent-scene')!.getAttribute('data-zoom-ready'),'true');
 await click('[aria-label="Select action 2"]');assert.equal(frames.size,1);
 assert.equal(host.querySelector('.latent-scene')!.getAttribute('data-zoom-ready'),'false');
 await click('[aria-label="Select action 3"]');assert.equal(frames.size,1);
 await tick(1800);
 await click('[aria-label="Replay latent-space animation"]');assert.equal(frames.size,1);
 await act(async()=>root.unmount());assert.equal(frames.size,0);
});

test('trimmed custom player starts at zero, loops, omits timestamps, and handles missing media',async()=>{
 const root=createRoot(host);
 await act(async()=>root.render(<VideoPlayer src="/front_figure/1_fail/current.mp4" label="Initial clip" autoPlay={false}/>));
 const v=host.querySelector('video')!;
 Object.defineProperty(v,'duration',{configurable:true,value:12});
 await act(async()=>v.dispatchEvent(new dom.window.Event('loadedmetadata',{bubbles:true})));
 assert.equal(v.currentTime,0);assert.equal((host.querySelector('input') as HTMLInputElement).value,'0');
 assert.equal(v.paused,true);assert.equal(host.querySelector('output'),null);assert.equal(v.loop,true);
 assert.equal(v.hasAttribute('controls'),false);
 await act(async()=>v.dispatchEvent(new dom.window.Event('error',{bubbles:true})));
 assert.match(host.textContent!,/Video unavailable/);assert.equal((host.querySelector('button') as HTMLButtonElement).disabled,true);
 await act(async()=>root.unmount());
});
test('equations have rendered HTML and accessible MathML, without raw TeX or errors',async()=>{
 const root=createRoot(host);await act(async()=>root.render(<Formulation/>));
 assert.equal(host.querySelectorAll('.katex').length,2);assert.equal(host.querySelectorAll('math').length,2);assert.equal(host.querySelectorAll('.katex-error').length,0);
 assert.ok(host.querySelector('[style*="background-color"]'));assert.equal(host.querySelector('.equation-key'),null);
 assert.match(host.querySelector('h2')!.textContent!,/How can we make robust decisions/);
 await act(async()=>root.unmount());
});
test('continuous playhead does not redraw charts or repeatedly seek companion videos',async()=>{
 const callbacks=new Map<number,FrameRequestCallback>();let id=0;
 dom.window.requestAnimationFrame=fn=>{callbacks.set(++id,fn);return id;};dom.window.cancelAnimationFrame=n=>{callbacks.delete(n);};
 const root=createRoot(host),trace={reachability:[.3,.1,-.2,.4],is_filtered:[0,0,1,0]};
 await act(async()=>root.render(<SyncedPlayer autoPlay={false} panels={[{label:'Test',videos:['/a.mp4','/b.mp4'],trace,color:'#ff9500'}]} fps={10} nSteps={4}/>));
 const clips=[...host.querySelectorAll('video')];
 await act(async()=>clips.forEach(v=>{Object.defineProperty(v,'readyState',{configurable:true,value:4});v.dispatchEvent(new dom.window.Event('loadeddata'));}));
 const {Chart}=await import('chart.js');const chart=Chart.getChart(host.querySelector('canvas')!)!;let redraws=0;
 const originalDraw=chart.draw.bind(chart);chart.draw=()=>{redraws++;originalDraw();};
 await click('[aria-label="Play synchronized videos"]');clips[0].currentTime=.12;clips[1].currentTime=.10;
 await act(async()=>{const ticks=[...callbacks.values()];callbacks.clear();ticks.forEach(fn=>fn(1000));});
 assert.equal(host.querySelector('.value-plot')!.getAttribute('aria-valuenow'),'0.12');
 assert.equal(clips[1].currentTime,.10,'small drift must not cause a seek');
 assert.ok(clips[1].playbackRate>1);assert.equal(redraws,0);
 assert.equal(companionAdjustment(1,.97,1,20).seek,null);assert.equal(companionAdjustment(1,.5,1,20).seek,1);
 await act(async()=>root.unmount());assert.equal(callbacks.size,0);
});
test('scrubbing while play is still loading restores playback after the pending request',async()=>{
 const resolves:Array<()=>void>=[];let calls=0;
 dom.window.HTMLMediaElement.prototype.play=function(){Object.defineProperty(this,'paused',{configurable:true,value:false});calls++;return calls<=2?new Promise<void>(resolve=>resolves.push(resolve)):Promise.resolve();};
 const root=createRoot(host),trace={reachability:[.2,-.1,.4],is_filtered:[0,1,0]};
 await act(async()=>root.render(<SyncedPlayer autoPlay={false} panels={[{label:'Test',videos:['/a.mp4','/b.mp4'],trace,color:'#ff9500'}]} fps={10} nSteps={3}/>));
 const clips=[...host.querySelectorAll('video')];
 await act(async()=>clips.forEach(v=>{Object.defineProperty(v,'readyState',{configurable:true,value:4});v.dispatchEvent(new dom.window.Event('loadeddata'));}));
 await click('[aria-label="Play synchronized videos"]');assert.equal(calls,2);
 const slider=host.querySelector('.value-plot')!;
 await act(async()=>slider.dispatchEvent(new dom.window.MouseEvent('pointerdown',{bubbles:true})));
 await act(async()=>slider.dispatchEvent(new dom.window.MouseEvent('pointerup',{bubbles:true})));
 await act(async()=>resolves.forEach(resolve=>resolve()));
 assert.equal(calls,4);assert.equal((host.querySelector('[aria-label="Play synchronized videos"]') as HTMLButtonElement).disabled,true);assert.ok(clips.every(v=>!v.paused));
 await act(async()=>root.unmount());
});

test('one controller synchronizes an imagination pair and automatically repeats both clips',async()=>{
 dom.window.HTMLMediaElement.prototype.play=async function(){Object.defineProperty(this,'paused',{configurable:true,value:false});};
 const root=createRoot(host);
 await act(async()=>root.render(<SyncedPlayer autoPlay={true} panels={[{label:'Nominal Imagination',videos:['/n.mp4'],color:'#0048a6'},{label:'Pessimistic Imagination',videos:['/p.mp4'],color:'#ff9500'}]} fps={30} nSteps={93}/>));
 const clips=[...host.querySelectorAll('video')];
 await act(async()=>clips.forEach(v=>{Object.defineProperty(v,'readyState',{configurable:true,value:4});v.dispatchEvent(new dom.window.Event('loadeddata'));}));
 assert.ok(clips.every(v=>!v.paused));assert.equal(host.querySelectorAll('.timeline-controls').length,1);assert.equal(host.querySelectorAll('canvas').length,0);
 const range=host.querySelector('input')!;
 await act(async()=>{Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype,'value')!.set!.call(range,'23.7');range.dispatchEvent(new dom.window.Event('input',{bubbles:true}));});
 clips.forEach(v=>assert.equal(v.currentTime,23.7/30));
 await act(async()=>clips[0].dispatchEvent(new dom.window.Event('ended')));
 clips.forEach(v=>assert.equal(v.currentTime,0));assert.ok(clips.every(v=>!v.paused));
 await act(async()=>root.unmount());
});

test('simulation metrics keep one chart per experiment, independent base policies, and mean-only diagnostics',async()=>{
 const root=createRoot(host);await act(async()=>root.render(<Results kind="simulation"/>));
 assert.equal(host.querySelectorAll('.chart-card').length,3);assert.equal(host.querySelectorAll('details').length,0);
 const panels=[...host.querySelectorAll('.metric-panel')];
 assert.equal(panels[2].querySelector('.base-policy-selector button[aria-pressed=true]')!.textContent,'DreamerV3');
 const change=async(panel:Element,selector:string,text:string)=>{const button=[...panel.querySelectorAll(selector)].find(b=>b.textContent===text)!;assert.ok(button);await act(async()=>button.dispatchEvent(new dom.window.MouseEvent('click',{bubbles:true})));};
 await change(panels[2],'.base-policy-selector button','Diffusion Policy');
 assert.equal(panels[0].querySelector('.base-policy-selector button[aria-pressed=true]')!.textContent,'DreamerV3');
 assert.match(panels[2].querySelector('.result-explanation')!.textContent!,/Partial observations and model approximation/);
 for(const panel of panels){
  for(const metric of ['Safety gain ↑','Conditional failure ↓']){
   await change(panel,'.metric-selector button',metric);
   assert.equal(panel.querySelectorAll('.chart-card').length,1);
   assert.match(panel.querySelector('.metric-definition')!.textContent!,/reported means/);
   assert.doesNotMatch(panel.querySelector('.chart-card')!.textContent!,/confidence|95%|bounds/);
   assert.equal(panel.querySelectorAll('.chart-values button').length,5);
  }
 }
 await act(async()=>root.unmount());
});

test('cached video metadata enables controls even when it arrives before hydration',async()=>{
 const proto=dom.window.HTMLMediaElement.prototype;
 const ready=Object.getOwnPropertyDescriptor(proto,'readyState')!,duration=Object.getOwnPropertyDescriptor(proto,'duration')!;
 Object.defineProperty(proto,'readyState',{configurable:true,get:()=>4});
 Object.defineProperty(proto,'duration',{configurable:true,get:()=>9.9});
 const root=createRoot(host);
 try{
  await act(async()=>root.render(<VideoPlayer src="/cached.mp4" label="Cached video" autoPlay={false}/>));
  assert.equal((host.querySelector('button') as HTMLButtonElement).disabled,false);
  assert.equal((host.querySelector('input') as HTMLInputElement).max,'9.9');
 }finally{
  await act(async()=>root.unmount());Object.defineProperty(proto,'readyState',ready);Object.defineProperty(proto,'duration',duration);
 }
});

test('trajectory clicks autoplay once, hold the final frame, and preserve imagination selection',async()=>{
 const root=createRoot(host);await act(async()=>root.render(<Demo/>));
 assert.equal(host.querySelector('.imagination-selector button[aria-pressed=true]')!.textContent,'Nominal');
 await click('.imagination-selector button:nth-child(2)');
 assert.equal(host.querySelector('[aria-label="Show Pessimistic outcome"]')!.getAttribute('aria-pressed'),'true');
 await click('[aria-label="Select action 2"]');
 let v=host.querySelector('.current-state-player video') as HTMLVideoElement;
 assert.equal(v.autoplay,true);assert.equal(v.loop,false);
 assert.equal(host.querySelector('.imagination-selector button[aria-pressed=true]')!.textContent,'Pessimistic');
 Object.defineProperty(v,'duration',{configurable:true,value:8});v.currentTime=8;
 await act(async()=>v.dispatchEvent(new dom.window.Event('loadedmetadata')));
 await act(async()=>{v.dispatchEvent(new dom.window.Event('play'));v.dispatchEvent(new dom.window.Event('ended'));});
 assert.equal(v.currentTime,8);assert.equal((host.querySelector('.current-state-player input') as HTMLInputElement).value,'8');
 assert.ok(host.querySelector('[aria-label="Play Current state"]'));
 await click('[aria-label="Select action 2"]');
 const restarted=host.querySelector('.current-state-player video') as HTMLVideoElement;
 assert.notEqual(v,restarted);assert.equal(restarted.autoplay,true);assert.equal(restarted.currentTime,0);
 await click('[aria-label="Show OOD outcome"]');
 assert.equal(host.querySelector('.imagination-selector button[aria-pressed=true]')!.textContent,'OOD');
 await act(async()=>root.unmount());
});
test('paper identity and resource placeholders precede monochrome takeaway cards',()=>{
 const html=renderToStaticMarkup(<PaperPage/>),page=new JSDOM(html).window.document;
 assert.equal(page.querySelector('h1')!.textContent,'Modeling Latent Disturbances for Robust Decision-Making in World Models');
 assert.equal(page.querySelector('.authors a')!.getAttribute('href'),'https://junwon.me/');
 assert.equal(page.querySelectorAll('.authors a')[1].getAttribute('href'),'https://www.cs.cmu.edu/~abajcsy/');
 assert.equal(page.querySelectorAll('.paper-resources button[disabled]').length,2);
 assert.equal(page.querySelector('.hero')!.nextElementSibling!.className,'paper-summary');
 assert.equal(page.querySelectorAll('.paper-benefits article').length,3);
 assert.equal(page.querySelectorAll('.paper-benefits small').length,0);
});
test('safety gain has consistent decimal ticks, a visible zero, and room for negative and positive values',async()=>{
 const root=createRoot(host);await act(async()=>root.render(<Results kind="simulation"/>));
 const {Chart}=await import('chart.js');
 for(const panel of host.querySelectorAll('.metric-panel')){
  const button=[...panel.querySelectorAll('.metric-selector button')].find(b=>b.textContent==='Safety gain ↑')!;
  await act(async()=>button.dispatchEvent(new dom.window.MouseEvent('click',{bubbles:true})));
  const chart=Chart.getChart(panel.querySelector('canvas')!)!;
  assert.equal(chart.options.scales!.y!.min,-.2);assert.equal(chart.options.scales!.y!.max,.3);
  const ticks=chart.options.scales!.y!.ticks!;
  assert.ok('stepSize' in ticks);assert.equal(ticks.stepSize,.1);
  assert.equal(ticks.callback!.call(chart.scales.y,.30000000000000004,0,[]),'0.3');
  assert.equal(ticks.callback!.call(chart.scales.y,-.000000000000001,0,[]),'0.0');
  chart.data.datasets[0].data.forEach(v=>assert.ok(Number(v)>=-.2&&Number(v)<=.3));
 }
 await act(async()=>root.unmount());
});
