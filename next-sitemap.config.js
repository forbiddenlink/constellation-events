/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://constellation-events.vercel.app',
  generateRobotsTxt: true,
  generateIndexSitemap: false,
  // Static asset/manifest routes aren't pages and shouldn't be listed as
  // sitemap entries (the sitemap was even listing itself).
  exclude: ['/icon.png', '/apple-icon.png', '/manifest.webmanifest', '/sitemap.xml'],
}
