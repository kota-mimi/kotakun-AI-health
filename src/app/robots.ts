import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://kotakun-ai-health.vercel.app'
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/guide',
          '/privacy', 
          '/terms',
          '/counseling',
        ],
        disallow: [
          '/api/',
          '/dashboard/',
          '/payment/',
          '/weight-test/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: [
          '/',
          '/guide',
          '/privacy',
          '/terms', 
          '/counseling',
        ],
        disallow: [
          '/api/',
          '/dashboard/',
          '/payment/',
          '/weight-test/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}