import type {ReactNode} from 'react';

export function SectionToc({items}:{items:[string,string][]}){return <nav className="section-toc" aria-label="In this section"><span>In this section</span><ol>{items.map(([id,label])=><li key={id}><a href={`#${id}`}>{label}</a></li>)}</ol></nav>;}
export function Caption({children}:{children:ReactNode}){return <p className="figure-caption" aria-live="polite">{children}</p>;}
export function Takeaways({items}:{items:ReactNode[]}){return <ul className="takeaway-list">{items.map((item,i)=><li key={i}>{item}</li>)}</ul>;}
