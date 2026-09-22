'use client';
import {useRef,useState} from 'react';
import {galleries} from '../data/content';
import {Placeholder,useMediaAvailable} from './Demo';
type Example = typeof galleries[number]['examples'][number];
function Pair({example}:{example:Example}) {
 const nominal=useMediaAvailable(example.nominal),ours=useMediaAvailable(example.ours);
 const refs=[useRef<HTMLVideoElement>(null),useRef<HTMLVideoElement>(null)];
 const [failed,setFailed]=useState<string[]>([]),[playing,setPlaying]=useState(false);
 const ready=nominal&&ours&&failed.length===0;
 async function control(action:'play'|'pause'|'restart') {
  const videos=refs.map(r=>r.current).filter((v):v is HTMLVideoElement=>!!v);
  if(action==='pause'){videos.forEach(v=>v.pause());setPlaying(false);return;}
  if(action==='restart') videos.forEach(v=>{v.currentTime=0;});
  else if(videos.length===2) videos[1].currentTime=videos[0].currentTime;
  const results=await Promise.allSettled(videos.map(v=>v.play()));
  if(results.some(r=>r.status==='rejected')) {videos.forEach(v=>v.pause());setPlaying(false);} else setPlaying(true);
 }
 return <article className="comparison"><div className="comparison-heading"><h4>{example.title}</h4><div className="playback"><button disabled={!ready} onClick={()=>control(playing?'pause':'play')}>{playing?'Ⅱ Pause':'▷ Play'}</button><button disabled={!ready} onClick={()=>control('restart')} aria-label={`Restart ${example.title}`}>↺</button></div></div><div className="video-pair">{(['nominal','ours'] as const).map((method,i)=><div className={`gallery-video ${method}`} key={method}><span className="video-tag">{method==='ours'?'Ours':'Nominal'}</span>{(i===0?nominal:ours)&&!failed.includes(method)?<video ref={refs[i]} src={example[method]} controls muted playsInline preload="metadata" onError={()=>setFailed(old=>[...old,method])} onEnded={()=>control('pause')} aria-label={`${example.title}: ${method}`}/>:<Placeholder>{method==='ours'?'Ours':'Nominal'}</Placeholder>}</div>)}</div>{example.caption && <p className="caption">{example.caption}</p>}</article>;
}
export function Gallery(){return <section id="videos" className="section"><div className="section-intro"><h2>Qualitative Results</h2></div>{galleries.map(g=><div className="gallery-group" key={g.id}><div className="subsection-title"><h3>{g.title}</h3><span>{g.subtitle}</span></div><div className="comparison-grid">{g.examples.map(e=><Pair example={e} key={e.title}/>)}</div></div>)}</section>;}
