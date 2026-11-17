/* A photo-space landmark follows the exact rendered landscape deformation. */
(() => {
  const api=window.melting,photo=document.querySelector('#mountain-photo');if(!api)return;
  function landmark(config){
  const hasCard=!!config.src&&!config.info;
  const ns='http://www.w3.org/2000/svg',layer=document.createElementNS(ns,'svg');
  layer.classList.add('hill-ui','hill-layer');layer.setAttribute('aria-label','Landscape photo');
  const target=document.createElementNS(ns,'path');target.classList.add('hill-target');
  if(config.hitPadding)target.style.strokeWidth=String(config.hitPadding*2)+'px';
  target.setAttribute('tabindex','0');target.setAttribute('role',config.info&&!config.action?'img':'button');target.setAttribute('aria-label',hasCard?'Open '+config.label:config.label);
  if(config.info&&!config.trail)target.style.cursor='default';
  if(config.trail){target.setAttribute('role','button');target.setAttribute('aria-label','Show gradient descent toward the green hillside photograph');}
  if(hasCard){target.setAttribute('aria-expanded','false');target.setAttribute('aria-controls',config.id);}else if(config.action&&!config.info)target.setAttribute('aria-pressed','false');
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
  const trail=config.trail?document.createElementNS(ns,'path'):null;
  if(trail){trail.classList.add('gradient-trail');trail.setAttribute('aria-hidden','true');layer.append(trail);}
  let trailUntil=0;
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
  function show(value){if(config.trail&&value){trailUntil=performance.now()+4800;update();return;}if(config.info){if(value&&config.action)config.action();return;}if(value&&!window.photoJourney.open(config.id))return;open=value;if(config.action&&value)config.action();if(!hasCard){target.setAttribute('aria-pressed',String(value));update();return;}card.hidden=!value;target.setAttribute('aria-expanded',String(value));update();if(value)card.querySelector('button').focus({preventScroll:true});}
  target.addEventListener('click',()=>show(!!config.action||!open));
  target.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();show(!!config.action||!open);}});
  target.addEventListener('pointerenter',()=>{hover=true;});target.addEventListener('pointerleave',()=>{hover=false;});
  target.addEventListener('focus',()=>{focused=true;});target.addEventListener('blur',()=>{focused=false;});
  if(hasCard)card.querySelector('button').addEventListener('click',()=>{show(false);target.focus({preventScroll:true});});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&open){show(false);target.focus({preventScroll:true});}});
  document.addEventListener('click',e=>{if(open&&!card.contains(e.target)&&e.target!==target)show(false);},true);
  function update(){
    const unlocked=window.photoJourney.canOpen(config.id);
    layer.style.display=unlocked?'':'none';
    target.setAttribute('tabindex',unlocked?'0':'-1');
    if(!unlocked)return;
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
    const trailActive=trail&&performance.now()<trailUntil;
    if(trail){
      const paths=config.trail.map(([from,to])=>{
        // Sample the whole shaft through the same deformation as the terrain.
        const points=Array.from({length:13},(_,i)=>{const t=i/12;return map([from[0]+(to[0]-from[0])*t,from[1]+(to[1]-from[1])*t]);});
        const b=points[12],previous=points[11],angle=Math.atan2(b[1]-previous[1],b[0]-previous[0]),size=6;
        const wing=sign=>[b[0]-size*Math.cos(angle+sign*.55),b[1]-size*Math.sin(angle+sign*.55)];
        const l=wing(1),r=wing(-1);
        return points.map((p,i)=>(i?'L':'M')+p[0]+','+p[1]).join(' ')+` M${l} L${b[0]},${b[1]} L${r}`;
      });
      trail.setAttribute('d',paths.join(' '));
      trail.style.opacity=trailActive?String(.58*Math.min(1,(trailUntil-performance.now())/1200)):'0';
    }
    if(hint){
      if(config.trail)hint.firstChild.textContent=trailActive?'gradient descent':config.hintLabel;
      const a=map(config.hint);
      hint.setAttribute('transform',`translate(${a[0]},${a[1]})`);
      hint.style.opacity=hover||focused||trailActive?'1':'0';
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
  landmark({id:'valley-hint',info:true,trail:[[[.766,.591],[.758,.619]],[[.752,.632],[.742,.658]],[[.737,.669],[.727,.696]]],label:'loss landscape?',hintLabel:'loss landscape?',hint:[.770,.558],
    ridge:[[.697,.547],[.717,.551],[.738,.556],[.756,.559],[.770,.558],[.786,.554],[.802,.547],[.817,.538],[.833,.528]],
    bottom:[[.825,.588],[.713,.590]]});
  landmark({id:'lake-song',hitPadding:72,hint:[.343,.847],anchor:[.343,.847],caption:'time?',src:'/assets/lake-time.jpg',alt:'Vintage computers, game consoles and controllers scattered across a room',label:'time photograph and play Weird Fishes',action:()=>window.playLakeSong(),
    ridge:[[.300,.866],[.310,.860],[.322,.856],[.332,.850],[.343,.847],[.349,.852],[.359,.855],[.369,.862],[.380,.865]],
    bottom:[[.380,.886],[.300,.887]]});
  landmark({id:'hill-photo',action:()=>window.playValleySong(),hint:[.725,.713],caption:'lake?',label:'hiking photograph',src:'/assets/hill-memory.jpg',alt:'Hikers following a trail through a green mountain valley',
    ridge:[[.695,.752],[.709,.731],[.716,.718],[.718,.706],[.722,.703],[.728,.706],[.736,.710],[.746,.710],[.759,.703],[.773,.695]],
    face:[[.682,.799],[.699,.787],[.717,.773],[.736,.760],[.755,.745],[.773,.730]],bottom:[[.775,.755],[.695,.79]],anchor:[.725,.713]});
  landmark({id:'peak-photo',action:()=>window.playPeakSong(),caption:'peaks and…?',hint:[.586,.529],label:'summit photograph',src:'/assets/peak-memory.jpg',alt:'The moon above a rocky summit with backpacks and weathered timbers',
    ridge:[[.497,.542],[.508,.547],[.522,.549],[.537,.547],[.551,.542],[.565,.536],[.574,.534],[.581,.528],[.586,.525],[.593,.529],[.601,.534],[.617,.537],[.638,.540]],
    bottom:[[.638,.590],[.510,.590]],anchor:[.586,.529]});
})();
