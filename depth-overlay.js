/* Optional mask inspection only; never intercepts landscape input. */
(() => {
 const api=window.melting;if(!api)return;
 const canvas=document.createElement('canvas');canvas.setAttribute('aria-hidden','true');
 canvas.style.cssText='position:absolute;left:0;top:0;pointer-events:none;z-index:10;opacity:.42;';canvas.hidden=true;document.body.append(canvas);
 const ctx=canvas.getContext('2d'),colors=[[239,161,235],[219,153,95],[126,199,130],[113,167,218],[218,216,160]];
 let active=false,frame=0,last=0;
 function paint(now){
  if(!active)return;
  if(now-last>120){last=now;const w=innerWidth,h=Math.max(innerHeight,document.body.scrollHeight);if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}ctx.clearRect(0,0,w,h);
   const step=20;
   for(let y=0;y<h;y+=step)for(let x=0;x<w;x+=step){
    const weights=api.getDepthAt(x+step/2,y+step/2).weights;
    const rgb=[0,1,2].map(c=>Math.round(weights.reduce((s,a,i)=>s+a*colors[i][c],0)));ctx.fillStyle=`rgb(${rgb.join(',')})`;
    const points=[[x,y],[x+step,y],[x+step,y+step],[x,y+step]].map(([a,b])=>api.samplePoint(a,b));ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(...p.slice(0,2)):ctx.moveTo(...p.slice(0,2)));ctx.closePath();ctx.fill();
   }
   ctx.fillStyle='rgb(239,161,235)';
   for(const el of document.querySelectorAll('.intro,.music,#still')){const b=el.getBoundingClientRect();const points=[[b.left,b.top+scrollY],[b.right,b.top+scrollY],[b.right,b.bottom+scrollY],[b.left,b.bottom+scrollY]].map(([x,y])=>api.samplePoint(x,y,'text'));ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();ctx.fill();}
  }
  frame=requestAnimationFrame(paint);
 }
 document.addEventListener('depthmaskchange',e=>{active=!!e.detail;canvas.hidden=!active;cancelAnimationFrame(frame);if(active){last=0;frame=requestAnimationFrame(paint);}});
})();
