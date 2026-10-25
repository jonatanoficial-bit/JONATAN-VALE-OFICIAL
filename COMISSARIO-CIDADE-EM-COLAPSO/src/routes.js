export const roadNodes = [
  {id:'m0',x:39,y:70,districtId:'manhattan'}, {id:'m1',x:43,y:54,districtId:'manhattan'}, {id:'m2',x:47,y:38,districtId:'manhattan'}, {id:'m3',x:51,y:21,districtId:'manhattan'},
  {id:'b0',x:57,y:12,districtId:'bronx'}, {id:'b1',x:64,y:9,districtId:'bronx'},
  {id:'q0',x:60,y:40,districtId:'queens'}, {id:'q1',x:69,y:43,districtId:'queens'}, {id:'q2',x:80,y:30,districtId:'queens'},
  {id:'k0',x:58,y:62,districtId:'brooklyn'}, {id:'k1',x:65,y:72,districtId:'brooklyn'}, {id:'k2',x:73,y:83,districtId:'brooklyn'},
  {id:'s0',x:23,y:85,districtId:'staten'}, {id:'s1',x:28,y:78,districtId:'staten'}
];
const edges=[['m0','m1'],['m1','m2'],['m2','m3'],['m3','b0'],['b0','b1'],['m2','q0'],['q0','q1'],['q1','q2'],['q0','k0'],['k0','k1'],['k1','k2'],['m0','k0'],['s0','s1'],['s1','k1']];
export const districtBase = {manhattan:'m1',bronx:'b0',queens:'q1',brooklyn:'k1',staten:'s0'};
export function routeBetween(fromId,toId,traffic=50){
  const distance=Object.fromEntries(roadNodes.map(n=>[n.id,Infinity])); const previous={}; const remaining=new Set(roadNodes.map(n=>n.id)); distance[fromId]=0;
  while(remaining.size){
    const current=[...remaining].sort((a,b)=>distance[a]-distance[b])[0]; remaining.delete(current); if(current===toId)break;
    const a=roadNodes.find(n=>n.id===current);
    for(const edge of edges.filter(e=>e.includes(current))){const id=edge.find(v=>v!==current);if(!remaining.has(id))continue;const b=roadNodes.find(n=>n.id===id);const cost=Math.hypot(a.x-b.x,a.y-b.y)*(1+traffic/100);if(distance[current]+cost<distance[id]){distance[id]=distance[current]+cost;previous[id]=current;}}
  }
  const path=[];let id=toId;while(id){path.unshift(roadNodes.find(n=>n.id===id));if(id===fromId)break;id=previous[id];}
  return {points:path,eta:Math.max(4,Math.round((distance[toId]||5)*.55))};
}
export function routePosition(points,progress){
  if(!points?.length)return roadNodes[1];if(points.length===1)return points[0];
  const lengths=points.slice(1).map((p,i)=>Math.hypot(p.x-points[i].x,p.y-points[i].y));let distance=lengths.reduce((a,b)=>a+b,0)*Math.max(0,Math.min(1,progress));
  for(let i=0;i<lengths.length;i++){if(distance<=lengths[i]){const t=lengths[i]?distance/lengths[i]:0;return{x:points[i].x+(points[i+1].x-points[i].x)*t,y:points[i].y+(points[i+1].y-points[i].y)*t};}distance-=lengths[i];}return points.at(-1);
}
