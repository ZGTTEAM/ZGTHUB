# AGENTS.md

## What this project is

ZGTHUB is a **single static page**: `index.html` contains all markup, CSS and
JavaScript inline. There is no package manager, no build step, no backend and
no environment variables — nothing in the code reads a secret or calls an
external service.

## Running it here

```
docker compose -f docker-compose.base44.yml up -d
```

`web` serves the repository root (bind-mounted, read-only) with Python's
stdlib `http.server` on host port 3000. nginx is not used: it drops its workers
to an unprivileged user, which cannot read this mode-700 checkout. Because the source is mounted rather than
baked into an image, there is nothing to rebuild: edit `index.html` and refresh
the preview. Force a full preview refresh when the browser cached the old page.

Health: `docker compose -f docker-compose.base44.yml ps` and
`curl -fsS http://localhost:3000/` should return the page.

## Verifying changes

There is no test suite. Check the served page, e.g.:

```
curl -fsS http://localhost:3000/ | grep -q "ZGTHUB" && echo ok
```

The navigation buttons (`home`, `projects`, `lore`, `code`, `news`, `secret`)
are inline `onclick` handlers in `index.html`; they swap the contents of
`#content` in place, except `home()`, which reloads the document.

## Deployment

`.github/workflows/jekyll-docker.yml` builds the site with the `jekyll/builder`
image into `_site/` on pushes and pull requests to `main` (GitHub Pages style).
There is no `_config.yml`, so that step is effectively a passthrough of the
static files. The compose file above is only for local/preview use.
