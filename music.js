/* Local full-track audio; lake and clock select their starting points. */
(() => {
  const button = document.querySelector('#music-toggle');
  const audio = document.querySelector('#song');
  const status = document.querySelector('#music-status');
  const icon = document.querySelector('.record-play');
  const sweetSource = audio.getAttribute('src');
  let title = 'To All the Dancers of the World, a Round Form of Fantasy by Sweet Trip';
  let pending = false, sweetTrip = true;
  const notify=()=>document.dispatchEvent(new Event('musicchange'));
  function sync() {
    const playing = !audio.paused && !audio.ended;
    button.setAttribute('aria-pressed', String(playing));
    button.setAttribute('aria-label', `${playing ? 'Pause' : 'Play'} ${title}`);
    status.textContent = '';
    icon.textContent = playing ? 'Ⅱ' : '▶';
    notify();
  }
  async function restoreSweetTrip() {
    if (sweetTrip) return;
    audio.pause();
    sweetTrip = true;
    title = 'To All the Dancers of the World, a Round Form of Fantasy by Sweet Trip';
    document.querySelector('.music-title').innerHTML = 'To All the Dancers of the World,<br>a Round Form of Fantasy';
    document.querySelector('.music-artist').replaceChildren(document.createTextNode('Sweet Trip '), status);
    const cover = document.querySelector('.record-cover img');
    cover.addEventListener('load', notify, {once:true});
    cover.src = '/assets/sweet-trip-cover.jpg';
    cover.alt = 'Velocity: Design: Comfort. album cover';
    audio.src = sweetSource;
    audio.currentTime = 46.5;
    sync();
    try { await audio.play(); }
    catch { sync(); status.textContent = '· retry playback'; }
  }
  const clock = document.querySelector('#clock');
  document.addEventListener('clockwind', restoreSweetTrip);
  clock.addEventListener('click', e => { if(e.detail===0)restoreSweetTrip(); });
  clock.addEventListener('keydown', e => {
    if (['Enter',' ','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) restoreSweetTrip();
  });
  window.playLakeSong = async () => {
    audio.pause();
    sweetTrip = false;
    title = 'Weird Fishes / Arpeggi by Radiohead';
    document.querySelector('.music-title').textContent = 'Weird Fishes / Arpeggi';
    const artist = document.querySelector('.music-artist');
    artist.replaceChildren(document.createTextNode('Radiohead '), status);
    const cover = document.querySelector('.record-cover img');
    cover.addEventListener('load', notify, {once:true});
    cover.src = '/assets/in-rainbows-cover.jpg';
    cover.alt = 'In Rainbows album cover';
    if (!audio.src.endsWith('/assets/weird-fishes.opus')) audio.src = '/assets/weird-fishes.opus';
    audio.currentTime = 7;
    sync();
    try { await audio.play(); }
    catch { sync(); status.textContent = '· retry playback'; }
  };
  button.addEventListener('click', async () => {
    if (pending) return;
    if (!audio.paused) { audio.pause(); return; }
    pending = true;
    status.textContent = '· loading';
    try {
      if (audio.ended || audio.currentTime < (sweetTrip ? 46.5 : 7)) audio.currentTime = sweetTrip ? 46.5 : 7;
      await audio.play();
    } catch {
      sync();
      status.textContent = '· retry playback';
    } finally { pending = false; }
  });
  for (const event of ['playing', 'pause', 'ended']) audio.addEventListener(event, sync);
  audio.addEventListener('error', () => {sync();status.textContent='· audio unavailable';});
})();
