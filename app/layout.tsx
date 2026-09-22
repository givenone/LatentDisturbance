import type { Metadata } from 'next';
import './globals.css';
import {metadata as paper,asset} from './data/content';
import 'katex/dist/katex.min.css';
const url=paper.siteUrl||undefined;
export const metadata: Metadata = {
 ...(url?{metadataBase:new URL(url),alternates:{canonical:url}}:{}),
 title: paper.title,
 description: paper.description,
 keywords: paper.keywords,
 authors: paper.authors.map(a=>({name:a.name,url:a.href})),
 robots: {index:true,follow:true},
 icons: {icon:[{url:asset('/icon.png'),sizes:'512x512',type:'image/png'},{url:asset('/icon-48.png'),sizes:'48x48',type:'image/png'}],apple:asset('/apple-touch-icon.png')},
 openGraph: {type:'article',title:paper.title,description:paper.description,siteName:paper.title,images:[{url:asset('/og-image.png'),width:1200,height:630,alt:paper.title}],...(url?{url}:{})},
 twitter: {card:'summary_large_image',title:paper.title,description:paper.description,images:[asset('/og-image.png')]},
};
const jsonLd={'@context':'https://schema.org','@type':'ScholarlyArticle',headline:paper.title,name:paper.title,description:paper.description,keywords:paper.keywords.join(', '),author:paper.authors.map(a=>({'@type':'Person',name:a.name,url:a.href,affiliation:{'@type':'Organization',name:paper.affiliations}})),image:url?new URL(asset('/og-image.png'),url).href:asset('/og-image.png'),...(url?{url}:{})};
export default function RootLayout({children}: {children: React.ReactNode}) { return <html lang="en"><body><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(jsonLd).replace(/</g,'\\u003c')}}/>{children}</body></html>; }
