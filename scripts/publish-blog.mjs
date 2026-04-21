import { readFile, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const root = process.cwd()
const contentDir = path.join(root, 'content')
const queuePath = path.join(contentDir, 'blog-queue.json')
const postsPath = path.join(root, 'src', 'content', 'blog-posts.json')
const mediaDir = path.join(root, 'public', 'blog-media')

async function ensureFile(filePath, fallback) {
  try {
    return JSON.parse(await readFile(filePath, 'utf8'))
  } catch (error) {
    if (error?.code === 'ENOENT') return fallback
    throw error
  }
}

async function ensureSeedFiles() {
  await mkdir(contentDir, { recursive: true })
  await mkdir(path.join(root, 'src', 'content'), { recursive: true })
  await mkdir(mediaDir, { recursive: true })

  const queue = await ensureFile(queuePath, [])
  const posts = await ensureFile(postsPath, [])

  if (queue.length === 0 && posts.length === 0) {
    queue.push({
      slug: 'co2-router-grid-intelligence',
      title: 'CO2 Router Grid Intelligence Is Now Live',
      excerpt: 'HaloGrid now publishes the next CO2 Router signal as an operational blog release.',
      publishedAt: new Date().toISOString(),
      heroImage: '/blog-media/grid-intelligence-hero.svg',
      themeImage: '/blog-media/grid-intelligence-theme.svg',
      tags: ['CO2 Router', 'HaloGrid', 'Operations'],
      body: [
        'HaloGrid now publishes the next queued CO2 Router brief without manual intervention.',
        'The control-plane narrative stays pinned to the approved media surface under /blog-media.',
        'This release establishes a repeatable publishing loop for future operational updates.'
      ]
    })
  }

  return { queue, posts }
}

async function main() {
  const { queue, posts } = await ensureSeedFiles()

  if (queue.length === 0) {
    throw new Error('No queued blog posts available for publishing.')
  }

  const nextPost = queue.shift()
  const publishedPost = {
    ...nextPost,
    status: 'published',
    publishedAt: new Date().toISOString()
  }

  posts.unshift(publishedPost)

  await writeFile(queuePath, `${JSON.stringify(queue, null, 2)}\n`, 'utf8')
  await writeFile(postsPath, `${JSON.stringify(posts, null, 2)}\n`, 'utf8')

  console.log(`Published blog post: ${publishedPost.title} (${publishedPost.slug})`)
  console.log(`Feed updated: ${path.relative(root, postsPath)}`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
