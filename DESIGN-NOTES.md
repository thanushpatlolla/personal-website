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

## Revision 4: moving refractive dream / painted Crash
Latest user direction supersedes revision 3's restrained legibility target:
- Harder-to-read melted text and bent photo, built from seeded multi-scale 2D
  value noise with domain warping. Four small advection steps avoid folded-over
  triangles cutting letters into shards. No periodic bands. Very slow autonomous
  field drift; exact original scene restored by winding.
- Mouse motion initially used a trailing lens; user explicitly rejected sticky
  following. Final version injects disturbances into an 88-column damped wave
  grid. Surface slopes refract the scene. Waves propagate and decay independently
  after movement stops. No static cursor attraction. No input while winding.
- New generated painted-crash.png uses the two user-supplied visual references:
  oil-painted pale blue/ivory/gold, permanently asymmetric Crash silhouette.
  Winding relaxes some of its waist and length, never makes it circular. More
  pronounced droop at full melt; animated hands remain in the same texture.
- Three turns: CHARGE_PER_DETENT=1/(48*3). Turning suppresses hold auto-charge;
  stationary hold remains slow. Removed angular speed clipping. Verified real
  pointer revolutions: remaining melt .681, .352, .015 after turns 1, 2, 3.
- Removed visible clock instructions and Reading heading. Loss-surfaces anchor
  now displays arxiv.org/abs/1412.0233. Added The Hardware Lottery titled link;
  kept After Work title and all social links.
- Chromium pacing sample (90 rAFs): average 16.67 ms, max 17.2 ms on current host.
  Not a cross-device performance guarantee. No runtime errors observed.
Final water revision QA: verified 390×844 via direct page capture (browser preview
thumbnail scaling differed during emulation); page fits with no horizontal
overflow and clock remains in view. Cleared device override. Exercised mouse
sweep and confirmed continuing scene motion, no application console errors.
Updated deformation opens the clock's concave waist slightly at full wind and
adds more hanging length at melt, preserving the approved painted design.

## Revision 5: both directions / unified flowing paint / faded sky clock
User requested retaining the approved painterly style, with a shape closer to
Cartier Crash and colors faded into the photo. Final asset painted-crash-muted.png
was edited from the approved blue/gold painted image using the Cartier/photo
references. A first beige-heavy candidate was discarded (not in repo).
Clock now smaller/higher in sky; mobile gives it its own sky area above bio.
Clock vertices now pass through the exact same world-space flow as photograph
and type, and receive the same atmospheric tint. Fine crumpling reduced; smoother
low/mid-frequency refraction plus irregular downward pigment flow added.
Both turn directions charge; all arrow keys supported. Verified real alternating
counterclockwise/clockwise/counterclockwise turns: melt .680, .348, .027.
Mobile 390x844 verified, no horizontal overflow. Hardware Lottery is now plain
hardwarelottery.github.io above the After Work title link.

Next user steering: add Sweet Trip “To All the Dancers of the World, a Round Form
of Fantasy” playing with album icon bottom left. Replace pause time label with
time is passing / let time pass as button. Move “somewhere, for a little while”
to bottom right; user uncertain about phrase and wants to consider alternatives.

## Revision 6: music and corner copy
Added bottom-left album art/title button for Sweet Trip's “To All the Dancers of
the World, a Round Form of Fantasy”. Opens a 320x200 official YouTube player
(FseYuqzoLSQ); a user click starts full-track playback. No page-load autoplay.
Closing removes iframe src, stopping audio. Native iframe remains visible during
playback; widget is outside the WebGL capture/hit testing. Artwork is hotlinked
from Spotify's oEmbed thumbnail. Bandcamp stream was unavailable; Spotify embed
was preview-only. No audio downloaded or redistributed.
Changed time toggle to “time is passing” / “let time pass”. Moved “somewhere, for
a little while.” to bottom right pending user's choice; suggested “nothing to do
but stay a while”, shorter “stay a while”, or leaving the corner empty.
Verified embedded YouTube playback: Pause video button, advancing elapsed time,
6:19 duration. Verified close removes source, keyboard time toggle resets melt
to 0, 390x844 mobile placement without horizontal overflow, no runtime errors.
JS parsed/executed in Chromium; node unavailable on shell PATH. Screenshot saved
in chat outputs as music-landscape-v6.jpg. No production deployment authorized.

