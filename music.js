/* Full tracks selected by the four photo discoveries. */
(() => {
  const button=document.querySelector('#music-toggle'),audio=document.querySelector('#song');
  const status=document.querySelector('#music-status'),icon=document.querySelector('.record-play');
  const tracks={
    sweet:{title:'To All the Dancers of the World, a Round Form of Fantasy',artist:'Sweet Trip',src:'sweet-trip.opus',cover:'sweet-trip-cover.jpg',alt:'Velocity: Design: Comfort. album cover',start:46},
    valley:{title:'Valley in the Ocean',artist:'Bruno Pernadas',src:'valley-in-the-ocean.opus',cover:'bruno-cover.jpg',alt:'Those Who Throw Objects at the Crocodiles Will Be Asked to Retrieve Them album cover',start:0},
    weird:{title:'Weird Fishes / Arpeggi',artist:'Radiohead',src:'weird-fishes.opus',cover:'in-rainbows-cover.jpg',alt:'In Rainbows album cover',start:7},
    daft:{title:'One More Time',artist:'Daft Punk',src:'one-more-time.opus',cover:'discovery-cover.jpg',alt:'Discovery album cover',start:0}
  };
  let current='sweet',pending=false,request=0;
  const notify=()=>document.dispatchEvent(new Event('musicchange'));
  function sync(){
    const t=tracks[current],playing=!audio.paused&&!audio.ended;
    button.setAttribute('aria-pressed',String(playing));
    button.setAttribute('aria-label',`${playing?'Pause':'Play'} ${t.title} by ${t.artist}`);
    status.textContent='';icon.textContent=playing?'Ⅱ':'▶';notify();
  }
  async function select(key){
    const ticket=++request,t=tracks[key];audio.pause();current=key;
    const title=document.querySelector('.music-title');
    if(key==='sweet')title.innerHTML='To All the Dancers of the World,<br>a Round Form of Fantasy';
    else title.textContent=t.title;
    document.querySelector('.music-artist').replaceChildren(document.createTextNode(t.artist+' '),status);
    const cover=document.querySelector('.record-cover img');cover.addEventListener('load',notify,{once:true});
    cover.src='/assets/'+t.cover;cover.alt=t.alt;
    audio.src='/assets/'+t.src;audio.currentTime=t.start;sync();
    try{await audio.play();return ticket===request;}
    catch{if(ticket===request){sync();status.textContent='· retry playback';}return false;}
  }
  window.playPeakSong=()=>select('sweet');
  window.playValleySong=()=>select('valley');
  window.playLakeSong=()=>{document.dispatchEvent(new Event('lakeactivate'));return select('weird');};
  async function playClockSong(){
    if(!window.photoJourney.open('clock-reward'))return;
    if(current==='daft'){document.dispatchEvent(new Event('clockreward'));return;}
    if(await select('daft'))document.dispatchEvent(new Event('clockreward'));
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
  for(const event of ['playing','pause','ended'])audio.addEventListener(event,sync);
  audio.addEventListener('error',()=>{sync();status.textContent='· audio unavailable';});
})();
