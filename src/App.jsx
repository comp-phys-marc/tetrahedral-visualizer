

import React, { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { RotateCcw, Play, Pause, Orbit, Sparkles, Info, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const SQ = Math.SQRT1_2;
const LABELS = ["|00⟩","|01⟩","|10⟩","|11⟩"];
const COLORS = ["#38bdf8","#a78bfa","#f59e0b","#34d399"];
const V3 = [
  [-1,-1,-1], [1,1,-1], [1,-1,1], [-1,1,1]
].map(v=>{const n=Math.sqrt(3);return v.map(x=>x/n)});

const c=(re=0,im=0)=>({re,im});
const add=(a,b)=>c(a.re+b.re,a.im+b.im);
const mul=(a,b)=>c(a.re*b.re-a.im*b.im,a.re*b.im+a.im*b.re);
const scale=(a,s)=>c(a.re*s,a.im*s);
const m2=a=>a.re*a.re+a.im*a.im;
const norm=s=>{const n=Math.sqrt(s.reduce((q,z)=>q+m2(z),0))||1;return s.map(z=>scale(z,1/n))};
const clone=s=>s.map(z=>c(z.re,z.im));

function gate1(s,q,m){const out=clone(s),mask=1<<(1-q);for(let i=0;i<4;i++)if(!(i&mask)){const j=i|mask,a=s[i],b=s[j];out[i]=add(mul(m[0][0],a),mul(m[0][1],b));out[j]=add(mul(m[1][0],a),mul(m[1][1],b));}return norm(out)}
function apply(s,g){
 if(g==="X₀")return gate1(s,0,[[c(),c(1)],[c(1),c()]]);
 if(g==="X₁")return gate1(s,1,[[c(),c(1)],[c(1),c()]]);
 if(g==="H₀")return gate1(s,0,[[c(SQ),c(SQ)],[c(SQ),c(-SQ)]]);
 if(g==="H₁")return gate1(s,1,[[c(SQ),c(SQ)],[c(SQ),c(-SQ)]]);
 if(g==="Z₀")return gate1(s,0,[[c(1),c()],[c(),c(-1)]]);
 if(g==="Z₁")return gate1(s,1,[[c(1),c()],[c(),c(-1)]]);
 if(g==="CNOT₀→₁"){const o=clone(s);[o[2],o[3]]=[s[3],s[2]];return o}
 return s;
}
const gates=["X₀","X₁","H₀","H₁","Z₀","Z₁","CNOT₀→₁"];
const desc={
 "X₀":"Reflects the state by swapping |00⟩↔|10⟩ and |01⟩↔|11⟩.",
 "X₁":"Reflects the state by swapping |00⟩↔|01⟩ and |10⟩↔|11⟩.",
 "H₀":"Mixes opposite vertex pairs. Interference may change both location and shell.",
 "H₁":"Mixes adjacent vertex pairs. Interference may change both location and shell.",
 "Z₀":"Changes coefficient signs for q₀=1. Probability position is unchanged.",
 "Z₁":"Changes coefficient signs for q₁=1. Probability position is unchanged.",
 "CNOT₀→₁":"Leaves the q₀=0 half fixed and swaps |10⟩↔|11⟩."
};
function rot(v,ax,ay){let [x,y,z]=v;let cy=Math.cos(ay),sy=Math.sin(ay);[x,z]=[x*cy+z*sy,-x*sy+z*cy];let cx=Math.cos(ax),sx=Math.sin(ax);[y,z]=[y*cx-z*sx,y*sx+z*cx];return [x,y,z]}
function project(v,ax,ay){const [x,y,z]=rot(v,ax,ay);const sc=205/(3.2-z);return [260+x*sc,225-y*sc,z]}
function bary(probs){return [0,1,2].map(k=>probs.reduce((s,p,i)=>s+p*V3[i][k],0))}
function fmt(z){const r=Math.abs(z.re)<1e-8?0:z.re,i=Math.abs(z.im)<1e-8?0:z.im;return `${r.toFixed(3)} ${i<0?"−":"+"} ${Math.abs(i).toFixed(3)}i`}

function ComponentSphere({state,trail,ax,ay,setAngles,showGrid,component,title,accent}){
 const drag=useRef(null);
 const raw=state.map(z=>component==="real"?z.re*z.re:z.im*z.im);
 const weight=raw.reduce((a,b)=>a+b,0);
 const probs=weight>1e-12?raw.map(v=>v/weight):[.25,.25,.25,.25];
 const point=bary(probs).map(v=>v*Math.sqrt(weight));
 const pv=V3.map(v=>project(v,ax,ay)), pp=project(point,ax,ay);
 const edges=[[0,1],[0,2],[0,3],[1,2],[1,3],[2,3]];
 const faces=[[0,1,2],[0,1,3],[0,2,3],[1,2,3]].sort((a,b)=>a.reduce((s,i)=>s+pv[i][2],0)-b.reduce((s,i)=>s+pv[i][2],0));
 const onDown=e=>{drag.current={x:e.clientX,y:e.clientY,ax,ay};e.currentTarget.setPointerCapture(e.pointerId)};
 const onMove=e=>{if(!drag.current)return;setAngles([drag.current.ax+(e.clientY-drag.current.y)*.008,drag.current.ay+(e.clientX-drag.current.x)*.008])};
 const onUp=()=>drag.current=null;
 const trailPoints=trail.map(s=>{const vals=s.map(z=>component==="real"?z.re*z.re:z.im*z.im),total=vals.reduce((a,b)=>a+b,0);const ps=total>1e-12?vals.map(v=>v/total):[.25,.25,.25,.25];return project(bary(ps).map(v=>v*Math.sqrt(total)),ax,ay)});
 return <div className="rounded-2xl border border-slate-800 bg-slate-950/60 overflow-hidden">
  <div className="flex items-center justify-between px-4 pt-3"><div><div className="font-semibold" style={{color:accent}}>{title}</div><div className="text-[10px] text-slate-500">component probability weight = {weight.toFixed(3)}</div></div><div className="font-mono text-xs text-slate-400">√p = {Math.sqrt(weight).toFixed(3)}</div></div>
  <svg viewBox="0 0 520 450" className="w-full h-[390px] cursor-grab active:cursor-grabbing select-none" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp}>
   <defs><radialGradient id={`orb-${component}`}><stop offset="0" stopColor="#1e293b" stopOpacity=".15"/><stop offset=".72" stopColor="#0f172a" stopOpacity=".1"/><stop offset="1" stopColor={accent} stopOpacity=".14"/></radialGradient><filter id={`glow-${component}`}><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
   <circle cx="260" cy="225" r="178" fill={`url(#orb-${component})`} stroke={accent} strokeOpacity=".25" strokeWidth="1.5" strokeDasharray="5 7"/>
   {showGrid&&[45,90,135].map(r=><ellipse key={r} cx="260" cy="225" rx="178" ry={r} fill="none" stroke="#334155" strokeOpacity=".45" strokeDasharray="3 6"/>)}
   {faces.map((f,j)=><polygon key={j} points={f.map(i=>`${pv[i][0]},${pv[i][1]}`).join(' ')} fill={COLORS[f[0]]} fillOpacity=".04"/>)}
   {edges.map(([a,b])=><line key={`${a}${b}`} x1={pv[a][0]} y1={pv[a][1]} x2={pv[b][0]} y2={pv[b][1]} stroke="#94a3b8" strokeOpacity=".5" strokeWidth="1.4"/>)}
   {trailPoints.length>1&&<polyline points={trailPoints.map(p=>`${p[0]},${p[1]}`).join(' ')} fill="none" stroke={accent} strokeWidth="2" strokeDasharray="4 5" opacity=".8"/>}
   <motion.circle animate={{cx:pp[0],cy:pp[1]}} r="8" fill="#fff" stroke={accent} strokeWidth="4" filter={`url(#glow-${component})`}/>
   {pv.map((p,i)=><g key={i}><circle cx={p[0]} cy={p[1]} r="14" fill={COLORS[i]}/><text x={p[0]} y={p[1]+4} textAnchor="middle" fontSize="10" fontWeight="700" fill="#020617">{i.toString(2).padStart(2,"0")}</text><text x={p[0]+(p[0]<260?-18:18)} y={p[1]+(p[1]<225?-20:26)} textAnchor={p[0]<260?"end":"start"} fontSize="13" fill={COLORS[i]} fontWeight="700">{LABELS[i]}</text></g>)}
   {weight<1e-12&&<text x="260" y="225" textAnchor="middle" fill={accent} fontSize="13">No {component} component</text>}
   <text x="16" y="426" fill="#64748b" fontSize="11">Drag either sphere to rotate both · marker radius reflects this component's total norm</text>
  </svg>
 </div>
}

function DualTetraView(props){return <div className="grid xl:grid-cols-2 gap-3"><ComponentSphere {...props} component="real" title="Real-component tetrahedral sphere" accent="#38bdf8"/><ComponentSphere {...props} component="imag" title="Imaginary-component tetrahedral sphere" accent="#a78bfa"/></div>}


export default function App(){
 const [state,setState]=useState(norm([c(.73),c(.42),c(.31),c(.44)]));
 const [before,setBefore]=useState(null); const [last,setLast]=useState("X₁");
 const [trail,setTrail]=useState([state]); const [ax,setAx]=useState(-.32),[ay,setAy]=useState(.58);
 const [showGrid,setShowGrid]=useState(true); const [auto,setAuto]=useState(false);
 const probs=state.map(m2), magnitudes=state.map(z=>Math.sqrt(m2(z)));
 React.useEffect(()=>{if(!auto)return;const id=setInterval(()=>setAy(v=>v+.012),30);return()=>clearInterval(id)},[auto]);
 const doGate=g=>{const old=clone(state),next=apply(old,g);setBefore(old);setState(next);setLast(g);setTrail(t=>[...t,next].slice(-12))};
 const reset=()=>{const s=norm([c(.62,.18),c(.32,-.28),c(.24,.35),c(.41,.22)]);setState(s);setBefore(null);setTrail([s]);setLast("X₁")};
 const setComponent=(i,component,val)=>{const s=clone(state);s[i]=component==="real"?c(val,s[i].im):c(s[i].re,val);const n=norm(s);setState(n);setBefore(null);setTrail(t=>[...t,n].slice(-12))};
 return <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-7"><div className="max-w-7xl mx-auto space-y-5">
  <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4"><div><div className="text-cyan-400 text-xs font-semibold tracking-[.24em] uppercase">Two-qubit square-root probability space</div><h1 className="text-3xl md:text-5xl font-bold mt-1">Tetrahedral Sphere Operations</h1><p className="text-slate-400 mt-2 max-w-3xl">Explore how quantum operations move a two-qubit state through the paper’s tetrahedral-sphere picture. Vertex proximity represents basis-state strength; coefficient signs and phases are tracked separately.</p></div><div className="flex gap-2"><Button variant="outline" onClick={()=>setAuto(v=>!v)}>{auto?<Pause className="w-4 h-4 mr-2"/>:<Orbit className="w-4 h-4 mr-2"/>}{auto?"Stop rotation":"Auto rotate"}</Button><Button variant="secondary" onClick={reset}><RotateCcw className="w-4 h-4 mr-2"/>Reset</Button></div></header>
  <div className="grid lg:grid-cols-12 gap-5">
   <Card className="lg:col-span-8 bg-slate-900 border-slate-800 text-slate-100 overflow-hidden"><CardHeader className="pb-0"><div className="flex items-center justify-between"><CardTitle className="text-lg">Paired real and imaginary tetrahedral spheres</CardTitle><label className="text-xs text-slate-400 flex items-center gap-2"><input type="checkbox" checked={showGrid} onChange={e=>setShowGrid(e.target.checked)} className="accent-cyan-400"/>spherical guides</label></div></CardHeader><CardContent className="p-2"><DualTetraView state={state} trail={trail} ax={ax} ay={ay} setAngles={([a,b])=>{setAx(a);setAy(b)}} showGrid={showGrid}/></CardContent></Card>
   <div className="lg:col-span-4 space-y-5">
    <Card className="bg-slate-900 border-slate-800 text-slate-100"><CardHeader><CardTitle className="text-lg">Apply an operation</CardTitle></CardHeader><CardContent><div className="grid grid-cols-2 gap-2">{gates.map(g=><Button key={g} onClick={()=>doGate(g)} variant={last===g?"default":"outline"} className={last===g?"bg-cyan-500 text-slate-950 hover:bg-cyan-400":""}>{g}</Button>)}</div><div className="mt-4 rounded-xl bg-slate-950 border border-slate-800 p-3 text-xs text-slate-400"><Sparkles className="w-4 h-4 text-cyan-400 inline mr-2"/><b className="text-slate-200">{last}</b> {desc[last]}</div></CardContent></Card>
    <Card className="bg-slate-900 border-slate-800 text-slate-100"><CardHeader><CardTitle className="text-lg">Coefficient components</CardTitle></CardHeader><CardContent className="space-y-4">{state.map((z,i)=><div key={i} className="rounded-xl border border-slate-800 bg-slate-950 p-3"><div className="flex justify-between text-xs mb-3"><span style={{color:COLORS[i]}} className="font-bold">{LABELS[i]}</span><span className="font-mono text-slate-300">c = {fmt(z)}</span></div><div className="grid grid-cols-2 gap-3"><label className="text-[10px] text-cyan-400"><span className="flex justify-between"><span>real component</span><span className="font-mono">{z.re.toFixed(3)}</span></span><input type="range" min="-1" max="1" step=".005" value={z.re} onChange={e=>setComponent(i,"real",+e.target.value)} className="w-full accent-cyan-400"/></label><label className="text-[10px] text-violet-400"><span className="flex justify-between"><span>imaginary component</span><span className="font-mono">{z.im.toFixed(3)}i</span></span><input type="range" min="-1" max="1" step=".005" value={z.im} onChange={e=>setComponent(i,"imag",+e.target.value)} className="w-full accent-violet-400"/></label></div><div className="mt-2 flex justify-between text-[10px] text-slate-500"><span>|c| = {Math.sqrt(m2(z)).toFixed(3)}</span><span>arg(c) = {Math.atan2(z.im,z.re).toFixed(3)} rad</span></div></div>)}</CardContent></Card>
   </div>
  </div>
  <div className="grid md:grid-cols-2 gap-5">
   <Card className="bg-slate-900 border-slate-800 text-slate-100"><CardHeader><CardTitle className="text-lg">Before → after probabilities</CardTitle></CardHeader><CardContent className="space-y-3">
    {probs.map((p,i)=>{const old=before?m2(before[i]):p;return <div key={i} className="grid grid-cols-[45px_1fr_55px] gap-2 items-center text-xs"><span style={{color:COLORS[i]}}>{LABELS[i]}</span><div className="relative h-5 rounded bg-slate-950 overflow-hidden"><div className="absolute top-0 bottom-0 border-l-2 border-pink-400" style={{left:`${old*100}%`}}/><motion.div animate={{width:`${p*100}%`}} className="h-full bg-cyan-500/60"/></div><span className="text-right">{(p*100).toFixed(1)}%</span></div>})}
    <div className="text-[10px] text-slate-500">Pink ticks show the state before the last operation. Cyan bars show the current state.</div></CardContent></Card>
   <Card className="bg-slate-900 border-slate-800 text-slate-100"><CardHeader><CardTitle className="text-lg">How to read this model</CardTitle></CardHeader><CardContent className="grid sm:grid-cols-2 gap-3 text-xs text-slate-400"><div className="rounded-xl bg-slate-950 p-3"><b className="text-cyan-300">Tetrahedral position</b><p className="mt-1">The marker is the barycentric point defined by the four measurement probabilities. Moving toward a vertex increases that basis state’s strength.</p></div><div className="rounded-xl bg-slate-950 p-3"><b className="text-amber-300">Nested spherical shells</b><p className="mt-1">The rounded tetrahedral sphere is a topological aid. Interior surfaces represent states at different distance from the uniform-superposition centre.</p></div><div className="rounded-xl bg-slate-950 p-3"><b className="text-violet-300">Pauli X</b><p className="mt-1">X operations permute basis-state weights and appear as reflections through planes passing through the centre.</p></div><div className="rounded-xl bg-slate-950 p-3"><b className="text-pink-300">Phase-only motion</b><p className="mt-1">Z can leave the probability marker fixed while changing stored sign/phase flags. H can convert those hidden phases into visible probability motion.</p></div></CardContent></Card>
  </div>
  <div className="flex items-start gap-2 rounded-xl border border-amber-700/30 bg-amber-950/15 p-3 text-xs text-slate-400"><Info className="w-4 h-4 text-amber-400 mt-0.5 shrink-0"/><span>This is a mathematical teaching visualizer. It implements exact two-qubit unitary operations, then projects probabilities into the paper’s tetrahedral-sphere topology. It does not claim to reproduce the paper’s discrete g-curve electronics or finite analog precision.</span></div>
 </div></div>
}
