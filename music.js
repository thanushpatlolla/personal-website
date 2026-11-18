/* Full tracks selected by the four photo discoveries. */
(() => {
  const button=document.querySelector('#music-toggle'),audio=document.querySelector('#song');
  const status=document.querySelector('#music-status'),icon=document.querySelector('.record-play');
  const tracks={
    stardust:{title:'Music Sounds Better With You',artist:'Stardust',src:'music-sounds-better-with-you.opus',cover:'stardust-cover.jpg',alt:'Music Sounds Better With You cover',start:0},
    sweet:{title:'To All the Dancers of the World, a Round Form of Fantasy',artist:'Sweet Trip',src:'sweet-trip.opus',cover:'sweet-trip-cover.jpg',alt:'Velocity: Design: Comfort. album cover',start:46},
    peak:{title:'The Girl From Ipanema',artist:'Oscar Peterson Trio',src:'girl-from-ipanema.opus',cover:'we-get-requests-cover.jpg',alt:'We Get Requests album cover',start:0},
    valley:{title:'Why I Do Em Like That',artist:'Westside Gunn',src:'why-i-do-em-like-that.opus',cover:'westside-gunn-cover.jpg',alt:'Westside Gunn album cover',start:0},
    weird:{title:'Weird Fishes / Arpeggi',artist:'Radiohead',src:'weird-fishes.opus',cover:'in-rainbows-cover.jpg',alt:'In Rainbows album cover',start:7},
    daft:{title:'One More Time',artist:'Daft Punk',src:'one-more-time.opus',cover:'discovery-cover.jpg',alt:'Discovery album cover',start:27.4}
  };
  let current='sweet',pending=false,request=0;
  const notify=()=>document.dispatchEvent(new Event('musicchange'));
  function sync(){
    const t=tracks[current],playing=!audio.paused&&!audio.ended;
    button.setAttribute('aria-pressed',String(playing));
    button.setAttribute('aria-label',`${playing?'Pause':'Play'} ${t.title} by ${t.artist}`);
    status.textContent='';icon.textContent=playing?'Ⅱ':'▶';notify();
  }
  async function select(key,autoplay=false){
    const resume=autoplay||(!audio.paused&&!audio.ended);
    if(autoplay&&key===current&&!audio.ended){
      try{await audio.play();return true;}
      catch{sync();status.textContent='· retry playback';return false;}
    }
    const ticket=++request,t=tracks[key];audio.pause();current=key;
    const title=document.querySelector('.music-title');
    if(key==='sweet')title.innerHTML='To All the Dancers of the World,<br>a Round Form of Fantasy';
    else title.textContent=t.title;
    document.querySelector('.music-artist').replaceChildren(document.createTextNode(t.artist+' '),status);
    const cover=document.querySelector('.record-cover img');cover.addEventListener('load',notify,{once:true});
    cover.src='/assets/'+t.cover;cover.alt=t.alt;
    audio.src='/assets/'+t.src;audio.currentTime=t.start;sync();
    if(!resume)return ticket===request;
    try{await audio.play();return ticket===request;}
    catch{if(ticket===request){sync();status.textContent='· retry playback';}return false;}
  }
  window.playPeakSong=()=>select('peak',true);
  window.playStardust=()=>select('stardust');
  window.playSweetTrip=()=>select('sweet');
  document.addEventListener('restoresweet',window.playSweetTrip);
  window.playValleySong=()=>select('valley',true);
  window.playLakeSong=()=>{document.dispatchEvent(new Event('lakeactivate'));return select('weird',true);};
  async function playClockSong(){
    if(!window.photoJourney.open('clock-reward'))return;
    if(await select('daft',true))document.dispatchEvent(new Event('clockreward'));
  }
  const clock=document.querySelector('#clock');
  document.addEventListener('clockwind',playClockSong);
  clock.addEventListener('click',e=>{if(e.detail===0)playClockSong();});
  clock.addEventListener('keydown',e=>{if(['Enter',' ','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key))playClockSong();});
  button.addEventListener('click',async()=>{
    if(pending)return;if(!audio.paused){audio.pause();return;}pending=true;status.textContent='· loading';
    try{if(audio.ended||audio.currentTime<tracks[current].start)audio.currentTime=tracks[current].start;await audio.play();}
    catch{sync();status.textContent='· retry playback';}finally{pending=false;}
  });
  // Space toggles playback on the page; focused controls keep their own keys.
  document.addEventListener('keydown',event=>{
    if(event.key!==' '||event.defaultPrevented||event.ctrlKey||event.metaKey||event.altKey||event.shiftKey)return;
    if(event.target.closest('button,a,input,textarea,select,summary,[contenteditable]:not([contenteditable="false"]),[role="button"],[role="slider"]'))return;
    event.preventDefault();
    if(!event.repeat)button.click();
  });
  for(const event of ['playing','pause','ended'])audio.addEventListener(event,sync);
  audio.addEventListener('error',()=>{sync();status.textContent='· audio unavailable';});
})();
