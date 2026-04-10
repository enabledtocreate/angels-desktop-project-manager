export function isArchivedFragment(fragment) {
  const status = String(fragment?.status || '').trim().toLowerCase();
  return status === 'archived' || status === 'integrated' || status === 'merged' || Boolean(fragment?.merged);
}

export function countActiveFragments(fragments = []) {
  return (Array.isArray(fragments) ? fragments : []).filter((fragment) => !isArchivedFragment(fragment)).length;
}

export function countArchivedFragments(fragments = []) {
  return (Array.isArray(fragments) ? fragments : []).filter((fragment) => isArchivedFragment(fragment)).length;
}
