export const CATEGORIES = [
  'Agriculture',
  'Business',
  'Education',
  'Entertainment',
  'Art',
  'Investment',
  'Uncategorized',
  'Weather',
];

export const IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

export const THUMBNAIL_LIMIT = 2000000;
export const AVATAR_LIMIT = 500000;

export function validateImage(file, maxBytes) {
  if (!file) return 'Please select an image file.';
  if (!IMAGE_TYPES.includes(file.type)) {
    return 'Supported formats: JPG, PNG, WebP, or GIF.';
  }
  if (!file.size) return 'The selected file is empty.';
  if (file.size > maxBytes) {
    const label = maxBytes === AVATAR_LIMIT ? '500 KB' : '2 MB';
    return `Image size must be under ${label}.`;
  }
  return '';
}

export function safeUser(raw) {
  return {
    id: raw._id || raw.id,
    name: raw.name,
    email: raw.email,
    avatar: raw.avatar || '',
    posts: raw.posts || 0,
  };
}

export function errorMessage(err) {
  if (err.code === 'ERR_CANCELED') {
    return 'Upload cancelled. Please check your posts before retrying.';
  }
  if (err.response?.data?.message) {
    return String(err.response.data.message);
  }
  if (err.code === 'ECONNABORTED') {
    return 'Request timed out. Please verify before submitting again.';
  }
  return 'Could not connect to the server. Please check your network.';
}

export function dateLabel(isoString) {
  const parsed = new Date(isoString);
  if (Number.isNaN(parsed.getTime())) return '';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(parsed);
}

export function plainText(html = '') {
  return html
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export function safeReturn(path) {
  if (
    path?.startsWith('/') &&
    !path.startsWith('//') &&
    !path.includes('\\') &&
    !path.startsWith('/login') &&
    !path.startsWith('/register')
  ) {
    return path;
  }
  return '/my-posts';
}