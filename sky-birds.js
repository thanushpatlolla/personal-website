/* Original 16x16 bird art by ma9ici4n; see assets/bird-CREDITS.txt. */
(() => {
  const api=window.melting,photo=document.querySelector('#mountain-photo');
  if(!api||!photo)return;
  const layer=document.createElement('div');layer.id='sky-birds';layer.setAttribute('aria-hidden','true');document.body.append(layer);
  const flock=[];let frame=0,last=0,press=null;
  document.addEventListener('pointerdown',e=>{press=e.isPrimary&&e.button===0?{x:e.clientX,y:e.clientY,moved:false}:null;},true);
  document.addEventListener('pointermove',e=>{if(press&&Math.hypot(e.clientX-press.x,e.clientY-press.y)>7)press.moved=true;},true);
  document.addEventListener('pointercancel',()=>{press=null;},true);
  function isSky(x,y){
    const w=innerWidth,h=innerHeight,s=Math.max(w/photo.naturalWidth,h/photo.naturalHeight),pw=photo.naturalWidth*s,ph=photo.naturalHeight*s;
    // Distant skyline in photo coordinates, transformed by the live scene field.
    const ridge=[[0,.47],[.10,.49],[.16,.478],[.23,.49],[.29,.485],[.36,.495],[.45,.494],[.55,.503],[.64,.49],[.72,.504],[.80,.502],[.89,.497],[1,.50]];
    const points=ridge.map(([u,v])=>api.samplePoint((w-pw)/2+u*pw,(h-ph)/2+v*ph));
    for(let i=1;i<points.length;i++){
      const a=points[i-1],b=points[i];if(x>=Math.min(a[0],b[0])&&x<=Math.max(a[0],b[0]))return y<a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0])-8;
    }
    return false;
  }
  function tick(now){
    const dt=Math.min((now-last)/1000,.05);last=now;
    for(let i=flock.length-1;i>=0;i--){
      const b=flock[i];b.age+=dt;b.x+=b.speed*dt;
      const y=b.y-Math.min(30,b.age*3)+Math.sin(b.age*2+b.phase)*3;
      b.el.style.transform=`translate(${Math.round(b.x)}px,${Math.round(y)}px)`;
      if(b.x>innerWidth+40||b.age>35){b.el.remove();flock.splice(i,1);}
    }
    frame=flock.length?requestAnimationFrame(tick):0;
  }
  document.addEventListener('skyclick',e=>{
    const {x,y,target}=e.detail;
    if(!press||press.moved||target.closest('a,button,input,select,summary,.melt-ui,.hill-ui,.intro'))return;
    press=null;
    const clock=api.getClockBounds();
    if(clock&&x>clock.left-12&&x<clock.right+12&&y>clock.top-12&&y<clock.bottom+12)return;
    if(!api.getState().ready||!isSky(x,y))return;
    for(let i=0;i<2;i++){
      const el=document.createElement('span');el.className='sky-bird';
      const sprite=document.createElement('span');sprite.className='sky-bird-sprite';sprite.style.animationDelay=`-${i*.23}s`;el.append(sprite);layer.append(el);
      const b={el,x:x-12-i*30,y:Math.max(8,y-scrollY-12+i*17),speed:63+i*3,age:0,phase:i*1.7};
      el.style.transform=`translate(${b.x}px,${b.y}px)`;flock.push(b);
    }
    while(flock.length>48)flock.shift().el.remove();
    if(!frame){last=performance.now();frame=requestAnimationFrame(tick);}
  });
})();
