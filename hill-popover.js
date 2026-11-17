/* A photo-space landmark follows the exact rendered landscape deformation. */
(() => {
  const api=window.melting,photo=document.querySelector('#mountain-photo');if(!api)return;
  const ns='http://www.w3.org/2000/svg',layer=document.createElementNS(ns,'svg');
  layer.classList.add('hill-ui','hill-layer');layer.setAttribute('aria-label','Landscape photo');
  const target=document.createElementNS(ns,'path');target.classList.add('hill-target');
  target.setAttribute('tabindex','0');target.setAttribute('role','button');target.setAttribute('aria-label','Open hiking photograph');target.setAttribute('aria-expanded','false');target.setAttribute('aria-controls','hill-photo');
  const outline=document.createElementNS(ns,'path');outline.classList.add('hill-outline');
  layer.append(target,outline);document.body.append(layer);
  const card=document.createElement('aside');card.id='hill-photo';card.className='hill-ui hill-photo';card.hidden=true;
  card.setAttribute('role','dialog');card.setAttribute('aria-label','Hiking photograph');
  card.innerHTML='<button class="hill-close" aria-label="Close photograph" type="button">×</button><img src="/assets/hill-memory.jpg" alt="Hikers following a trail through a green mountain valley"><span class="hill-caret" aria-hidden="true"></span>';
  document.body.append(card);
  const ridge=[[.695,.752],[.709,.731],[.716,.718],[.718,.706],[.722,.703],[.728,.706],[.736,.710],[.746,.710],[.759,.703],[.773,.695]];
  let open=false,focused=false,hover=false;
  function show(value){open=value;card.hidden=!value;target.setAttribute('aria-expanded',String(value));update();if(value)card.querySelector('button').focus({preventScroll:true});}
  target.addEventListener('click',()=>show(!open));
  target.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();show(!open);}});
  target.addEventListener('pointerenter',()=>{hover=true;});target.addEventListener('pointerleave',()=>{hover=false;});
  target.addEventListener('focus',()=>{focused=true;});target.addEventListener('blur',()=>{focused=false;});
  card.querySelector('button').addEventListener('click',()=>{show(false);target.focus({preventScroll:true});});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&open){show(false);target.focus({preventScroll:true});}});
  document.addEventListener('click',e=>{if(open&&!e.target.closest('.hill-ui'))show(false);},true);
  function update(){
    if(!api.getState().ready)return;
    const w=innerWidth,h=parseFloat(document.querySelector('#liquid-surface').style.height),scale=Math.max(w/photo.naturalWidth,h/photo.naturalHeight);
    const map=([u,v])=>api.samplePoint((w-photo.naturalWidth*scale)/2+u*photo.naturalWidth*scale,(h-photo.naturalHeight*scale)/2+v*photo.naturalHeight*scale);
    layer.setAttribute('viewBox',`0 0 ${w} ${h}`);layer.style.height=h+'px';
    const points=[];
    for(let j=0;j<ridge.length-1;j++)for(let i=0;i<5;i++){const t=i/5,a=ridge[j],b=ridge[j+1];points.push(map([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]));}
    const path=points.map((p,i)=>(i?'L':'M')+p[0]+','+p[1]).join(' ');
    const bottomA=map([.775,.755]),bottomB=map([.695,.79]);
    target.setAttribute('d',path+` L${bottomA[0]},${bottomA[1]} L${bottomB[0]},${bottomB[1]} Z`);
    outline.setAttribute('d',path);outline.style.opacity=hover||focused||open?'1':'0';
    if(open){
      const a=map([.725,.713]),cw=card.offsetWidth,ch=card.offsetHeight;
      const left=Math.max(12,Math.min(w-cw-12,a[0]-cw/2));
      card.style.left=left+'px';card.style.top=Math.max(scrollY+12,a[1]-ch-15)+'px';
      card.style.setProperty('--caret-x',Math.max(14,Math.min(cw-14,a[0]-left))+'px');
    }
  }
  function tick(){if(!document.hidden)update();requestAnimationFrame(tick);}tick();
})();