## Revision 7: compact text, broken escapement, direct audio
User rejected embedded video/music UI and requested smaller, compressed text,
matching name/music side margins, no footer phrase, unchanged time-button spot.
Bio is now 16px (same as name), tighter 1.5 leading, shortened to 2 compact
paragraphs. Name retained provisionally as a small identifier; not required.
Shared --side is 44px desktop / 24px mobile for name, bio, music. Removed footer.
Cleaned old CSS overrides; smaller 40px album art. Time button stays top right.
Clock advances on seeded uneven intervals: 0.18–0.34s double-tick spacing,
0.50–1.20s normal waits, occasional 1.20–1.44s hesitation; 6% double steps.
Expected rate ~1.30 clock seconds per real second; winding/melting rate unchanged.
Fixed resize feedback from old canvas height affecting body.scrollHeight.
Mira inspection: audio.js?v=154 uses Audio elements with tracks.json previewUrl,
Apple iTunes previews. Replaced iframe with direct native audio from official
Apple lookup track 299710497. Verified real playback at 8.34s, readyState=4,
duration 30.001s; pause works, iframe count=0. Preview label is explicit.
Full-length native playback STILL NEEDS a full-track audio file or direct source;
no Sweet Trip audio found in Downloads/Music. Do not claim full song now plays.
Verified bio/name 16px, equal 44px desktop /24px mobile margins, no horizontal
overflow, canvas height exactly844 in 390x844 viewport, time toggle and no logs.
Screenshot compact-landscape-v7.jpg in chat outputs. No production push.

## Revision 8: user's clock PNG and restored full bio
User supplied clipboard-03a1c7e8...png (1093x1439, alpha); copied byte-for-byte to
assets/user-crash-clock.png. Renderer now contains it at native aspect ratio in
700-square texture instead of stretching it square. Hands centered at340,350
with narrower x scale to remain inside the elongated face; shared flow retained.
Restored BOTH original user-written bio paragraphs: prior compression had removed
wording, which user noticed. Preserve all wording now; keep16px and upper-left
layout. Music art increased40→48px, captions11→12px, artist10→11px. Bottom gap
30→48px desktop and24→40px mobile; shared side margins retained.
Time button's rectangular keyboard focus indicator replaced with underline in
both CSS and canvas. No border/box. Verified focused label + outline:none,
390x844 full text/no horizontal overflow/reading ends534.5/music starts752;
keyboard clock interaction resumes flow, no warnings/errors. Final preview image
supplied-clock-v8.jpg. Direct music remains30-second preview pending full audio.

