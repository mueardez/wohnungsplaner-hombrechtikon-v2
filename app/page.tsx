"use client";
import {useCallback,useEffect,useMemo,useRef,useState} from "react";
import InventoryPanel,{type InventoryItem} from "./InventoryPanel";
import {usePurchases,PurchaseLegend} from "./usePurchases";
import {purchaseColor} from "./purchaseStyle";
import Plan2D,{type ViewActions} from "./plan/Plan2D";
import Plan3D from "./plan/Plan3D";
import {area,bounds,fmt,inferKind,roomNames,rooms,snapItem,warnings,type FurnitureKind,type PlanItem} from "./plan/geometry";
import {usePlan} from "./plan/usePlan";
import "./plan/planner.css";
const stableUrl="https://mueardez.github.io/wohnungsplaner-hombrechtikon/";
const kinds:{value:FurnitureKind;label:string}[]=[{value:"box",label:"Neutraler Körper"},{value:"table",label:"Tisch"},{value:"chair",label:"Stuhl"},{value:"sofa",label:"Sofa / Sessel"},{value:"bed",label:"Bett"},{value:"shelf",label:"Regal / Schrank"}];
export default function Home(){
 const plan=usePlan(),[section,setSection]=useState<"plan"|"inventory">("plan"),[mode,setMode]=useState<"2d"|"3d">("2d"),[focus,setFocus]=useState("all"),[selected,setSelected]=useState<string|null>(null);
 const [labels,setLabels]=useState(true),[dimensions,setDimensions]=useState(true),[snap,setSnap]=useState(true),[cutaway,setCutaway]=useState(true),[notice,setNotice]=useState("");
 const [showPeople,setShowPeople]=useState(true);
 const purchases=usePurchases();
 const displayItems=useMemo(()=>plan.items.map(f=>({...f,color:purchaseColor(purchases.flags[f.inventoryId],f.color)})),[plan.items,purchases.flags]);
 const actionsRef=useRef<ViewActions|null>(null),active=plan.items.find(f=>f.id===selected),activeRoom=rooms.find(r=>r.id===focus);
 const select=useCallback((id:string|null)=>setSelected(id),[]);
 const errors=useMemo(()=>active?warnings(active,plan.items):[],[active,plan.items]);
 const warningCount=useMemo(()=>plan.items.filter(f=>warnings(f,plan.items).length).length,[plan.items]);
 const webglError=useCallback(()=>{setMode("2d");setNotice("3D ist in diesem Browser nicht verfügbar. Im 2D-Grundriss kannst du weiterplanen.")},[]);
 const update=(patch:Partial<PlanItem>)=>{if(active)plan.change(plan.current.current.map(f=>f.id===active.id?{...f,...patch}:f))};
 const rotate=(degrees:number)=>{if(active)update({rot:(active.rot+degrees*Math.PI/180+Math.PI*2)%(Math.PI*2)})};
 const remove=()=>{if(!active)return;plan.change(plan.current.current.filter(f=>f.id!==active.id));setSelected(null);setNotice("Aus dem Testplan entfernt. Der Inventareintrag bleibt erhalten.")};
 const place=(item:InventoryItem)=>{
  if(!item.width||!item.depth||!item.height||item.includeInPlan===false||item.room==="Terrasse"){setNotice("Diese Inventarposition ist nur zur Inventarisierung vorgesehen.");return}
  const placed=plan.current.current.filter(f=>f.inventoryId===item.id);
  if(placed.length>=item.quantity){setSection("plan");setSelected(placed[0].id);setFocus(rooms.find(r=>r.name===item.room)?.id??"all");setNotice("Alle Exemplare dieser Position sind bereits im Testplan.");return}
  const room=rooms.find(r=>r.name===item.room)??rooms[6],b=bounds(room.poly);
  const f:PlanItem={id:crypto.randomUUID(),inventoryId:item.id,name:item.title,room:item.room,x:(b.minX+b.maxX)/2,y:(b.minY+b.maxY)/2,w:item.width,d:item.depth,h:item.height,rot:0,kind:inferKind(item.title),color:"#99ad88"};
  let done=false;for(let y=b.minY+f.d/2+.10;y<=b.maxY-f.d/2&&!done;y+=.25)for(let x=b.minX+f.w/2+.10;x<=b.maxX-f.w/2;x+=.25){const candidate={...f,x,y};if(!warnings(candidate,plan.current.current).length){f.x=x;f.y=y;done=true;break}}
  plan.change([...plan.current.current,f]);setFocus(room.id);setSelected(f.id);setSection("plan");setNotice(done?"Möbel im Testplan platziert.":"Möbel platziert. Bitte die Platzierungshinweise prüfen.");
 };
 useEffect(()=>{const key=(e:KeyboardEvent)=>{if(section!=="plan"||(e.target instanceof HTMLElement&&e.target.closest("input,textarea,select,[contenteditable]")))return;
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="z"){e.preventDefault();if(e.shiftKey)plan.redo();else plan.undo();return}
  const f=plan.current.current.find(f=>f.id===selected);if(!f)return;
  const delta:Record<string,[number,number]>={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};
  if(delta[e.key]){e.preventDefault();const d=delta[e.key],step=e.shiftKey?.10:.01;plan.change(plan.current.current.map(item=>item.id===f.id?{...f,x:f.x+d[0]*step,y:f.y+d[1]*step}:item))}
  if(e.key==="Escape")setSelected(null);
 };window.addEventListener("keydown",key);return()=>window.removeEventListener("keydown",key)},[section,selected,plan]);
 const viewerProps={showPeople,items:displayItems,selected,focus,labels,dimensions,snap,cutaway,onSelect:select,onBegin:plan.begin,onPreview:(item:PlanItem)=>{const original=plan.current.current.find(f=>f.id===item.id);if(original)plan.preview({...item,color:original.color})},onEnd:plan.end,actionsRef,onError:webglError};
 return <main className="v2-main">
  <header className="v2-header"><div className="v2-brand"><span className="brand-mark">H</span><div><h1>Raumplaner</h1><span>Hombrechtikon</span></div><span className="v2-badge">V2 · Vorschau</span></div><nav className="mainNav" aria-label="Hauptnavigation"><button className={section==="plan"?"active":""} onClick={()=>setSection("plan")}>Raumplan</button><button className={section==="inventory"?"active":""} onClick={()=>setSection("inventory")}>Inventar & PDF</button></nav><a className="stable-link" href={stableUrl} target="_blank" rel="noreferrer">Aktuelle Version ↗</a></header>
  <div className="v2-banner"><span>Separater Raumplaner · Eure aktuelle Version bleibt erhalten.</span><span>Inventar, Fotos und Umzugsdaten sind in beiden Versionen gemeinsam.</span></div>
  {(notice||plan.storageError)&&<div className="v2-notice" role="status"><span>{plan.storageError||notice}</span>{notice&&!plan.storageError&&<button aria-label="Hinweis schliessen" onClick={()=>setNotice("")}>×</button>}</div>}
  {section==="inventory"?<InventoryPanel roomNames={roomNames} onPlace={place}/>:<>
   <PurchaseLegend error={purchases.error}/><label style={{display:"block",margin:"8px 16px",fontSize:13}}><input type="checkbox" checked={showPeople} onChange={e=>setShowPeople(e.target.checked)}/> Massstabsfiguren · 185 cm (Körperbreite ca. 48 cm)</label><div className="plan-toolbar"><div className="view-toggle" role="group" aria-label="Ansicht"><button aria-pressed={mode==="2d"} className={mode==="2d"?"active":""} onClick={()=>setMode("2d")}>Grundriss</button><button aria-pressed={mode==="3d"} className={mode==="3d"?"active":""} onClick={()=>setMode("3d")}>3D</button></div>
    <div className="history-buttons"><button title="Rückgängig (Ctrl/⌘ Z)" aria-label="Rückgängig" disabled={!plan.canUndo} onClick={plan.undo}>↶</button><button title="Wiederholen (Ctrl/⌘ Shift Z)" aria-label="Wiederholen" disabled={!plan.canRedo} onClick={plan.redo}>↷</button></div>
    <label><input type="checkbox" checked={snap} onChange={e=>setSnap(e.target.checked)}/>Einrasten</label><label><input type="checkbox" checked={labels} onChange={e=>setLabels(e.target.checked)}/>Bezeichnungen</label>
    {mode==="2d"?<label><input type="checkbox" checked={dimensions} onChange={e=>setDimensions(e.target.checked)}/>Masse</label>:<label><input type="checkbox" checked={cutaway} onChange={e=>setCutaway(e.target.checked)}/>Wände niedrig</label>}
    <button className="fit-button" onClick={()=>actionsRef.current?.fit()}>Ansicht einpassen</button>
   </div>
   <div className="v2-workspace">
    <aside className="rooms-panel"><div className="panel-heading"><span className="kicker">DEINE WOHNUNG</span><h2>Räume & Bereiche</h2></div>
     <button className={focus==="all"?"room-row current":"room-row"} onClick={()=>{setFocus("all");setSelected(null)}}><span>Gesamtwohnung</span><small>Übersicht</small></button>
     <div className="room-list">{rooms.filter(r=>!r.zone).map(r=><button key={r.id} className={focus===r.id?"room-row current":"room-row"} onClick={()=>{setFocus(r.id);setSelected(null)}}><span>{r.name}</span><small>ca. {fmt(area(r.poly))} m²</small></button>)}</div>
     <details className="subareas"><summary>Weitere Bereiche</summary>{rooms.filter(r=>r.zone).map(r=><button key={r.id} className={focus===r.id?"room-row current":"room-row"} onClick={()=>{setFocus(r.id);setSelected(null)}}>{r.name}</button>)}<div className="inventory-zone">Terrasse<small>Nur im Inventar zuordnen</small></div></details>
     <details className="plan-notes"><summary>Planstand & Annahmen</summary><p>Nach Originalplan neu abgeglichen. Raumflächen sind aus der Modellgeometrie berechnet.</p><p>Raumhöhe: 2,39 m laut Schnitt. Einbauten, Öffnungsdetails und Nischen sind angenähert. Für die Küche fehlt der separate Detailplan.</p><p>Keller: separat dargestellt, 3 × 3 m (9 m²). Höhe 2,39 m angenommen; Türposition noch nicht erfasst.</p><p>Vor einer Bestellung vor Ort nachmessen.</p></details>
    </aside>
    <section className="v2-stage" aria-label="Planungsfläche"><div className="stage-title"><span>{activeRoom?.name??"Gesamtwohnung"}</span><small>{mode==="2d"?"2D · massstäblich":"3D · schematische Möbelformen"}</small></div>
     {mode==="2d"?<Plan2D {...viewerProps}/>:<Plan3D {...viewerProps}/>}
     <div className="zoom-buttons"><button aria-label="Hineinzoomen" onClick={()=>actionsRef.current?.zoom(1.25)}>+</button><button aria-label="Herauszoomen" onClick={()=>actionsRef.current?.zoom(.8)}>−</button></div>
    </section>
    <aside className="object-panel"><div className="panel-heading"><span className="kicker">EINRICHTEN</span><h2>{active?"Möbel bearbeiten":"Möbel im Plan"}</h2></div>
     {active?<div className="item-editor"><div className="selected-name">{active.name}</div><span className="muted">{active.room}</span>
      <div className="item-measure"><span>Breite <strong>{fmt(active.w)} m</strong></span><span>Tiefe <strong>{fmt(active.d)} m</strong></span><span>Höhe <strong>{fmt(active.h)} m</strong></span></div>
      <p className="small-note">Masse aus dem Inventar. Die Darstellung bleibt beim Verschieben gleich gross.</p>
      <label className="field">Drehwinkel<div className="degree-field"><input aria-label="Drehwinkel in Grad" type="number" min="0" max="359" value={Math.round(active.rot*180/Math.PI)%360} onChange={e=>{const value=Number(e.target.value);if(Number.isFinite(value))update({rot:((value%360+360)%360)*Math.PI/180})}}/><span>°</span></div></label>
      <div className="rotation-buttons"><button onClick={()=>rotate(-15)}>−15°</button><button onClick={()=>rotate(15)}>+15°</button><button onClick={()=>rotate(90)}>+90°</button></div>
      <label className="field">Möbelform<select value={active.kind} onChange={e=>update({kind:e.target.value as FurnitureKind})}>{kinds.map(k=><option key={k.value} value={k.value}>{k.label}</option>)}</select></label>
      <label className="field color-field">{purchases.flags[active.inventoryId]?"Grundfarbe (Neubeschaffung wird violett angezeigt)":"Farbe"}<input aria-label="Möbelfarbe" type="color" value={active.color} onChange={e=>update({color:e.target.value})}/></label>
      <button className="outline-action" onClick={()=>{const f=snapItem(active,true);update({x:f.x,y:f.y})}}>Am Raster / Wand ausrichten</button>
      {errors.length?<div className="placement-warning"><strong>Platzierung prüfen</strong><ul>{errors.map(e=><li key={e}>{e}</li>)}</ul></div>:<div className="placement-good">Keine Überschneidung im Modell erkannt</div>}
      <button className="remove-placement" onClick={remove}>Aus dem Plan entfernen</button>
      <p className="small-note">Pfeiltasten: 1 cm · Shift: 10 cm<br/>Alt beim Ziehen: ohne Einrasten</p>
     </div>:<div className="placement-intro"><p>Erfasse Möbel im Inventar und platziere sie hier. Ziehe eine freie Fläche, um den Plan zu verschieben.</p><button className="add-from-inventory" onClick={()=>setSection("inventory")}>+ Möbel aus Inventar</button>{!plan.items.length&&<div className="empty-plan"><span>Dein Testplan ist noch leer.</span><p>Bestehende Inventarsicherung importieren oder neue Testmöbel erfassen.</p></div>}</div>}
     {!!plan.items.length&&<div className="placed-list"><div className="list-caption">{plan.items.length} platziert{warningCount? ` · ${warningCount} mit Hinweis`:""}</div>{plan.items.filter(f=>!activeRoom||f.room===activeRoom.name).map(f=><button className={selected===f.id?"placed-item current":"placed-item"} key={f.id} onClick={()=>setSelected(f.id)}><i style={{background:purchaseColor(purchases.flags[f.inventoryId],f.color)}}/><span>{f.name}<small>{fmt(f.w)} × {fmt(f.d)} m</small></span></button>)}<button className="outline-action" onClick={()=>setSection("inventory")}>Inventar öffnen</button></div>}
    </aside>
   </div>
   <footer className="plan-footer"><span>{plan.storageError?"Speichern nicht möglich":plan.ready?"Testplan wird lokal gespeichert":"Testplan wird geladen"}</span><span>5-cm-Raster · Raumhöhe 2,39 m · Einbaudetails angenähert</span></footer>
  </>}
 </main>;
}
