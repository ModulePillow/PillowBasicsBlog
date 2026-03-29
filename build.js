#!/usr/bin/env node
/**
 * PillowBasics Blog — Static Site Builder
 *
 * Usage:
 *   npm run build           Build the site once into ./docs/
 *   node build.js --watch   Rebuild automatically when files change
 *
 * Content layout:
 *   ./Blogs/    *.md  — regular blog posts
 *   ./Pinned/   *.md  — posts pinned to the top of the main page
 *
 * Output:
 *   ./docs/index.html            Main page
 *   ./docs/posts/<slug>.html     Individual post pages
 *   ./docs/style.css             Stylesheet (copied from source)
 */

'use strict';

const fs   = require('fs');
const path = require('path');

let marked;
try {
  ({ marked } = require('marked'));
} catch {
  console.error('[build] "marked" is not installed. Run: npm install');
  process.exit(1);
}

// ─── Configuration ────────────────────────────────────────────────────────────

const ROOT      = __dirname;
const BLOGS_DIR = path.join(ROOT, 'Blogs');
const PINNED_DIR= path.join(ROOT, 'Pinned');
const OUT_DIR   = path.join(ROOT, 'docs');
const POSTS_DIR = path.join(OUT_DIR, 'posts');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Parse a simple YAML-like front-matter block (--- ... ---) */
function parseFrontMatter(src) {
  const match = src.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: src };

  const meta = {};
  for (const line of match[1].split(/\r?\n/)) {
    const colon = line.indexOf(':');
    if (colon === -1) continue;
    const key   = line.slice(0, colon).trim();
    const value = line.slice(colon + 1).trim();
    meta[key] = value;
  }
  return { meta, body: match[2] };
}

