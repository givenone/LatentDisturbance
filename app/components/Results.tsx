'use client';
import {useEffect,useRef,useState} from 'react';
import {Chart,registerables} from 'chart.js';
import hardware from '../data/hardware.json';
import {colors,methodColors,methodNames} from '../data/content';
import {simulation,type SimRow} from '../data/simulation';
import {wilson} from '../data/statistics';
import {Caption,Takeaways} from './ExperimentText';
Chart.register(...registerables);
Chart.defaults.font.family = "'Noto Sans', 'Segoe UI', system-ui, sans-serif";
type Datum={label:string;color:string;value:number;lower?:number;upper?:number;count?:string;reported?:string;sourceReported?:string};
const pct=(n:number)=>`${(n*100).toFixed(1).replace(/\.0$/,'')}%`;
function RateChart({title,subtitle,data,rate=true,controls}:{title:string;subtitle:string;data:Datum[];rate?:boolean;controls?:React.ReactNode}) {
 const scale=rate?100:1;
 const format=(d:Datum)=>d.reported??(rate?pct(d.value):String(d.value));
 const ref=useRef<HTMLCanvasElement>(null);const chartRef=useRef<Chart|null>(null);
 const [focused,setFocused]=useState<number|null>(null);
 const card=useRef<HTMLElement>(null),[visible,setVisible]=useState(false);
 useEffect(()=>{
  const el=card.current;if(!el)return;
  const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){setVisible(true);observer.disconnect();}},{threshold:.35});
  observer.observe(el);return()=>observer.disconnect();
 },[]);
 useEffect(()=>{
  if(!visible)return;
  const still=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;let settled=!!still;
  const chart=new Chart(ref.current!, {
    type: 'bar',
    data: { labels: data.map(d=>d.label), datasets: [{ data: data.map(d=>d.value*scale), backgroundColor: data.map(d=>d.color), borderRadius: 3, barPercentage: .65, maxBarThickness: 45 }] },
    options: {
      responsive: true, maintainAspectRatio: false, animation: still?false:{ duration: 1000, easing: 'easeOutQuart', onComplete: c=>{if(!settled){settled=true;c.chart.draw();}} },
      layout: { padding: { top: 12 } },
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: c => {
          const d=data[c.dataIndex];
          return `${format(d)}${d.lower===undefined?'':rate?` (95% CI ${pct(d.lower)}–${pct(d.upper!)})`:' (± as reported)'}`;
        } } },
      },
      scales: {
        y: { ...(rate?{min:0,max:100}:{min:-.2,max:.3,title:{display:true,text:'Change in safety value'}}), ticks:{stepSize:rate?25:.1,callback:v=>rate?`${v}%`:(Math.abs(Number(v))<1e-8?'0.0':Number(v).toFixed(1)),color:'#8a8b8e',font:{size:10}},border:{display:false},grid:{color:'#e9eaeb'} },
        x: { grid:{display:false},border:{display:false},ticks:{display:false} },
      },
    },
    plugins: [{ id: 'intervals', afterDatasetsDraw(c) {
      if(!settled)return;const ctx=c.ctx,y=c.scales.y;ctx.save();ctx.strokeStyle='#484a4d';ctx.lineWidth=1;
      data.forEach((d,i)=>{const bar=c.getDatasetMeta(0).data[i];if(d.lower!==undefined){
        const lo=y.getPixelForValue(d.lower*scale),hi=y.getPixelForValue(d.upper!*scale);
        ctx.beginPath();ctx.moveTo(bar.x,hi);ctx.lineTo(bar.x,lo);ctx.moveTo(bar.x-4,hi);ctx.lineTo(bar.x+4,hi);ctx.moveTo(bar.x-4,lo);ctx.lineTo(bar.x+4,lo);ctx.stroke();
      }});ctx.restore();
    } }],
  });
  chartRef.current=chart;return()=>{chart.destroy();chartRef.current=null;};
 },[data,rate,visible]);
 return <article ref={card} className="chart-card"><div className="chart-top"><div><h4>{title}</h4><p className="chart-subtitle">{subtitle}</p></div>{controls}</div><div className="chart-canvas"><canvas ref={ref} role="img" aria-label={`${title}. Exact values are in the data table below.`}/></div><div className="chart-values">{data.map((d,i)=><button key={d.label} style={{'--bar-color':d.color} as React.CSSProperties} onFocus={()=>setFocused(i)} onBlur={()=>setFocused(null)} onMouseEnter={()=>setFocused(i)} onMouseLeave={()=>setFocused(null)} aria-label={`${d.label}: ${format(d)}${d.lower===undefined?'':rate?`, 95% confidence interval ${pct(d.lower)} to ${pct(d.upper!)}`:', ± as reported'}`}><b>{format(d)}</b><span>{d.label}</span></button>)}</div><div className="chart-readout" aria-live="polite">{focused!==null?<>{data[focused].label}: {format(data[focused])}{rate&&data[focused].lower!==undefined&&` · 95% CI ${pct(data[focused].lower!)}–${pct(data[focused].upper!)}`}</>:data[0].lower!==undefined?(rate?'95% Wilson intervals':'± as reported; not a confidence interval'):''}</div><div className="sr-only"><div className="table-scroll"><table><caption>{title}</caption><thead><tr><th>Method</th><th>{rate?'Rate':'Reported value'}</th>{data[0].sourceReported&&<th>As reported in manuscript</th>}{data[0].lower!==undefined&&<><th>{rate?'95% CI':'Mean ± spread bounds'}</th><th>{rate?'Count':''}</th></>}</tr></thead><tbody>{data.map(d=><tr key={d.label}><th scope="row">{d.label}</th><td>{d.reported??d.value.toFixed(4)}</td>{d.sourceReported&&<td>{d.sourceReported}</td>}{d.lower!==undefined&&<><td>{d.lower.toFixed(4)}–{d.upper!.toFixed(4)}</td><td>{d.count}</td></>}</tr>)}</tbody></table></div></div></article>;
}
const hardwareNames=['Base Policy','Nominal','Ours'];const hardwareColors=[colors.base,colors.nominal,colors.ours];
function countData(counts:number[],n:number,invert=false,names=hardwareNames,palette=hardwareColors):Datum[]{return counts.map((k,i)=>({label:names[i],color:palette[i],...wilson(k,n,invert),count:`${invert?n-k:k} / ${n}`}));}
const simulationData=(rows:SimRow[],metric:'success'|'failure'|'allSafe'):Datum[]=>rows.map((row,i)=>({label:methodNames[i],color:methodColors[i],value:row[metric]!}));
type Metric='success'|'failure'|'allSafe'|'gain'|'conditional';
type Policy='DreamerV3'|'Diffusion Policy';
const metricLabels:Record<Metric,string>={success:'Success ↑',failure:'Failure ↓',allSafe:'All-safe ↑',gain:'Safety gain ↑',conditional:'Conditional failure ↓'};
const metricDescriptions:Record<Metric,string>={
 success:'Fraction of rollouts that complete the task.',
 failure:'Fraction of rollouts that enter a failure state.',
 allSafe:'Fraction of trajectories safe under all 20 physics settings.',
 gain:'Change in safety value after an intervention.',
 conditional:'Failure rate among rollouts where the filter intervenes.'
};
function metricData(rows:SimRow[],metric:Metric):Datum[]{
 if(metric==='success'||metric==='failure'||metric==='allSafe')return simulationData(rows,metric);
 return rows.flatMap((r,i)=>r[metric]==='—'?[]:[{label:methodNames[i],color:methodColors[i],value:Number(r[metric].split(' ± ')[0]),sourceReported:r[metric]}]);
}
const panels={
 stochastic:{id:'sim-uncertain',title:'Can robust filtering prevent failures under uncertainty?',setup:'Each policy is rolled out for 2,000 trajectories with randomized initial states and physics.',takeaways:[
  'Sampling-based (Worst-of-N) and risk-sensitive (CVaR) baselines are less effective: in high-dimensional latent spaces, sampling rarely finds meaningful worst cases, while extreme tails can include implausible states.',
  'Ours optimizes against worst-case plausible latent dynamics, reducing failures while remaining far less conservative than Ours without OOD.',
  'Its interventions yield positive safety gains, moving the system toward safer realized states, whereas Nominal gains are smaller or even negative.',
 ]},
 replay:{id:'sim-controlled',title:'Robustness under controlled uncertainty',setup:'We replay 100 successful teleoperation trajectories, each under 20 different physics settings.',takeaways:[
  'Ours keeps most trajectories failure-free across all physics settings, with safety actions that remain effective across dynamics variations.',
  'Without OOD also avoids failures, but only by rarely completing the task, since implausibly pessimistic imaginations make useful actions look unsafe.',
 ]},
 fixed:{id:'sim-partial',title:'Robustness under partial observability',setup:'The same task with fixed physics, so uncertainty arises only from partial observability and model approximation.',takeaways:[
  'Even when the system is deterministic, the learned world model remains uncertain about future transitions due to partial observability.',
  'Nominal filtering is more effective than under randomized physics, but Ours further reduces failures by accounting for this remaining uncertainty.',
 ]},
};
function MetricPanel({mode}:{mode:'stochastic'|'replay'|'fixed'}){
 const [policy,setPolicy]=useState<Policy>('DreamerV3'),[metric,setMetric]=useState<Metric>(mode==='replay'?'allSafe':'success');
 const rows=mode==='replay'?simulation.replay:simulation[mode][policy];
 const metrics:Metric[]=mode==='replay'?['allSafe','failure','success','gain','conditional']:['success','failure','gain','conditional'];
 const panel=panels[mode];
 return <section className="metric-panel" aria-labelledby={panel.id}><h3 className="experiment-heading" id={panel.id}>{panel.title}</h3>
 <div className="base-policy-selector"><span>Base policy</span>{mode==='replay'?<strong>Teleoperation trajectories</strong>:<div className="segmented">{(['DreamerV3','Diffusion Policy'] as const).map(p=><button key={p} aria-pressed={policy===p} onClick={()=>setPolicy(p)}>{p}</button>)}</div>}</div>
 <RateChart title={mode==='stochastic'?'Randomized physics':mode==='replay'?'Controlled-physics replay':'Fixed physics'} subtitle={mode==='replay'?'100 trajectories × 20 physics settings':'2,000 rollouts per method'} data={metricData(rows,metric)} rate={metric!=='gain'} controls={<div className="segmented metric-selector" aria-label="Select result metric">{metrics.map(m=><button key={m} aria-pressed={metric===m} onClick={()=>setMetric(m)}>{metricLabels[m]}</button>)}</div>}/>
 <Caption>{panel.setup} <strong>{metricLabels[metric].replace(/ [↑↓]/,'')}:</strong> {metricDescriptions[metric]}{(metric==='gain'||metric==='conditional')&&' Reported means; not reported for the base policy.'}{mode==='fixed'&&metric==='conditional'&&policy==='Diffusion Policy'&&' Filters intervene on different rollouts.'}</Caption>
 <Takeaways items={panel.takeaways}/>
 </section>;
}
export function Results({kind='hardware'}:{kind?:'hardware'|'simulation'}){
 const [replay,setReplay]=useState<'tape_results'|'tape_results_safe'>('tape_results');
 const b=hardware[replay],steering=hardware['Steering Results'].openpi;
 return <div className="results-section">{kind==='hardware'&&<>
 <div className="result-heading"><h3 className="experiment-heading" id="hw-surfaces">Robustness across surface disturbances</h3><div className="segmented"><button onClick={()=>setReplay('tape_results')} aria-pressed={replay==='tape_results'}>Failure replay · 30</button><button onClick={()=>setReplay('tape_results_safe')} aria-pressed={replay==='tape_results_safe'}>Success replay · 20</button></div></div>
 <div className="chart-grid hardware-replay">{([['no_tape','No tape'],['black_tape','Heavy-duty tape'],['transparent_tape','Scotch tape']] as const).map(([key,label])=><RateChart key={key} title={label} subtitle={`Failure rate ↓ · n = ${b.total}`} data={countData([b[key].nofilter,b[key].nominal,b[key].robust],b.total,true)}/>)}<RateChart title="Across all surfaces" subtitle={`Robust rate ↑ · n = ${b.total}`} data={countData([b.all_safe.nofilter,b.all_safe.nominal,b.all_safe.robust],b.total)}/></div>
 <Caption>We replay 30 failure and 20 success trajectories on three spatula surfaces while safeguarding them. The robust rate is the fraction of trajectories that remain safe across all surfaces.</Caption>
 <Takeaways items={[
  'Ours consistently reduces failures and achieves a higher robust rate, so its interventions do not depend on a favorable surface.',
  'The Nominal filter is effective only under certain surfaces: its fallback actions break down once the unobserved contact properties change.',
 ]}/>
 <h3 className="experiment-heading" id="hw-policies">Robustly safeguarding and steering task policies</h3>
 <div className="chart-grid three">{(['diffusion policy','openpi'] as const).map((key,i)=>{const p=hardware['Policy Results'][key];return <RateChart key={key} title={`${i===0?'Diffusion Policy':'π₀.₅'} · safety filtering`} subtitle="Success rate ↑ · n = 20" data={countData([p.nofilter,p.nominal,p.robust],20)}/>;})}<RateChart title="π₀.₅ · policy steering" subtitle="Success rate ↑ · n = 20" data={countData([steering.baseline,steering['nominal imagination'],steering['adversarial imagination (w.o. OOD)'],steering['adversarial imagination']],20,false,['Base Policy','Nominal','Without OOD','Ours'],[colors.base,colors.nominal,colors.ood,colors.ours])}/></div>
 <Caption>Left two panels: safety filtering over 20 trials with Scotch tape on the spatula. Right panel: sample-and-verify steering of π₀.₅, which evaluates 8 candidate action chunks in world-model imagination and executes the one with the best predicted outcome.</Caption>
 <Takeaways items={[
  'As a safety filter, Ours improves success more than Nominal for both a diffusion policy and a fine-tuned VLA.',
  'In steering, Ours selects actions that remain favorable even under plausible worst-case futures.',
  'Nominal steering imagines optimistic futures for risky actions, while steering without OOD imagines infeasible failures even for safe actions, weakening discrimination among candidates.',
 ]}/>
 </>}{kind==='simulation'&&<div className="result-group"><MetricPanel mode="stochastic"/><MetricPanel mode="replay"/><MetricPanel mode="fixed"/></div>}</div>;
}
