import test from "node:test";
import assert from "node:assert/strict";
import {ShapeUtils,Vector2} from "three";
import {area,bounds,fixtures,itemCorners,openings,overlap,rect,roomNames,rooms,snapItem,wallDistances,wallPolygon,walls,warnings} from "../app/plan/geometry.ts";

const item=(overrides={})=>({id:"test",inventoryId:"inventory",name:"Testmöbel",room:"Büro Reto",x:2,y:2,w:1,d:.6,h:.8,rot:0,kind:"table",color:"#99ad88",...overrides});
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
test("printed room dimensions and orientation match the scan",()=>{
 for(const[id,w,d]of[["reto",4.13,3.80],["tam",3.51,3.30],["bad",2.22,2.75],["wc",1.31,2.75],["reduit",2.12,3.29],["wohnen",7.90,7.82],["noa",4.10,2.93],["eltern",3.68,4.90],["dusche",3,2]]){
  const r=rooms.find(r=>r.id===id),b=bounds(r.poly);close(b.maxX-b.minX,w);close(b.maxY-b.minY,d);close(area(r.poly),w*d);
 }
 assert.ok(rooms.find(r=>r.id==="reto").label[1]<rooms.find(r=>r.id==="wohnen").label[1]);
 assert.ok(rooms.find(r=>r.id==="noa").label[0]>rooms.find(r=>r.id==="wohnen").label[0]);
});
test("real room polygons do not double-count zones",()=>{
 const actual=rooms.filter(r=>!r.zone);
 const triangles=poly=>ShapeUtils.triangulateShape(poly.map(p=>new Vector2(...p)),[]).map(indices=>indices.map(i=>poly[i]));
 for(let i=0;i<actual.length;i++)for(let j=i+1;j<actual.length;j++)assert.equal(triangles(actual[i].poly).some(a=>triangles(actual[j].poly).some(b=>overlap(a,b))),false,`${actual[i].name} overlaps ${actual[j].name}`);
});
test("Keller is a detached 3 m room and Terrasse remains inventory-only",()=>{
 assert.ok(roomNames.includes("Keller"));assert.ok(roomNames.includes("Terrasse"));
 assert.ok(!rooms.some(r=>r.name==="Terrasse"));
 const cellar=rooms.find(r=>r.name==="Keller"),b=bounds(cellar.poly);close(b.maxX-b.minX,3);close(b.maxY-b.minY,3);close(area(cellar.poly),9);
 assert.ok(b.minX>Math.max(...rooms.filter(r=>r!==cellar).map(r=>bounds(r.poly).maxX)));
 const f=item({room:"Keller",x:19.5,y:3.5});assert.deepEqual(warnings(f,[f]),[]);
 assert.ok(warnings({...f,x:17.9},[]).some(w=>w.includes("Wand")));
 const snapped=snapItem({...f,x:18.52},true);close(snapped.w,f.w);close(snapped.d,f.d);close(snapped.x,18.5);
 assert.equal(new Set(roomNames).size,roomNames.length);
});
test("all door openings have a clear midpoint through the wall",()=>{
 for(const o of openings.filter(o=>o.kind==="door")){
  const x=(o.a[0]+o.b[0])/2,y=(o.a[1]+o.b[1])/2;
  assert.ok(!walls.some(w=>overlap(rect(x-.015,y-.015,.03,.03),wallPolygon(w))),o.id);
 }
});
test("furniture touching a wall does not shrink or falsely collide",()=>{
 const f=item({x:.50});assert.equal(warnings(f,[f]).length,0);
 assert.ok(warnings({...f,x:.45},[{...f,x:.45}]).some(w=>w.includes("Wand")));
});
test("snapping and rotation preserve dimensions at arbitrary angles",()=>{
 for(const rot of[0,Math.PI/6,Math.PI/2,Math.PI*.93]){
  const f=item({x:.56,y:1.63,rot}),snapped=snapItem(f,true);
  assert.equal(snapped.w,f.w);assert.equal(snapped.d,f.d);assert.equal(snapped.h,f.h);
  close(area(itemCorners(snapped)),f.w*f.d);
 }
 const aligned=snapItem(item({x:.53}),true);close(aligned.x,.5);
});
test("unobstructed position and distances are measured from footprint",()=>{
 const f=item();assert.deepEqual(warnings(f,[f]),[]);
 const left=wallDistances(f).find(d=>d.b[0]<d.a[0]);close(left.length,1.5);
 const moved={...f,x:3};const next=wallDistances(moved).find(d=>d.b[0]<d.a[0]);close(next.length,2.5);
});
test("fixtures, other furniture, door swings and outside areas raise warnings",()=>{
 const bath=fixtures.find(f=>f.id==="wanne");
 assert.ok(warnings(item({x:bath.x,y:bath.y}),[]).some(w=>w.includes("Einbau")));
 const f=item();assert.ok(warnings(f,[f,item({id:"other",x:2.1})]).some(w=>w.includes("Testmöbel")));
 assert.ok(warnings(item({x:-2}),[]).some(w=>w.includes("ausserhalb")));
 const door=item({x:3.85,y:3.2,w:.3,d:.3});assert.ok(warnings(door,[door]).some(w=>w.includes("Tür")));
});
