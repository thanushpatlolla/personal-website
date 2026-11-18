# Website deployment

Repository: https://github.com/thanushpatlolla/personal-website
Live site: https://thanushpatlolla.com
Local design preview: http://localhost:8765/

## Actual hosting configuration (verified 2026-11-17)

Cloudflare **Workers Builds**, Worker `personal-website`, hosts the static site.
The previous Pages instructions were inaccurate for this deployment.
Production branch: `main`. Build command: `exit 0`. Deploy command:
`npx wrangler deploy`. Root directory: `/`.

**Builds for Preview branches are disabled.** Keep them disabled unless preview
hosting is explicitly configured and verified to be isolated. Previously the
non-production version command was also `npx wrangler deploy`, so pushes to
`design/melting-landscape` unexpectedly overwrote production despite `main`
remaining unchanged. This was discovered and corrected on 2026-11-17.

## Workflow

- Make and preview design edits locally on `design/melting-landscape`.
- Commit and push the design branch to preserve work; this must not deploy.
- Publish only after user authorization, by fast-forwarding `main` to the
  approved commit. Do not include unapproved later design commits.
- Verify the actual live HTML/script revision, not only the Git branch.
- A successful Git push is not deployment confirmation. On 2026-11-17,
  revision97 was on main while production still served94. The dashboard later
  showed the clock deployment completing and the label build in progress:
  deployment lag, not a timezone bug. GitHub check runs can lag or be absent;
  use Cloudflare's deployment history and verify served HTML/script versions.
- When changing hosting configuration, verify branch builds cannot overwrite
  production before resuming design pushes.

Local server: `python3 -m http.server 8765` from this directory.

## Current approved release

User authorized all current design through revision170 on 2026-11-17.
Includes clear startup that automatically melts with stronger activated text melting, gentler swirling terrain, removed birds and tuning panel, revised songs (Nardis peak, Mysterons forest, Weird Fishes lake), protected music/time controls, and removed Spotify social link. Preview-branch builds remain disabled. Verify live revision170 after pushing main.

Release162 also includes finer stronger sky melt, localized mountain drips, reduced text descent, immediate5.5s melting, and state-dependent click/wind cue tracking a more restrained clock.

Revision163 approved for production:15% more variation in word melt heights with unchanged mean descent; source commit a6ebf8f.

Revision164 approved for production: opening photos starts music and switching/closing photos preserves playback; source commit4bde115.

Revision166 approved for production on2026-11-18: narrow-screen time control stays native/fixed, visible and clickable; source commit7561a0b. Also includes reading heading from165.

Revision167: Nardis by Bill Evans Trio replaces Ipanema at the peak; approved for production.

Revision168: Start fully melted (except reduced-motion preference), approved alongside Nardis update.

Revision169: Mysterons by Portishead replaces Westside Gunn at the forest photo; approved for production.

Revision170: Load unmelted and immediately animate into melted state; reduced-motion stays still. Approved with Mysterons update.
