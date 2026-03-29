# PillowBasics Blog

A static blog website framework for the **PillowBasics** open-source game engine.  
Styled with grey backgrounds and glassmorphism (transparent blur) controls.

## Quick Start

```bash
# 1. Install dependencies (Node.js ≥ 18 required)
npm install

# 2. Build the site
npm run build

# 3. Open docs/index.html in your browser
```

## Adding Content

### Blog Posts

Place Markdown files in the `Blogs/` folder:

```
Blogs/
  blog000.md
  blog001.md
  blog002.md
  ...
```

Posts are listed in reverse order (newest first) on the home page.

### Pinned Posts

Place Markdown files in the `Pinned/` folder:

```
Pinned/
  about.md
  roadmap.md
```

Pinned posts appear at the top of the home page in a highlighted section.

### Front Matter

Each `.md` file supports optional YAML front matter:

```markdown
---
title: My Post Title
date: 2026-03-29
summary: A short description shown on the home page card.
---

Your content here…
```

| Field     | Description                                    |
|-----------|------------------------------------------------|
| `title`   | Post title (falls back to filename if omitted) |
| `date`    | Publication date (`YYYY-MM-DD`)                |
| `summary` | Short excerpt shown in the post card           |

## Watch Mode

Automatically rebuild when files in `Blogs/` or `Pinned/` change:

```bash
node build.js --watch
```

## Output

The built site is written to `docs/` — ready to serve with GitHub Pages  
(**Settings → Pages → Source: `docs/`**).

## Deployment (GitHub Pages)

1. Push your changes (including the `docs/` folder) to GitHub.
2. In your repository settings, go to **Pages**.
3. Set the source to **Deploy from a branch** → `main` / `docs` folder.
4. Your blog will be live at `https://<user>.github.io/<repo>/`.

## Project Structure

```
├── Blogs/          ← Add your blog posts here (*.md)
├── Pinned/         ← Add pinned posts here (*.md)
├── docs/           ← Generated static site (commit this for GitHub Pages)
│   ├── index.html
│   ├── style.css
│   └── posts/
├── build.js        ← Static site generator
└── package.json
```
