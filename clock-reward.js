/* The lake reveals a final clock easter egg. */
(() => {
  const api=window.melting;if(!api)return;
  const ns='http://www.w3.org/2000/svg',layer=document.createElementNS(ns,'svg');
  layer.classList.add('hill-ui','clock-clue');layer.setAttribute('aria-hidden','true');
  const cue=document.createElementNS(ns,'g');cue.classList.add('lake-hint');
  for(const [value,y] of [['?',-13],['⌄',-4]]){
    const text=document.createElementNS(ns,'text');text.textContent=value;
    text.setAttribute('y',y);text.setAttribute('text-anchor','middle');cue.append(text);
  }
  layer.append(cue);document.body.append(layer);
  const card=document.createElement('aside');card.id='clock-reward';card.className='hill-ui hill-photo has-caption';
  card.hidden=true;card.setAttribute('role','dialog');card.setAttribute('aria-label','congratulations!');
  card.innerHTML='<div class="hill-caption">congratulations!</div><button class="hill-close" type="button" aria-label="Close congratulations photograph">×</button><img src="/assets/congratulations.png" alt="Shinji smiling beneath a blue sky"><span class="hill-caret" aria-hidden="true"></span>';
  document.body.append(card);
  let armed=false;
  document.addEventListener('lakeactivate',()=>{armed=true;card.hidden=true;update();});
  document.addEventListener('clockreward',()=>{armed=false;card.hidden=false;update();});
  card.querySelector('button').addEventListener('click',()=>{card.hidden=true;});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')card.hidden=true;});
  function update(){
    if(!armed&&card.hidden){cue.style.opacity='0';return;}
    const b=api.getClockBounds();if(!b)return;
    const h=parseFloat(document.querySelector('#liquid-surface').style.height);
    layer.setAttribute('viewBox',`0 0 ${innerWidth} ${h}`);layer.style.height=h+'px';
    const anchor=api.getClockCue();
    const cueScale=Math.max(.55,Math.min(1,(b.right-b.left)/265));
    cue.setAttribute('transform',`translate(${anchor.point[0]+72*cueScale},${anchor.point[1]-22*cueScale})`);
    cue.style.opacity=armed&&anchor.hovered?'1':'0';
    if(!card.hidden){
      const cw=card.offsetWidth,ch=card.offsetHeight,cy=(b.top+b.bottom)/2;
      card.style.left=Math.max(12,Math.min(innerWidth-cw-12,b.right+18))+'px';
      const top=Math.max(scrollY+12,Math.min(scrollY+innerHeight-ch-12,cy-ch/2));
      card.style.top=top+'px';card.style.setProperty('--caret-y',Math.max(40,Math.min(ch-18,cy-top))+'px');
    }
  }
  function tick(){if(!document.hidden)update();requestAnimationFrame(tick);}tick();
})();
