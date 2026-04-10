import { fetchJson } from '@/lib/api-client';

function LinkGlyph({ type = 'url', className = 'h-4 w-4' }) {
  if (type === 'folder') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
        <path d="M3.5 7.5h5l1.8 2h10.2v8.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z" />
        <path d="M3.5 7.5a2 2 0 0 1 2-2h3.4l1.6 2h8a2 2 0 0 1 2 2" />
      </svg>
    );
  }

  if (type === 'file') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
        <path d="M7 3.5h6.6L19 8.9V19a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 6 19V5A1.5 1.5 0 0 1 7.5 3.5z" />
        <path d="M13.5 3.5V9H19" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <path d="M10.2 13.8 7.4 16.6a3 3 0 0 1-4.2-4.2l4.1-4.1a3 3 0 0 1 4.2 0" />
      <path d="m13.8 10.2 2.8-2.8a3 3 0 1 1 4.2 4.2l-4.1 4.1a3 3 0 0 1-4.2 0" />
      <path d="m8.8 15.2 6.4-6.4" />
    </svg>
  );
}

async function openProjectLink(link) {
  if (!link?.url) return;
  const type = String(link.type || 'url').trim().toLowerCase();
  const action = String(link.action || 'auto').trim().toLowerCase();

  if (type === 'url') {
    if (action === 'chrome') {
      await fetchJson('/api/open-chrome', {
        method: 'POST',
        body: JSON.stringify({ url: link.url }),
      });
      return;
    }
    await fetchJson('/api/open-url', {
      method: 'POST',
      body: JSON.stringify({ url: link.url }),
    });
    return;
  }

  const routeByAction = {
    auto: '/api/open-explorer',
    default: '/api/open-explorer',
    explorer: '/api/open-explorer',
    cursor: '/api/open-cursor',
    vscode: '/api/open-vscode',
    chrome: '/api/open-chrome',
  };

  const route = routeByAction[action] || '/api/open-explorer';
  await fetchJson(route, {
    method: 'POST',
    body: JSON.stringify({ path: link.url }),
  });
}

export function ProjectLinkIcons({ links = [], className = '', iconClassName = 'h-4 w-4', buttonClassName = '' }) {
  const visibleLinks = (Array.isArray(links) ? links : []).filter((link) => link && (link.description || link.url));

  if (!visibleLinks.length) return null;

  return (
    <div className={['flex flex-wrap items-center gap-2', className].filter(Boolean).join(' ')}>
      {visibleLinks.map((link, index) => {
        const label = link.description || link.url || `Link ${index + 1}`;
        return (
          <button
            key={`${link.type || 'url'}-${link.url || label}-${index}`}
            type="button"
            title={label}
            aria-label={label}
            className={[
              'inline-flex h-8 w-8 items-center justify-center rounded-lg bg-transparent text-ink/75 transition hover:bg-white/8 hover:text-ink',
              buttonClassName,
            ].filter(Boolean).join(' ')}
            onClick={() => {
              openProjectLink(link).catch((error) => {
                console.error('Failed to open project link:', error);
              });
            }}
          >
            <LinkGlyph type={link.type} className={iconClassName} />
          </button>
        );
      })}
    </div>
  );
}
