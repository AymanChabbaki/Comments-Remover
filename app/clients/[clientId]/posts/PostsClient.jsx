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
  const [selected, setSelected] = useState([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const loadVersion = useRef(0);

  const loadAll = useCallback(async () => {
    const version = ++loadVersion.current;
    setPosts([]);
    setSelected([]);
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

  async function deletePostRequest(post) {
    const response = await fetch(`/api/clients/${clientId}/posts/${encodeURIComponent(post.id)}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform: post.platform }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Could not delete the post.');
  }

  async function removePost(post) {
    if (!window.confirm('Delete this Facebook post permanently? This cannot be undone.')) return;
    setDeleting(post.id);
    setErrors((current) => ({ ...current, delete: null }));
    try {
      await deletePostRequest(post);
      setPosts((current) => current.filter((item) => !(item.platform === post.platform && item.id === post.id)));
      setSelected((current) => current.filter((id) => id !== post.id));
      setProgress((current) => ({ ...current, [post.platform]: Math.max(0, current[post.platform] - 1) }));
    } catch (error) {
      setErrors((current) => ({ ...current, delete: error.message }));
    } finally {
      setDeleting(null);
    }
  }

  const visiblePosts = filter === 'all' ? posts : posts.filter((post) => post.platform === filter);
  const selectablePosts = visiblePosts.filter((post) => post.canDelete);
  const selectedPosts = posts.filter((post) => post.canDelete && selected.includes(post.id));
  const allVisibleSelected = selectablePosts.length > 0 && selectablePosts.every((post) => selected.includes(post.id));

  function togglePost(postId) {
    setSelected((current) => current.includes(postId) ? current.filter((id) => id !== postId) : [...current, postId]);
  }

  function toggleAllVisible() {
    const visibleIds = selectablePosts.map((post) => post.id);
    setSelected((current) => {
      if (allVisibleSelected) return current.filter((id) => !visibleIds.includes(id));
      return [...new Set([...current, ...visibleIds])];
    });
  }

  async function deleteSelected() {
    const targets = selectedPosts;
    if (!targets.length) return;
    if (!window.confirm(`Delete ${targets.length} selected Facebook post${targets.length === 1 ? '' : 's'} permanently? This cannot be undone.`)) return;

    setBulkDeleting(true);
    setErrors((current) => ({ ...current, delete: null }));
    const removed = [];
    const failures = [];

    // Small batches avoid flooding Meta while still making large selections practical.
    for (let index = 0; index < targets.length; index += 3) {
      const batch = targets.slice(index, index + 3);
      const results = await Promise.allSettled(batch.map((post) => deletePostRequest(post)));
      results.forEach((result, resultIndex) => {
        const post = batch[resultIndex];
        if (result.status === 'fulfilled') removed.push(post.id);
        else failures.push(`${post.id}: ${result.reason?.message || 'unknown error'}`);
      });
      if (removed.length) {
        const removedSet = new Set(removed);
        setPosts((current) => current.filter((post) => !removedSet.has(post.id)));
        setSelected((current) => current.filter((id) => !removedSet.has(id)));
      }
    }

    if (removed.length) {
      setProgress((current) => ({ ...current, facebook: Math.max(0, current.facebook - removed.length) }));
    }
    if (failures.length) {
      setErrors((current) => ({
        ...current,
        delete: `${removed.length} deleted; ${failures.length} failed. ${failures.slice(0, 3).join(' | ')}`,
      }));
    }
    setBulkDeleting(false);
  }

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

        {(selectablePosts.length > 0 || selectedPosts.length > 0) && (
          <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-surface-container-high bg-surface-container-lowest/95 p-4 shadow-sm backdrop-blur">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={allVisibleSelected}
                onChange={toggleAllVisible}
                disabled={loading || bulkDeleting}
                className="h-4 w-4 accent-primary"
              />
              Select all Facebook posts in this view
            </label>
            <div className="flex items-center gap-3">
              <span className="text-sm text-on-surface-variant">{selectedPosts.length} selected</span>
              {selectedPosts.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelected([])}
                  disabled={bulkDeleting}
                  className="text-sm font-medium underline disabled:opacity-50"
                >
                  Clear
                </button>
              )}
              <button
                type="button"
                onClick={deleteSelected}
                disabled={!selectedPosts.length || bulkDeleting}
                className="inline-flex items-center gap-2 rounded-lg bg-error px-4 py-2 text-sm font-semibold text-on-error disabled:opacity-40"
              >
                {bulkDeleting ? <LoaderCircle size={16} className="animate-spin" /> : <Trash2 size={16} />}
                {bulkDeleting ? 'Deleting…' : `Delete selected (${selectedPosts.length})`}
              </button>
            </div>
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
              <div className="relative aspect-square bg-surface-container">
                {post.canDelete && (
                  <label className="absolute left-3 top-3 z-[1] flex cursor-pointer items-center gap-2 rounded-lg bg-white/95 px-2.5 py-2 text-xs font-semibold text-on-surface shadow-md">
                    <input
                      type="checkbox"
                      checked={selected.includes(post.id)}
                      onChange={() => togglePost(post.id)}
                      disabled={bulkDeleting || deleting === post.id}
                      className="h-4 w-4 accent-primary"
                    />
                    Select
                  </label>
                )}
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
                      disabled={deleting === post.id || bulkDeleting}
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
