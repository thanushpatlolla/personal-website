# Melting landscape — design checkpoint

2026-11-17. Exploratory design branch; production is main (Cloudflare Pages).
Do not merge/push to main without Thanush's explicit instruction.

Intent: “a small, strange place to visit”, quiet and dreamlike like The
Persistence of Memory, rather than a résumé. References: mirayu.com,
iansilber.com, nikhilvemuri.com. Keep content minimal; future writings can wait.

Thanush selected Downloads/100_1423 (2) 2.JPG. assets/mountains.jpg is a resized
copy of that photograph. Do not use the unrelated document photos in Downloads.
No moon in this scene: he clarified the moon idea was more for 100_1642.jpg.

Single spring value controls SVG watch deformation, individual bio words,
canvas terrain stretching and dusk-to-night tint. Hold or circular drag on the
watch winds it; release unwinds over 42 seconds. Space/Enter also work. Pause
restores legibility; reduced-motion starts paused. No audio/autoplay. No package
manager, external runtime dependencies, or build step. Original photo and bio
remain usable with JS disabled. Social and reading links remain undistorted.

Bio is the user's supplied wording. Preserve all six social icons (email, X,
LinkedIn, GitHub, Spotify, Instagram). User requested arXiv:1412.0233 and suggested
Clara Collier's “After Work, We’ll Have Each Other”; both now in Reading.

Preview: python3 -m http.server 8765 from checkout. Check desktop and narrow
mobile, hold/release, circular drag, keyboard, pause, reduced-motion, console,
and no-JS fallback when changing interaction. Photo is user-provided; no generated
imagery. CSS/JS visual effects leave original asset unchanged. Existing favicon,
canonical URL, robots and sitemap retained. Metadata updated to new interests.

## Revision: continuous painted melt (same day)
User rejected word-level skew/stretch and slow oval watch. Replaced renderer with
one WebGL textured surface for the complete photograph and UI, plus a separately
meshed painted watch. Whole glyph strokes bend together along smooth gravity
channels; no word splitting or independent movement. Watch folds into an
asymmetric narrow waist and heavy curled lower lobe. Numerals and ticking hands
are part of its texture and deform with the enamel. Generated transparent oil
painted watch at assets/painted-watch.png; original landscape photo unchanged.

Melt duration: 5.5 seconds, immediate onset on release. Hold restores in ~0.87 s;
circular dragging adds wind. Full scene includes name, icons, reading, footer,
and hint. Scene capture uses DOM text ranges for actual line wrapping; native
HTML retained for semantics/keyboard and readable fallback without WebGL.
Pointer links/pause and watch are hit-tested against the deformed outlines,
including the watch tip outside its original button. Reduced-motion starts
paused. Renderer stops repeated uploads of an unchanged fully melted surface;
hands tick once per second. Assets are same-origin, no dependencies/build step.

Revision validation: visually inspected full melt and restored states on desktop
and 390×844 mobile. Held the melted lower tip for 1.4s: melt returned from 1 to
0.03 after release. Clicked visibly deformed pause control: melt=0, pressed=true.
Emulated reduced-motion: melt=0, pressed=true; reset emulation after check.
No console errors/warnings; no horizontal overflow. Screenshot pair in chat
workspace outputs. Browser rendering is tested in Chromium; Safari/Firefox
have not been independently tested. Original HTML is retained as fallback.

## Revision 3: quiet, localized surrealism and mechanical winding
User rejected extreme, periodic full-page waves and instant hold recovery. Latest
behavior supersedes previous rates and shape notes:
- Seven deterministic irregular 2D soft spots (no periodic vertical columns),
  maximum local shifts on the order of 12–37 px desktop, smaller on mobile.
  Text stays legible at full melt; mountains/horizon remain recognizable.
- Clock retains a baseline soft, asymmetrical shape at melt=0. Broad bend and
  subtle fold shading replace the extreme hourglass pinch. Never fully circular.
- Clockwise circular motion is primary: 7.5-degree detents, .021 charge/detent,
  roughly one revolution to restore. Counterclockwise freewheels without winding.
  Hands move per detent; case takes up slight torsion and springs back on release.
- Hold: .7 s dwell then 18 s to full wind. Release: 6.5 s to melt, immediate onset.
  Charge is smoothed over ~60 ms. Pointer angle center is fixed for the gesture;
  spindle crossings are ignored. Right/Up keys advance two detents. Space/Enter
  hold slowly, and no longer accidentally instant-wind through a synthetic click.
- Validation: 1.8 s hold from full melt left melt=.955. One clockwise circular
  gesture brought it to .029. Real pointer events, not direct state injection.
