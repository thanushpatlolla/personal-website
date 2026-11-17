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

## Current published version

User approved all current design changes through revision120 on 2026-11-17.
Includes 30% starting melt, faster desktop winding, tuned mountain/ambient motion,
propagating mouse waves with immediate onset, 3-second pause restoration,
free photo discovery with lake unlocking clock, and sampled photo-frame colors.
Gradient experiment and preview controls are removed. Preview-branch builds
remain disabled. Verify live revision120 after the production push.
