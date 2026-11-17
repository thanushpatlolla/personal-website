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
- When changing hosting configuration, verify branch builds cannot overwrite
  production before resuming design pushes.

Local server: `python3 -m http.server 8765` from this directory.

## Current published version

User approved revision96 on 2026-11-17: local-time clock with temporary winding
hand offset that resets on release, additional gentle clock drift, and a more
visible copper-red seconds hand. Clock face/case colors unchanged. Includes the
previously approved mountain, motion, playback and Snoopy changes.
Production and design share this approved version. Subsequent design pushes remain
isolated because preview-branch builds are disabled.
