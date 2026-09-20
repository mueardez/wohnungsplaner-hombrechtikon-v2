// Metres. The original sheet is viewed with the children's rooms at the top.
// x points right, y points down. 3D uses (x, height, y).
export type Point = [number, number];
export type Room = { id: string; name: string; poly: Point[]; label: Point; tone: string; measured?: string; zone?: boolean };
export type Wall = { a: Point; b: Point; thickness: number; outer?: boolean };
export type Opening = { id: string; kind: "door" | "window"; a: Point; b: Point; swing?: number };
export type Fixture = { id: string; kind: "bath" | "basin" | "toilet" | "shower" | "counter" | "island" | "closet"; name: string; x: number; y: number; w: number; d: number; h: number };
export type FurnitureKind = "box" | "table" | "chair" | "sofa" | "bed" | "shelf";
export type PlanItem = { id: string; inventoryId: string; name: string; room: string; x: number; y: number; w: number; d: number; h: number; rot: number; kind: FurnitureKind; color: string };
export const rect = (x: number,y: number,w: number,d: number):Point[] => [[x,y],[x+w,y],[x+w,y+d],[x,y+d]];
export const rooms:Room[] = [
 {id:"reto",name:"Büro Reto",poly:rect(0,0,4.13,3.80),label:[2.06,1.85],tone:"#eee5d3",measured:"4,13 × 3,80 m"},
 {id:"tam",name:"Büro Tam",poly:rect(0,3.92,3.51,3.30),label:[1.75,5.56],tone:"#eee5d3",measured:"3,51 × 3,30 m"},
 {id:"bad",name:"Bad",poly:rect(4.25,0,2.22,2.75),label:[5.38,1.55],tone:"#dfeae7",measured:"2,22 × 2,75 m"},
 {id:"wc",name:"WC",poly:rect(6.59,0,1.31,2.75),label:[7.24,1.63],tone:"#dfeae7",measured:"1,31 × 2,75 m"},
 {id:"reduit",name:"Reduit",poly:rect(5.78,3.92,2.12,3.29),label:[6.84,5.35],tone:"#e5e1d9",measured:"2,12 × 3,29 m"},
 {id:"entree",name:"Entrée",poly:[[4.25,2.87],[7.90,2.87],[7.90,3.77],[5.63,3.77],[5.63,7.34],[3.63,7.34],[3.63,5.97],[4.25,5.97]],label:[4.87,4.15],tone:"#f2ede4"},
 {id:"wohnen",name:"Wohnen / Essen",poly:rect(0,7.34,7.90,7.82),label:[3.22,12.1],tone:"#f3e9d8",measured:"7,90 × 7,82 m"},
 {id:"kueche",name:"Küche",poly:rect(5.10,7.34,2.80,3.30),label:[6.45,10.90],tone:"#f3e9d8",zone:true},
 {id:"noa",name:"Kinderzimmer Noa",poly:rect(8.15,12.23,4.10,2.93),label:[10.2,13.70],tone:"#eee5d3",measured:"4,10 × 2,93 m"},
 {id:"eltern",name:"Eltern",poly:rect(12.37,10.26,3.68,4.90),label:[14.20,13.50],tone:"#eee5d3",measured:"3,68 × 4,90 m"},
 {id:"gang",name:"Gang Noa / Eltern",poly:rect(8.15,10.26,4.10,1.85),label:[10.20,11.15],tone:"#f2ede4"},
 {id:"nische-noa",name:"Nische Noa",poly:rect(8.15,10.26,4.10,.78),label:[10.15,10.65],tone:"#f2ede4",zone:true},
 {id:"nische-eltern",name:"Nische Eltern",poly:rect(12.37,10.26,2.30,.78),label:[13.52,10.65],tone:"#f2ede4",zone:true},
 {id:"dusche",name:"Dusche",poly:rect(13.05,8.04,3,2),label:[14.55,9.28],tone:"#dfeae7",measured:"3,00 × 2,00 m"},
 {id:"keller",name:"Keller",poly:rect(18,2,3,3),label:[19.5,3.5],tone:"#e0e4e8",measured:"3,00 × 3,00 m"},
 {id:"gang-dusche",name:"Gang Dusche",poly:rect(12.37,10.16,3.68,.98),label:[14.3,10.63],tone:"#f2ede4",zone:true}
];
// Subareas remain assignable; they are not added to total floor area.
export const roomNames=rooms.map(r=>r.name).concat("Terrasse");
export const wallHeight=2.39; // Read from section A–A; not a field measurement.
export const walls:Wall[]=[];
const wall=(a:Point,b:Point,thickness=.12,outer=false)=>walls.push({a,b,thickness,outer});
// Detached cellar: 3 x 3 m clear interior; height assumed, door position unknown.
wall([17.94,1.94],[21.06,1.94]);wall([21.06,1.94],[21.06,5.06]);
wall([21.06,5.06],[17.94,5.06]);wall([17.94,5.06],[17.94,1.94]);
// Outer walls are split at actual openings; there are no solid walls behind doors.
wall([-.10,-.10],[8.025,-.10],.20,true);
[[0,.95],[1.95,2.20],[3.20,4.37],[5.37,5.62],[6.62,8.21],[11.77,15.16]].forEach(([a,b])=>wall([-.10,a],[ -.10,b],.20,true));
[[0,.65],[1.65,3.52],[7.20,8.025]].forEach(([a,b])=>wall([a,15.26],[b,15.26],.20,true));
wall([8.025,0],[8.025,2.60],.25,true);wall([8.025,3.58],[8.025,11.22],.25,true);wall([8.025,12.05],[8.025,15.26],.25,true);
[[8.025,8.90],[10.76,13.59],[15.45,16.15]].forEach(([a,b])=>wall([a,15.26],[b,15.26],.20,true));
wall([16.15,8.04],[16.15,15.26],.20,true);
wall([8.15,10.08],[12.99,10.08],.12,true);wall([12.99,8.0],[12.99,10.08],.12,true);
wall([12.99,7.98],[16.15,7.98],.12,true);
// Upper rooms and hall storage.
wall([0,3.86],[4.19,3.86]);wall([4.19,0],[4.19,2.79]);wall([4.19,3.67],[4.19,3.86]);
wall([4.25,2.81],[4.94,2.81]);wall([5.72,2.81],[6.47,2.81]);wall([6.53,0],[6.53,2.81]);
wall([6.59,2.81],[6.82,2.81]);wall([7.50,2.81],[7.90,2.81]);
wall([0,7.28],[3.57,7.28]);wall([3.57,3.92],[3.57,6.21]);wall([3.57,7.09],[3.57,7.28]);
wall([5.705,3.845],[7.9,3.845],.15);wall([5.705,3.845],[5.705,5.97],.15);wall([5.705,6.75],[5.705,7.285],.15);wall([5.705,7.285],[7.9,7.285],.15);
// Lower wing: hall, bedroom door and shower entrance.
wall([8.15,12.17],[8.93,12.17]);wall([9.81,12.17],[12.31,12.17]);
wall([12.31,10.14],[12.31,11.13]);wall([12.31,12.01],[12.31,15.16]);
wall([13.05,10.10],[14.67,10.10]);wall([15.40,10.10],[16.05,10.10]);
// Small structural pier in living area (45 × 20 cm on the scan).
wall([3.30,10.89],[3.75,10.89],.20);
export const openings:Opening[]=[
 {id:"reto",kind:"door",a:[4.19,3.67],b:[4.19,2.79],swing:-1},
 {id:"tam",kind:"door",a:[3.57,7.09],b:[3.57,6.21],swing:-1},
 {id:"bad",kind:"door",a:[4.94,2.81],b:[5.72,2.81],swing:-1},
 {id:"wc",kind:"door",a:[6.82,2.81],b:[7.50,2.81],swing:-1},
 {id:"reduit",kind:"door",a:[5.705,6.75],b:[5.705,5.97],swing:1},
 {id:"noa",kind:"door",a:[8.93,12.17],b:[9.81,12.17],swing:1},
 {id:"eltern",kind:"door",a:[12.31,12.01],b:[12.31,11.13],swing:1},
 {id:"dusche",kind:"door",a:[15.40,10.10],b:[14.67,10.10],swing:-1},
 {id:"eingang",kind:"door",a:[8.025,2.60],b:[8.025,3.58],swing:1},
 ...([[.95,1.95],[2.20,3.20],[4.37,5.37],[5.62,6.62],[8.21,11.77]] as Point[]).map(([a,b],i)=>({id:`west-${i}`,kind:"window" as const,a:[-.10,a] as Point,b:[-.10,b] as Point})),
 ...([[.65,1.65],[3.52,7.20],[8.90,10.76],[13.59,15.45]] as Point[]).map(([a,b],i)=>({id:`south-${i}`,kind:"window" as const,a:[a,15.26] as Point,b:[b,15.26] as Point}))
];
export const fixtures:Fixture[]=[
 {id:"wanne",kind:"bath",name:"Badewanne",x:4.72,y:1.70,w:.70,d:1.70,h:.58},
 {id:"lavabo-bad",kind:"basin",name:"Lavabo Bad",x:4.92,y:.42,w:.65,d:.48,h:.84},
 {id:"wc",kind:"toilet",name:"WC",x:7.24,y:1.38,w:.42,d:.68,h:.43},
 {id:"lavabo-wc",kind:"basin",name:"Lavabo WC",x:7.24,y:.42,w:.48,d:.40,h:.82},
 {id:"garderobe",kind:"closet",name:"Garderobe",x:3.94,y:4.945,w:.62,d:2.05,h:2.10},
 {id:"hochschrank",kind:"closet",name:"Küchenhochschrank",x:6.22,y:7.67,w:.88,d:.60,h:2.10},
 {id:"zeile",kind:"counter",name:"Küche · Spüle / Kochfeld",x:7.58,y:9.20,w:.64,d:2.55,h:.92},
 {id:"insel",kind:"island",name:"Kücheninsel",x:5.71,y:9.56,w:.82,d:1.26,h:.92},
 {id:"dusche",kind:"shower",name:"Dusche",x:13.58,y:8.59,w:1,d:1,h:.08},
 {id:"lavabo-dusche",kind:"basin",name:"Lavabo Dusche",x:14.51,y:8.43,w:.66,d:.48,h:.84}
];
export function bounds(points:Point[]){const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);return{minX:Math.min(...xs),maxX:Math.max(...xs),minY:Math.min(...ys),maxY:Math.max(...ys)}}
export function area(points:Point[]){return Math.abs(points.reduce((n,p,i)=>{const q=points[(i+1)%points.length];return n+p[0]*q[1]-q[0]*p[1]},0)/2)}
export function contains(p:Point,poly:Point[]){let inside=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if(((a[1]>p[1])!==(b[1]>p[1]))&&(p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0]))inside=!inside}return inside}
export function itemCorners(f:Pick<PlanItem,"x"|"y"|"w"|"d"|"rot">):Point[]{const c=Math.cos(f.rot),s=Math.sin(f.rot);return rect(-f.w/2,-f.d/2,f.w,f.d).map(([x,y])=>[f.x+x*c-y*s,f.y+x*s+y*c])}
export function overlap(a:Point[],b:Point[]){for(const p of[a,b])for(let i=0;i<p.length;i++){const q=p[(i+1)%p.length],axis=[-(q[1]-p[i][1]),q[0]-p[i][0]];const pa=a.map(v=>v[0]*axis[0]+v[1]*axis[1]),pb=b.map(v=>v[0]*axis[0]+v[1]*axis[1]);if(Math.max(...pa)<=Math.min(...pb)+.0001||Math.max(...pb)<=Math.min(...pa)+.0001)return false}return true}
export function wallPolygon(w:Wall){const dx=w.b[0]-w.a[0],dy=w.b[1]-w.a[1],len=Math.hypot(dx,dy),nx=-dy/len*w.thickness/2,ny=dx/len*w.thickness/2;return[[w.a[0]+nx,w.a[1]+ny],[w.b[0]+nx,w.b[1]+ny],[w.b[0]-nx,w.b[1]-ny],[w.a[0]-nx,w.a[1]-ny]] as Point[]}
export function doorSector(o:Opening):Point[]{const dx=o.b[0]-o.a[0],dy=o.b[1]-o.a[1],r=Math.hypot(dx,dy),angle=Math.atan2(dy,dx);return[o.a,...Array.from({length:17},(_,i):Point=>{const t=angle+(o.swing??1)*Math.PI/2*i/16;return[o.a[0]+r*Math.cos(t),o.a[1]+r*Math.sin(t)]})]}
export function warnings(item:PlanItem,items:PlanItem[]):string[]{
 const poly=itemCorners(item),result:string[]=[];
 if(walls.some(w=>overlap(poly,wallPolygon(w))))result.push("Überschneidung mit einer Wand");
 const fixed=fixtures.filter(f=>overlap(poly,rect(f.x-f.w/2,f.y-f.d/2,f.w,f.d)));
 if(fixed.length)result.push(`Einbau belegt: ${fixed.map(f=>f.name).join(", ")}`);
 const other=items.filter(f=>f.id!==item.id&&overlap(poly,itemCorners(f)));
 if(other.length)result.push(`Überschneidung: ${other.map(f=>f.name).join(", ")}`);
 if(openings.some(o=>o.kind==="door"&&overlap(poly,doorSector(o))))result.push("Türschwenkbereich möglicherweise blockiert");
 const samples=[...poly,[item.x,item.y] as Point,...poly.map((p,i):Point=>[(p[0]+poly[(i+1)%4][0])/2,(p[1]+poly[(i+1)%4][1])/2])];
 if(samples.some(p=>!rooms.some(r=>contains(p,r.poly))))result.push("Teilweise ausserhalb der erfassten Bodenfläche");
 return result;
}
export function snapItem(item:PlanItem,enabled:boolean):PlanItem{
 if(!enabled)return item;
 let x=Math.round(item.x/.05)*.05,y=Math.round(item.y/.05)*.05;
 const b=bounds(itemCorners({...item,x,y}));let bestX=.081,bestY=.081,shiftX=0,shiftY=0;
 walls.forEach(w=>{if(w.a[0]===w.b[0]&&b.maxY>Math.min(w.a[1],w.b[1])&&b.minY<Math.max(w.a[1],w.b[1])){for(const d of[w.a[0]-w.thickness/2-b.maxX,w.a[0]+w.thickness/2-b.minX])if(Math.abs(d)<bestX){bestX=Math.abs(d);shiftX=d}}
 if(w.a[1]===w.b[1]&&b.maxX>Math.min(w.a[0],w.b[0])&&b.minX<Math.max(w.a[0],w.b[0])){for(const d of[w.a[1]-w.thickness/2-b.maxY,w.a[1]+w.thickness/2-b.minY])if(Math.abs(d)<bestY){bestY=Math.abs(d);shiftY=d}}});
 x+=shiftX;y+=shiftY;return{...item,x,y};
}
export function wallDistances(item:PlanItem){const b=bounds(itemCorners(item));const out:{a:Point;b:Point;length:number}[]=[];
 for(const [dx,dy,start] of[[-1,0,[b.minX,item.y]],[1,0,[b.maxX,item.y]],[0,-1,[item.x,b.minY]],[0,1,[item.x,b.maxY]]] as [number,number,Point][]){let best=Infinity;
  walls.forEach(w=>{if(dx&&w.a[0]===w.b[0]&&item.y>=Math.min(w.a[1],w.b[1])&&item.y<=Math.max(w.a[1],w.b[1])){const d=(w.a[0]-dx*w.thickness/2-start[0])*dx;if(d>=0)best=Math.min(best,d)}
  if(dy&&w.a[1]===w.b[1]&&item.x>=Math.min(w.a[0],w.b[0])&&item.x<=Math.max(w.a[0],w.b[0])){const d=(w.a[1]-dy*w.thickness/2-start[1])*dy;if(d>=0)best=Math.min(best,d)}});
  if(Number.isFinite(best))out.push({a:start,b:[start[0]+dx*best,start[1]+dy*best],length:best});
 }return out;
}
export const fmt=(n:number)=>n.toLocaleString("de-CH",{minimumFractionDigits:2,maximumFractionDigits:2});
export function inferKind(name:string):FurnitureKind{if(/sofa|couch|sessel/i.test(name))return"sofa";if(/stuhl|chair/i.test(name))return"chair";if(/tisch|desk/i.test(name))return"table";if(/bett|bed/i.test(name))return"bed";if(/schrank|regal|sideboard|kommode/i.test(name))return"shelf";return"box"}
