import { useEffect, useState } from 'react';
import { incidents as seed } from '../mock/data';
import type { Incident } from '../types';
export function useMockRealtime(initial:Incident[]){
 const [items,setItems]=useState(initial);
 const [pulse,setPulse]=useState(0);
 useEffect(()=>{setItems(initial)},[initial]);
 useEffect(()=>{
   const t=setInterval(()=>{
     setPulse(p=>p+1);
     setItems(prev=>prev.map(i=>i.id==='INC-024' ? {...i,verification_score:i.verification_score>=96?94:i.verification_score+1}:i));
   },12000); return ()=>clearInterval(t);
 },[]);
 return {items,pulse};
}
export function nextDemoState(items:Incident[]){ return items.map(i=>i.id==='INC-024'?{...i,verification_score:94,confirmed_buses:2,status:'CONFIRMED' as const}:i); }
export const mockSeed=seed;
