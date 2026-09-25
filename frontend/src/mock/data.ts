import type { Activity, Bus, DashboardSummary, Incident } from '../types';
const now = Date.now();
const ago = (m:number)=>new Date(now-m*60000).toISOString();
export const incidents:Incident[]=[
 {id:'INC-024',type:'POTHOLE',severity:'HIGH',verification_score:94,confirmed_buses:2,status:'CONFIRMED',latitude:13.0582,longitude:80.2526,timestamp:ago(7),evidence_image:'/evidence-pothole.svg',source_bus:'BUS-104',frames_validated:4,validation_total:4,description:'Deep road-surface defect repeatedly observed by independent buses near a major arterial.'},
 {id:'INC-023',type:'PEDESTRIAN_RISK',severity:'CRITICAL',verification_score:97,confirmed_buses:3,status:'UNDER_REVIEW',latitude:13.0674,longitude:80.2419,timestamp:ago(19),evidence_image:'/evidence-pedestrian.svg',source_bus:'BUS-203',frames_validated:5,validation_total:5,description:'Pedestrian movement close to moving traffic at an active junction.'},
 {id:'INC-022',type:'ROAD_DAMAGE',severity:'MEDIUM',verification_score:82,confirmed_buses:1,status:'NEW',latitude:13.0741,longitude:80.2707,timestamp:ago(31),evidence_image:'/evidence-road.svg',source_bus:'BUS-301',frames_validated:3,validation_total:4,description:'Possible damaged road edge requiring municipal inspection.'},
 {id:'INC-021',type:'WATERLOGGING',severity:'HIGH',verification_score:88,confirmed_buses:2,status:'CONFIRMED',latitude:13.0478,longitude:80.2601,timestamp:ago(48),evidence_image:'/evidence-water.svg',source_bus:'BUS-104',frames_validated:4,validation_total:4,description:'Standing water occupying a portion of the carriageway.'},
 {id:'INC-020',type:'INFRASTRUCTURE',severity:'LOW',verification_score:69,confirmed_buses:1,status:'UNDER_REVIEW',latitude:13.0827,longitude:80.2707,timestamp:ago(66),evidence_image:'/evidence-sign.svg',source_bus:'BUS-203',frames_validated:2,validation_total:4,description:'Road signage appears damaged or partially occluded.'},
 {id:'INC-019',type:'TRAFFIC',severity:'MEDIUM',verification_score:77,confirmed_buses:2,status:'CONFIRMED',latitude:13.0402,longitude:80.2336,timestamp:ago(92),evidence_image:'/evidence-traffic.svg',source_bus:'BUS-301',frames_validated:4,validation_total:4,description:'Traffic slowdown detected across consecutive observations.'}
];
export const buses:Bus[]=[
 {bus_id:'BUS-104',latitude:13.0582,longitude:80.2526,status:'ACTIVE',last_seen:'5 sec ago',recent_events:4,route:'MTC 21G'},
 {bus_id:'BUS-203',latitude:13.0674,longitude:80.2419,status:'ACTIVE',last_seen:'3 sec ago',recent_events:3,route:'MTC 12B'},
 {bus_id:'BUS-301',latitude:13.0741,longitude:80.2707,status:'ACTIVE',last_seen:'8 sec ago',recent_events:2,route:'MTC 5C'},
 {bus_id:'BUS-118',latitude:13.0468,longitude:80.2668,status:'IDLE',last_seen:'2 min ago',recent_events:1,route:'MTC 27D'},
 {bus_id:'BUS-412',latitude:13.0864,longitude:80.2513,status:'ACTIVE',last_seen:'11 sec ago',recent_events:5,route:'MTC 40A'}
];
export const summary:DashboardSummary={total_incidents:42,active_incidents:18,critical_incidents:4,potholes:16,active_buses:27};
export const activities:Activity[]=[
 {id:'a1',time:'10:42',message:'BUS-104 detected pothole',kind:'detection'},
 {id:'a2',time:'10:43',message:'Multi-frame validation completed (4/4)',kind:'validation'},
 {id:'a3',time:'10:46',message:'BUS-203 matched same location',kind:'confirmation'},
 {id:'a4',time:'10:46',message:'INC-024 verification increased to 94%',kind:'confirmation'},
 {id:'a5',time:'10:48',message:'GIS layer updated with confirmed incident',kind:'system'}
];
