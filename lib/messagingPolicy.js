export function parseRecipients(value) {
  if (typeof value !== 'string' || value.length > 20000) throw new Error('Paste up to 500 recipient IDs.');
  const ids = [...new Set(value.split(/[\s,;]+/).filter(Boolean))];
  if (!ids.length || ids.length > 500 || ids.some(id => !/^\d{1,40}$/.test(id))) {
    throw new Error('Use 1–500 numeric messaging recipient IDs, separated by lines or commas. Usernames and profile links cannot be used.');
  }
  return ids;
}

export function validateMessage(value) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > 1000) throw new Error('Write a message of 1–1,000 characters.');
  return value.trim();
}

export function isEligible(lastInbound, now = Date.now()) {
  const time = new Date(lastInbound).getTime();
  return Number.isFinite(time) && time <= now && time > now - 24 * 60 * 60 * 1000;
}

export function matchesRule(rule, text) {
  return rule.enabled && (!rule.keyword || String(text || '').toLocaleLowerCase().includes(rule.keyword.toLocaleLowerCase()));
}