/** Convert a filename stem to a URL-safe slug */
function slugify(stem) {
  return stem.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/** Read all *.md files from a directory and return parsed post objects */
function loadPosts(dir) {
  if (!fs.existsSync(dir)) return [];

  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.md'))
    .sort()
    .map(filename => {
      const stem    = path.basename(filename, '.md');
      const slug    = slugify(stem);
      const src     = fs.readFileSync(path.join(dir, filename), 'utf8');
      const { meta, body } = parseFrontMatter(src);
      const html    = marked.parse(body);
      const title   = meta.title  || stem;
      const date    = meta.date   || '';
      const summary = meta.summary|| '';
      return { filename, slug, title, date, summary, html, meta };
    });
}

/** Escape HTML entities in a string (for use in attributes / text nodes) */
function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── HTML templates ───────────────────────────────────────────────────────────

/**
 * Full HTML page shell.
 * @param {string} title     <title> text
 * @param {string} bodyClass class on <body>
 * @param {string} content   inner HTML
 * @param {string} [rootPrefix] relative path back to root (e.g. "../")
 */
function pageShell(title, bodyClass, content, rootPrefix = '') {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(title)}</title>
  <link rel="stylesheet" href="${rootPrefix}style.css" />
</head>
<body class="${bodyClass}">
  <header class="site-header glass">
    <div class="header-inner">
      <a href="${rootPrefix}index.html" class="site-logo">⬡ PillowBasics</a>
      <nav class="site-nav">
        <a href="${rootPrefix}index.html">Home</a>
        <a href="https://github.com/ModulePillow" target="_blank" rel="noopener">GitHub</a>
      </nav>
    </div>
  </header>

  <main class="site-main">
${content}
  </main>

  <footer class="site-footer glass">
    <p>© ${new Date().getFullYear()} PillowBasics — MIT License &nbsp;·&nbsp;
       <a href="https://github.com/ModulePillow" target="_blank" rel="noopener">GitHub</a>
    </p>
  </footer>
</body>
</html>`;
}

/** Card for a post in a list */
function postCard(post, rootPrefix = '') {
  const href = `${rootPrefix}posts/${post.slug}.html`;
  return `
    <article class="post-card glass">
      <div class="post-card-meta">
        ${post.date ? `<time datetime="${esc(post.date)}">${esc(post.date)}</time>` : ''}
      </div>
      <h2 class="post-card-title"><a href="${href}">${esc(post.title)}</a></h2>
      ${post.summary ? `<p class="post-card-summary">${esc(post.summary)}</p>` : ''}
      <a href="${href}" class="post-card-link">Read more →</a>
    </article>`;
}

/** Build docs/index.html */
function buildIndex(blogPosts, pinnedPosts) {
  const pinnedSection = pinnedPosts.length === 0 ? '' : `
    <section class="pinned-section">
      <h2 class="section-heading">📌 Pinned</h2>
      <div class="posts-grid">
        ${pinnedPosts.map(p => postCard(p)).join('\n')}
      </div>
    </section>`;

  const blogSection = blogPosts.length === 0
    ? '<p class="empty-state">No blog posts yet. Add <code>.md</code> files to the <code>Blogs/</code> folder.</p>'
    : `
    <section class="blog-section">
      <h2 class="section-heading">📝 Latest Posts</h2>
      <div class="posts-grid">
        ${[...blogPosts].reverse().map(p => postCard(p)).join('\n')}
      </div>
    </section>`;

  const hero = `
    <section class="hero glass">
      <h1 class="hero-title">PillowBasics Blog</h1>
      <p class="hero-subtitle">News, tutorials, and deep dives for the open-source PillowBasics game engine.</p>
    </section>`;

  const content = `${hero}\n${pinnedSection}\n${blogSection}`;
  return pageShell('PillowBasics Blog', 'page-home', content, '');
}

/** Build docs/posts/<slug>.html */
function buildPost(post, rootPrefix = '../') {
  const content = `
    <article class="post glass">
      <header class="post-header">
        <div class="post-meta">
          ${post.date ? `<time datetime="${esc(post.date)}">${esc(post.date)}</time>` : ''}
        </div>
        <h1 class="post-title">${esc(post.title)}</h1>
        ${post.summary ? `<p class="post-summary">${esc(post.summary)}</p>` : ''}
      </header>
      <div class="post-body">
        ${post.html}
      </div>
      <footer class="post-footer">
        <a href="${rootPrefix}index.html" class="back-link">← Back to all posts</a>
      </footer>
    </article>`;

  return pageShell(post.title + ' — PillowBasics Blog', 'page-post', content, rootPrefix);
}

// ─── CSS ──────────────────────────────────────────────────────────────────────

const CSS = `/* ═══════════════════════════════════════════════════════════
   PillowBasics Blog — Stylesheet
   Grey backgrounds · Transparent blur (glassmorphism) controls
   ═══════════════════════════════════════════════════════════ */

/* ── Reset & Base ─────────────────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  /* Grey palette */
  --bg-deep:     #1c1c1e;
  --bg-mid:      #2a2a2e;
  --bg-surface:  #3a3a3f;
  --text-primary:#f0f0f2;
  --text-muted:  #9a9aaa;
  --text-link:   #9ecfff;
  --accent:      #7eb8ff;
  --accent-soft: rgba(126,184,255,0.18);
  --border:      rgba(255,255,255,0.10);

  /* Glass */
  --glass-bg:    rgba(255,255,255,0.06);
  --glass-border:rgba(255,255,255,0.12);
  --glass-blur:  16px;
  --glass-shadow:0 8px 32px rgba(0,0,0,0.45);

  /* Layout */
  --max-width: 900px;
  --radius:    14px;
  --gap:       1.5rem;
}

html { scroll-behavior: smooth; }

body {
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
  font-size: 16px;
  line-height: 1.7;
  color: var(--text-primary);
  background-color: var(--bg-deep);
  background-image:
    radial-gradient(ellipse 80% 60% at 20% 0%,  rgba(80,100,160,0.18) 0%, transparent 60%),
    radial-gradient(ellipse 60% 50% at 80% 100%, rgba(60,80,120,0.14) 0%, transparent 55%);
  min-height: 100vh;
}

/* ── Glass utility ────────────────────────────────────────── */
.glass {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  border-radius: var(--radius);
  box-shadow: var(--glass-shadow);
}

/* ── Header ───────────────────────────────────────────────── */
.site-header {
  position: sticky;
  top: 0;
  z-index: 100;
  border-radius: 0;
  border-left: none;
  border-right: none;
  border-top: none;
}

