# Melting scene

Buildless HTML + JavaScript + WebGL 1. Run `python3 -m http.server 8765` in
this checkout. Open `http://localhost:8765/?tune=1` for Melt studio, or press
Shift+M on the normal page. Escape closes it. Saved settings are browser-local;
Reset clears them. No settings are uploaded.

## Interaction

The winding clock remains the normal controller. Either direction charges it;
release restores the melt over 6.5 seconds. The time button restores/pauses.
The studio's Melt progress slider holds any state from 0 to 1. Turning the clock
or selecting Use clock resumes its normal control from that exact state.
Mouse movement deposits directional momentum into a diffusive, frictional field.
It drags the material along, then the displaced paint slowly settles. This is
separate from the deterministic base shape; Clear paint removes that transient.
Reduced-motion starts paused. The original document is the no-WebGL fallback.

## Geometry

`melt-field.js` exports `MeltField` to the browser (or CommonJS). It has no DOM,
image, or WebGL dependency. It maps coordinates of any textured image; no
before/after images are required. `scene.js` textures a 128×112 mesh with the
photograph, laid-out text, music artwork and playback icon, and a 64×80 mesh with the supplied clock PNG.
Textures stay attached to the vertices. WebGL rasterizes both meshes.

The base velocity field combines localized forward pulls, radial volume changes,
gravity, broad seeded material noise, and quieter detail. Feathered anchor masks
hold selected regions; a quiet upper sky and fixed perimeter avoid an all-over
wave effect. Six midpoint-integration steps map each vertex through that field.
The field contains no time input, so scrubbing cannot accumulate drift.

The clock adds a stable spindle and a softer, swollen trailing edge. Its top
banks left. Perspective is applied after banking so the screen-right side recedes.
Its shared world-space deformation and projected hit target follow the same math.

The field is cached on a spatial grid when settings/size change. Mesh index
buffers and vertex storage are reused. The static base map is cached separately from the moving paint. Slow seeded
ambient creep continues in normal clock mode even at full melt. Manual progress
freezes that extra motion so comparisons stay deterministic. Keeping the mapping in JavaScript lets pointer hit tests
use exactly the rendered geometry rather than approximate shader-only offsets.

## API and parameters

```js
window.melting.setMeltProgress(0.65); // holds a deterministic base shape; clears mouse paint
window.melting.configure({ gravity: 1.1, intensity: 0.9, anchoring: 0.8 });
window.melting.resetInteraction();
window.melting.useClock();
window.melting.getState(); // current progress, settings, interaction activity, render cost
```

`MeltField.defaults` and `MeltField.limits` define validated settings:

- intensity: overall deformation strength
- scale: spatial extent of the localized bends
- gravity: downward sag; direction: its angle in degrees (0 = down)
- anchoring: how firmly the selected rigid areas hold
- noiseFrequency / detail: material irregularity (not time oscillation)
- viscosity / damping / drag: mouse field diffusion, friction, and injected momentum

For a different image, use the same field on its mesh UVs, or replace the page's
photo. Its default regional layout is art-directed for this landscape; it does
not infer object boundaries. Supply normalized regions for another composition:

```js
const field = new MeltField({ intensity: 1 });
field.resize(imageWidth, imageHeight);
field.setRegions({
  // [centerX, centerY, radiusX, radiusY, pullX, pullY, volume]
  zones: [[0.5, 0.7, 0.2, 0.25, 12, 65, 0.1]],
  // [centerX, centerY, radiusX, radiusY, firmness]
  anchors: [[0.5, 0.3, 0.15, 0.12, 0.9]]
});
const [x, y] = field.map(originalX, originalY, meltProgress);
```

Pulls are reference pixel amplitudes, scaled with the canvas; centers and radii
are fractions of the image. Positive volume expands locally; negative contracts.
`window.melting.setRegions(...)` applies these to the current scene too.

## Validation and limits

`node tests/melt-field.test.cjs` checks exact zero/restoration, determinism,
no cumulative drift, fixed boundaries, finite results, and positive triangle
orientation across 45 size/parameter/progress cases and 6 tilted-clock cases.

Chromium desktop: a 90-frame mouse-drag sample averaged 16.66 ms/frame
(max 17.5 ms), with 7.77 ms average geometry/render submission cost on this host.
This is not a mobile-device benchmark. Visually checked 390×844 mobile, normal
and manual states, controls, keyboard clock handoff, and browser console.
Safari and Firefox have not been independently tested. This is an art-directed
viscous deformation model, not an incompressible Navier–Stokes simulation.

The music is currently a 30-second Apple preview. Visible play/playing preview
labels were removed at the user’s request; the accessible label identifies it. Full-track direct audio
requires an audio asset/source; there is no hidden player or redistributed song.


## Current composition (revision 11)

Bio: exact user wording, now including “old Nintendo games, bookstores, and
collecting vinyl.” Nominal bio size 16px, music title 13px, artist 12px. Desktop
intro/music share left=152px. Intro raised to y=125px. Music bottom=84px; time
control moved to bottom right with the same bottom=84px and previous right=80px
(56px at 761–1000px). Mobile bottom=72px, right=32px. Mobile music wraps in the
space remaining beside the time button. The whole lower UI now shares scene
geometry and hit testing. Feathered copy masks limit glyph inflation while a
shallow continuous sag bends baselines. Lower controls receive extra anchoring
to prevent clipping offscreen at full melt. Photo saturation is +8%.

The Clock selector in Melt studio offers **Original**, **Warm · sky**, and
**Warm · mountains**. Deep links: `?clock=original`, `?clock=warm`, `?clock=ridge`.
The default is warm sky. All three use the EXACT original user-crash-clock.png;
no regenerated image is consumed. Warm modes apply a small shader RGB shift
(+4.5% red, +1.125% green, -5.4% blue), preserving all texture and geometry.
The user explicitly rejected regenerated clock variations. Do not overwrite the
original. The ridge version lays the same mesh across a photo-space landmark,
adds a broad sag and soft contact shadow, and follows the shared terrain flow.
It remains windable. Mobile ridge mode raises the bio to avoid overlap.
`window.melting.setClockStyle('original'|'warm'|'ridge')` switches immediately;
Save settings remembers the selection locally. A URL selection takes precedence.

Latest QA: 45 geometry cases + 18 clock mode/size/progress cases pass without
inverted triangles. Default protected bio max principal stretch 1.1283. Verified
390×844 mobile with no horizontal overflow, equal lower DOM edges, and clicking
the warped music cover starts audio. Verified original/warm/ridge selector.
Full-melt ambient sample moved ~0.47 CSS px over 1.8s without pointer input;
render submission ~1.2ms for that sample on this host (not a device benchmark).
No browser console warnings/errors observed.

Pending: user requested full song playback starting at 0:42 and said they will
provide the audio file. Current Apple preview is only 30 seconds; official
Bandcamp page exposes no playable stream (`file:null`). Do not pretend seeking
to 42 works on the preview. Integrate supplied full audio when it arrives.


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
