import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://tvoje-domena.cz' // Změň za svou reálnou doménu

  // Seznam veřejných cest, které chceš indexovat
  const routes = [
    '',
    '/cenik',
    '/o-ems',
    '/pro-koho',
    '/kontakt',
  ]

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: route === '' ? 1.0 : 0.8,
  }))
}