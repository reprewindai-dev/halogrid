import { mkdir, readFile, writeFile, access } from 'node:fs/promises'
import { constants as fsConstants } from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const root = process.cwd()
const queuePath = path.join(root, 'content', 'blog-queue.json')
const feedPath = path.join(root, 'src', 'content', 'blog-posts.json')
const mediaDir = path.join(root, 'public', 'blog-media')

const encoder = new TextEncoder()

const seededPost = {
  id: 'co2-router-carbon-surge-routing',
  slug: 'co2-router-carbon-surge-routing',
  title: 'How HaloGrid Routes Around Carbon Surges',
  excerpt: 'A production note on how CO2 Router shifts load before the grid turns expensive.',
  status: 'queued',
  publishedAt: null,
  mediaTheme: 'carbon-surge',
  tags: ['CO2 Router', 'carbon-aware routing', 'operations', 'sustainability'],
  cta: {
    label: 'See the control plane',
    href: '/',
  },
  sections: [
    {
      heading: 'Why carbon spikes matter',
      body: 'HaloGrid prioritizes lower-carbon regions before peak intensity becomes a cost problem. The router watches carbon, load, and service pressure together, so decisions move early instead of reacting after emissions are already locked in.',
    },
    {
      heading: 'How the router responds',
      body: 'The control plane compares regional drift, confidence, and decision age. When the spread widens, it redirects work toward cleaner routes while preserving uptime and auditability across the stream.',
    },
    {
      heading: 'What this means in production',
      body: 'The result is a measurable reduction in waste without giving up control. The same operational graph used for live routing also powers the published story, so the marketing surface stays grounded in actual system behavior.',
    },
  ],
  media: [
    {
      id: 'hero',
      filePath: 'public/blog-media/co2-router-carbon-surge-hero.svg',
      publicUrl: '/blog-media/co2-router-carbon-surge-hero.svg',
      alt: 'HaloGrid CO2 Router hero image with concentric routing rings and carbon signal lines.',
    },
    {
      id: 'thumb',
      filePath: 'public/blog-media/co2-router-carbon-surge-thumb.svg',
      publicUrl: '/blog-media/co2-router-carbon-surge-thumb.svg',
      alt: 'Compact HaloGrid carbon routing diagram.',
    },
  ],
}

const heroSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1600" height="900" viewBox="0 0 1600 900" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="147" y1="102" x2="1427" y2="836" gradientUnits="userSpaceOnUse">
      <stop stop-color="#050B16"/>
      <stop offset="1" stop-color="#0A1A2D"/>
    </linearGradient>
    <radialGradient id="glow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(800 452) rotate(90) scale(394 603)">
      <stop stop-color="#38BDF8" stop-opacity="0.35"/>
      <stop offset="1" stop-color="#38BDF8" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="route" x1="388" y1="590" x2="1235" y2="319" gradientUnits="userSpaceOnUse">
      <stop stop-color="#38BDF8"/>
      <stop offset="0.5" stop-color="#2DD4BF"/>
      <stop offset="1" stop-color="#A3E635"/>
    </linearGradient>
    <linearGradient id="panel" x1="138" y1="148" x2="1466" y2="770" gradientUnits="userSpaceOnUse">
      <stop stop-color="#0F172A" stop-opacity="0.7"/>
      <stop offset="1" stop-color="#0B1220" stop-opacity="0.2"/>
    </linearGradient>
  </defs>
  <rect width="1600" height="900" fill="url(#bg)"/>
  <rect x="72" y="72" width="1456" height="756" rx="40" fill="url(#panel)" stroke="rgba(56,189,248,0.18)"/>
  <rect x="72" y="72" width="1456" height="756" rx="40" fill="url(#glow)"/>
  <g opacity="0.14" stroke="#7DD3FC" stroke-width="1">
    <path d="M112 186H1488"/>
    <path d="M112 300H1488"/>
    <path d="M112 414H1488"/>
    <path d="M112 528H1488"/>
    <path d="M112 642H1488"/>
    <path d="M236 124V776"/>
    <path d="M420 124V776"/>
    <path d="M604 124V776"/>
    <path d="M788 124V776"/>
    <path d="M972 124V776"/>
    <path d="M1156 124V776"/>
    <path d="M1340 124V776"/>
  </g>
  <circle cx="800" cy="450" r="220" stroke="rgba(56,189,248,0.25)" stroke-width="2"/>
  <circle cx="800" cy="450" r="150" stroke="rgba(45,212,191,0.45)" stroke-width="2"/>
  <circle cx="800" cy="450" r="82" stroke="rgba(163,230,53,0.6)" stroke-width="2"/>
  <circle cx="800" cy="450" r="20" fill="#38BDF8"/>
  <path d="M454 578C561 537 641 492 734 468C845 438 924 369 1048 320C1124 290 1186 276 1263 262" stroke="url(#route)" stroke-width="5" stroke-linecap="round"/>
  <path d="M476 338C596 379 674 398 792 402C908 406 1008 451 1110 505C1184 544 1252 560 1328 570" stroke="rgba(56,189,248,0.45)" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="12 14"/>
  <g fill="#E2E8F0">
    <circle cx="454" cy="578" r="8"/>
    <circle cx="734" cy="468" r="8"/>
    <circle cx="1048" cy="320" r="8"/>
    <circle cx="1263" cy="262" r="8"/>
    <circle cx="476" cy="338" r="8"/>
    <circle cx="792" cy="402" r="8"/>
    <circle cx="1110" cy="505" r="8"/>
    <circle cx="1328" cy="570" r="8"/>
  </g>
  <g opacity="0.9" font-family="Inter, Arial, sans-serif" fill="#E2E8F0">
    <text x="132" y="160" font-size="22" letter-spacing="4">HALOGRID BLOG</text>
    <text x="132" y="196" font-size="52" font-weight="700">How HaloGrid Routes Around Carbon Surges</text>
    <text x="132" y="242" font-size="22" fill="#94A3B8">CO2 Router control plane notes from the live production surface.</text>
  </g>
