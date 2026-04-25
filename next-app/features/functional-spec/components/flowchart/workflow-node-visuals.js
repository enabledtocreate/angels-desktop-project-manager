'use client';

export const NODE_VISUALS = {
  start: { label: 'start', accent: 'emerald', className: 'rounded-full border-emerald-200/35 bg-emerald-400/18 text-emerald-50' },
  user_action: { label: 'user action', accent: 'blue', className: 'rounded-[1rem] border-blue-200/35 bg-blue-400/12 text-blue-50' },
  system_action: { label: 'system action', accent: 'slate', className: 'rounded-[1rem] border-white/14 bg-white/6 text-white' },
  decision: { label: 'decision', accent: 'amber', className: 'rounded-[1.35rem] border-amber-200/40 bg-amber-400/14 text-amber-50' },
  validation: { label: 'validation', accent: 'lime', className: 'rounded-[1rem] border-lime-200/35 bg-lime-400/12 text-lime-50' },
  loop: { label: 'loop', accent: 'orange', className: 'rounded-[1rem] border-orange-200/35 bg-orange-400/12 text-orange-50' },
  input: { label: 'input', accent: 'teal', className: 'rounded-[1rem] border-teal-200/35 bg-teal-400/12 text-teal-50' },
  output: { label: 'output', accent: 'indigo', className: 'rounded-[1rem] border-indigo-200/35 bg-indigo-400/12 text-indigo-50' },
  endpoint: { label: 'endpoint', accent: 'cyan', className: 'rounded-[1rem] border-cyan-200/35 bg-cyan-400/12 text-cyan-50' },
  return: { label: 'return', accent: 'fuchsia', className: 'rounded-[1rem] border-dashed border-fuchsia-200/35 bg-fuchsia-400/10 text-fuchsia-50' },
  error_path: { label: 'error path', accent: 'rose', className: 'rounded-[1rem] border-rose-200/35 bg-rose-400/12 text-rose-50' },
  log_audit: { label: 'log / audit', accent: 'zinc', className: 'rounded-[1rem] border-slate-200/25 bg-slate-400/12 text-slate-50' },
  external_interaction: { label: 'external interaction', accent: 'violet', className: 'rounded-[1rem] border-violet-200/35 bg-violet-400/12 text-violet-50' },
  formula: { label: 'formula', accent: 'yellow', className: 'rounded-[1rem] border-yellow-200/35 bg-yellow-400/12 text-yellow-50' },
  model_reference: { label: 'model reference', accent: 'sky', className: 'rounded-[1rem] border-sky-200/35 bg-sky-400/12 text-sky-50' },
  ai_placeholder: { label: 'ai placeholder', accent: 'cyan', className: 'rounded-[1rem] border-dashed border-cyan-200/45 bg-cyan-300/14 text-cyan-50' },
  open_question: { label: 'open question', accent: 'purple', className: 'rounded-[1rem] border-dashed border-purple-200/35 bg-purple-400/12 text-purple-50' },
};

export function visualForType(type) {
  return NODE_VISUALS[String(type || '').toLowerCase()] || NODE_VISUALS.system_action;
}

export function WorkflowNodeIcon({ type, className = '' }) {
  const normalized = String(type || 'system_action').toLowerCase();
  const common = {
    className: ['h-4 w-4', className].filter(Boolean).join(' '),
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': 'true',
  };
  if (normalized === 'start') return <svg {...common}><circle cx="12" cy="12" r="7" /><path d="M10 8l6 4-6 4V8z" /></svg>;
  if (normalized === 'user_action') return <svg {...common}><circle cx="12" cy="7" r="3" /><path d="M5 21a7 7 0 0 1 14 0" /></svg>;
  if (normalized === 'decision') return <svg {...common}><path d="M12 3l9 9-9 9-9-9 9-9z" /><path d="M9 10a3 3 0 1 1 5 2c-1 1-2 1.5-2 3" /><path d="M12 18h.01" /></svg>;
  if (normalized === 'validation') return <svg {...common}><path d="M20 6L9 17l-5-5" /><path d="M4 20h16" /></svg>;
  if (normalized === 'loop') return <svg {...common}><path d="M17 2l4 4-4 4" /><path d="M3 11V9a3 3 0 0 1 3-3h15" /><path d="M7 22l-4-4 4-4" /><path d="M21 13v2a3 3 0 0 1-3 3H3" /></svg>;
  if (normalized === 'input') return <svg {...common}><path d="M3 12h12" /><path d="M11 8l4 4-4 4" /><path d="M21 4v16" /></svg>;
  if (normalized === 'output') return <svg {...common}><path d="M9 12h12" /><path d="M17 8l4 4-4 4" /><path d="M3 4v16" /></svg>;
  if (normalized === 'endpoint' || normalized === 'return') return <svg {...common}><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /><circle cx="5" cy="12" r="2" /></svg>;
  if (normalized === 'error_path') return <svg {...common}><path d="M12 9v4" /><path d="M12 17h.01" /><path d="M10.3 3.9L2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /></svg>;
  if (normalized === 'log_audit') return <svg {...common}><path d="M6 3h12v18H6z" /><path d="M9 7h6" /><path d="M9 11h6" /><path d="M9 15h3" /></svg>;
  if (normalized === 'external_interaction') return <svg {...common}><path d="M8 12h8" /><path d="M13 7l5 5-5 5" /><path d="M3 5v14h6" /><path d="M21 5v14h-6" /></svg>;
  if (normalized === 'formula') return <svg {...common}><path d="M4 7h16" /><path d="M7 7l4 10" /><path d="M17 7l-4 10" /><path d="M4 17h16" /></svg>;
  if (normalized === 'model_reference') return <svg {...common}><path d="M4 7l8-4 8 4-8 4-8-4z" /><path d="M4 12l8 4 8-4" /><path d="M4 17l8 4 8-4" /></svg>;
  if (normalized === 'ai_placeholder') return <svg {...common}><path d="M12 3l7 4v6c0 4-3 7-7 8-4-1-7-4-7-8V7l7-4z" /><path d="M9 11h6" /><path d="M12 8v6" /><path d="M8 17c2-1 6-1 8 0" /></svg>;
  if (normalized === 'open_question') return <svg {...common}><path d="M9 9a3 3 0 1 1 5 2.2c-1.1.7-2 1.5-2 3" /><path d="M12 18h.01" /><circle cx="12" cy="12" r="9" /></svg>;
  return <svg {...common}><rect x="4" y="5" width="16" height="14" rx="3" /><path d="M8 12h8" /></svg>;
}
