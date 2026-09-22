'use client';
import {forwardRef,useEffect,useImperativeHandle,useRef} from 'react';
import {Chart,registerables} from 'chart.js';
import {filterColor,frameAt,type Trace} from '../data/playback';
Chart.register(...registerables);
export type PlotHandle={paint:(time:number)=>void};
type Props={trace:Trace;fps:number;color:string;label:string;onSeek:(frame:number)=>void;onScrubStart:()=>void;onScrubEnd:()=>void};
export const ValuePlot=forwardRef<PlotHandle,Props>(function ValuePlot({trace,fps,color,label,onSeek,onScrubStart,onScrubEnd},handle){
 const container=useRef<HTMLDivElement>(null);
 const canvas=useRef<HTMLCanvasElement>(null),overlay=useRef<HTMLCanvasElement>(null),chart=useRef<Chart|null>(null),time=useRef(0),dragging=useRef(false);
 const paint=(t:number)=>{
  time.current=t;container.current?.setAttribute('aria-valuenow',String(t));container.current?.setAttribute('aria-valuetext',`${t.toFixed(2)} seconds`);const c=chart.current,o=overlay.current;if(!c||!o||!c.chartArea)return;
  const ratio=window.devicePixelRatio||1;
  if(o.width!==Math.round(c.width*ratio)||o.height!==Math.round(c.height*ratio)){o.width=Math.round(c.width*ratio);o.height=Math.round(c.height*ratio);}
  const ctx=o.getContext('2d');if(!ctx)return;ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,c.width,c.height);
  const f=frameAt(t,fps,trace.reachability.length),position=Math.min(trace.reachability.length-1,Math.max(0,t*fps)),i=Math.floor(position),fraction=position-i;
  const value=trace.reachability[i]+((trace.reachability[i+1]??trace.reachability[i])-trace.reachability[i])*fraction;
  const x=c.scales.x.getPixelForValue(t),y=c.scales.y.getPixelForValue(value);
  ctx.strokeStyle='#555';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,c.chartArea.top);ctx.lineTo(x,c.chartArea.bottom);ctx.stroke();ctx.beginPath();ctx.arc(x,y,4,0,Math.PI*2);ctx.fillStyle=filterColor(trace,f,color);ctx.fill();

 };
 useImperativeHandle(handle,()=>({paint}));
 useEffect(()=>{
  const count=trace.reachability.length;
  const c=new Chart(canvas.current!,{type:'line',data:{datasets:[
   {label:'Value',data:trace.reachability.map((y,i)=>({x:i/fps,y})),borderColor:'#222',borderWidth:2,pointRadius:0,segment:{borderColor:ctx=>filterColor(trace,ctx.p0DataIndex,color)}},
   ...(trace.robust_reachability?[{label:'Robust reference',data:trace.robust_reachability.map((y,i)=>({x:i/fps,y})),borderColor:'#edb668',borderDash:[4,4],borderWidth:2,pointRadius:0}]:[]),
  ]},options:{responsive:true,maintainAspectRatio:false,animation:false,parsing:false,normalized:true,interaction:{mode:'nearest',axis:'x',intersect:false},plugins:{legend:{display:false},tooltip:{callbacks:{title:items=>`${items[0]?.parsed.x?.toFixed(2)} s`,label:item=>`${item.dataset.label}: ${item.parsed.y?.toFixed(5)}`}}},scales:{x:{type:'linear',min:0,max:(count-1)/fps,title:{display:true,text:'Time (s)'},grid:{display:false},ticks:{maxTicksLimit:7}},y:{suggestedMin:-.1,suggestedMax:.1,title:{display:true,text:'Safety value'},border:{display:false},ticks:{maxTicksLimit:5},grid:{color:'#eee'}}}},plugins:[{id:'zero-line',afterDraw(c){const ctx=c.ctx,{left,right}=c.chartArea;const zero=c.scales.y.getPixelForValue(0);ctx.save();ctx.strokeStyle='#666';ctx.setLineDash([2,4]);ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(left,zero);ctx.lineTo(right,zero);ctx.stroke();ctx.restore();paint(time.current);}}]});
  chart.current=c;paint(time.current);return()=>{c.destroy();chart.current=null;};
 },[trace,fps,color]);
 const seek=(event:React.PointerEvent)=>{const c=chart.current;if(!c)return;const rect=c.canvas.getBoundingClientRect();if(!rect.width)return;const x=(event.clientX-rect.left)*c.width/rect.width;onSeek((c.scales.x.getValueForPixel(x)??0)*fps);};
 return <div ref={container} className="value-plot" role="slider" tabIndex={0} aria-label={`${label} playback position`} aria-valuemin={0} aria-valuemax={(trace.reachability.length-1)/fps} aria-valuenow={0} onKeyDown={e=>{const delta=e.shiftKey?10:1;const frame=time.current*fps;const next=e.key==='Home'?0:e.key==='End'?trace.reachability.length-1:e.key==='ArrowRight'?frame+delta:e.key==='ArrowLeft'?frame-delta:null;if(next!==null){e.preventDefault();onScrubStart();onSeek(next);}}} onKeyUp={e=>{if(['Home','End','ArrowLeft','ArrowRight'].includes(e.key))onScrubEnd();}} onBlur={onScrubEnd} onPointerDown={e=>{if(e.button!==0)return;dragging.current=true;e.currentTarget.setPointerCapture?.(e.pointerId);onScrubStart();seek(e);}} onPointerMove={e=>{if(dragging.current)seek(e);}} onPointerUp={()=>{if(dragging.current){dragging.current=false;onScrubEnd();}}} onPointerCancel={()=>{dragging.current=false;onScrubEnd();}}><canvas ref={canvas} role="img" aria-label={`${label}. Drag to seek, or use the arrow keys. Home and End jump to the start and end.`}/><canvas ref={overlay} className="plot-cursor" aria-hidden="true"/><div className="sr-only"><table><caption>{label}</caption><thead><tr><th>Time (s)</th><th>Value</th><th>Filtered</th>{trace.robust_reachability&&<th>Robust Safety Value (Reference)</th>}</tr></thead><tbody>{trace.reachability.map((v,i)=><tr key={i}><td>{i/fps}</td><td>{v}</td><td>{trace.is_filtered[i]}</td>{trace.robust_reachability&&<td>{trace.robust_reachability[i]}</td>}</tr>)}</tbody></table></div></div>;
});
