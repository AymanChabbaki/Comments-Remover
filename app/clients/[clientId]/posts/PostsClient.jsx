'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, Images, LoaderCircle, RefreshCw, Trash2 } from 'lucide-react';
import AppShell from '../../../../components/AppShell';

const PAGE_SIZE = 50;

function mergePosts(current, incoming) {
  const byId = new Map(current.map((post) => [`${post.platform}:${post.id}`, post]));
  for (const post of incoming) byId.set(`${post.platform}:${post.id}`, post);
  return [...byId.values()].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
}

export default function PostsClient({ clientId, clientName, connected }) {
  const [posts, setPosts] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState({ instagram: 0, facebook: 0 });
  const [errors, setErrors] = useState({});
  const [deleting, setDeleting] = useState(null);
  const loadVersion = useRef(0);

  const loadAll = useCallback(async () => {
    const version = ++loadVersion.current;
    setPosts([]);
    setErrors({});
    setProgress({ instagram: 0, facebook: 0 });
    setLoading(true);

    async function loadPlatform(platform) {
      if (!connected[platform]) return;
      let after = null;
      try {
        do {
          const query = new URLSearchParams({ platform, limit: String(PAGE_SIZE) });
          if (after) query.set('after', after);
          const response = await fetch(`/api/clients/${clientId}/posts?${query}`);
          const data = await response.json();
          if (response.status === 401) {
            window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
            return;
          }
          if (!response.ok) throw new Error(data.error || `Could not load ${platform} posts.`);
          if (loadVersion.current !== version) return;
          setPosts((current) => mergePosts(current, data.posts || []));
          setProgress((current) => ({ ...current, [platform]: current[platform] + (data.posts?.length || 0) }));
          after = data.nextCursor || null;
        } while (after && loadVersion.current === version);
      } catch (error) {
        if (loadVersion.current === version) setErrors((current) => ({ ...current, [platform]: error.message }));
      }
    }

    await Promise.all([loadPlatform('instagram'), loadPlatform('facebook')]);
    if (loadVersion.current === version) setLoading(false);
  }, [clientId, connected]);

  useEffect(() => {
    loadAll();
    return () => { loadVersion.current += 1; };
  }, [loadAll]);

  async function removePost(post) {
    if (!window.confirm('Delete this Facebook post permanently? This cannot be undone.')) return;
    setDeleting(post.id);
    setErrors((current) => ({ ...current, delete: null }));
    try {
      const response = await fetch(`/api/clients/${clientId}/posts/${encodeURIComponent(post.id)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: post.platform }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not delete the post.');
      setPosts((current) => current.filter((item) => !(item.platform === post.platform && item.id === post.id)));
      setProgress((current) => ({ ...current, [post.platform]: Math.max(0, current[post.platform] - 1) }));
    } catch (error) {
      setErrors((current) => ({ ...current, delete: error.message }));
    } finally {
      setDeleting(null);
    }
  }

  const visiblePosts = filter === 'all' ? posts : posts.filter((post) => post.platform === filter);
  const availableFilters = [
    { id: 'all', label: `All (${posts.length})`, show: true },
    { id: 'instagram', label: `Instagram (${progress.instagram})`, show: connected.instagram },
    { id: 'facebook', label: `Facebook (${progress.facebook})`, show: connected.facebook },
  ].filter((item) => item.show);

  return (
    <AppShell
      clientId={clientId}
      clientName={clientName}
      subtitle="All connected Instagram and Facebook posts"
      wide
      headerAction={(
        <button
          type="button"
          onClick={loadAll}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm font-medium disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      )}
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">Posts</h2>
            <p className="mt-1 text-sm text-on-surface-variant">
              Posts load automatically from every connected account.
            </p>
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter posts">
            {availableFilters.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.id)}
                className={`rounded-full px-4 py-2 text-sm font-medium ${
                  filter === item.id ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {!connected.instagram || !connected.facebook ? (
          <p className="rounded-xl border border-surface-container-high bg-surface-container-lowest p-4 text-sm text-on-surface-variant">
            Only connected accounts are shown. <Link href={`/clients/${clientId}/settings`} className="font-medium text-primary underline">Connect another account in Settings</Link>.
          </p>
        ) : null}

        {Object.entries(errors).filter(([, message]) => message).map(([key, message]) => (
          <p key={key} role="alert" className="rounded-xl bg-error-container p-4 text-sm text-on-error-container">
            {key === 'delete' ? 'Delete failed' : `${key} could not load`}: {message}
          </p>
        ))}

        {loading && (
          <div className="flex items-center gap-3 rounded-xl border border-surface-container-high bg-surface-container-lowest p-4 text-sm text-on-surface-variant">
            <LoaderCircle size={18} className="animate-spin text-primary" />
            Loading all posts… {progress.instagram + progress.facebook} found
          </div>
        )}

        {!loading && !visiblePosts.length && !Object.values(errors).some(Boolean) && (
          <div className="rounded-2xl border border-dashed border-outline-variant bg-surface-container-lowest p-12 text-center">
            <Images size={36} className="mx-auto text-on-surface-variant" />
            <h3 className="mt-4 text-lg font-semibold">No posts found</h3>
            <p className="mt-1 text-sm text-on-surface-variant">Published posts will appear here automatically.</p>
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {visiblePosts.map((post) => (
            <article key={`${post.platform}:${post.id}`} className="overflow-hidden rounded-2xl border border-surface-container-high bg-surface-container-lowest shadow-[0_1px_2px_rgba(31,36,44,0.04)]">
              <div className="aspect-square bg-surface-container">
                {post.imageUrl ? (
                  // Meta's media hosts vary, so use a plain image instead of a fixed Next.js remote-host allowlist.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={post.imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <div className="flex h-full items-center justify-center text-on-surface-variant"><Images size={38} /></div>
                )}
              </div>
              <div className="space-y-3 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${post.platform === 'instagram' ? 'bg-ig-soft text-ig' : 'bg-fb-soft text-fb'}`}>
                    {post.platform === 'instagram' ? 'Instagram' : 'Facebook'} · {post.type}
                  </span>
                  <time className="text-xs text-on-surface-variant" dateTime={post.createdAt || undefined}>
                    {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : ''}
                  </time>
                </div>
                <p className="line-clamp-3 min-h-[3.75rem] text-sm text-on-surface">
                  {post.caption || 'Post without a caption'}
                </p>
                {(post.likesCount !== null || post.commentsCount !== null) && (
                  <p className="text-xs text-on-surface-variant">
                    {post.likesCount !== null ? `${post.likesCount.toLocaleString()} likes` : ''}
                    {post.likesCount !== null && post.commentsCount !== null ? ' · ' : ''}
                    {post.commentsCount !== null ? `${post.commentsCount.toLocaleString()} comments` : ''}
                  </p>
                )}
                <div className="flex items-center gap-2 border-t border-surface-container-high pt-3">
                  {post.permalink && (
                    <a href={post.permalink} target="_blank" rel="noreferrer" className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-outline-variant px-3 py-2 text-sm font-medium">
                      <ExternalLink size={15} /> Open
                    </a>
                  )}
                  {post.canDelete ? (
                    <button
                      type="button"
                      onClick={() => removePost(post)}
                      disabled={deleting === post.id}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-error-container px-3 py-2 text-sm font-medium text-on-error-container disabled:opacity-50"
                    >
                      {deleting === post.id ? <LoaderCircle size={15} className="animate-spin" /> : <Trash2 size={15} />}
                      Delete
                    </button>
                  ) : post.permalink ? (
                    <a href={post.permalink} target="_blank" rel="noreferrer" className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-ig-soft px-3 py-2 text-sm font-medium text-ig">
                      <Trash2 size={15} /> Delete in Instagram
                    </a>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
