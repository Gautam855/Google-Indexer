import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://google-indexer-one.vercel.app';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard/', '/api/'], // Disallow private/dashboard routes
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
