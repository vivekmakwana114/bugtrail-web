const DRIVE_HOSTS = new Set(['drive.google.com', 'docs.google.com']);
/** Drive file ids are long runs of letters, digits, - and _. */
const DRIVE_ID = /^[\w-]{20,}$/;

/**
 * The Drive file id in a share link, or null if it isn't one. Handles the shapes Drive hands out:
 *   https://drive.google.com/file/d/<id>/view?usp=sharing
 *   https://drive.google.com/open?id=<id>
 *   https://drive.google.com/uc?export=view&id=<id>
 * Parsed with URL (not a regex on the whole string), so "drive.google.com.evil.com" doesn't count.
 */
export function driveFileId(link: string): string | null {
  let url: URL;
  try {
    url = new URL(link);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' || !DRIVE_HOSTS.has(url.hostname)) return null;
  const fromPath = url.pathname.match(/\/file\/d\/([^/]+)/)?.[1];
  const id = fromPath ?? url.searchParams.get('id');
  return id && DRIVE_ID.test(id) ? id : null;
}

/**
 * A link people paste as a picture, turned into one an <img> can show. A Drive share link
 * opens Google's viewer page (HTML), not the image, so for Drive files this returns Google's
 * direct image address for that file instead, sized to at most 256px on its longest side
 * (sharp for avatars on high-density screens, ~25 KB instead of the multi-MB original).
 * It only works when the file is shared as "Anyone with the link". Other links pass through.
 * Note: lh3.googleusercontent.com/d/<id> is widely used but not officially documented by
 * Google; if it ever stops working, the Avatar falls back to initials.
 */
export function toImageUrl(link: string): string {
  const id = driveFileId(link);
  return id ? `https://lh3.googleusercontent.com/d/${id}=s256` : link;
}
