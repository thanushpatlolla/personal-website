/* Direct preview audio, like the reference site; no iframe or player overlay. */
(() => {
  const button = document.querySelector('#music-toggle');
  const audio = document.querySelector('#song');
  const status = document.querySelector('#music-status');
  const icon = document.querySelector('.record-play');
  const title = 'To All the Dancers of the World, a Round Form of Fantasy by Sweet Trip';
  let pending = false;
  const notify=()=>document.dispatchEvent(new Event('musicchange'));
  function sync() {
    const playing = !audio.paused && !audio.ended;
    button.setAttribute('aria-pressed', String(playing));
    button.setAttribute('aria-label', `${playing ? 'Pause' : 'Play'} preview of ${title}`);
    status.textContent = '';
    icon.textContent = playing ? 'Ⅱ' : '▶';
    notify();
  }
  button.addEventListener('click', async () => {
    if (pending) return;
    if (!audio.paused) { audio.pause(); return; }
    pending = true;
    status.textContent = '· loading';
    try {
      if (audio.ended) audio.currentTime = 0;
      await audio.play();
    } catch {
      sync();
      status.textContent = '· retry playback';
    } finally { pending = false; }
  });
  for (const event of ['playing', 'pause', 'ended']) audio.addEventListener(event, sync);
  audio.addEventListener('error', () => {sync();status.textContent='· audio unavailable';});
})();
