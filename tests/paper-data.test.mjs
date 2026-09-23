import assert from 'node:assert/strict';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {wilson} from '../app/data/statistics.ts';
import {simulation} from '../app/data/simulation.ts';
import {actions,outcomes,demo,experimentMedia} from '../app/data/content.ts';
const source = new URL('../../egg/0814_hardware_results/figures/',import.meta.url);
test('real-world imagination files match their shared timeline and preserve each full source clip',()=>{
 assert.equal(experimentMedia.hardwareImagination.length,10);
 for(const example of experimentMedia.hardwareImagination){
  for(const [mode,side] of [['nominal',example.left],['pessimistic',example.right]]){
   const readVideo=path=>{
    const result=spawnSync('ffprobe',['-v','error','-select_streams','v:0','-show_entries','stream=avg_frame_rate,nb_frames','-of','json',path],{encoding:'utf8'});
    assert.equal(result.status,0,result.stderr);return JSON.parse(result.stdout).streams[0];
   };
   const output=readVideo(fileURLToPath(new URL('../public'+side.src,import.meta.url)));
   const original=readVideo(fileURLToPath(new URL(`../more_results/${example.id}/${mode}.mp4`,import.meta.url)));
   const [a,b]=output.avg_frame_rate.split('/').map(Number);
   assert.equal(a/b,example.fps);assert.equal(Number(output.nb_frames),example.nSteps);
   assert.ok(Number(output.nb_frames)>=Number(original.nb_frames),'no source frames are truncated');
  }
 }
});
test('hardware data exactly matches source counts',()=>{
 assert.deepEqual(JSON.parse(readFileSync(new URL('../app/data/hardware.json',import.meta.url))),JSON.parse(readFileSync(new URL('results.json',source))));
});
test('Wilson intervals and mirrored failure intervals match Python source implementation',()=>{
 const py=`import ast,json,math\nfrom pathlib import Path\np=Path(${JSON.stringify(fileURLToPath(new URL('plot_results.py',source)))})\nt=ast.parse(p.read_text())\nf=next(n for n in t.body if isinstance(n,ast.FunctionDef) and n.name=='wilson')\nns={'math':math,'Z':1.959963984540054}\nexec(compile(ast.Module(body=[f],type_ignores=[]),'source','exec'),ns)\nprint(json.dumps([ns['wilson'](k,n) for n in [20,30] for k in range(n+1)]))`;
 const p=spawnSync('python',['-c',py],{encoding:'utf8'});assert.equal(p.status,0,p.stderr);const expected=JSON.parse(p.stdout);let i=0;
 for(const n of [20,30])for(let k=0;k<=n;k++){
  const [v,lo,hi]=expected[i++],actual=wilson(k,n),inverse=wilson(k,n,true);
  for(const [a,b] of [[actual.value,v],[actual.lower,lo],[actual.upper,hi],[inverse.value,1-v],[inverse.lower,1-hi],[inverse.upper,1-lo]])assert.ok(Math.abs(a-b)<1e-12);
 }
});
test('every active block-pouring table value matches the manuscript',()=>{
 const tex=readFileSync(new URL('../../69532e950f3a5c79f81bcd92/experiment_mainpulation.tex',import.meta.url),'utf8').split('\n').filter(l=>!l.trimStart().startsWith('%')).join('\n');
 const groups=[['block-pouring-filtering',[...simulation.stochastic.DreamerV3,...simulation.stochastic['Diffusion Policy']]],['controlled-uncertainty',simulation.replay],['deterministic-block-pouring',[...simulation.fixed.DreamerV3,...simulation.fixed['Diffusion Policy']]]];
 for(const [label,rows] of groups){
  const table=tex.slice(tex.indexOf(`\\label{tab:${label}}`)).split('\\end{table}')[0];
  const expected=[...table.matchAll(/&\s*(-?\d+\.\d+|--)(?:\s*\$\\pm\$\s*(\d+\.\d+))?/g)].map(m=>m[1]==='--'?'—':m[2]?`${m[1]} ± ${m[2]}`:Number(m[1]));
  const actual=rows.flatMap(r=>[r.success,r.failure,r.gain,r.conditional,...(r.allSafe===undefined?[]:[r.allSafe])]);
  assert.deepEqual(actual,expected,label);
 }
});
test('21 distinct demo media mappings',()=>{
 const paths=actions.flatMap(a=>outcomes.map(o=>demo.video(a.id,o.id)));
 assert.equal(new Set(paths).size,21);assert.equal(paths[0],'/front_figure/1_fail/nominal.mp4');assert.equal(paths[20],'/front_figure/7_success/pessimistic.mp4');
 for(const path of paths)assert.ok(readFileSync(new URL('../public'+path,import.meta.url)).length>0);
 for(const a of actions){const svg=readFileSync(new URL(`../front_figure/${a.id}.svg`,import.meta.url),'utf8');assert.ok(svg.includes(a.path),'overlay matches supplied SVG');}
});

test('action-specific OOD layouts preserve centered nominal and feasible orange points',async()=>{
 const {oodRegions,outcomePoint,outsideOOD}=await import('../app/data/content.ts');
 assert.deepEqual(actions.map(a=>oodRegions(a.id).length),[2,3,3,2,3,2,4]);
 for(const a of actions){
  assert.deepEqual(outcomePoint(a.id,'nominal'),[.5,.5]);
  assert.ok(outsideOOD(a.id,200,150));
  for(const r of oodRegions(a.id)){
   const radii=r.points.map(([x,y])=>Math.hypot(x/r.rx,y/r.ry));
   assert.ok(Math.min(...radii)<.7&&Math.max(...radii)>.9,'OOD contour has a concave radial indentation');
   const dx=r.cx-200,dy=r.cy-150,e=a.ellipse;
   const u=(dx*Math.cos(e.angle)+dy*Math.sin(e.angle))/e.rx;
   const v=(-dx*Math.sin(e.angle)+dy*Math.cos(e.angle))/e.ry;
   assert.ok(Math.hypot(u,v)<e.radius,'OOD center stays inside the green set');
  }
  const p=outcomePoint(a.id,'ours'),x=p[0]*400-200,y=p[1]*300-150,e=a.ellipse;
  const u=(x*Math.cos(e.angle)+y*Math.sin(e.angle))/(e.rx*e.radius);
  const v=(-x*Math.sin(e.angle)+y*Math.cos(e.angle))/(e.ry*e.radius);
  assert.ok(u*u+v*v<1);assert.ok(outsideOOD(a.id,p[0]*400,p[1]*300));
  for(const r of oodRegions(a.id))for(const [dx,dy] of r.points){
   const px=r.cx+dx*Math.cos(r.angle)-dy*Math.sin(r.angle),py=r.cy+dx*Math.sin(r.angle)+dy*Math.cos(r.angle);
   assert.ok(px>0&&px<400&&py>0&&py<300,'OOD contour stays visible');
  }
 }
});
test('animation reveals the arrow, distribution, then zoom in sequence',async()=>{
 const {animationProgress}=await import('../app/components/latentDrawing.ts');
 assert.deepEqual(animationProgress(0),{arrow:0,distribution:0,zoom:0});
 assert.equal(animationProgress(650).arrow,1);assert.equal(animationProgress(650).distribution,0);
 assert.equal(animationProgress(1050).distribution,1);assert.equal(animationProgress(1050).zoom,0);
 assert.deepEqual(animationProgress(1750),{arrow:1,distribution:1,zoom:1});
});
