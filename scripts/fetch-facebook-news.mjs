// scripts/fetch-facebook-news.mjs
// Pulls recent posts from the school's Facebook Page (Graph API) and writes:
//   data/news.json                  -> read by assets/js/news-feed.js on home.html
//   assets/images/news/fb-<id>.*    -> local copies of the post pictures
//
// Runs in GitHub Actions (Node 20+, no dependencies).
// Secrets needed: FB_PAGE_ID, FB_PAGE_TOKEN

import { mkdir, readFile, writeFile, readdir, unlink, access } from 'node:fs/promises';

/* ------------------------------ SETTINGS ------------------------------ */
const CONFIG = {
  pageUrl: 'https://www.facebook.com/ICCBalayanIncOfficial',
  fetchLimit: 25,          // how many recent posts to look at
  maxItems: 6,             // how many to keep in news.json (home.html shows the first 3)
  requiredHashtag: '',     // e.g. '#iccbiweb' -> only posts containing it appear. '' = every post
  requirePhoto: false,     // true -> skip posts that have no picture
  titleMax: 95,
  excerptMax: 150,
  stripEmoji: true,        // remove emoji from title/excerpt so the cards stay clean
  defaultCategory: 'Campus Life',
  // First match wins. Matched against the whole caption (hashtags included).
  categories: [
    { label: 'Admissions', match: /enrol|admission|registration|\bapply\b/i },
    { label: 'Licensure',  match: /licensure|board exam|passer|passing rate|\bPRC\b|\bLET\b/i },
    { label: 'Academics',  match: /accredit|PAASCU|PACUCOA|dean'?s list|scholar|academic/i },
    { label: 'Faith & Formation', match: /\bmass\b|retreat|recollection|novena|rosary|\bprayer\b/i },
  ],
  imageDir: 'assets/images/news',
  jsonPath: 'data/news.json',
};
/* ---------------------------------------------------------------------- */

const PAGE_ID = process.env.FB_PAGE_ID;
const TOKEN = process.env.FB_PAGE_TOKEN;
const GRAPH_VERSION = process.env.FB_GRAPH_VERSION || 'v26.0';

if (!PAGE_ID || !TOKEN) {
  console.error('Missing FB_PAGE_ID or FB_PAGE_TOKEN (add them as repository secrets).');
  process.exit(1);
}

const exists = (p) => access(p).then(() => true, () => false);
const squash = (s) => s.replace(/\s+/g, ' ').trim();

function truncate(str, max) {
  if (str.length <= max) return str;
  const cut = str.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:.\-–—]+$/, '') + '…';
}

function cleanText(text) {
  let t = text.replace(/#[\p{L}\p{N}_]+/gu, '');                 // remove hashtags
  if (CONFIG.stripEmoji) t = t.replace(/[\p{Extended_Pictographic}\uFE0F\u200D]/gu, '');
  return squash(t);
}

function splitMessage(message) {
  const lines = message.split(/\r?\n/).map(cleanText).filter(Boolean);
  let title = lines[0] || '';
  let rest = lines.slice(1).join(' ');

  // Single paragraph: use the first sentence as the title, the remainder as the excerpt.
  if (lines.length === 1) {
    const m = title.match(/^(.{15,}?[.!?])\s+(.+)$/);
    if (m) { title = m[1]; rest = m[2]; }
  }
  return {
    title: truncate(title, CONFIG.titleMax),
    excerpt: truncate(rest, CONFIG.excerptMax),
  };
}

function pickCategory(text) {
  const hit = CONFIG.categories.find((c) => c.match.test(text));
  return hit ? hit.label : CONFIG.defaultCategory;
}

function formatDate(iso) {
  // Facebook sends +0000 (no colon); normalise so every runtime parses it.
  const d = new Date(iso.replace(/([+-]\d{2})(\d{2})$/, '$1:$2'));
  return {
    iso: d.toISOString(),
    label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'Asia/Manila' }),
  };
}

async function saveImage(post) {
  if (!post.full_picture) return '';
  const safeId = post.id.replace(/[^\w-]/g, '_');
  const base = `${CONFIG.imageDir}/fb-${safeId}`;

  for (const ext of ['jpg', 'png', 'webp']) {            // already downloaded on an earlier run
    if (await exists(`${base}.${ext}`)) return `${base}.${ext}`;
  }
  try {
    const res = await fetch(post.full_picture);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const type = res.headers.get('content-type') || '';
    const ext = type.includes('png') ? 'png' : type.includes('webp') ? 'webp' : 'jpg';
    await writeFile(`${base}.${ext}`, Buffer.from(await res.arrayBuffer()));
    return `${base}.${ext}`;
  } catch (err) {
    console.warn(`Could not download picture for ${post.id}: ${err.message}`);
    return '';
  }
}

async function main() {
  const fields = ['id', 'message', 'created_time', 'permalink_url', 'full_picture', 'status_type'].join(',');
  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${encodeURIComponent(PAGE_ID)}/posts`
    + `?fields=${fields}&limit=${CONFIG.fetchLimit}&access_token=${encodeURIComponent(TOKEN)}`;

  const res = await fetch(url);
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.error) {
    // Never print the URL: it contains the token.
    console.error('Graph API error:', body.error?.message || `HTTP ${res.status}`);
    process.exit(1);
  }

  const wantedTag = CONFIG.requiredHashtag.toLowerCase();
  const posts = (body.data || []).filter((p) => {
    if (!p.message || !p.permalink_url) return false;
    if (CONFIG.requirePhoto && !p.full_picture) return false;
    if (wantedTag && !p.message.toLowerCase().includes(wantedTag)) return false;
    return true;
  }).slice(0, CONFIG.maxItems);

  if (!posts.length) {
    console.log('No matching posts returned — leaving data/news.json untouched.');
    return;
  }

  await mkdir(CONFIG.imageDir, { recursive: true });
  await mkdir('data', { recursive: true });

  const items = [];
  for (const p of posts) {
    const { title, excerpt } = splitMessage(p.message);
    if (!title) continue;
    const date = formatDate(p.created_time);
    items.push({
      id: p.id,
      title,
      excerpt,
      category: pickCategory(p.message),
      date: date.iso,
      dateLabel: date.label,
      image: await saveImage(p),
      url: p.permalink_url,
    });
  }

  // Only rewrite news.json when something actually changed (avoids empty commits).
  let previous = [];
  try { previous = JSON.parse(await readFile(CONFIG.jsonPath, 'utf8')).items || []; } catch { /* first run */ }
  if (JSON.stringify(previous) !== JSON.stringify(items)) {
    await writeFile(CONFIG.jsonPath, JSON.stringify({
      updated: new Date().toISOString(),
      pageUrl: CONFIG.pageUrl,
      items,
    }, null, 2) + '\n');
    console.log(`Wrote ${items.length} posts to ${CONFIG.jsonPath}`);
  } else {
    console.log('No changes in posts.');
  }

  // Delete downloaded fb-* pictures that are no longer used (manual images are never touched).
  const used = new Set(items.map((i) => i.image.split('/').pop()).filter(Boolean));
  for (const f of await readdir(CONFIG.imageDir)) {
    if (f.startsWith('fb-') && !used.has(f)) await unlink(`${CONFIG.imageDir}/${f}`);
  }
}

main().catch((err) => { console.error(err.message || err); process.exit(1); });
