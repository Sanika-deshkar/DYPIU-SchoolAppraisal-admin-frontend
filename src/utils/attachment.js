// Resolves a stored attachment/logo path (e.g. "/uploads/xyz.png") into a URL the
// browser can actually load. The admin app's dev server only proxies "/api" to the
// backend (see vite.config.js), so a raw relative path like "/uploads/..." 404s.
// Routing it through the public /api/attachments/download endpoint fixes that both
// in dev (proxy) and in prod (served behind the same gateway).
export const getAttachmentUrl = (url) => {
  if (!url) return '';
  const resolvedUrl = String(url);

  if (resolvedUrl.startsWith('blob:') || resolvedUrl.startsWith('data:')) {
    return resolvedUrl;
  }

  if (
    (resolvedUrl.startsWith('http://') || resolvedUrl.startsWith('https://')) &&
    !resolvedUrl.includes('/uploads/')
  ) {
    return resolvedUrl;
  }

  const cleanPath = resolvedUrl.startsWith('/') ? resolvedUrl : `/${resolvedUrl}`;
  return `/api/attachments/download?url=${encodeURIComponent(cleanPath)}&inline=true`;
};
