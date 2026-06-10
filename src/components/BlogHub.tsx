import posts from '../content/blog-posts.json'
import type { BlogAsset, BlogPost } from '../types'

function RenderAsset({ asset }: { asset: BlogAsset }) {
  if (asset.kind === 'image') {
    return <img src={asset.src} alt={asset.label} className="w-full rounded-2xl object-cover" />
  }

  if (asset.kind === 'video') {
    return (
      <video className="w-full rounded-2xl" controls playsInline preload="metadata" poster={asset.poster}>
        <source src={asset.src} />
      </video>
    )
  }

  if (asset.kind === 'audio') {
    return (
      <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        {asset.poster && <img src={asset.poster} alt={asset.label} className="w-full h-52 object-cover" />}
        <div className="p-4">
          <div className="text-sm font-semibold text-slate-100 mb-3">{asset.label}</div>
          <audio className="w-full" controls preload="metadata">
            <source src={asset.src} />
          </audio>
        </div>
      </div>
    )
  }

  return (
    <a
      href={asset.src}
      target="_blank"
      rel="noreferrer"
      className="block rounded-2xl px-4 py-6 text-sm font-medium transition-all"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      Open {asset.label}
    </a>
  )
}

function BlogCard({ post }: { post: BlogPost }) {
  return (
    <article
      className="rounded-[28px] overflow-hidden"
      style={{ background: 'rgba(7,15,28,0.9)', border: '1px solid rgba(56,189,248,0.08)', boxShadow: '0 24px 64px rgba(0,0,0,0.24)' }}
    >
      <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-0">
        <div className="p-6 lg:p-8">
          <div className="flex items-center gap-3 text-[10px] font-mono tracking-[0.22em] uppercase text-slate-500">
            <span style={{ color: '#2dd4bf' }}>{post.category}</span>
            <span>{new Date(post.publishedAt).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
          </div>
          <h2 className="mt-4 text-3xl lg:text-4xl font-semibold leading-tight text-slate-50">{post.title}</h2>
          <p className="mt-4 text-base leading-7 text-slate-300 max-w-3xl">{post.excerpt}</p>

          <div className="mt-6 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full px-3 py-1 text-[10px] font-mono tracking-[0.18em] uppercase"
                style={{ background: 'rgba(56,189,248,0.1)', color: '#7dd3fc' }}
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="mt-8 space-y-4">
            {post.paragraphs.map((paragraph, index) => (
              <p key={index} className="text-[15px] leading-7 text-slate-300">
                {paragraph}
              </p>
            ))}
          </div>

          {post.gallery && post.gallery.length > 0 && (
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {post.gallery.map((asset) => (
                <RenderAsset key={`${post.id}-${asset.src}`} asset={asset} />
              ))}
            </div>
          )}
        </div>

        <div className="p-6 lg:p-8" style={{ background: 'linear-gradient(180deg, rgba(45,212,191,0.06) 0%, rgba(56,189,248,0.02) 100%)' }}>
          <RenderAsset asset={post.hero} />
        </div>
      </div>
    </article>
  )
}

export default function BlogHub() {
  const sortedPosts = [...(posts as BlogPost[])].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <div
        className="min-h-full px-6 py-8 lg:px-10"
        style={{
          background:
            'radial-gradient(circle at top left, rgba(45,212,191,0.08), transparent 26%), radial-gradient(circle at top right, rgba(56,189,248,0.08), transparent 26%), #060d18',
        }}
      >
        <section className="max-w-6xl mx-auto">
          <div className="rounded-[32px] p-8 lg:p-10 mb-8" style={{ background: 'rgba(7,15,28,0.88)', border: '1px solid rgba(56,189,248,0.08)' }}>
            <div className="text-[11px] font-mono tracking-[0.24em] uppercase" style={{ color: '#2dd4bf' }}>
              CO2 Router Journal
            </div>
            <h1 className="mt-4 text-4xl lg:text-5xl font-semibold leading-tight text-slate-50">
              A scheduled stream of control-plane thinking, proof infrastructure, and environmental execution doctrine
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
              This is the publishing surface for recurring CO2 Router posts. Each entry can carry images, video, audio, and reference documents directly from the project media library.
            </p>
          </div>

          <div className="space-y-8">
            {sortedPosts.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
