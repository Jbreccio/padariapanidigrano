import { cleanYouTubeTitle } from '../../utils/helpers.js';

export async function getInstagramPosts(env) {
  try {
    const INSTAGRAM_TOKEN = env.INSTAGRAM_ACCESS_TOKEN;
    const INSTAGRAM_USER_ID = env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
    if (!INSTAGRAM_TOKEN || !INSTAGRAM_USER_ID) return { data: [], paging: {} };
    const res = await fetch(`https://graph.facebook.com/v19.0/${INSTAGRAM_USER_ID}/media?fields=id,caption,media_url,permalink,thumbnail_url,timestamp,username,media_type&access_token=${INSTAGRAM_TOKEN}&limit=50`);
    if (!res.ok) return { data: [], paging: {} };
    const data = await res.json();
    let posts = [];
    if (data.data && Array.isArray(data.data)) {
      const extractShortcode = (permalink) => { if (!permalink) return null; const match = permalink.match(/\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/); return match ? match[1] : null; };
      const seenIds = new Set(); const seenShortcodes = new Set(); const seenPermalinks = new Set();
      posts = data.data.filter(post => {
        if (seenIds.has(post.id)) return false; seenIds.add(post.id);
        if (post.permalink) { const pl = post.permalink.replace(/\/$/, '').toLowerCase(); if (seenPermalinks.has(pl)) return false; seenPermalinks.add(pl); }
        const sc = extractShortcode(post.permalink);
        if (sc) { if (seenShortcodes.has(sc)) return false; seenShortcodes.add(sc); }
        if (!post.media_url && !post.thumbnail_url) return false;
        return true;
      }).slice(0, 6).map(post => ({ id: post.id, caption: post.caption ? cleanYouTubeTitle(post.caption) : 'Post do Instagram', media_url: post.media_url || '', permalink: post.permalink || '', thumbnail_url: post.thumbnail_url || post.media_url || '', timestamp: post.timestamp || new Date().toISOString(), username: post.username || 'santuario.fatima', media_type: post.media_type || 'IMAGE', isVideo: post.media_type === 'VIDEO' }));
    }
    return { data: posts, paging: data.paging || {} };
  } catch (error) {
    console.error('Erro no Instagram:', error);
    return { data: [], paging: {} };
  }
}