'use client';
import {useEffect,useRef,useState} from 'react';
import {colors,trajectoryRoots} from '../data/content';
import {filterColor,frameAt,nextRandom,companionAdjustment,type Trace} from '../data/playback';
import {ValuePlot,type PlotHandle} from './ValuePlot';
type Panel={label:string;videos:string[];trace?:Trace;color:string;cameraLayout?:'stacked'|'side-by-side'};
export function SyncedPlayer({panels,fps,nSteps,autoPlay=true,defaultSpeed=1}:{panels:Panel[];fps:number;nSteps:number;autoPlay?:boolean;defaultSpeed?:number}){
 const root=useRef<HTMLDivElement>(null),visible=useRef(typeof IntersectionObserver==='undefined');
 const videos=useRef<(HTMLVideoElement|null)[]>([]),plots=useRef<(PlotHandle|null)[]>([]),borders=useRef<(HTMLDivElement|null)[]>([]);
 const slider=useRef<HTMLInputElement>(null),output=useRef<HTMLOutputElement>(null),clock=useRef(0),wanted=useRef(autoPlay),dragging=useRef(false),pending=useRef(false),alive=useRef(true),generation=useRef(0);
 const [playing,setPlaying]=useState(false),[ready,setReady]=useState(false),[failed,setFailed]=useState(false),[error,setError]=useState(''),[speed,setSpeed]=useState(defaultSpeed);
 const all=()=>videos.current.filter((v):v is HTMLVideoElement=>!!v);
 const paint=(time:number)=>{
  const t=Math.max(0,Math.min((nSteps-1)/fps,time)),frame=frameAt(t,fps,nSteps);clock.current=t;
  if(slider.current)slider.current.value=String(t*fps);
  if(output.current)output.current.textContent=`${t.toFixed(2)} / ${((nSteps-1)/fps).toFixed(2)} s`;
  panels.forEach((p,i)=>{plots.current[i]?.paint(t);if(borders.current[i]){borders.current[i]!.style.borderColor=p.trace?filterColor(p.trace,frame,p.color):p.color;borders.current[i]!.dataset.filtered=String(!!p.trace?.is_filtered[frame]);}});
 };
 const pause=()=>{all().forEach(v=>{v.pause();v.playbackRate=speed;});setPlaying(false);};
 const play=async(userInitiated=false)=>{
  // Mobile browsers may preload only metadata. play() must be able to request
  // the first frame, including directly within a user's tap.
  if((!visible.current&&!userInitiated)||pending.current||!wanted.current||dragging.current||!alive.current||failed||all().some(v=>(!userInitiated&&v.readyState<1)||v.seeking))return;
  if(all().every(v=>!v.paused))return;
  pending.current=true;const token=generation.current;all().forEach(v=>v.playbackRate=speed);
  const results=await Promise.allSettled(all().map(v=>v.play()));pending.current=false;
  if(!alive.current||generation.current!==token||!wanted.current||dragging.current){all().forEach(v=>v.pause());if(alive.current&&wanted.current&&!dragging.current)void play();return;}
  if(results.some(r=>r.status==='rejected')){wanted.current=false;pause();setError('Press play to retry.');}else{setPlaying(true);setError('');}
 };
 const seekTo=(frame:number)=>{const t=Math.max(0,Math.min((nSteps-1)/fps,frame/fps));paint(t);all().forEach(v=>{v.currentTime=t;});};
 const begin=()=>{if(dragging.current)return;dragging.current=true;generation.current++;pause();};
 const end=()=>{dragging.current=false;if(wanted.current)void play();};
 const repeat=()=>{if(!wanted.current||dragging.current)return;generation.current++;pause();seekTo(0);void play();};
 const markReady=()=>{const usable=all().length===panels.reduce((n,p)=>n+p.videos.length,0)&&all().every(v=>v.readyState>=1);setReady(usable);if(usable&&wanted.current&&!dragging.current)void play();};
 useEffect(()=>{markReady();paint(0);},[]);
 useEffect(()=>{if(typeof IntersectionObserver==='undefined')return;const observer=new IntersectionObserver(([entry])=>{visible.current=entry.isIntersecting;if(visible.current){if(wanted.current)void play();}else pause();},{rootMargin:'120px'});if(root.current)observer.observe(root.current);return()=>observer.disconnect();},[speed]);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;wanted.current=false;generation.current++;all().forEach(v=>v.pause());};},[]);
 useEffect(()=>{
  if(!playing)return;let raf=0,lastSync=0;
  const tick=(now:number)=>{const primary=videos.current[0];if(primary&&!primary.paused&&!dragging.current){
   paint(primary.currentTime);
   if(now-lastSync>250){lastSync=now;all().slice(1).forEach(v=>{if(v.seeking)return;const adjustment=companionAdjustment(primary.currentTime,v.currentTime,speed,fps);v.playbackRate=adjustment.rate;if(adjustment.seek!==null)v.currentTime=adjustment.seek;});}
  }raf=window.requestAnimationFrame(tick);};
  if(window.requestAnimationFrame)raf=window.requestAnimationFrame(tick);return()=>window.cancelAnimationFrame?.(raf);
 },[playing,speed,fps,nSteps]);
 let index=0;
 return <div ref={root} className={`synced-player ${panels.some(p=>p.trace)?'with-plots':'comparison-videos'}`}><div className={`synced-panels ${panels.length===1?'single':''}`}>{panels.map((panel,p)=><div className="synced-panel" key={panel.label}><h4 style={{color:panel.color}}>{panel.label}</h4><div ref={el=>{borders.current[p]=el;}} className="camera-pair" data-filtered={String(!!panel.trace?.is_filtered[frameAt(clock.current,fps,nSteps)])} style={{borderColor:panel.trace?filterColor(panel.trace,frameAt(clock.current,fps,nSteps),panel.color):panel.color}}>{panel.videos.map((src,view)=>{const i=index++;return <div className={`camera-view ${panel.cameraLayout==='side-by-side'?'camera-layout-side-by-side':''}`} key={src}>{panel.videos.length>1?<span className="camera-legend">{`Camera ${view+1}`}</span>:<><span className="camera-legend">Camera 1</span><span className="camera-legend camera-second">Camera 2</span></>}<video ref={el=>{videos.current[i]=el;}} src={src} preload="auto" muted playsInline aria-label={panel.videos.length===1?`${panel.label}, Cameras 1 and 2`:`${panel.label}, Camera ${view+1}`} onLoadedMetadata={markReady} onLoadedData={markReady} onCanPlay={markReady} onSeeked={()=>{paint(clock.current);if(wanted.current&&!dragging.current)void play();}} onWaiting={e=>{if(wanted.current&&!pending.current&&!e.currentTarget.seeking&&!dragging.current){generation.current++;pause();}}} onError={()=>{wanted.current=false;generation.current++;pause();setReady(false);setFailed(true);setError('This video could not be loaded. Select another trajectory.');}} onEnded={()=>{if(i===0)repeat();}}/></div>;})}{panel.trace&&<span className="filter-badge" style={{background:panel.color}}>Safety Filtered</span>}</div>{panel.trace&&<ValuePlot ref={el=>{plots.current[p]=el;}} trace={panel.trace} fps={fps} color={panel.color} onSeek={seekTo} onScrubStart={begin} onScrubEnd={end} label={`${panel.label} safety value`}/>}</div>)}</div>
 <div className="timeline-controls"><button disabled={failed||playing} aria-label="Play synchronized videos" onClick={()=>{wanted.current=true;if(clock.current>=(nSteps-1)/fps)seekTo(0);void play(true);}}>▶ Play</button><button disabled={failed} aria-label="Stop synchronized videos" onClick={()=>{wanted.current=false;generation.current++;pause();}}>■ Stop</button><button disabled={!ready} onClick={()=>{generation.current++;pause();seekTo(0);wanted.current=true;void play();}}>↺ Restart</button>{!panels.some(p=>p.trace)&&<><label className="timeline"><span className="sr-only">Synchronized time</span><input ref={slider} type="range" min="0" max={nSteps-1} step="any" defaultValue="0" disabled={!ready} onPointerDown={begin} onPointerUp={end} onPointerCancel={end} onKeyDown={e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key))begin();}} onKeyUp={end} onInput={e=>seekTo(Number(e.currentTarget.value))}/></label><output ref={output}>0.00 / {((nSteps-1)/fps).toFixed(2)} s</output></>}<select className="playback-speed" aria-label="Playback speed" value={speed} onChange={e=>{const rate=Number(e.target.value);setSpeed(rate);all().forEach(v=>v.playbackRate=rate);}}>{[.5,1,1.5,2].map(v=><option key={v} value={v}>{v}×</option>)}</select></div>{error&&<p className="media-error" role="status">{error}</p>}</div>;
}
type HardwareEntry={id:number;name:string;outcome:string;n_steps:number;data:string;video:Record<string,string>};
type SimEntry={tag:string;graphs_json:string;n_steps:number;fps:number;nominal_outcome:string;robust_outcome:string};
type Loaded={panels:Panel[];fps:number;nSteps:number};
export function TrajectoryBrowser({kind}:{kind:'robust'|'nominal'|'simulation'}){
 const base=trajectoryRoots[kind];
 const [entries,setEntries]=useState<(HardwareEntry|SimEntry)[]>([]),[selected,setSelected]=useState(0),[loaded,setLoaded]=useState<Loaded|null>(null),[error,setError]=useState('');
 useEffect(()=>{const abort=new AbortController();fetch(`${base}/index.json`,{signal:abort.signal}).then(r=>{if(!r.ok)throw Error();return r.json();}).then(d=>setEntries((d as {trajectories:(HardwareEntry|SimEntry)[]}).trajectories)).catch(e=>{if(e.name!=='AbortError')setError('Trajectory list unavailable.');});return()=>abort.abort();},[base]);
 useEffect(()=>{if(!entries.length)return;const abort=new AbortController();setLoaded(null);setError('');const entry=entries[selected];const path='tag'in entry?entry.graphs_json:entry.data;
  fetch(`${base}/${path}`,{signal:abort.signal}).then(r=>{if(!r.ok)throw Error();return r.json();}).then(raw=>{
   const d=raw as {fps:number;n_steps:number;signals:Trace;nominal:Trace;robust:Trace};
   if('tag'in entry){setLoaded({fps:entry.fps,nSteps:entry.n_steps,panels:(['nominal','robust'] as const).map(condition=>({label:condition==='nominal'?'Nominal':'Robust',color:condition==='nominal'?colors.nominal:colors.ours,trace:d[condition],videos:['front','wrist'].map(view=>`${base}/${entry.tag}_${condition}_${view}.mp4`)}))});}
   else setLoaded({fps:d.fps,nSteps:d.n_steps,panels:[{label:kind==='robust'?'Robust safety filter':'Nominal safety filter',color:kind==='robust'?colors.ours:colors.nominal,trace:d.signals,videos:Object.values(entry.video).map(path=>`${base}/${path}`)}]});
  }).catch(e=>{if(e.name!=='AbortError')setError('Trajectory data unavailable.');});return()=>abort.abort();
 },[base,entries,selected,kind]);
 return <div className="trajectory-browser"><div className="trajectory-toolbar"><div className="trajectory-picker"><button aria-label="Previous trajectory" disabled={entries.length<2} onClick={()=>setSelected(i=>(i-1+entries.length)%entries.length)}>‹</button><span aria-live="polite">Trajectory {selected+1} / {entries.length||'…'}</span><button aria-label="Next trajectory" disabled={entries.length<2} onClick={()=>setSelected(i=>(i+1)%entries.length)}>›</button></div><button disabled={entries.length<2} onClick={()=>setSelected(i=>nextRandom(i,entries.length))}>⇄ Shuffle</button></div>{loaded?<SyncedPlayer key={`${kind}-${selected}`} {...loaded}/>:<p className="loading-media" role="status">{error||'Loading trajectory…'}</p>}<div className="trace-legend"><span><i style={{background:'#222'}}/>Not Filtered</span>{kind!=='robust'&&<span><i style={{background:colors.nominal}}/>Nominal Safety Filter Active</span>}{kind!=='nominal'&&<span><i style={{background:colors.ours}}/>Robust Safety Filter Active</span>}{kind==='nominal'&&<span><i className="reference-line"/>Robust Safety Value (Reference)</span>}<span>··· Zero threshold</span></div></div>;
}
