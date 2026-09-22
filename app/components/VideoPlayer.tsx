'use client';
import {useEffect,useRef,useState} from 'react';

export function VideoPlayer({src,label,color='#555',autoPlay=true,loop=true,playbackRate=1,onEnded}:{src:string;label:string;color?:string;autoPlay?:boolean;loop?:boolean;playbackRate?:number;onEnded?:()=>void}){
 const video=useRef<HTMLVideoElement>(null),slider=useRef<HTMLInputElement>(null),seeking=useRef(false),resume=useRef(false);
 const [duration,setDuration]=useState(0),[playing,setPlaying]=useState(false),[ready,setReady]=useState(false),[failed,setFailed]=useState(false);
 useEffect(()=>{const v=video.current;if(v&&v.readyState>=1){setDuration(v.duration);setReady(true);}},[src]);
 useEffect(()=>{const v=video.current;if(v){v.defaultPlaybackRate=playbackRate;v.playbackRate=playbackRate;}},[src,playbackRate]);
 const update=(time:number)=>{if(slider.current)slider.current.value=String(time);};
 useEffect(()=>{if(!playing)return;let raf=0;const tick=()=>{const v=video.current;if(v&&!v.paused&&!seeking.current)update(v.currentTime);raf=window.requestAnimationFrame(tick);};if(window.requestAnimationFrame)raf=window.requestAnimationFrame(tick);return()=>window.cancelAnimationFrame?.(raf);},[playing]);
 const play=()=>{if(video.current)void video.current.play().catch(()=>setPlaying(false));};
 const begin=()=>{resume.current=!!video.current&&!video.current.paused;seeking.current=true;video.current?.pause();};
 const end=()=>{seeking.current=false;if(resume.current)play();resume.current=false;};
 return <div className="paper-player" style={{'--player-color':color,borderColor:color} as React.CSSProperties}>
  <div className="paper-player-screen">{failed?<div className="media-placeholder">Video unavailable</div>:<video ref={video} src={src} muted playsInline autoPlay={autoPlay} loop={loop} preload="auto" aria-label={label} onLoadedMetadata={e=>{e.currentTarget.playbackRate=playbackRate;setDuration(e.currentTarget.duration);update(0);setReady(true);}} onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)} onEnded={e=>{if(!loop){setPlaying(false);update(e.currentTarget.duration);}onEnded?.();}} onTimeUpdate={e=>{if(!seeking.current)update(e.currentTarget.currentTime);}} onError={()=>{setFailed(true);setReady(false);setPlaying(false);}}/>}</div>
  <div className="paper-player-controls"><button className="round-play" disabled={!ready} onClick={()=>{if(playing)video.current?.pause();else play();}} aria-label={`${playing?'Pause':'Play'} ${label}`}>{playing?'Ⅱ':'▶'}</button><input ref={slider} type="range" min="0" max={duration||1} step="any" defaultValue="0" disabled={!ready} aria-label={`${label} time`} onPointerDown={begin} onPointerUp={end} onPointerCancel={end} onKeyDown={e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)&&!seeking.current)begin();}} onKeyUp={end} onInput={e=>{const time=Number(e.currentTarget.value);if(video.current)video.current.currentTime=time;update(time);}}/></div>
 </div>;
}
