import { useCallback, useEffect, useRef, useState } from "react";
import {personPosition} from "../scalePeople";
import { area, bounds, doorSector, fixtures, fmt, openings, rooms, snapItem, wallDistances, walls, type PlanItem, type Point } from "./geometry";

export type ViewActions={fit:()=>void;zoom:(factor:number)=>void};
export type PlannerProps={
 showPeople?:boolean;items:PlanItem[];selected:string|null;focus:string;labels:boolean;dimensions:boolean;snap:boolean;cutaway:boolean;
 onSelect:(id:string|null)=>void;onBegin:()=>void;onPreview:(item:PlanItem)=>void;onEnd:()=>void;
 actionsRef:React.RefObject<ViewActions|null>;onError?:()=>void;
};
type Gesture={kind:"pan";px:number;py:number;cx:number;cy:number}|{kind:"move";id:string;dx:number;dy:number}|{kind:"rotate";id:string};
const path=(p:Point[])=>p.map(q=>q.join(",")).join(" ");

function FixtureSymbol({f}:{f:typeof fixtures[number]}){
 return <g transform={`translate(${f.x-f.w/2} ${f.y-f.d/2})`} className="fixed-object">
  <rect width={f.w} height={f.d} rx={f.kind==="bath"?.12:.03} fill={f.kind==="counter"||f.kind==="island"?"#c4b49b":"#f5f7f5"} stroke="#8d9993" strokeWidth=".025"/>
  {f.kind==="bath"&&<rect x=".07" y=".09" width={f.w-.14} height={f.d-.18} rx=".22" fill="#dfebe6" stroke="#a4b2ac" strokeWidth=".02"/>}
  {f.kind==="basin"&&<ellipse cx={f.w/2} cy={f.d/2} rx={f.w*.34} ry={f.d*.28} fill="#dbe7e4" stroke="#9aaea8" strokeWidth=".02"/>}
  {f.kind==="toilet"&&<><rect x=".02" y=".01" width={f.w-.04} height=".16" fill="#dde3df"/><ellipse cx={f.w/2} cy={f.d*.58} rx={f.w*.39} ry={f.d*.34} fill="#fff" stroke="#a4b2ac" strokeWidth=".025"/></>}
  {f.kind==="shower"&&<><path d={`M 0 0 L ${f.w} ${f.d} M 0 ${f.d} L ${f.w} 0`} stroke="#b6c9c3" strokeWidth=".018"/><circle cx={f.w/2} cy={f.d/2} r=".04" fill="#8b9c96"/></>}
  {f.kind==="counter"&&<><rect x=".08" y={f.d*.63} width={f.w-.16} height=".43" rx=".04" fill="#dbe7e4" stroke="#8d9993" strokeWidth=".02"/>{[.16,.43].flatMap(x=>[.30,.57].map(y=><circle key={x+":"+y} cx={x} cy={y} r=".10" fill="#504f48"/>))}</>}
  {f.kind==="closet"&&<path d={`M 0 0 L ${f.w} ${f.d} M ${f.w} 0 L 0 ${f.d}`} stroke="#a9a091" strokeWidth=".018"/>}
  <title>{f.name} · Einbaumasse angenähert</title>
 </g>;
}
export default function Plan2D(props:PlannerProps){
 const {items,selected,focus,labels,dimensions,snap,onSelect,onBegin,onPreview,onEnd,actionsRef}=props;
 const svg=useRef<SVGSVGElement>(null),host=useRef<HTMLDivElement>(null),gesture=useRef<Gesture|null>(null);
 const pointers=useRef(new Map<number,Point>()),pinch=useRef<{distance:number;zoom:number;anchor:Point}|null>(null);
 const [size,setSize]=useState({w:900,h:700}),[view,setView]=useState({x:8,y:7.6,z:35});
 const latest=useRef({items,snap,view,size,onSelect,onBegin,onPreview,onEnd});
 useEffect(()=>{latest.current={items,snap,view,size,onSelect,onBegin,onPreview,onEnd}},[items,snap,view,size,onSelect,onBegin,onPreview,onEnd]);
 const fit=useCallback(()=>{const room=rooms.find(r=>r.id===focus),b=room?bounds(room.poly):{minX:-.8,minY:-.8,maxX:21.8,maxY:16};
  const w=Math.max(b.maxX-b.minX,2),h=Math.max(b.maxY-b.minY,2);
  setView({x:(b.minX+b.maxX)/2,y:(b.minY+b.maxY)/2,z:Math.max(12,Math.min((size.w-90)/w,(size.h-110)/h,180))});
 },[focus,size.w,size.h]);
 useEffect(()=>{const observer=new ResizeObserver(entries=>{const r=entries[0].contentRect;setSize({w:r.width,h:r.height})});if(host.current)observer.observe(host.current);return()=>observer.disconnect()},[]);
 useEffect(()=>{const id=requestAnimationFrame(fit);return()=>cancelAnimationFrame(id)},[fit]);
 useEffect(()=>{actionsRef.current={fit,zoom:factor=>setView(v=>({...v,z:Math.min(320,Math.max(10,v.z*factor))}))};return()=>{actionsRef.current=null}},[actionsRef,fit]);
 useEffect(()=>{const element=svg.current;if(!element)return;const wheel=(e:WheelEvent)=>{e.preventDefault();const r=element.getBoundingClientRect(),sx=e.clientX-r.left,sy=e.clientY-r.top;setView(v=>{const z=Math.min(320,Math.max(10,v.z*Math.exp(-e.deltaY*.0015)));return{x:v.x+(sx-r.width/2)*(1/v.z-1/z),y:v.y+(sy-r.height/2)*(1/v.z-1/z),z}})};element.addEventListener("wheel",wheel,{passive:false});return()=>element.removeEventListener("wheel",wheel)},[]);
 const point=(e:React.PointerEvent):Point=>{const r=svg.current!.getBoundingClientRect();return[(e.clientX-r.left-size.w/2)/view.z+view.x,(e.clientY-r.top-size.h/2)/view.z+view.y]};
 const start=(e:React.PointerEvent,id?:string,rotate=false)=>{
  if(e.button!==0)return;e.preventDefault();e.stopPropagation();svg.current!.setPointerCapture(e.pointerId);pointers.current.set(e.pointerId,[e.clientX,e.clientY]);
  if(pointers.current.size===2){if(gesture.current&&gesture.current.kind!=="pan")onEnd();gesture.current=null;const [a,b]=[...pointers.current.values()],r=svg.current!.getBoundingClientRect();pinch.current={distance:Math.hypot(a[0]-b[0],a[1]-b[1]),zoom:view.z,anchor:[((a[0]+b[0])/2-r.left-size.w/2)/view.z+view.x,((a[1]+b[1])/2-r.top-size.h/2)/view.z+view.y]};return}
  const item=items.find(f=>f.id===id);if(item){onSelect(item.id);onBegin();const p=point(e);gesture.current=rotate?{kind:"rotate",id:item.id}:{kind:"move",id:item.id,dx:item.x-p[0],dy:item.y-p[1]}}
  else{onSelect(null);gesture.current={kind:"pan",px:e.clientX,py:e.clientY,cx:view.x,cy:view.y}};
 };
 const move=(e:React.PointerEvent)=>{
  if(!pointers.current.has(e.pointerId))return;pointers.current.set(e.pointerId,[e.clientX,e.clientY]);
  if(pinch.current&&pointers.current.size===2){const[a,b]=[...pointers.current.values()],p=pinch.current,r=svg.current!.getBoundingClientRect(),z=Math.min(320,Math.max(10,p.zoom*Math.hypot(a[0]-b[0],a[1]-b[1])/Math.max(1,p.distance)));setView({x:p.anchor[0]-((a[0]+b[0])/2-r.left-size.w/2)/z,y:p.anchor[1]-((a[1]+b[1])/2-r.top-size.h/2)/z,z});return}
  const g=gesture.current;if(!g)return;
  if(g.kind==="pan"){setView(v=>({...v,x:g.cx-(e.clientX-g.px)/v.z,y:g.cy-(e.clientY-g.py)/v.z}));return}
  const f=latest.current.items.find(f=>f.id===g.id);if(!f)return;const p=point(e);
  if(g.kind==="move")onPreview(snapItem({...f,x:p[0]+g.dx,y:p[1]+g.dy},snap&&!e.altKey));
  else{let rot=Math.atan2(p[1]-f.y,p[0]-f.x)+Math.PI/2;if(snap&&!e.altKey)rot=Math.round(rot/(Math.PI/12))*Math.PI/12;onPreview({...f,rot:(rot+Math.PI*2)%(Math.PI*2)})}
 };
 const end=(e:React.PointerEvent)=>{pointers.current.delete(e.pointerId);if(gesture.current&&gesture.current.kind!=="pan")onEnd();gesture.current=null;pinch.current=null;if(svg.current?.hasPointerCapture(e.pointerId))svg.current.releasePointerCapture(e.pointerId)};
 const selectedItem=items.find(f=>f.id===selected),activeRoom=rooms.find(r=>r.id===focus);
 return <div ref={host} className="plan2d"><svg ref={svg} width="100%" height="100%" aria-label="Grundriss: freie Fläche ziehen zum Verschieben, Möbel ziehen zum Platzieren" onPointerDown={e=>start(e)} onPointerMove={move} onPointerUp={end} onPointerCancel={end} onLostPointerCapture={end}>
 <defs><pattern id="plan-grid" width={view.z*.5} height={view.z*.5} patternUnits="userSpaceOnUse" x={size.w/2-view.x*view.z} y={size.h/2-view.y*view.z}><circle cx="1" cy="1" r=".7" fill="#ccc8bd"/></pattern></defs>
 <rect width="100%" height="100%" fill="url(#plan-grid)"/>
 <g transform={`translate(${size.w/2} ${size.h/2}) scale(${view.z}) translate(${-view.x} ${-view.y})`}>
 {rooms.filter(r=>!r.zone).map(r=><polygon key={r.id} points={path(r.poly)} fill={r.tone} opacity={!activeRoom||activeRoom.id===r.id?1:.30}/>)}
 {activeRoom?.zone&&<polygon points={path(activeRoom.poly)} fill="#ced5b1" fillOpacity=".5" stroke="#657646" strokeWidth={1/view.z} strokeDasharray={` ${5/view.z} ${4/view.z}`}/>}
 {openings.filter(o=>o.kind==="door").map(o=>{const p=doorSector(o);return <g key={o.id}><polygon points={path(p)} fill="#c1bda9" fillOpacity=".10"/><polyline points={path(p.slice(1))} fill="none" stroke="#a49b85" strokeWidth={1/view.z} strokeDasharray={`${4/view.z} ${3/view.z}`}/><line x1={o.a[0]} y1={o.a[1]} x2={p[p.length-1][0]} y2={p[p.length-1][1]} stroke="#9a866b" strokeWidth=".045"/></g>})}
 {fixtures.map(f=><FixtureSymbol key={f.id} f={f}/>)}
 {walls.map((w,i)=><line key={i} x1={w.a[0]} y1={w.a[1]} x2={w.b[0]} y2={w.b[1]} stroke="#655f54" strokeWidth={w.thickness} strokeLinecap="square"/>)}
 {openings.filter(o=>o.kind==="window").map(o=><g key={o.id}><line x1={o.a[0]} y1={o.a[1]} x2={o.b[0]} y2={o.b[1]} stroke="#789b9f" strokeWidth=".085"/><line x1={(o.a[0]+o.b[0])/2-.07} y1={(o.a[1]+o.b[1])/2-.07} x2={(o.a[0]+o.b[0])/2+.07} y2={(o.a[1]+o.b[1])/2+.07} stroke="#52757a" strokeWidth=".04"/></g>)}
 {labels&&rooms.filter(r=>!r.zone&&(!activeRoom||activeRoom.id===r.id)).map(r=><g key={r.id} transform={`translate(${r.label.join(" ")}) scale(${1/view.z})`} pointerEvents="none"><text textAnchor="middle" fill="#686151" fontSize="12" fontWeight="600">{r.name}</text><text textAnchor="middle" y="16" fill="#8c8576" fontSize="11">ca. {fmt(area(r.poly))} m²</text></g>)}
 {items.map(f=><g key={f.id} transform={`translate(${f.x} ${f.y}) rotate(${f.rot*180/Math.PI})`} onPointerDown={e=>start(e,f.id)} className="plan-furniture">
  <rect x={-f.w/2} y={-f.d/2} width={f.w} height={f.d} rx=".04" fill={f.color} fillOpacity=".9" stroke={f.id===selected?"#445d36":"#51604b"} strokeWidth={(f.id===selected?2.5:1)/view.z}/>
  {f.kind==="bed"&&<><rect x={-f.w*.4} y={-f.d*.43} width={f.w*.8} height={f.d*.20} rx=".04" fill="#f3f1e8"/><line x1={-f.w/2} y1={-f.d*.14} x2={f.w/2} y2={-f.d*.14} stroke="#fff" strokeOpacity=".4" strokeWidth=".025"/></>}
  {(f.kind==="sofa"||f.kind==="chair")&&<path d={`M ${-f.w*.4} ${f.d*.35} L ${-f.w*.4} ${-f.d*.32} L ${f.w*.4} ${-f.d*.32} L ${f.w*.4} ${f.d*.35}`} fill="none" stroke="#e2e7d6" strokeWidth=".08"/>}
  {f.kind==="table"&&<rect x={-f.w*.42} y={-f.d*.4} width={f.w*.84} height={f.d*.8} rx=".03" fill="none" stroke="#e2e7d6" strokeWidth=".02"/>}
  {f.kind==="shelf"&&<line x1="0" y1={-f.d/2} x2="0" y2={f.d/2} stroke="#e2e7d6" strokeWidth=".02"/>}
  <title>{f.name} · {fmt(f.w)} × {fmt(f.d)} m</title>
 </g>)}
 {props.showPeople&&rooms.filter(r=>!activeRoom||r.id===activeRoom.id).map(r=>{const [x,y]=personPosition(r.poly);return <g key={r.id} transform={`translate(${x} ${y})`} pointerEvents="none"><title>Massstabsfigur: 185 cm, Körperbreite ca. 48 cm (Draufsicht)</title><ellipse rx=".24" ry=".13" fill="#496b86"/><ellipse rx=".11" ry=".115" fill="#dbe7ef" stroke="#496b86" strokeWidth=".015"/></g>})}
 {labels&&items.map(f=><g key={f.id} transform={`translate(${f.x} ${f.y}) scale(${1/view.z})`} pointerEvents="none"><text textAnchor="middle" dominantBaseline="middle" fontSize="11" fill="#172516" paintOrder="stroke" stroke="#f7f8ee" strokeWidth="3" strokeLinejoin="round">{f.name.length>23?f.name.slice(0,22)+"…":f.name}</text></g>)}
 {selectedItem&&<>
  {dimensions&&wallDistances(selectedItem).map((d,i)=><g key={i} pointerEvents="none"><line x1={d.a[0]} y1={d.a[1]} x2={d.b[0]} y2={d.b[1]} stroke="#567643" strokeWidth={1/view.z} strokeDasharray={`${4/view.z} ${3/view.z}`}/><g transform={`translate(${(d.a[0]+d.b[0])/2} ${(d.a[1]+d.b[1])/2}) scale(${1/view.z})`}><rect x="-29" y="-9" width="58" height="18" rx="4" fill="#fffef6"/><text textAnchor="middle" y="4" fontSize="11" fill="#415d31">{fmt(d.length)} m</text></g></g>)}
  <g transform={`translate(${selectedItem.x} ${selectedItem.y}) rotate(${selectedItem.rot*180/Math.PI})`}>
   <line x1="0" y1={-selectedItem.d/2} x2="0" y2={-selectedItem.d/2-30/view.z} stroke="#445d36" strokeWidth={1.5/view.z}/>
   <circle role="button" aria-label="Möbel drehen" cx="0" cy={-selectedItem.d/2-30/view.z} r={10/view.z} fill="#fff" stroke="#445d36" strokeWidth={2/view.z} onPointerDown={e=>start(e,selectedItem.id,true)} className="rotate-handle"/>
  </g>
 </>}
 {dimensions&&<g pointerEvents="none">{(activeRoom?[activeRoom]:rooms.filter(r=>!r.zone)).map(r=>{const b=bounds(r.poly);return <g key={r.id} opacity={activeRoom?1:.7}><g transform={`translate(${(b.minX+b.maxX)/2} ${b.maxY-.16}) scale(${1/view.z})`}><text textAnchor="middle" fontSize="10" fill="#716956">{fmt(b.maxX-b.minX)} m</text></g>{activeRoom&&<g transform={`translate(${b.maxX-.12} ${(b.minY+b.maxY)/2}) scale(${1/view.z})`}><text textAnchor="end" fontSize="10" fill="#716956">{fmt(b.maxY-b.minY)} m</text></g>}</g>})}</g>}
 </g></svg>
 <div className="plan-scale"><span style={{width:view.z*(view.z>130?.5:1)}}/>{view.z>130?"50 cm":"1 m"}</div>
 <div className="canvas-help">Freie Fläche ziehen · Mausrad / zwei Finger: Zoom{selected?" · Kreisgriff: drehen":""}</div>
 </div>;
}
