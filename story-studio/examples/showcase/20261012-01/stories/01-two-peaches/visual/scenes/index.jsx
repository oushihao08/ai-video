import React from 'react';
import { useCurrentFrame } from 'remotion';

const C = { paper:'#f5efdf', ink:'#443e3b', rose:'#dc866c', peach:'#edb06f', green:'#758c6c', blue:'#91b5b5', bag:'#d8bd94', floor:'#e8decb' };
const clamp = n => Math.max(0,Math.min(1,n));
const ease = (frame,start,length=20) => {const t=clamp((frame-start)/length);return t*t*(3-2*t);};
function Peach({x,y,scale=1}) {
 return <g transform={`translate(${x} ${y}) scale(${scale})`} stroke={C.ink} strokeWidth="4">
   <path d="M0-10q-4-17 8-23" fill="none" stroke={C.green}/>
   <path d="M3-25q18-12 22-2-10 11-22 2z" fill={C.green}/>
   <path d="M0-11q-19-21-37 1-12 15 1 41Q-23 52 0 42q22 11 36-11Q55 4 37-10 19-27 0-11z" fill={C.peach}/>
   <path d="M0-8q-6 12-1 23" fill="none" stroke="#b97455" strokeWidth="3"/>
   <circle cx="-16" cy="8" r="3" fill="#ffe4ac" stroke="none"/>
 </g>;
}
function Person({x,y,shirt,pose='rest',turn=0,step=0,walking=0}) {
 const arm = pose==='scan' ? -1 : pose==='bag' ? 1 : pose==='hold' ? .7 : 0;
 const gait=step*Math.PI;
 const stride=clamp(walking);
 const leftX=Math.sin(gait)*15*stride;
 const rightX=-leftX;
 const leftLift=Math.max(0,Math.cos(gait))*9*stride;
 const rightLift=Math.max(0,-Math.cos(gait))*9*stride;
 return <g transform={`translate(${x} ${y+Math.sin(step)*3})`} stroke={C.ink} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
   <path d={`M-19 94L${-24+leftX} ${157-leftLift}M19 94L${24+rightX} ${157-rightLift}`} fill="none"/>
   {walking>.05&&<path d={`M${-24+leftX} ${157-leftLift}l12 1M${24+rightX} ${157-rightLift}l12 1`} fill="none" strokeWidth="5"/>}
   <path d="M-34 0q33-16 67 0l17 99h-97z" fill={shirt}/>
   <path d={`M-29 17L${pose==='scan'?-69:-57} ${57+arm*10}`} fill="none"/>
   <path d={`M29 17L${pose==='bag'?67:56} ${pose==='hold'?38:62}`} fill="none"/>
   <circle cy="-42" r="37" fill="#e9bd9e"/>
   <path d="M-35-53q4-42 43-34 31 3 29 39L14-61l-28 5-11 17z" fill={pose==='scan'?C.ink:'#6c5649'}/>
   <circle cx={turn?-10:4} cy="-43" r="3" fill={C.ink} stroke="none"/><circle cx={turn?10:22} cy="-43" r="3" fill={C.ink} stroke="none"/>
   <path d={turn?'M-5-24q9 5 18 0':'M1-23h15'} fill="none" strokeWidth="3"/>
 </g>;
}
function Exterior({frame}) {
 const walk=ease(frame,0,30);
 const drift=walk*96;
 const step=Math.min(frame,30)/5;
 return <svg width="100%" height="100%" viewBox="0 0 1280 720" style={{fontFamily:'PingFang SC, sans-serif'}}>
   <rect width="1280" height="720" fill="#e8e9dc"/>
   <path d="M0 0h1280v510H0z" fill="#ede7d8"/>
   <path d="M0 510h1280v210H0z" fill="#d8d4c5"/>
   <path d="M0 514h1280" stroke="#9e9a87" strokeWidth="5"/>
   <rect x="98" y="86" width="300" height="78" rx="5" fill={C.green} stroke={C.ink} strokeWidth="5"/>
   <text x="248" y="139" textAnchor="middle" fill="#fff7e7" fontSize="32">超市</text>
   <rect x="102" y="180" width="292" height="336" fill="#d4dfd3" stroke={C.ink} strokeWidth="7"/>
   <rect x="122" y="201" width="116" height="287" fill="#e8eee3" stroke="#899889" strokeWidth="4"/>
   <rect x="257" y="201" width="116" height="287" fill="#d8e5de" stroke="#899889" strokeWidth="4"/>
   <path d="M247 190v317M247 190h17v317" stroke="#718375" strokeWidth="6"/>
   <path d="M92 520h314" stroke="#758c6c" strokeWidth="12"/>
   <g transform={`translate(${drift} 0)`}>
     <Person x={500} y={374} shirt={C.rose} pose="hold" step={step} walking={1}/>
     <Person x={780} y={374} shirt={C.blue} pose="hold" step={step} walking={1}/>
     <g transform="translate(580 447)">
       <path d="M0 0h190l-16 133H16z" fill={C.bag} stroke={C.ink} strokeWidth="5"/>
       <path d="M9 5q86 22 172 0" fill="none" stroke="#9b7959" strokeWidth="4"/>
       <path d="M23 15q-11-27 4-39 17 10 13 32 12-27 28-21 0 24-22 34z" fill="#82966e" stroke={C.ink} strokeWidth="3"/>
       <path d="M151-28h31v55h-31z" fill="#d4a86e" stroke={C.ink} strokeWidth="3"/>
       <path d="M157-28v-11h19v11" fill="none" stroke={C.ink} strokeWidth="3"/>
       <Peach x={73} y={20} scale={.55}/><Peach x={128} y={18} scale={.55}/>
     </g>
     <g fill="none" strokeLinecap="round" strokeLinejoin="round">
       <path d="M529 391Q552 408 586 449" stroke={C.rose} strokeWidth="16"/>
       <path d="M586 449q9-8 17 2m-16 2q10-7 18 3" stroke="#e9bd9e" strokeWidth="8"/>
       <path d="M751 391Q773 414 770 449" stroke={C.blue} strokeWidth="17"/>
       <path d="M762 449q9-7 17 2m-17 2q10-7 18 3" stroke="#e9bd9e" strokeWidth="8"/>
     </g>
   </g>
 </svg>;
}
function Peaches({shot,cueFrame}) {
 const frame=useCurrentFrame();
 const stage=shot.scene.data.stage;
 if(stage===3) return <Exterior frame={frame}/>;
 const cue=(phrase,id=stage===1?'s001':'s002',edge='start')=>{
   const value=cueFrame(id,phrase,edge);
   if(value===null) throw new Error(`本期动作缺真实词时间：${id} ${phrase}`);
   return value;
 };
 const walkStart=stage===2?cue('一起提着'):0;
 const walkEnd=stage===2?shot.durationFrames:walkStart+1;
 const walk=stage===2?clamp((frame-walkStart)/(walkEnd-walkStart)):0;
 const girlScan=stage===1?frame>=cue('一个个扫'):false;
 const item=stage===1?ease(frame,cue('爸爸撑着袋子接'),16):0;
 const twoFruit=stage===2?frame>=cue('两颗桃子'):false;
 const bagReady=stage===2?frame>=cue('袋子装好了'):false;
 const place=stage===2?ease(frame,cue('轻轻放在最上面'),20):0;
 const fatherHolds=stage===2?frame>=cue('托住袋底'):false;
 const girlHolds=stage===2?frame>=cue('攥住袋口'):false;
 const shift=walk*120;
 const cam=walk*70;
 return <svg width="100%" height="100%" viewBox="0 0 1280 720" style={{fontFamily:'PingFang SC, sans-serif'}}>
   <defs>
    <pattern id="papergrain" width="37" height="31" patternUnits="userSpaceOnUse"><circle cx="7" cy="6" r="1.2" fill="#695a4f" opacity=".13"/><path d="M21 24l5-1" stroke="#695a4f" opacity=".12"/></pattern>
   </defs>
   <rect width="1280" height="720" fill={C.paper}/><rect width="1280" height="720" fill="url(#papergrain)"/>
   <g transform={`translate(${-cam} 0)`}>
    <path d="M0 0h1280v508H0z" fill="#eee5d5"/>
    <path d="M0 504h1280v216H0z" fill={C.floor}/><path d="M0 506h1280" stroke="#a99c88" strokeWidth="5"/>
    <path d="M42 82h239v251H42z" fill="#e3dbc8" stroke="#9b8e7b" strokeWidth="5"/>
    <path d="M61 110h199M61 175h199M61 240h199" stroke="#9b8e7b" strokeWidth="4"/>
    <g fill={C.rose} stroke={C.ink} strokeWidth="3"><circle cx="101" cy="143" r="14"/><circle cx="153" cy="142" r="14"/><circle cx="207" cy="207" r="14"/><circle cx="105" cy="276" r="14"/></g>
    <path d="M318 358h572v38H318z" fill="#bba98b" stroke={C.ink} strokeWidth="5"/>
    <path d="M348 395v120M856 395v120" stroke={C.ink} strokeWidth="10"/>
    <rect x="397" y="222" width="210" height="127" rx="10" fill="#d7e1db" stroke={C.ink} strokeWidth="5"/>
    <rect x="417" y="242" width="170" height="74" rx="7" fill="#637976"/>
    <text x="502" y="288" textAnchor="middle" fill="#fff7e7" fontSize="23">自助结账</text>
    <path d="M642 308h83l-16 26h-52z" fill="#9cbcb9" stroke={C.ink} strokeWidth="4"/>
    <path d={girlScan?`M675 306l${Math.sin(frame/3)*20} 27`:'M666 309l-10 18'} stroke="#d78369" strokeWidth="6"/>
    <path d="M1040 181h184v335h-184z" fill="#d3dfd2" stroke={C.ink} strokeWidth="7"/>
    <path d="M1064 204h137v250h-137z" fill="#eff1e4" stroke="#8e9985" strokeWidth="5"/>
    <circle cx="1181" cy="326" r="6" fill={C.ink}/>
    <path d="M1025 517h216" stroke="#758c6c" strokeWidth="12"/>
   </g>
   {stage===1 ? <g>
     <Person x={485} y={371} shirt={C.rose} pose={girlScan?'scan':'rest'} step={girlScan?frame/4:0}/>
     <Person x={795} y={373} shirt={C.blue} pose={item>.2?'bag':'rest'} step={0}/>
     <g transform="translate(709 440)">
       <path d="M0 0h174l-14 132H14z" fill={C.bag} stroke={C.ink} strokeWidth="5"/>
       <path d="M10 4q77 23 154 0" fill="none" stroke="#9b7959" strokeWidth="4"/>
       {item>.2&&<g opacity={item}>
         <path d="M21 15q-11-27 4-39 17 10 13 32 12-27 28-21 0 24-22 34z" fill="#82966e" stroke={C.ink} strokeWidth="3"/>
         <path d="M151-28h31v55h-31z" fill="#d4a86e" stroke={C.ink} strokeWidth="3"/>
         <path d="M157-28v-11h19v11" fill="none" stroke={C.ink} strokeWidth="3"/>
         <path d={`M78 ${-20+item*44}h30l-4 35H82z`} fill="#d6b17d" stroke={C.ink} strokeWidth="3"/>
       </g>}
     </g>
     <g opacity={girlScan?1:.35} stroke="#607b78" strokeWidth="4" fill="none"><path d={`M651 305q25-20 ${45+Math.sin(frame/4)*5} -5`}/><path d="M686 295q7 6 0 12"/></g>
   </g> : <g transform={`translate(${shift} 0)`}>
     <Person x={558} y={374} shirt={C.rose} pose={girlHolds?'hold':'rest'} step={walk*6} walking={walk}/>
     <Person x={862} y={372} shirt={C.blue} pose={fatherHolds?'bag':'rest'} step={walk*6} walking={walk}/>
     <g transform="translate(691 447)">
       <path d="M0 0h197l-16 133H17z" fill={C.bag} stroke={C.ink} strokeWidth="5"/>
       <path d="M9 5q91 22 177 0" fill="none" stroke="#9b7959" strokeWidth="4"/>
       <g>
         <path d="M21 15q-11-27 4-39 17 10 13 32 12-27 28-21 0 24-22 34z" fill="#82966e" stroke={C.ink} strokeWidth="3"/>
         <path d="M151-28h31v55h-31z" fill="#d4a86e" stroke={C.ink} strokeWidth="3"/>
         <path d="M157-28v-11h19v11" fill="none" stroke={C.ink} strokeWidth="3"/>
         <path d="M78 24h30l-4 35H82z" fill="#d6b17d" stroke={C.ink} strokeWidth="3"/>
       </g>
       {bagReady&&<g opacity={place}>
         <Peach x={69} y={-16+place*39} scale={.66}/><Peach x={131} y={-18+place*42} scale={.66}/>
       </g>}
     </g>
     {twoFruit&&!bagReady&&<g><Peach x={495} y={437} scale={.78}/><Peach x={550} y={432} scale={.78}/></g>}
     {girlHolds&&<g fill="none" strokeLinecap="round" strokeLinejoin="round">
       <path d="M586 398Q634 420 690 448" stroke={C.rose} strokeWidth="16"/>
       <path d="M691 448q10-9 19 2m-17 2q11-8 20 4" stroke="#e9bd9e" strokeWidth="8"/>
     </g>}
     {fatherHolds&&<g fill="none" strokeLinecap="round" strokeLinejoin="round">
       <path d="M835 398Q895 424 907 464V547q0 35-34 38l-32 0" stroke={C.blue} strokeWidth="17"/>
       <path d="M841 585q17 10 35 2" stroke="#e9bd9e" strokeWidth="12"/>
     </g>}
   </g>}
 </svg>;
}
export default { Peaches };
