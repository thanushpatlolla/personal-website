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
