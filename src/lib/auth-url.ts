const trimTrailingSlash = (url: string) => url.replace(/\/+$/, '')

export function getAppBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return trimTrailingSlash(process.env.NEXT_PUBLIC_APP_URL)
  }

  if (typeof window !== 'undefined') {
    return trimTrailingSlash(window.location.origin)
  }

  return ''
}

export function getAuthCallbackUrl(locale: string): string {
  const baseUrl = getAppBaseUrl()
  return `${baseUrl}/${locale}/auth/callback`
}

