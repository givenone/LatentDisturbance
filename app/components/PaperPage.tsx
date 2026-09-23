'use client';
import {useEffect,useState,type ReactNode} from 'react';
import {metadata} from '../data/content';
import {Demo,Method} from './Demo';
import {Formulation} from './Formulation';
import {RuntimeSteering} from './RuntimeSteering';
import {HardwareResults,SimulationResults} from './Experiments';
const resourceIcons:Record<string,ReactNode>={
  arXiv:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  Code:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>,
};
const navItems=[{id:'overview',label:'Overview'},{id:'formulation',label:'Robust Optimization'},{id:'method',label:'Uncertainty Set'},{id:'runtime-steering',label:'Runtime Steering'},{id:'hardware',label:'Experiment: Real World'},{id:'simulation',label:'Experiment: Simulation'}];
function useActiveSection(){
 const [active,setActive]=useState<string|null>(null);
 useEffect(()=>{
  const update=()=>{let current:string|null=null;for(const {id} of navItems){const el=document.getElementById(id);if(el&&el.getBoundingClientRect().top<=window.innerHeight*.35)current=id;}if(window.innerHeight+window.scrollY>=document.documentElement.scrollHeight-2)current=navItems[navItems.length-1].id;setActive(current);};
  update();window.addEventListener('scroll',update,{passive:true});window.addEventListener('resize',update);
  return()=>{window.removeEventListener('scroll',update);window.removeEventListener('resize',update);};
 },[]);
 return active;
}
export function PaperPage(){const active=useActiveSection();return <><a className="skip-link" href="#overview">Skip to content</a><header className="site-nav"><nav aria-label="Page sections">{navItems.map(item=><a key={item.id} href={`#${item.id}`} className={active===item.id?'active':undefined} aria-current={active===item.id?'location':undefined}>{item.label}</a>)}</nav></header><main id="top"><div className="hero"><h1>{metadata.title}</h1><p className="authors">{metadata.authors.map((author,i)=><span key={author.name}>{i>0&&', '}<a href={author.href} target="_blank" rel="noopener noreferrer">{author.name}</a></span>)}</p><p className="affiliations">{metadata.affiliations}</p><div className="paper-resources" aria-label="Paper resources">{metadata.resources.map(resource=>resource.href?<a key={resource.label} href={resource.href} target="_blank" rel="noopener noreferrer">{resourceIcons[resource.label]}{resource.label} ↗</a>:<button key={resource.label} disabled title={`${resource.label} link coming soon`}>{resourceIcons[resource.label]}{resource.label} ↗</button>)}</div></div><section className="paper-summary" aria-label="Main takeaways"><p className="paper-intro">{metadata.intro}</p><div className="paper-benefits">{metadata.takeaways.map(item=><article key={item.tag}><h3>{item.tag}</h3><p dangerouslySetInnerHTML={{__html:item.text}}/></article>)}</div></section><section id="overview" className="overview"><Demo/></section><Formulation/><Method/><RuntimeSteering/><HardwareResults/><SimulationResults/><footer><a href="#top">Back to top ↑</a><p className="copyright">© {new Date().getFullYear()} Junwon Seo</p></footer></main></>;}
