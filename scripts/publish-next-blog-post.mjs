import fs from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()
const queuePath = path.join(root, 'content', 'blog-queue.json')
const publishedPath = path.join(root, 'src', 'content', 'blog-posts.json')

function sortByDateDesc(posts) {
  return [...posts].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, 'utf8'))
}

async function writeJson(filePath, value) {
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

async function main() {
  const queue = await readJson(queuePath)
  const published = await readJson(publishedPath)

  if (!Array.isArray(queue) || queue.length === 0) {
    console.log('No queued posts to publish.')
    return
  }

  const [nextPost, ...remainingQueue] = queue
  const publishedPost = {
    id: nextPost.id,
    slug: nextPost.slug,
    title: nextPost.title,
    excerpt: nextPost.excerpt,
    publishedAt: new Date().toISOString(),
    category: nextPost.category,
    tags: nextPost.tags,
    hero: nextPost.hero,
    gallery: nextPost.gallery ?? [],
    paragraphs: nextPost.paragraphs,
  }

  await writeJson(publishedPath, sortByDateDesc([publishedPost, ...published]))
  await writeJson(queuePath, remainingQueue)

  console.log(`Published: ${publishedPost.title}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
