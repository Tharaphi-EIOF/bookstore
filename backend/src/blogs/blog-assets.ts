import { unlink } from 'fs/promises';
import { resolve } from 'path';

export const BLOG_UPLOADS_PREFIX = '/uploads/blogs/';
export const BLOG_UPLOADS_DIR = resolve(process.cwd(), 'uploads/blogs');

// Keep asset parsing focused on blog-upload URLs so cleanup stays predictable.
export const extractBlogUploadUrls = (content: string | null | undefined) => {
  if (!content) return [];
  const matches = content.match(/\/uploads\/blogs\/[^\s"'\\)]+/g) ?? [];
  return Array.from(new Set(matches));
};

export const hasInlineImageData = (content: string | null | undefined) =>
  /data:image\//i.test(content ?? '');

export const resolveBlogUploadPath = (url: string) => {
  if (!url.startsWith(BLOG_UPLOADS_PREFIX)) return null;
  const relativePath = url.slice(1);
  const filePath = resolve(process.cwd(), relativePath);
  return filePath.startsWith(BLOG_UPLOADS_DIR) ? filePath : null;
};

export const getBlogUploadOwnerId = (url: string) => {
  if (!url.startsWith(BLOG_UPLOADS_PREFIX)) return null;
  const relativePath = url.slice(BLOG_UPLOADS_PREFIX.length);
  const [ownerId] = relativePath.split('/');
  return ownerId?.trim() || null;
};

export const deleteBlogUploadFile = async (url: string) => {
  const filePath = resolveBlogUploadPath(url);
  if (!filePath) return;
  try {
    await unlink(filePath);
  } catch (error: unknown) {
    if (
      !(
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'ENOENT'
      )
    ) {
      throw error;
    }
  }
};
