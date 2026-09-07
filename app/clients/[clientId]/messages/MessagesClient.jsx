'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import AppShell from '../../../../components/AppShell';

const input = 'w-full rounded-lg border border-outline-variant bg-surface-container-lowest p-3 text-on-surface';
const button = 'rounded-lg bg-primary px-4 py-2.5 font-medium text-on-primary disabled:opacity-40';
const panel = 'rounded-2xl border border-surface-container-high bg-surface-container-lowest p-6 space-y-4';
const emptyRule = { platform: 'instagram', kind: 'private', keyword: '', message: '', enabled: false };

export default function MessagesClient({ clientId, clientName }) {
  const url = `/api/clients/${clientId}/messages`;
  const [data, setData] = useState(null);
  const [platform, setPlatform] = useState('instagram');
  const [recipients, setRecipients] = useState('');
  const [message, setMessage] = useState('');
  const [preview, setPreview] = useState(null);
  const [rule, setRule] = useState(emptyRule);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const campaign = useRef(null);
  const sending = useRef(false);
  const refresh = useCallback(async () => {
    const response = await fetch(url);
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Could not load messages.');
    setData(result);
  }, [url]);
  useEffect(() => { refresh().catch(err => setError(err.message)); }, [refresh]);
  useEffect(() => { setPreview(null); campaign.current = null; }, [platform, recipients, message]);

  async function post(body) {
    const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Request failed.');
    return result;
  }
  async function act(work) {
    if (sending.current) return;
    sending.current = true; setBusy(true); setError(''); setNotice('');
    try { await work(); await refresh(); } catch (err) { setError(err.message); }
    finally { sending.current = false; setBusy(false); }
  }
  async function drain() {
    // Small awaited batches survive serverless request limits; the scheduled worker
    // continues queued messages if the user closes this page.
    let count = 0;
    while (true) {
      const result = await post({ action: 'process' });
      count += result.results.length;
      await refresh();
      if (!result.results.length) break;
    }
    setNotice(`Finished processing ${count} messages. See the results below.`);
  }
  const eligible = preview?.filter(item => item.eligible).length || 0;
  return <AppShell clientId={clientId} clientName={clientName} subtitle="Automatic replies and recipient lists">
    <div className="space-y-6">
      <div><h2 className="text-2xl font-semibold">Auto Messages</h2><p className="mt-2 text-on-surface-variant">Reply to comments and DMs, or send a saved message to a list of eligible contacts.</p></div>
      <div className={panel}><p>List messages use contacts who messaged this connected account within the last 24 hours. Paste messaging recipient IDs, not usernames or profile links. Unknown and expired contacts are skipped.</p><p className="text-sm text-on-surface-variant">Messaging permissions and a scheduled worker are required for unattended replies. <Link className="underline" href={`/clients/${clientId}/settings`}>Connect or reconnect accounts in Settings</Link>.</p></div>
      {error && <p role="alert" className="rounded-lg bg-red-50 p-4 text-red-700">{error}</p>}
      {notice && <p role="status" className="rounded-lg bg-green-50 p-4 text-green-800">{notice}</p>}
      {!data && !error && <p>Loading messages…</p>}
      {data && <>
        {!data.active && <p role="alert">This account is paused. Sending is disabled.</p>}
        <fieldset disabled={busy} className={`${panel} disabled:opacity-70`}>
          <legend className="text-lg font-semibold">Send to a list</legend>
          <label className="block">Platform<select className={input} value={platform} onChange={e => setPlatform(e.target.value)}><option value="instagram">Instagram</option><option value="facebook">Facebook Messenger</option></select></label>
          {!data.connected[platform] && <p>Connect {platform} in Settings before sending.</p>}
          <label className="block">Recipient IDs<textarea className={input} rows={5} value={recipients} onChange={e => setRecipients(e.target.value)} placeholder={'One recipient ID per line, up to 500'} /></label>
          <button className="underline" onClick={() => setRecipients(data.contacts.filter(c => c.platform === platform && Date.now()-new Date(c.last_inbound_at).getTime() < 86400000).map(c => c.recipient_id).join('\n'))}>Use recent contacts</button>
          <label className="block">Message<textarea className={input} rows={4} maxLength={1000} value={message} onChange={e => setMessage(e.target.value)} placeholder="Write the message each recipient will receive" /></label>
          <p className="text-sm text-on-surface-variant">{message.length}/1,000 characters</p>
          <button className={button} disabled={!data.active || !data.connected[platform] || !recipients.trim() || !message.trim()} onClick={() => act(async () => { const result = await post({ action: 'preview', platform, recipients }); setPreview(result.recipients); })}>Preview recipients</button>
          {preview && <div className="space-y-3"><p className="font-medium">{eligible} ready · {preview.length-eligible} skipped</p><div className="max-h-52 overflow-auto">{preview.map(item => <p key={item.id} className="py-1 text-sm">{item.id} — {item.reason}</p>)}</div><p className="whitespace-pre-wrap rounded-lg bg-surface-container-low p-4">{message}</p><button className={button} disabled={!eligible || !data.active} onClick={() => act(async () => {
            if (!campaign.current) campaign.current = crypto.randomUUID();
            await post({ action: 'send', platform, recipients, message, campaignId: campaign.current });
            setPreview(null); await drain();
          })}>Send to {eligible} eligible contacts</button></div>}
        </fieldset>
        <fieldset disabled={busy} className={panel}>
          <legend className="text-lg font-semibold">Automatic reply rules</legend>
          <p className="text-sm text-on-surface-variant">The first matching rule runs once per event. Comments removed by moderation receive no reply. A private comment reply sends one initial DM; further messages require a reply from the recipient.</p>
          {data.rules.map(item => <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-surface-container-low p-3"><div><p className="font-medium">{item.platform} · {item.kind === 'incoming' ? 'Incoming DM' : item.kind === 'private' ? 'Comment → private DM' : 'Public comment reply'} · {item.enabled ? 'Enabled' : 'Disabled'}</p><p className="text-sm">{item.keyword || 'All messages/comments'} → {item.message}</p></div><div className="flex gap-3"><button className="underline" onClick={() => setRule(item)}>Edit</button><button className="underline" onClick={() => act(async () => { await post({ action: 'saveRule', ...item, enabled: !item.enabled }); })}>{item.enabled ? 'Disable' : 'Enable'}</button><button className="underline" onClick={() => act(async () => { await post({ action: 'deleteRule', id: item.id }); if (rule.id === item.id) setRule(emptyRule); })}>Delete</button></div></div>)}
          {!data.rules.length && <p>No rules yet. Create your first reply below.</p>}
          <label className="block">Platform<select className={input} value={rule.platform} onChange={e => setRule({ ...rule, platform: e.target.value })}><option value="instagram">Instagram</option><option value="facebook">Facebook</option></select></label>
          <label className="block">Reply type<select className={input} value={rule.kind} onChange={e => setRule({ ...rule, kind: e.target.value })}><option value="private">Comment → private DM</option><option value="public">Public comment reply</option><option value="incoming">Incoming DM → auto reply</option></select></label>
          <label className="block">Keyword (leave blank to match all)<input className={input} maxLength={100} value={rule.keyword} onChange={e => setRule({ ...rule, keyword: e.target.value })} placeholder="price" /></label>
          <label className="block">Reply message<textarea className={input} maxLength={1000} rows={3} value={rule.message} onChange={e => setRule({ ...rule, message: e.target.value })} /></label>
          <label className="flex gap-2"><input type="checkbox" checked={rule.enabled} onChange={e => setRule({ ...rule, enabled: e.target.checked })} />Enable this rule</label>
          <div className="flex gap-3"><button className={button} disabled={!rule.message.trim() || !data.active || !data.connected[rule.platform]} onClick={() => act(async () => { await post({ action: 'saveRule', ...rule }); setRule(emptyRule); setNotice('Rule saved.'); })}>{rule.id ? 'Save changes' : 'Create rule'}</button>{rule.id && <button onClick={() => setRule(emptyRule)}>Cancel edit</button>}</div>
        </fieldset>
        <section className={panel}><div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-lg font-semibold">Message history</h3><button disabled={busy} className="underline" onClick={() => act(refresh)}>Refresh</button></div><p>{data.pending} messages queued. Latest 100 results shown. “Sent” means Meta accepted the message.</p><div className="flex gap-3"><button className={button} disabled={busy || !data.pending || !data.active} onClick={() => act(drain)}>{busy ? 'Working…' : 'Process queued messages'}</button><button disabled={busy || !data.pending} className="underline" onClick={() => act(() => post({ action: 'cancel' }))}>Cancel queued messages</button></div>
          {!data.jobs.length ? <p>No messages yet.</p> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr>{['Recipient / comment', 'Message', 'Status', 'Time'].map(label => <th key={label} className="p-2">{label}</th>)}</tr></thead><tbody>{data.jobs.map(job => <tr key={job.id} className="border-t border-surface-container-high"><td className="p-2">{job.recipient_id}<span className="block text-xs">{job.platform} · {job.kind}</span></td><td className="max-w-xs break-words p-2">{job.message}</td><td className="p-2">{job.status}{job.error && <p className="max-w-xs text-red-700">{job.error}</p>}</td><td className="whitespace-nowrap p-2">{new Date(job.created_at).toLocaleString()}</td></tr>)}</tbody></table></div>}
        </section>
      </>}
    </div>
  </AppShell>;
}
