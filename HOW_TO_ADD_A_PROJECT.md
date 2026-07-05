# How to Add a New Project

Every project on the site is one JSON file in the `projects/` folder. Two steps — the project list (`projects/index.json`) is regenerated automatically by a GitHub Action on every push:

## 1. Create the project JSON

Create `projects/<slug>.json`, where `<slug>` is a short lowercase id with dashes (e.g. `space-raider`). The slug becomes the page URL: `#/project/space-raider`.

```json
{
	"order": 1,
	"title": "Space Raider",
	"engine": "Unity",
	"tags": ["FPS", "Multiplayer", "C#"],
	"shortDescription": "One-liner shown on the project card.",
	"description": "Full text for the project page.\nSeparate paragraphs with \\n.",
	"cover": "assets/space-raider/cover.jpg",
	"video": "https://www.youtube.com/watch?v=XXXXXXXXXXX",
	"screenshots": [
		"assets/space-raider/01.jpg",
		"assets/space-raider/02.jpg"
	],
	"links": [
		{ "label": "GitHub Repo", "url": "https://github.com/Dan-WarrioR/space-raider" },
		{ "label": "Play on itch.io", "url": "https://..." }
	]
}
```

### Fields

| Field | Required | Notes |
|---|---|---|
| `title` | yes | Project name shown everywhere. |
| `order` | no | Display position (lower = first). Projects without it go last, alphabetically. First projects also appear in "Featured" on the landing page. |
| `engine` | no | Rendered as a highlighted tag (`Unity`, `Unreal Engine`, ...). |
| `tags` | no | Extra tags shown next to the engine. |
| `shortDescription` | no | Shown on the project card in the grid. |
| `description` | no | Project page text. `\n` inside the string starts a new paragraph. |
| `cover` | no | Card image, 16:9 works best. |
| `video` | no | Any normal YouTube link (watch, share, or shorts URL). Section is hidden if omitted. |
| `screenshots` | no | Shown in the carousel with arrows and fullscreen view. Section is hidden if omitted. |
| `links` | no | Buttons at the bottom of the project page. |

Every optional field can simply be deleted — its section will not render.

## 2. Add images

Put the cover and screenshots into `assets/<slug>/`. Use JPG or PNG (or WebP for smaller size). Recommended: 1280×720 or any 16:9 resolution, under ~500 KB per image.

## 3. Push

Commit and push — done. A GitHub Action regenerates `projects/index.json` from the folder contents (sorted by `order`), validates every project file, and GitHub Pages redeploys automatically. Never edit `index.json` by hand; run `git pull` afterwards to get the regenerated file locally.

## Checking locally

The site reads `projects/index.json`, so after adding a project regenerate it first, then run any static server from the repo root and open `http://localhost:4173`:

```
node .github/scripts/generate-projects-index.mjs
py -m http.server 4173
```

If a project doesn't show up, open the browser console (F12) — a broken JSON file is reported there and skipped, the rest of the site keeps working.
