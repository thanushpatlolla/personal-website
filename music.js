/* Official full-track player; the initial page makes no autoplay claim. */
(() => {
  const toggle = document.querySelector('#music-toggle');
  const panel = document.querySelector('#music-panel');
  const frame = document.querySelector('#music-frame');
  const status = document.querySelector('#music-status');
  function close() {
    frame.removeAttribute('src'); // Stop audio as well as closing the panel.
    panel.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Play To All the Dancers of the World, a Round Form of Fantasy by Sweet Trip');
    status.textContent = '· play';
    toggle.focus({preventScroll:true});
  }
  toggle.addEventListener('click', () => {
    if (!panel.hidden) { close(); return; }
    panel.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Stop music and close player');
    frame.src = 'https://www.youtube.com/embed/FseYuqzoLSQ?autoplay=1&playsinline=1&rel=0';
    status.textContent = '· player open';
  });
  document.querySelector('#music-close').addEventListener('click', close);
  document.querySelector('.music').addEventListener('keydown', event => {
    if (event.key === 'Escape' && !panel.hidden) {event.preventDefault();close();}
  });
})();
