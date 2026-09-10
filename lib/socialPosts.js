import axios from 'axios';

function graphUrl(platform, path) {
  const version = process.env.GRAPH_API_VERSION || 'v19.0';
  const host = platform === 'instagram' ? 'graph.instagram.com' : 'graph.facebook.com';
  return `https://${host}/${version}/${path}`;
}

function apiError(error) {
  const detail = error.response?.data?.error?.message || error.response?.data || error.message;
  return typeof detail === 'string' ? detail : JSON.stringify(detail);
}

function nextCursor(data) {
  return data.paging?.next ? data.paging?.cursors?.after || null : null;
}

function firstAttachment(post) {
  return post.attachments?.data?.[0] || null;
}

function normalizeInstagram(post) {
  return {
    id: String(post.id),
    platform: 'instagram',
    caption: post.caption || '',
    type: post.media_type || 'MEDIA',
    imageUrl: post.thumbnail_url || post.media_url || null,
    permalink: post.permalink || null,
    createdAt: post.timestamp || null,
    commentsCount: Number.isFinite(post.comments_count) ? post.comments_count : null,
    likesCount: Number.isFinite(post.like_count) ? post.like_count : null,
    canDelete: false,
  };
}

function normalizeFacebook(post) {
  const attachment = firstAttachment(post);
  return {
    id: String(post.id),
    platform: 'facebook',
    caption: post.message || post.story || '',
    type: attachment?.media_type || attachment?.type || 'POST',
    imageUrl: post.full_picture || attachment?.media?.image?.src || null,
    permalink: post.permalink_url || attachment?.url || null,
    createdAt: post.created_time || null,
    commentsCount: post.comments?.summary?.total_count ?? null,
    likesCount: post.likes?.summary?.total_count ?? null,
    canDelete: true,
  };
}

async function listInstagramPosts({ accessToken, after, limit = 50 }) {
  try {
    const { data } = await axios.get(graphUrl('instagram', 'me/media'), {
      params: {
        fields: 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,comments_count,like_count',
        limit,
        after: after || undefined,
        access_token: accessToken,
      },
    });
    return { posts: (data.data || []).map(normalizeInstagram), nextCursor: nextCursor(data) };
  } catch (error) {
    throw new Error(apiError(error));
  }
}

async function listFacebookPosts({ pageId, accessToken, after, limit = 50 }) {
  try {
    const { data } = await axios.get(graphUrl('facebook', `${pageId}/published_posts`), {
      params: {
        fields: 'id,message,story,created_time,permalink_url,full_picture,attachments{media_type,type,media,url},comments.limit(0).summary(true),likes.limit(0).summary(true)',
        limit,
        after: after || undefined,
        access_token: accessToken,
      },
    });
    return { posts: (data.data || []).map(normalizeFacebook), nextCursor: nextCursor(data) };
  } catch (error) {
    throw new Error(apiError(error));
  }
}

async function deleteFacebookPost(postId, accessToken) {
  try {
    await axios.delete(graphUrl('facebook', postId), { params: { access_token: accessToken } });
    return { ok: true };
  } catch (error) {
    return { ok: false, error: apiError(error) };
  }
}

export { listInstagramPosts, listFacebookPosts, deleteFacebookPost };