</svg>
`

const thumbSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="1200" viewBox="0 0 1200 1200" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="bgThumb" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(600 570) rotate(90) scale(580 580)">
      <stop stop-color="#0F172A"/>
      <stop offset="1" stop-color="#050B16"/>
    </radialGradient>
    <linearGradient id="lineThumb" x1="184" y1="775" x2="1016" y2="402" gradientUnits="userSpaceOnUse">
      <stop stop-color="#38BDF8"/>
      <stop offset="0.5" stop-color="#2DD4BF"/>
      <stop offset="1" stop-color="#A3E635"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="1200" rx="64" fill="url(#bgThumb)"/>
  <circle cx="600" cy="600" r="292" stroke="rgba(56,189,248,0.22)" stroke-width="3"/>
  <circle cx="600" cy="600" r="202" stroke="rgba(45,212,191,0.44)" stroke-width="3"/>
  <circle cx="600" cy="600" r="112" stroke="rgba(163,230,53,0.58)" stroke-width="3"/>
  <circle cx="600" cy="600" r="24" fill="#38BDF8"/>
  <path d="M220 760C346 710 432 660 548 622C682 579 780 493 936 438" stroke="url(#lineThumb)" stroke-width="8" stroke-linecap="round"/>
  <path d="M262 360C394 404 492 429 606 435C728 440 828 487 930 540" stroke="rgba(56,189,248,0.42)" stroke-width="4" stroke-linecap="round" stroke-dasharray="18 18"/>
  <g fill="#E2E8F0">
    <circle cx="220" cy="760" r="10"/>
    <circle cx="548" cy="622" r="10"/>
    <circle cx="936" cy="438" r="10"/>
    <circle cx="262" cy="360" r="10"/>
    <circle cx="606" cy="435" r="10"/>
    <circle cx="930" cy="540" r="10"/>
  </g>
  <text x="96" y="944" font-family="Inter, Arial, sans-serif" font-size="42" font-weight="700" fill="#E2E8F0">CO2 ROUTER</text>
  <text x="96" y="990" font-family="Inter, Arial, sans-serif" font-size="24" fill="#94A3B8">Carbon-aware routing in production</text>
</svg>
`

async function readJson(filePath, fallback) {
  try {
    const raw = await readFile(filePath, 'utf8')
    return JSON.parse(raw)
  } catch (error) {
    if (error?.code === 'ENOENT') return fallback
    throw error
  }
}

async function writeJson(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

async function ensureFile(filePath, contents) {
  try {
    await access(filePath, fsConstants.F_OK)
  } catch {
    await mkdir(path.dirname(filePath), { recursive: true })
    await writeFile(filePath, contents, 'utf8')
  }
}

async function ensureSeedQueue(queue) {
  if (queue.length > 0) return queue

  await ensureFile(path.join(root, seededPost.media[0].filePath), heroSvg)
  await ensureFile(path.join(root, seededPost.media[1].filePath), thumbSvg)

  return [structuredClone(seededPost)]
}

function normalizePublishedPost(post) {
  const publishedAt = new Date().toISOString()
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    status: 'published',
    publishedAt,
    updatedAt: publishedAt,
    route: `/blog/${post.slug}`,
    tags: post.tags ?? [],
    cta: post.cta ?? null,
    sections: post.sections ?? [],
    mediaTheme: post.mediaTheme ?? 'carbon-surge',
    media: (post.media ?? []).map((asset) => ({
      id: asset.id,
      filePath: asset.filePath,
      publicUrl: asset.publicUrl,
      alt: asset.alt,
    })),
  }
}

function assertFeedIntegrity(feed) {
  for (const post of feed) {
    for (const asset of post.media ?? []) {
      if (!asset.filePath || !asset.filePath.startsWith('public/blog-media/')) {
        throw new Error(`Feed integrity failure: ${post.slug} references invalid media path "${asset.filePath ?? ''}"`)
      }
    }
  }
}

async function main() {
  const currentQueue = await readJson(queuePath, [])
  const queue = await ensureSeedQueue(Array.isArray(currentQueue) ? currentQueue : [])

  const nextPost = queue.shift()
  if (!nextPost) {
    throw new Error('No queued post available after seeding.')
  }

  await ensureFile(path.join(root, nextPost.media[0].filePath), heroSvg)
  await ensureFile(path.join(root, nextPost.media[1].filePath), thumbSvg)

  const currentFeed = await readJson(feedPath, [])
  const feed = Array.isArray(currentFeed) ? currentFeed : []
  const publishedPost = normalizePublishedPost(nextPost)
  const dedupedFeed = feed.filter((entry) => entry.slug !== publishedPost.slug)
  const nextFeed = [publishedPost, ...dedupedFeed].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())

  assertFeedIntegrity(nextFeed)

  await writeJson(queuePath, queue)
  await writeJson(feedPath, nextFeed)

  console.log(JSON.stringify({
    published: {
      id: publishedPost.id,
      slug: publishedPost.slug,
      title: publishedPost.title,
      publishedAt: publishedPost.publishedAt,
    },
    queueRemaining: queue.length,
    feedCount: nextFeed.length,
  }, null, 2))
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error))
  process.exitCode = 1
})
