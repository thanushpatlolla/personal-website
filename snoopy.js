/* The user's original Snoopy cutout, seated on the ridge only during playback. */
(() => {
  const audio=document.querySelector('#song'),photo=document.querySelector('#mountain-photo');
  const api=window.melting;
  const snoopy=document.createElement('img');
  snoopy.src='/assets/snoopy-headphones.png';snoopy.alt='';snoopy.setAttribute('aria-hidden','true');
  snoopy.className='ridge-snoopy';snoopy.hidden=true;document.body.append(snoopy);
  let frame=0;
  function update(){
    frame=0;
    if(audio.paused||audio.ended||document.hidden){snoopy.hidden=true;return;}
    if(api?.getState().ready&&photo.naturalWidth){
      const w=innerWidth,h=parseFloat(document.querySelector('#liquid-surface').style.height);
      const scale=Math.max(w/photo.naturalWidth,h/photo.naturalHeight);
      const x=(w-photo.naturalWidth*scale)/2+photo.naturalWidth*.49*scale;
      const y=(h-photo.naturalHeight*scale)/2+photo.naturalHeight*.553*scale;
      const p=api.samplePoint(x,y);snoopy.style.left=p[0]+'px';snoopy.style.top=p[1]+'px';snoopy.hidden=false;
    }
    frame=requestAnimationFrame(update);
  }
  function sync(){cancelAnimationFrame(frame);update();}
  for(const event of ['playing','pause','ended','emptied'])audio.addEventListener(event,sync);
  document.addEventListener('visibilitychange',sync);
})();
