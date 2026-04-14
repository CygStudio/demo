const baseUrl = import.meta.env.BASE_URL ?? '/'

export function withBase(path = '') {
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
  const normalizedPath = path.replace(/^\//, '')
  return normalizedPath ? `${normalizedBase}${normalizedPath}` : normalizedBase
}

export function getAppPathname() {
  const currentPath = window.location.pathname
  const basePath = new URL(baseUrl, window.location.origin).pathname.replace(/\/$/, '')

  if (!basePath || basePath === '/') {
    return currentPath
  }

  return currentPath.startsWith(basePath) ? currentPath.slice(basePath.length) || '/' : currentPath
}
