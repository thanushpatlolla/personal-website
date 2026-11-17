/* A photo-space landmark follows the exact rendered landscape deformation. */
(() => {
  const api=window.melting,photo=document.querySelector('#mountain-photo');if(!api)return;
  function landmark(config){
  const hasCard=!config.action&&!config.info;
  const ns='http://www.w3.org/2000/svg',layer=document.createElementNS(ns,'svg');
  layer.classList.add('hill-ui','hill-layer');layer.setAttribute('aria-label','Landscape photo');
  const target=document.createElementNS(ns,'path');target.classList.add('hill-target');
  if(config.hitPadding)target.style.strokeWidth=String(config.hitPadding*2)+'px';
  target.setAttribute('tabindex','0');target.setAttribute('role',config.info?'img':'button');target.setAttribute('aria-label',hasCard?'Open '+config.label:config.label);
  if(config.info)target.style.cursor='default';
  if(config.action)target.setAttribute('aria-pressed','false');else if(hasCard){target.setAttribute('aria-expanded','false');target.setAttribute('aria-controls',config.id);}
  const outline=document.createElementNS(ns,'path');outline.classList.add('hill-outline');
  layer.append(target,outline);document.body.append(layer);
  let hint;
  if(config.hint){
    hint=document.createElementNS(ns,'g');hint.classList.add('lake-hint');hint.setAttribute('aria-hidden','true');
    for(const [text,y] of [[config.hintLabel||'?',-25],['⌄',-16]]){
      const label=document.createElementNS(ns,'text');label.textContent=text;
      if(config.hintLabel&&text===config.hintLabel)label.style.fontSize='12px';
      label.setAttribute('y',y);label.setAttribute('text-anchor','middle');hint.append(label);
    }
    layer.append(hint);
  }
  const card=document.createElement('aside');card.id=config.id;card.className='hill-ui hill-photo';card.hidden=true;
  card.setAttribute('role','dialog');card.setAttribute('aria-label',config.label);
  if(hasCard)card.innerHTML=`<button class="hill-close" aria-label="Close photograph" type="button">×</button><img src="${config.src}" alt="${config.alt}"><span class="hill-caret" aria-hidden="true"></span>`;
  if(hasCard&&config.caption){
    const caption=document.createElement('div');caption.className='hill-caption';caption.textContent=config.caption;
    card.prepend(caption);card.classList.add('has-caption');
  }
  if(hasCard)document.body.append(card);
  const ridge=config.ridge;
  let open=false,focused=false,hover=false;
  function show(value){if(config.info)return;open=value;if(config.action){target.setAttribute('aria-pressed',String(value));if(value)config.action();update();return;}card.hidden=!value;target.setAttribute('aria-expanded',String(value));update();if(value)card.querySelector('button').focus({preventScroll:true});}
  target.addEventListener('click',()=>show(!!config.action||!open));
  target.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();show(!!config.action||!open);}});
  target.addEventListener('pointerenter',()=>{hover=true;});target.addEventListener('pointerleave',()=>{hover=false;});
  target.addEventListener('focus',()=>{focused=true;});target.addEventListener('blur',()=>{focused=false;});
  if(hasCard)card.querySelector('button').addEventListener('click',()=>{show(false);target.focus({preventScroll:true});});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&open){show(false);target.focus({preventScroll:true});}});
  document.addEventListener('click',e=>{if(open&&!card.contains(e.target)&&e.target!==target)show(false);},true);
  function update(){
    if(!api.getState().ready)return;
    const w=innerWidth,h=parseFloat(document.querySelector('#liquid-surface').style.height),scale=Math.max(w/photo.naturalWidth,h/photo.naturalHeight);
    const map=([u,v])=>api.samplePoint((w-photo.naturalWidth*scale)/2+u*photo.naturalWidth*scale,(h-photo.naturalHeight*scale)/2+v*photo.naturalHeight*scale);
    layer.setAttribute('viewBox',`0 0 ${w} ${h}`);layer.style.height=h+'px';
    const points=[];
    for(let j=0;j<ridge.length-1;j++)for(let i=0;i<=5;i++){const t=i/5,a=ridge[j],b=ridge[j+1];points.push(map([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]));}
    const path=points.map((p,i)=>(i?'L':'M')+p[0]+','+p[1]).join(' ');
    const bottomA=map(config.bottom[0]),bottomB=map(config.bottom[1]);
    target.setAttribute('d',path+` L${bottomA[0]},${bottomA[1]} L${bottomB[0]},${bottomB[1]} Z`);
    const face=config.face||[];
    const facePoints=[];
    for(let j=0;j<face.length-1;j++)for(let i=0;i<=6;i++){const t=i/6,a=face[j],b=face[j+1];facePoints.push(map([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]));}
    const facePath=facePoints.map((p,i)=>(i?'L':'M')+p[0]+','+p[1]).join(' ');
    outline.setAttribute('d',path+' '+facePath);outline.style.opacity=hover||focused||open?'1':'0';
    if(hint){
      const a=map(config.hint);
      hint.setAttribute('transform',`translate(${a[0]},${a[1]})`);
      hint.style.opacity=hover||focused?'1':'0';
    }
    if(open&&hasCard){
      const a=map(config.anchor),cw=card.offsetWidth,ch=card.offsetHeight;
      const left=Math.max(12,Math.min(w-cw-12,a[0]-cw/2));
      card.style.left=left+'px';card.style.top=Math.max(scrollY+12,a[1]-ch-15)+'px';
      card.style.setProperty('--caret-x',Math.max(14,Math.min(cw-14,a[0]-left))+'px');
    }
  }
  function tick(){if(!document.hidden)update();requestAnimationFrame(tick);}tick();
  }
  landmark({id:'valley-hint',info:true,label:'loss landscape?',hintLabel:'loss landscape?',hint:[.770,.558],
    ridge:[[.697,.547],[.717,.551],[.738,.556],[.756,.559],[.770,.558],[.786,.554],[.802,.547],[.817,.538],[.833,.528]],
    bottom:[[.825,.588],[.713,.590]]});
  landmark({id:'lake-song',hitPadding:72,hint:[.343,.847],label:'Play Weird Fishes / Arpeggi by Radiohead from 7 seconds',action:()=>window.playLakeSong(),
    ridge:[[.300,.866],[.310,.860],[.322,.856],[.332,.850],[.343,.847],[.349,.852],[.359,.855],[.369,.862],[.380,.865]],
    bottom:[[.380,.886],[.300,.887]]});
  landmark({id:'hill-photo',hint:[.725,.713],caption:'lake?',label:'hiking photograph',src:'/assets/hill-memory.jpg',alt:'Hikers following a trail through a green mountain valley',
    ridge:[[.695,.752],[.709,.731],[.716,.718],[.718,.706],[.722,.703],[.728,.706],[.736,.710],[.746,.710],[.759,.703],[.773,.695]],
    face:[[.682,.799],[.699,.787],[.717,.773],[.736,.760],[.755,.745],[.773,.730]],bottom:[[.775,.755],[.695,.79]],anchor:[.725,.713]});
  landmark({id:'peak-photo',hint:[.586,.529],label:'summit photograph',src:'/assets/peak-memory.jpg',alt:'The moon above a rocky summit with backpacks and weathered timbers',
    ridge:[[.497,.542],[.508,.547],[.522,.549],[.537,.547],[.551,.542],[.565,.536],[.574,.534],[.581,.528],[.586,.525],[.593,.529],[.601,.534],[.617,.537],[.638,.540]],
    bottom:[[.638,.590],[.510,.590]],anchor:[.586,.529]});
})();
