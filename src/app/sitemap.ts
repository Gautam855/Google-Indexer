import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://google-indexer-one.vercel.app';

  // Static routes
  const staticRoutes = ['', '/login'].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  // Example of fetching dynamic routes (e.g. blog posts)
  // const posts = await fetch('https://api.example.com/posts').then((res) => res.json());
  // const dynamicRoutes = posts.map((post: any) => ({
  //   url: `${baseUrl}/blog/${post.slug}`,
  //   lastModified: new Date(post.updatedAt),
  //   changeFrequency: 'weekly' as const,
  //   priority: 0.7,
  // }));

  return [...staticRoutes /*, ...dynamicRoutes */];
}
