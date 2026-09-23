'use client';
import {useState} from 'react';
import {experimentMedia,colors} from '../data/content';
import {TrajectoryBrowser,SyncedPlayer} from './TrajectoryPlayer';
import {nextRandom} from '../data/playback';
import {Results} from './Results';
import {Caption,SectionToc,Takeaways} from './ExperimentText';
function Pair({title,left,right,fps,nSteps,cameraLayout='stacked',defaultSpeed=1}:{title:string;left:{src:string;label:string};right:{src:string;label:string};fps:number;nSteps:number;cameraLayout?:'stacked'|'side-by-side';defaultSpeed?:number}){return <div className={`imagination-pair ${cameraLayout==='side-by-side'?'landscape-imagination':''}`}><h4>{title}</h4><SyncedPlayer fps={fps} nSteps={nSteps} defaultSpeed={defaultSpeed} panels={[{label:left.label,videos:[left.src],cameraLayout,color:left.label.includes('Nominal')?colors.nominal:'#555'},{label:right.label,videos:[right.src],cameraLayout,color:right.label.includes('OOD')?colors.ood:colors.ours}]}/></div>;}
export function HardwareImaginations(){
 const [selected,setSelected]=useState(0),examples=experimentMedia.hardwareImagination,example=examples[selected];
 return <div className="hardware-imaginations">
  <h3 className="experiment-heading" id="hw-imagination">Does latent disturbance induce pessimistic yet plausible imaginations?</h3>
  <div className="trajectory-toolbar imagination-toolbar"><div className="trajectory-picker"><button aria-label="Previous imagination example" onClick={()=>setSelected(i=>(i-1+examples.length)%examples.length)}>‹</button><span aria-live="polite">Example {selected+1} / {examples.length}</span><button aria-label="Next imagination example" onClick={()=>setSelected(i=>(i+1)%examples.length)}>›</button></div><button aria-label="Shuffle imagination examples" onClick={()=>setSelected(i=>nextRandom(i,examples.length))}>⇄ Shuffle</button></div>
  <Pair key={example.id} {...example} defaultSpeed={.5}/>
  <Caption>Nominal (left) and pessimistic (right) world-model imaginations for the same real-world observation and action.{example.holdsFinalFrame&&' The shorter clip holds its final frame while the other finishes.'}</Caption>
 </div>;
}
function TaskIntro(){const [playing,setPlaying]=useState(true);return <div className="task-video"><video id="block-pouring-intro" src={experimentMedia.stochasticity} autoPlay muted loop playsInline preload="auto" aria-label="Block pouring under different physics: the same action produces different outcomes"/><button className="intro-pause" aria-label={playing?'Pause task overview':'Play task overview'} onClick={()=>{const v=document.getElementById('block-pouring-intro') as HTMLVideoElement;if(playing)v.pause();else void v.play();setPlaying(!playing);}}>{playing?'Ⅱ':'▶'}</button><p className="video-caption">Same action · Different physics</p></div>;}
export function HardwareResults(){return <section className="section" id="hardware"><div className="section-intro"><h2>1) Real-World Results: Serving Sunny-Side-Up Egg</h2></div>
 <SectionToc items={[['hw-filtering','Robust latent safety filtering'],['hw-nominal','Why does the nominal safety filter fail?'],['hw-imagination','Pessimistic yet plausible imaginations'],['hw-surfaces','Robust to disturbances: different spatula surfaces'],['hw-policies','Robustly safeguarding and steering task policies']]}/>
 <h3 className="experiment-heading" id="hw-filtering">Robust latent safety filtering</h3><TrajectoryBrowser kind="robust"/>
 <Caption>Rollouts safeguarded by the robust safety filter. Orange marks steps where the filter overrides the task-policy action because its robust safety value becomes non-positive.</Caption>
 <Takeaways items={[
  'Ours preemptively identifies actions that may cause the egg to fall or flip, and overrides them before failure becomes unavoidable.',
  'It intervenes with robust fallback actions whose plausible outcomes remain safe under worst-case dynamics.',
 ]}/>
 <h3 className="experiment-heading" id="hw-nominal">Why does the nominal safety filter fail?</h3><TrajectoryBrowser kind="nominal"/>
 <Caption>Rollouts safeguarded by the nominal safety filter. The dotted orange line evaluates the same rollout with the robust safety value for reference.</Caption>
 <Takeaways items={[
  'Overly optimistic imaginations can delay the intervention until failure is no longer avoidable.',
  'Fallback actions that appear safe under nominal dynamics can still fail under adverse contact conditions, flipping the egg sunny-side down.',
 ]}/>
 <HardwareImaginations/>
 <Results kind="hardware"/></section>;}
export function SimulationResults(){const [example,setExample]=useState(1);return <section className="section" id="simulation"><div className="section-intro"><h2>2) Simulation Results: Block Pouring</h2></div>
 <SectionToc items={[['sim-ood','Does the in-distribution constraint matter?'],['sim-imagination','Does latent disturbance induce pessimistic yet plausible imaginations?'],['sim-filtering','Does the robust safety value avoid overestimating safety?'],['sim-uncertain','Can robust filtering prevent failures under uncertainty?'],['sim-controlled','Robustness under controlled uncertainty'],['sim-partial','Robustness under partial observability']]}/>
 <TaskIntro/>
 <h3 className="experiment-heading" id="sim-ood">Does the in-distribution constraint matter?</h3><Pair {...experimentMedia.ood}/>
 <Caption>Left: the action executed in simulation. Right: the imagined outcome of the same action, using a latent disturbance optimized without the in-distribution constraint.</Caption>
 <Takeaways items={[
  'Without the in-distribution constraint, the disturbance exploits model errors and imagines the green block falling in an infeasible manner.',
  'Latent states with high predicted likelihood can still be out-of-distribution; the constraint excludes them and prevents overly pessimistic imaginations.',
 ]}/>
 <h3 className="experiment-heading" id="sim-imagination">Does latent disturbance induce pessimistic yet plausible imaginations?</h3><div className="segmented example-selector">{[1,2].map(i=><button key={i} aria-pressed={example===i} onClick={()=>setExample(i)}>Example {i}</button>)}</div><Pair key={example} {...experimentMedia.imagination[example-1]} defaultSpeed={.5}/>
 <Caption>Nominal (left) and pessimistic (right) world-model imaginations for the same initial state and action.</Caption>
 <Takeaways items={[
  'The nominal imagination can predict a non-failure outcome, overestimating safety.',
  'Within the calibrated uncertainty set, the latent disturbance imagines a plausible adverse transition, such as the green block sliding off and falling.',
 ]}/>
 <h3 className="experiment-heading" id="sim-filtering">Does the robust safety value avoid overestimating safety?</h3><TrajectoryBrowser kind="simulation"/>
 <Caption>Both filters safeguard the same base action sequence. The plots show when each filter intervenes; the videos show whether those actions prevent failure.</Caption>
 <Takeaways items={[
  'The nominal safety value evaluates the average outcome of an action, so it can overestimate safety when adverse outcomes occur.',
  'The robust safety value evaluates worst-case plausible outcomes, so Ours intervenes more preemptively, using actions whose plausible outcomes avoid failure.',
 ]}/>
 <Results kind="simulation"/></section>;}
