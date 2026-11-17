/* Local full-track audio; lake and clock select their starting points. */
(() => {
  const button = document.querySelector('#music-toggle');
  const audio = document.querySelector('#song');
  const status = document.querySelector('#music-status');
  const icon = document.querySelector('.record-play');
  let title = 'To All the Dancers of the World, a Round Form of Fantasy by Sweet Trip';
  let pending = false, track = 'sweet', startAt = 46;
  const notify=()=>document.dispatchEvent(new Event('musicchange'));
  function sync() {
    const playing = !audio.paused && !audio.ended;
    button.setAttribute('aria-pressed', String(playing));
    button.setAttribute('aria-label', `${playing ? 'Pause' : 'Play'} ${title}`);
    status.textContent = '';
    icon.textContent = playing ? 'Ⅱ' : '▶';
    notify();
  }
  async function playClockSong() {
    if (track !== 'weird') return;
    audio.pause();
    track = 'daft';startAt = 0;
    title = 'One More Time by Daft Punk';
    document.querySelector('.music-title').textContent = 'One More Time';
    document.querySelector('.music-artist').replaceChildren(document.createTextNode('Daft Punk '), status);
    const cover = document.querySelector('.record-cover img');
    cover.addEventListener('load', notify, {once:true});
    cover.src = '/assets/discovery-cover.jpg';
    cover.alt = 'Discovery album cover';
    audio.src = '/assets/one-more-time.opus';
    audio.currentTime = startAt;
    sync();
    try { await audio.play(); }
    catch { sync(); status.textContent = '· retry playback'; }
  }
  const clock = document.querySelector('#clock');
  document.addEventListener('clockwind', playClockSong);
  clock.addEventListener('click', e => { if(e.detail===0)playClockSong(); });
  clock.addEventListener('keydown', e => {
    if (['Enter',' ','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) playClockSong();
  });
  window.playLakeSong = async () => {
    audio.pause();
    track = 'weird';startAt = 7;
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
      if (audio.ended || audio.currentTime < startAt) audio.currentTime = startAt;
      await audio.play();
    } catch {
      sync();
      status.textContent = '· retry playback';
    } finally { pending = false; }
  });
  for (const event of ['playing', 'pause', 'ended']) audio.addEventListener(event, sync);
  audio.addEventListener('error', () => {sync();status.textContent='· audio unavailable';});
})();
