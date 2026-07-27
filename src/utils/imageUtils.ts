export function getCachedImageUrl(url?: string): string {
  if (!url) return '';
  if (url.startsWith('data:') || url.startsWith('blob:')) return url;
  if (url.includes('wsrv.nl')) return url;
  const cleanUrl = url.startsWith('http') ? url : `https://${url}`;
  
  if (
    cleanUrl.includes('postimg.cc') ||
    cleanUrl.includes('postimages.org') ||
    cleanUrl.includes('i.postimg.cc')
  ) {
    return cleanUrl;
  }
  
  return `https://wsrv.nl/?url=${encodeURIComponent(cleanUrl)}`;
}