## Revision 9: anonymous corner / left-banked clock
Removed visible name and opening “Currently studying EECS and physics at MIT.”
sentence at user's request. Retained all subsequent original wording.
Increased shared left margin44→56px desktop,24→32px mobile. Time control's
right margin preserved44/24px. Music bottom margin48→60px desktop,40→52px mobile;
art48→56px; title12→13px, artist11→12px.
Clock banked60 degrees counterclockwise (TOP POINTS LEFT per user's correction),
with cross-axis foreshortening. Original image stays untouched, both hands and
face share transformation and sky flow. CSS fallback matches leftward bank.
Verified390px mobile: no overflow, reading ends510.5/music begins735.8,
left margins32px, bottom gap52px. No console warnings/errors. Screenshot
sky-clock-left-v9.jpg in chat outputs. Production unchanged; preview audio still
30 seconds pending full-track asset/source.


## Revision 10–11: deterministic melting, typography, clock variants
See MELTING.md for current architecture, tuning API, validation and pending audio.
Replaced ripple field with seeded localized material integration; retained the
viscous mouse painting that the user explicitly liked. Added controllable
meltProgress, configurable gravity/anchors/noise/viscosity/damping, optional
Melt studio (?tune=1 or Shift+M), restrained copy sag and persistent ambient creep.
Preserve exact latest bio in index.html. Music text13/12px; bio16px. Preview labels
removed from visible text. Time button bottom right, bottom aligned with music.
Music art/text now captured into the same mesh and hit-tested at warped positions.
Clock variants all use untouched original PNG with optional subtle shader warmth;
regenerated alternatives were rejected and are not used. Original clock can be
restored in the tuning selector or with ?clock=original. Mountain option applies
a draped geometry to that same original asset. User is supplying full-track audio
for requested start at42sec; preview remains30sec until then.
No production deployment is authorized. Continue on design/melting-landscape.


Revision 12: Warm sky remains default. Original PNG remains untouched. Added
subtle contrast reduction and atmospheric color mixing to warm modes. Ridge
clock is smaller, drapes down one side rather than forming a hammock, and uses
the terrain flow exactly (no independent spindle anchor). Lower face receives
restrained slope shading. Ambient field now28/38px amplitudes and .18 time rate
(previously8/12 and.075). Full-melt sample moved9.56px in2.5sec without mouse;
render submission2.8ms on this host. Manual slider still freezes ambient motion.
45 geometry/18 clock cases passed before final shading-only change. This is
a manually composed 2D terrain illusion, not depth reconstruction.


Revision13: User requests the draped preview and fully melted initialization.
Default clock and Reset now select ridge. Initial energy/charge are0, so first
render is meltProgress1 and ambient motion runs immediately. Explicit URL or
saved clock selection still overrides the default. Reduced-motion retains its
existing paused/readable behavior. Original and warm sky remain selectable.

User also requested more motion in words: ambient protection reduced from82%
to45% in copy area. Deterministic copy geometry/size protection is unchanged.

Revision14: User rejected mountain placement; default and Reset return to warm
floating sky clock. Keep fully melted initialization and increased text motion.
Mountain variant remains optional; original asset remains untouched.


Revision15–18: User rejected repetitive baseline curves and any “drag to wind”
label. Final text melt uses isolated2D patches, stretching selected words and
icons/links rather than stretching every line. Added lower patch for reading
links; increased amplitudes at explicit user request. Overall patch influence
fades at block boundary. Tests now allow local stretching (max2.0691) while
checking positive orientation;45 scene and18 clock cases pass.
Clock hover shows ONLY a thin curved arrow, interpolated along original rim UVs
and mapped through watchPoint so it melts/paints with clock. No label. Keyboard
focus also shows cue. Time hover adds a similarly mapped underline. Its hover
and click target have28px horizontal/22px vertical padding, tested outside the
visible text. Its deformation is attenuated86% locally to keep it away from
corner and easier to catch. Original clock and warm default preserved.
Browser checked latest screenshot, no warnings/errors. Pending full-track audio
file/start42sec remains outstanding. Continue on design/melting-landscape.

Revision19: Added three quieter localized pulls in previously less-deformed
upper-right, middle-left, and lower-right portions of the copy block, at user
request. Existing strongest patches and block-edge falloff remain unchanged.

Revision20–21: User requested barely readable text, more waves and scattered
scene stretching. Copy patch amplitudes increased35%, added nonperiodic
correlated waves; five additional localized landscape pulls. Geometry checks
pass45+18 cases; max local copy stretch2.9912 (intentional stronger effect).
Restoration verified melt0 and initial melt1. User then requested black arrow
under clock, aligned closely, thin rather than thicker. Arrow now traces actual
original PNG alpha silhouette at700px texture size, offset9 texture pixels,
Catmull interpolated then mapped through exact watch geometry. No text label.
GitHub social link/icon removed at user request. Latest preview checked, no logs.
