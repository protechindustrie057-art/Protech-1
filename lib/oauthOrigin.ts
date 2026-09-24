export function getOAuthOrigin(req: Request) {
  const configuredOrigin = process.env.GOOGLE_REDIRECT_ORIGIN || process.env.NEXT_PUBLIC_SITE_URL
  if (configuredOrigin) return configuredOrigin.replace(/\/+$/, '')

  return new URL(req.url).origin
}
