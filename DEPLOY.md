# Publish thanushpatlolla.com with GitHub Pages

The site is plain HTML and CSS. There is no install or build step.

## 1. Put the site on GitHub

Create a public repository named `website` at:

https://github.com/new

Then, from this folder, run:

```bash
git init
git add .
git commit -m "Build personal website"
git branch -M main
git remote add origin https://github.com/thanushpatlolla/website.git
git push -u origin main
```

Any repository name works. `website` is only a suggestion.

## 2. Turn on GitHub Pages

1. Open the repository on GitHub.
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Select branch **main**, folder **/ (root)**, then click **Save**.
5. Under **Custom domain**, enter `thanushpatlolla.com` and click **Save**.

The repository already includes a `CNAME` file containing the same domain.
GitHub recommends adding the custom domain in Pages settings before changing DNS.

Optional but recommended: in your personal GitHub **Settings → Pages**, verify
`thanushpatlolla.com`. GitHub will show a TXT record to add in Cloudflare. This
prevents another GitHub account from claiming a site beneath your domain.

## 3. Point Cloudflare DNS at GitHub Pages

In the Cloudflare dashboard, open **thanushpatlolla.com → DNS → Records**. Remove
any parking records for `@` or `www`, then add these records:

| Type | Name | Content | Proxy status | TTL |
| --- | --- | --- | --- | --- |
| A | @ | 185.199.108.153 | DNS only | Auto |
| A | @ | 185.199.109.153 | DNS only | Auto |
| A | @ | 185.199.110.153 | DNS only | Auto |
| A | @ | 185.199.111.153 | DNS only | Auto |
| CNAME | www | thanushpatlolla.github.io | DNS only | Auto |

Use the gray-cloud **DNS only** setting while GitHub provisions the certificate.
The `www` target must not include `/website`.

GitHub will serve `thanushpatlolla.com` and redirect
`www.thanushpatlolla.com` to it. DNS changes can take up to 24 hours, although
they are often visible sooner.

## 4. Turn on HTTPS

Return to **GitHub repository → Settings → Pages**. Once GitHub reports that the
DNS check succeeded and the certificate is ready, enable **Enforce HTTPS**.
Certificate provisioning can take up to 24 hours.

## 5. Check the records

```bash
dig thanushpatlolla.com +noall +answer -t A
dig www.thanushpatlolla.com +noall +answer -t CNAME
```

The first command should return the four GitHub Pages IP addresses; the second
should show `thanushpatlolla.github.io`.

## Preview locally

From this folder:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Add a blog post later

1. Copy `blog/hello-world.html` to a new file in `blog/` and replace its title,
   date, description, canonical URL, and article body.
2. Add one new `<li>` row to the writing list in `index.html`.

