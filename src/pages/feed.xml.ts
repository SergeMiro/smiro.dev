import type { APIRoute } from 'astro';

const posts = [
  {
    title: 'How I Built a Multi-Agent AI System with Claude',
    date: '2026-03-15',
    slug: 'multi-agent-ai-claude',
    excerpt: 'A deep dive into building autonomous agent orchestration — the mistakes, the breakthroughs, and why multi-agent is the future.',
  },
  {
    title: 'Automating Everything: My n8n + AI Pipeline',
    date: '2026-02-28',
    slug: 'n8n-ai-pipeline',
    excerpt: 'How I automated 80% of repetitive tasks using n8n workflows powered by LLMs.',
  },
  {
    title: 'Why I Switched from Next.js to Astro for My Portfolio',
    date: '2026-02-10',
    slug: 'nextjs-to-astro',
    excerpt: 'Zero JS by default, content collections, and island architecture.',
  },
];

export const GET: APIRoute = () => {
  const items = posts.map(post => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>https://smiro.dev/blog/${post.slug}</link>
      <description><![CDATA[${post.excerpt}]]></description>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      <guid>https://smiro.dev/blog/${post.slug}</guid>
    </item>`).join('');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>smiro.dev blog</title>
    <description>Notes on AI tools, automation, dev tips, and product thinking by Sergiy Mirochnyk.</description>
    <link>https://smiro.dev/blog</link>
    <atom:link href="https://smiro.dev/feed.xml" rel="self" type="application/rss+xml"/>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${items}
  </channel>
</rss>`;

  return new Response(rss.trim(), {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
