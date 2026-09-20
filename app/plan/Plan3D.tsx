import {createScalePeople,showScalePeople} from "../scalePeople";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { bounds, doorSector, fixtures, openings, rooms, snapItem, wallHeight, walls, type PlanItem } from "./geometry";
import type { PlannerProps } from "./Plan2D";

function dispose(root:THREE.Object3D){
 const geometry=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>(),textures=new Set<THREE.Texture>();
 root.traverse(o=>{const m=o as THREE.Mesh;if(m.geometry)geometry.add(m.geometry);if(m.material)(Array.isArray(m.material)?m.material:[m.material]).forEach(mat=>{materials.add(mat);Object.values(mat).forEach(v=>{if(v instanceof THREE.Texture)textures.add(v)})})});
 geometry.forEach(g=>g.dispose());textures.forEach(t=>t.dispose());materials.forEach(m=>m.dispose());
}
function furnitureModel(f:PlanItem){
 const g=new THREE.Group(),material=new THREE.MeshStandardMaterial({color:f.color,roughness:.82}),light=new THREE.MeshStandardMaterial({color:"#e9e7dc",roughness:1});
 const part=(x:number,y:number,z:number,w:number,h:number,d:number,mat=material)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;g.add(m)};
 const legs=(height:number)=>{for(const x of[-.40,.40])for(const z of[-.38,.38])part(x,height/2,z,.07,height,.07)};
 if(f.kind==="table"){part(0,.95,0,1,.10,1);legs(.90)}
 else if(f.kind==="chair"){legs(.45);part(0,.51,0,1,.12,1);part(0,.78,-.44,1,.44,.12)}
 else if(f.kind==="bed"){part(0,.25,0,1,.45,1);part(0,.63,.02,.95,.31,.94,light);part(0,.85,-.46,1,.30,.08);for(const x of[-.25,.25])part(x,.86,-.28,.43,.12,.24,light)}
 else if(f.kind==="sofa"){part(0,.24,0,1,.40,1);part(0,.52,.03,.78,.18,.82,light);part(0,.79,-.40,1,.42,.2);for(const x of[-.44,.44])part(x,.60,.05,.12,.36,.90)}
 else if(f.kind==="shelf"){part(0,.05,0,1,.1,1);part(0,.96,0,1,.08,1);part(0,.5,-.47,1,1,.06);for(const x of[-.46,.46])part(x,.5,0,.08,1,1);for(const y of[.34,.66])part(0,y,0,.84,.05,.94)}
 else part(0,.5,0,1,1,1);
 g.scale.set(f.w,f.h,f.d);g.userData.furnitureId=f.id;return g;
}
type Runtime={people:(show:boolean,focus:string)=>void;sync:(items:PlanItem[],selected:string|null,labels:boolean)=>void;focus:(id:string)=>void;walls:(low:boolean)=>void};
export default function Plan3D(props:PlannerProps){
 const host=useRef<HTMLDivElement>(null),runtime=useRef<Runtime|null>(null),latest=useRef(props);
 useEffect(()=>{latest.current=props},[props]);
 const {actionsRef,onError}=props;
 useEffect(()=>{
  const el=host.current;if(!el)return;
  let renderer:THREE.WebGLRenderer;
  try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:"low-power"})}catch{onError?.();return}
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.setSize(el.clientWidth,el.clientHeight);
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.setClearColor("#f0ede5");el.appendChild(renderer.domElement);
  const scene=new THREE.Scene(),staticGroup=new THREE.Group(),furniture=new THREE.Group(),wallGroup=new THREE.Group(),tagLayer=document.createElement("div");tagLayer.className="model-tags";el.appendChild(tagLayer);scene.add(staticGroup,furniture,wallGroup);
  scene.add(new THREE.HemisphereLight("#fffdf5","#c4c9bd",2.5));const sun=new THREE.DirectionalLight("#fff5db",3);sun.position.set(-6,18,3);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-18,right:18,top:18,bottom:-18});sun.shadow.bias=-.001;scene.add(sun);
  const camera=new THREE.OrthographicCamera(-12,12,10,-10,.05,180);camera.position.set(23,24,27);
  const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=false;controls.screenSpacePanning=true;controls.maxPolarAngle=Math.PI*.47;controls.minZoom=.3;controls.maxZoom=8;controls.mouseButtons.LEFT=THREE.MOUSE.PAN;controls.mouseButtons.RIGHT=THREE.MOUSE.ROTATE;controls.touches.ONE=THREE.TOUCH.PAN;controls.touches.TWO=THREE.TOUCH.DOLLY_PAN;
  const mat=(color:string)=>new THREE.MeshStandardMaterial({color,roughness:.85});
  const box=(parent:THREE.Group,x:number,y:number,z:number,w:number,h:number,d:number,color:string)=>{
   const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(color));mesh.position.set(x,y+h/2,z);mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);return mesh;
  };
  rooms.filter(r=>!r.zone).forEach(r=>{const shape=new THREE.Shape();r.poly.forEach(([x,y],i)=>i?shape.lineTo(x,-y):shape.moveTo(x,-y));const floor=new THREE.Mesh(new THREE.ShapeGeometry(shape),mat(r.tone));floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;floor.userData.room=r.id;staticGroup.add(floor)});
  walls.forEach(w=>{const length=Math.hypot(w.b[0]-w.a[0],w.b[1]-w.a[1]),m=box(wallGroup,(w.a[0]+w.b[0])/2,0,(w.a[1]+w.b[1])/2,length,wallHeight,w.thickness,w.outer?"#ddd7c9":"#f6f3e9");m.rotation.y=-Math.atan2(w.b[1]-w.a[1],w.b[0]-w.a[0])});
  openings.forEach(o=>{
   const length=Math.hypot(o.b[0]-o.a[0],o.b[1]-o.a[1]),g=new THREE.Group();g.position.set(o.a[0],0,o.a[1]);g.rotation.y=-Math.atan2(o.b[1]-o.a[1],o.b[0]-o.a[0]);staticGroup.add(g);
   if(o.kind==="window"){
    const glass=new THREE.Mesh(new THREE.BoxGeometry(length,2.08,.025),new THREE.MeshStandardMaterial({color:"#accad1",transparent:true,opacity:.27,roughness:.18}));glass.position.set(length/2,1.08,0);g.add(glass);
    for(const x of[0,length/2,length])box(g,x,0,0,.04,2.16,.065,"#777f7b");
    for(const y of[.03,2.14])box(g,length/2,y,0,length,.035,.065,"#777f7b");
   }else{
    const sector=doorSector(o),last=sector[sector.length-1];
    const leaf=box(staticGroup,(o.a[0]+last[0])/2,0,(o.a[1]+last[1])/2,length,2.02,.035,"#c5b291");leaf.rotation.y=-Math.atan2(last[1]-o.a[1],last[0]-o.a[0]);leaf.userData.door=true;
   }
  });
  fixtures.forEach(f=>{
   const g=new THREE.Group();g.position.set(f.x,0,f.y);staticGroup.add(g);
   if(f.kind==="bath"){box(g,0,0,0,f.w,f.h,f.d,"#f5f4ed");box(g,0,f.h,.02,f.w*.77,.012,f.d*.85,"#c0d3d0")}
   else if(f.kind==="basin"){box(g,0,0,0,f.w,f.h-.04,f.d,"#dad8ca");box(g,0,f.h-.04,0,f.w,.05,f.d,"#fdfcf7");box(g,0,f.h+.01,0,f.w*.70,.012,f.d*.62,"#bbcdc8")}
   else if(f.kind==="toilet"){const bowl=new THREE.Mesh(new THREE.CylinderGeometry(f.w/2,f.w*.42,f.h,24),mat("#f9f8f3"));bowl.scale.z=f.d/f.w*.76;bowl.position.set(0,f.h/2,.07);g.add(bowl);box(g,0,0,-f.d*.35,f.w,.73,.16,"#f5f4ef")}
   else if(f.kind==="shower"){box(g,0,0,0,f.w,.06,f.d,"#edf0e9");const pane=new THREE.Mesh(new THREE.BoxGeometry(.018,1.9,f.d),new THREE.MeshStandardMaterial({color:"#b2d0d0",transparent:true,opacity:.3}));pane.position.set(-f.w/2,.95,0);g.add(pane)}
   else{box(g,0,0,0,f.w,f.h,f.d,"#c4b69d");if(f.kind!=="closet")box(g,0,f.h,0,f.w+.025,.035,f.d+.025,"#69655a");
    if(f.kind==="counter"){box(g,0,f.h+.037,f.d*.30,f.w*.7,.012,.45,"#b9c9c5");for(const x of[-.15,.15])for(const z of[-.87,-.55]){const ring=new THREE.Mesh(new THREE.CylinderGeometry(.1,.1,.015,20),mat("#292d2c"));ring.position.set(x,f.h+.045,z);g.add(ring)}}
   }
  });
  const people=createScalePeople(rooms);scene.add(people);
  let selectedOutline:THREE.BoxHelper|null=null,activePointer:number|null=null,dragId:string|null=null;
  const ray=new THREE.Raycaster(),mouse=new THREE.Vector2(),plane=new THREE.Plane(new THREE.Vector3(0,1,0),0),offset=new THREE.Vector3(),models=new Map<string,THREE.Group>(),tags=new Map<string,HTMLDivElement>();
  const pick=(e:MouseEvent)=>{const r=renderer.domElement.getBoundingClientRect();mouse.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(mouse,camera);let object:THREE.Object3D|null=ray.intersectObjects(furniture.children,true)[0]?.object??null;while(object&&object.userData.furnitureId==null)object=object.parent;return object};
  const fit=()=>{const room=rooms.find(r=>r.id===latest.current.focus),b=room?bounds(room.poly):{minX:0,minY:0,maxX:21.2,maxY:15.16},cx=(b.minX+b.maxX)/2,cy=(b.minY+b.maxY)/2,span=Math.max(b.maxX-b.minX,b.maxY-b.minY,3),aspect=el.clientWidth/el.clientHeight,vertical=span*1.4/Math.min(1,aspect);camera.left=-vertical*aspect/2;camera.right=-camera.left;camera.top=vertical/2;camera.bottom=-camera.top;camera.zoom=1;camera.position.set(cx+span*.8,span*1.4,cy+span);controls.target.set(cx,0,cy);camera.updateProjectionMatrix();controls.update()};
  const sync:Runtime["sync"]=(items,selected,labels)=>{
   const ids=new Set(items.map(f=>f.id));
   for(const[id,model]of models)if(!ids.has(id)){furniture.remove(model);dispose(model);models.delete(id);tags.get(id)?.remove();tags.delete(id)}
   for(const f of items){const signature=[f.kind,f.w,f.d,f.h,f.color].join("/");let model=models.get(f.id);
    if(!model||model.userData.signature!==signature){if(model){furniture.remove(model);dispose(model)}model=furnitureModel(f);model.userData.signature=signature;models.set(f.id,model);furniture.add(model)}
    model.position.set(f.x,0,f.y);model.rotation.y=-f.rot;
    let tag=tags.get(f.id);if(!tag){tag=document.createElement("div");tag.className="model-tag";tagLayer.appendChild(tag);tags.set(f.id,tag)}tag.textContent=f.name;tag.hidden=!labels;
   }
   if(selectedOutline){scene.remove(selectedOutline);dispose(selectedOutline);selectedOutline=null}
   const model=selected?models.get(selected):null;if(model){selectedOutline=new THREE.BoxHelper(model,0x547343);scene.add(selectedOutline)}
  };
  runtime.current={people:(show,focus)=>showScalePeople(people,show,rooms.find(r=>r.id===focus)?.name),sync,focus:()=>fit(),walls:low=>{wallGroup.children.forEach(o=>{o.scale.y=low?.25:1;o.position.y=wallHeight*(low?.25:1)/2});staticGroup.children.filter(o=>o.userData.door).forEach(o=>{o.scale.y=low?.30:1;o.position.y=2.02*(low?.30:1)/2})}};
  actionsRef.current={fit,zoom:factor=>{camera.zoom=THREE.MathUtils.clamp(camera.zoom*factor,.3,8);camera.updateProjectionMatrix()}};
  const down=(e:PointerEvent)=>{if(e.button!==0||!e.isPrimary||activePointer!==null)return;const object=pick(e);if(!object){latest.current.onSelect(null);return}const p=new THREE.Vector3();if(!ray.ray.intersectPlane(plane,p))return;e.preventDefault();e.stopImmediatePropagation();controls.enabled=false;activePointer=e.pointerId;dragId=object.userData.furnitureId;offset.copy(object.position).sub(p);renderer.domElement.setPointerCapture(e.pointerId);latest.current.onBegin();latest.current.onSelect(dragId)};
  const move=(e:PointerEvent)=>{if(e.pointerId!==activePointer||!dragId)return;pick(e);const p=new THREE.Vector3();if(ray.ray.intersectPlane(plane,p)){p.add(offset);const f=latest.current.items.find(f=>f.id===dragId);if(f)latest.current.onPreview(snapItem({...f,x:p.x,y:p.z},latest.current.snap&&!e.altKey))}};
  const up=(e:PointerEvent)=>{if(e.pointerId!==activePointer)return;latest.current.onEnd();activePointer=null;dragId=null;controls.enabled=true;if(renderer.domElement.hasPointerCapture(e.pointerId))renderer.domElement.releasePointerCapture(e.pointerId)};
  const lost=(e:Event)=>{e.preventDefault();onError?.()};
  renderer.domElement.addEventListener("pointerdown",down,true);renderer.domElement.addEventListener("pointermove",move);renderer.domElement.addEventListener("pointerup",up);renderer.domElement.addEventListener("pointercancel",up);renderer.domElement.addEventListener("lostpointercapture",up);renderer.domElement.addEventListener("webglcontextlost",lost);
  let width=el.clientWidth,height=el.clientHeight;
  const observer=new ResizeObserver(()=>{const w=el.clientWidth,h=el.clientHeight;if(!w||!h)return;const units=(camera.top-camera.bottom)/height;camera.left*=w/width;camera.right*=w/width;camera.top=h*units/2;camera.bottom=-camera.top;width=w;height=h;camera.updateProjectionMatrix();renderer.setSize(w,h)});observer.observe(el);
  let frame=0;const projected=new THREE.Vector3();
  const animate=()=>{controls.update();if(selectedOutline)selectedOutline.update();renderer.render(scene,camera);for(const f of latest.current.items){const tag=tags.get(f.id);if(!tag||tag.hidden)continue;projected.set(f.x,f.h+.12,f.y).project(camera);tag.style.transform=`translate(${(projected.x+1)*width/2}px,${(1-projected.y)*height/2}px) translate(-50%,-100%)`;tag.style.visibility=projected.z<-1||projected.z>1?"hidden":"visible"}frame=requestAnimationFrame(animate)};fit();animate();
  return()=>{cancelAnimationFrame(frame);observer.disconnect();controls.dispose();runtime.current=null;actionsRef.current=null;renderer.domElement.removeEventListener("webglcontextlost",lost);renderer.domElement.removeEventListener("pointerdown",down,true);renderer.domElement.removeEventListener("pointermove",move);renderer.domElement.removeEventListener("pointerup",up);renderer.domElement.removeEventListener("pointercancel",up);renderer.domElement.removeEventListener("lostpointercapture",up);dispose(scene);renderer.dispose();renderer.domElement.remove();tagLayer.remove()};
 },[actionsRef,onError]);
 useEffect(()=>{runtime.current?.sync(props.items,props.selected,props.labels)},[props.items,props.selected,props.labels]);
 useEffect(()=>{runtime.current?.focus(props.focus)},[props.focus]);
 useEffect(()=>{runtime.current?.walls(props.cutaway)},[props.cutaway]);
 useEffect(()=>{runtime.current?.people(props.showPeople===true,props.focus)},[props.showPeople,props.focus]);
 return <div className="plan3d" ref={host}><div className="canvas-help">Ziehen: verschieben · Rechts ziehen: drehen · Mausrad: Zoom</div></div>;
}