.header-inner {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 0.85rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.site-logo {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  text-decoration: none;
  letter-spacing: -0.5px;
}
.site-logo:hover { color: var(--accent); }

.site-nav { display: flex; gap: 1.25rem; }
.site-nav a {
  color: var(--text-muted);
  text-decoration: none;
  font-size: 0.9rem;
  transition: color 0.2s;
}
.site-nav a:hover { color: var(--text-link); }

/* ── Main ─────────────────────────────────────────────────── */
.site-main {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 2.5rem 1.5rem 4rem;
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
}

/* ── Hero ─────────────────────────────────────────────────── */
.hero {
  padding: 3rem 2.5rem;
  text-align: center;
}
.hero-title {
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 800;
  letter-spacing: -1px;
  background: linear-gradient(135deg, #ffffff 30%, var(--accent));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 0.75rem;
}
.hero-subtitle {
  color: var(--text-muted);
  font-size: 1.05rem;
  max-width: 520px;
  margin: 0 auto;
}

/* ── Section headings ─────────────────────────────────────── */
.section-heading {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: var(--gap);
}

/* ── Posts grid ───────────────────────────────────────────── */
.posts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--gap);
}

/* ── Post card ────────────────────────────────────────────── */
.post-card {
  padding: 1.5rem 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  transition: transform 0.2s, box-shadow 0.2s;
}
.post-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 40px rgba(0,0,0,0.55);
}

.post-card-meta time {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.post-card-title {
  font-size: 1.15rem;
  font-weight: 700;
  line-height: 1.3;
}
.post-card-title a {
  color: var(--text-primary);
  text-decoration: none;
}
.post-card-title a:hover { color: var(--accent); }

.post-card-summary {
  font-size: 0.9rem;
  color: var(--text-muted);
  flex: 1;
}

.post-card-link {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--accent);
  text-decoration: none;
  margin-top: 0.25rem;
  align-self: flex-start;
}
.post-card-link:hover { text-decoration: underline; }

/* Pinned section — wider cards */
.pinned-section .posts-grid {
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
}

/* ── Individual post ──────────────────────────────────────── */
.post {
  padding: 2.5rem 3rem;
  max-width: 720px;
  margin: 0 auto;
  width: 100%;
}
@media (max-width: 600px) { .post { padding: 1.5rem 1.25rem; } }

.post-header { margin-bottom: 2rem; }
.post-meta time {
  font-size: 0.82rem;
  color: var(--text-muted);
  display: block;
  margin-bottom: 0.5rem;
}
.post-title {
  font-size: clamp(1.6rem, 4vw, 2.2rem);
  font-weight: 800;
  letter-spacing: -0.5px;
  line-height: 1.25;
  margin-bottom: 0.75rem;
}
.post-summary {
  color: var(--text-muted);
  font-size: 1rem;
  border-left: 3px solid var(--accent);
  padding-left: 1rem;
  margin-top: 0.75rem;
}

/* ── Post body (markdown content) ────────────────────────── */
.post-body { color: var(--text-primary); }
.post-body h1,.post-body h2,.post-body h3,
.post-body h4,.post-body h5,.post-body h6 {
  margin: 2rem 0 0.75rem;
  line-height: 1.25;
  font-weight: 700;
}
.post-body h1 { font-size: 1.9rem; }
.post-body h2 { font-size: 1.5rem; color: var(--text-primary); }
.post-body h3 { font-size: 1.2rem; }
.post-body p { margin-bottom: 1.1rem; }
.post-body a { color: var(--text-link); }
.post-body a:hover { text-decoration: underline; }
.post-body ul, .post-body ol { padding-left: 1.5rem; margin-bottom: 1.1rem; }
.post-body li { margin-bottom: 0.35rem; }
.post-body blockquote {
  border-left: 3px solid var(--accent);
  padding: 0.5rem 1.25rem;
  color: var(--text-muted);
  margin: 1.25rem 0;
  font-style: italic;
}
.post-body code {
  font-family: 'Cascadia Code', 'Fira Code', 'Consolas', monospace;
  font-size: 0.875em;
  background: rgba(255,255,255,0.09);
  border: 1px solid var(--border);
  border-radius: 5px;
  padding: 0.15em 0.45em;
}
.post-body pre {
  background: rgba(0,0,0,0.35);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 1.25rem 1.5rem;
  overflow-x: auto;
  margin: 1.25rem 0;
}
.post-body pre code {
  background: none;
  border: none;
  padding: 0;
  font-size: 0.85rem;
}
.post-body table {
  width: 100%;
  border-collapse: collapse;
  margin: 1.25rem 0;
  font-size: 0.9rem;
}
.post-body th, .post-body td {
  padding: 0.6rem 0.9rem;
  border: 1px solid var(--border);
  text-align: left;
}
.post-body th {
  background: rgba(255,255,255,0.07);
  font-weight: 600;
}
.post-body img { max-width: 100%; border-radius: 8px; margin: 1rem 0; }
.post-body hr { border: none; border-top: 1px solid var(--border); margin: 2rem 0; }

