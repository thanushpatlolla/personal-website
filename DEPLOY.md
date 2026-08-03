# Publish thanushpatlolla.com with Cloudflare Pages

The site is plain HTML and CSS. GitHub stores the source; Cloudflare Pages hosts
the website, deploys each update, manages the domain, and provides HTTPS.

Repository: `git@github.com:thanushpatlolla/personal-website.git`

## 1. Push the current site to GitHub

From this folder:

```bash
git add .
git commit -m "Configure Cloudflare Pages hosting"
git push
```

The GitHub Pages-specific `CNAME` file is intentionally not used with
Cloudflare Pages.

## 2. Create the Cloudflare Pages project

1. Sign in to the Cloudflare dashboard.
2. Open **Workers & Pages**.
3. Select **Create application → Pages → Import an existing Git repository**.
4. Connect GitHub when prompted and choose
   `thanushpatlolla/personal-website`.
5. Use these deployment settings:

| Setting | Value |
| --- | --- |
| Project name | `thanushpatlolla` |
| Production branch | `main` |
| Framework preset | `None` |
| Build command | `exit 0` |
| Build output directory | `.` |
| Root directory | Leave blank |

6. Select **Save and Deploy**.

Cloudflare will first publish the site at a URL similar to
`thanushpatlolla.pages.dev`. Every later push to `main` will automatically
create a new production deployment.

## 3. Connect thanushpatlolla.com

After the first deployment succeeds:

1. Open the Pages project in Cloudflare.
2. Select **Custom domains → Set up a domain**.
3. Enter `thanushpatlolla.com` and continue.
4. Confirm the DNS record Cloudflare proposes.
5. Repeat the process for `www.thanushpatlolla.com` if you want the `www`
   address to work too.

Because the domain is registered and managed in the same Cloudflare account,
Cloudflare can create the required DNS records automatically. Associate the
domain through the Pages project's **Custom domains** screen instead of adding
a record manually first.

If you previously added GitHub Pages DNS records, remove the four GitHub
`185.199.*` A records and the `www → thanushpatlolla.github.io` CNAME before
connecting the Pages domain. Do not remove unrelated email-verification, MX,
TXT, or registrar records.

Cloudflare provisions HTTPS automatically. Wait until the custom domain status
shows **Active**, then open both the apex and `www` addresses to confirm they
load.

## Preview locally

From this folder:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Publish future changes

```bash
git add .
git commit -m "Update website"
git push
```

Cloudflare Pages will deploy the pushed commit automatically.

## Add a blog post later

1. Create a new standalone HTML file in `blog/` with its title, date,
   description, canonical URL, and article body.
2. Uncomment the Writing section in `index.html`, then replace its placeholder
   date, link, and title. For later posts, add another `<li>` row to that list.