.post-footer { margin-top: 2.5rem; padding-top: 1.5rem; border-top: 1px solid var(--border); }
.back-link {
  color: var(--text-muted);
  text-decoration: none;
  font-size: 0.9rem;
  transition: color 0.2s;
}
.back-link:hover { color: var(--accent); }

/* ── Footer ───────────────────────────────────────────────── */
.site-footer {
  text-align: center;
  border-radius: 0;
  border-left: none;
  border-right: none;
  border-bottom: none;
  padding: 1.25rem;
  color: var(--text-muted);
  font-size: 0.85rem;
}
.site-footer a { color: var(--text-muted); }
.site-footer a:hover { color: var(--text-link); }

/* ── Empty state ──────────────────────────────────────────── */
.empty-state {
  color: var(--text-muted);
  font-style: italic;
}
.empty-state code {
  background: rgba(255,255,255,0.08);
  padding: 0.1em 0.4em;
  border-radius: 4px;
  font-style: normal;
}

/* ── Responsive ───────────────────────────────────────────── */
@media (max-width: 640px) {
  .hero { padding: 2rem 1.25rem; }
  .post-card { padding: 1.25rem; }
  .posts-grid { grid-template-columns: 1fr; }
}
`;

// ─── Build ────────────────────────────────────────────────────────────────────

function build() {
  console.log('[build] Starting…');

  // Ensure output directories exist
  fs.mkdirSync(OUT_DIR,   { recursive: true });
  fs.mkdirSync(POSTS_DIR, { recursive: true });

  // Load content
  const blogPosts   = loadPosts(BLOGS_DIR);
  const pinnedPosts = loadPosts(PINNED_DIR);

  console.log(`[build] Found ${blogPosts.length} blog post(s), ${pinnedPosts.length} pinned post(s).`);

  // Write CSS
  fs.writeFileSync(path.join(OUT_DIR, 'style.css'), CSS, 'utf8');
  console.log('[build] Wrote docs/style.css');

  // Write index
  fs.writeFileSync(path.join(OUT_DIR, 'index.html'), buildIndex(blogPosts, pinnedPosts), 'utf8');
  console.log('[build] Wrote docs/index.html');

  // Write individual post pages for blogs
  for (const post of blogPosts) {
    const file = path.join(POSTS_DIR, `${post.slug}.html`);
    fs.writeFileSync(file, buildPost(post, '../'), 'utf8');
    console.log(`[build] Wrote docs/posts/${post.slug}.html`);
  }

  // Write individual post pages for pinned
  for (const post of pinnedPosts) {
    const file = path.join(POSTS_DIR, `${post.slug}.html`);
    fs.writeFileSync(file, buildPost(post, '../'), 'utf8');
    console.log(`[build] Wrote docs/posts/${post.slug}.html  (pinned)`);
  }

  console.log('[build] Done ✓');
}

// ─── Watch mode ───────────────────────────────────────────────────────────────

function watch() {
  build();
  console.log('[watch] Watching for changes in Blogs/ and Pinned/ …');

  const watchDir = (dir) => {
    if (!fs.existsSync(dir)) return;
    fs.watch(dir, { persistent: true }, (event, filename) => {
      if (filename && filename.endsWith('.md')) {
        console.log(`[watch] Change detected: ${filename}`);
        try { build(); } catch (err) { console.error('[build] Error:', err.message); }
      }
    });
  };

  watchDir(BLOGS_DIR);
  watchDir(PINNED_DIR);
}

// ─── Entry point ──────────────────────────────────────────────────────────────

const isWatch = process.argv.includes('--watch');
if (isWatch) {
  watch();
} else {
  build();
}
