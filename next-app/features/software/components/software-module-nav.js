import { ActionButton } from '@/components/ui/action-button';

const SECTION_ORDER = [
  'Product Definition',
  'Product Delivery',
  'Requirements',
  'System Design',
  'Validation & Decisions',
];

function groupModules(modules) {
  const grouped = new Map();
  for (const module of modules) {
    const label = module.hierarchyGroup || 'Software';
    const bucket = grouped.get(label) || [];
    bucket.push(module);
    grouped.set(label, bucket);
  }
  return Array.from(grouped.entries()).map(([label, sectionModules]) => ({
    label,
    modules: sectionModules.sort((left, right) => {
      const orderCompare = Number(left.hierarchyOrder || 0) - Number(right.hierarchyOrder || 0);
      if (orderCompare !== 0) return orderCompare;
      return String(left.label || left.name || left.moduleKey).localeCompare(String(right.label || right.name || right.moduleKey));
    }),
  })).sort((left, right) => {
    const leftIndex = SECTION_ORDER.indexOf(left.label);
    const rightIndex = SECTION_ORDER.indexOf(right.label);
    if (leftIndex === -1 && rightIndex === -1) return left.label.localeCompare(right.label);
    if (leftIndex === -1) return 1;
    if (rightIndex === -1) return -1;
    return leftIndex - rightIndex;
  });
}

function SoftwareModuleButton({ module, activeModuleKey, onSelect }) {
  const pendingFragmentCount = Number(module.pendingFragmentCount || 0);

  return (
    <ActionButton
      key={module.moduleKey}
      id={`software-module-button-${module.moduleKey}`}
      className="software-module-button w-full min-w-0 justify-start text-left"
      variant={module.moduleKey === activeModuleKey ? 'accent' : 'ghost'}
      onClick={() => onSelect(module.moduleKey)}
    >
      <div
        className="software-module-button-content min-w-0 space-y-1"
        style={{ marginLeft: `${Math.max(0, Number(module.hierarchyDepth || 0)) * 14}px` }}
      >
        <p className="software-module-button-label break-words text-sm font-medium leading-5">
          {module.label || module.name || module.moduleKey}
          <span
            className={[
              'software-module-button-fragment-count ml-1 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold',
              pendingFragmentCount > 0
                ? 'border-amber-400/50 bg-amber-400/15 text-amber-100'
                : 'border-white/10 bg-white/5 text-ink/55',
            ].join(' ')}
            title={`${pendingFragmentCount} fragment${pendingFragmentCount === 1 ? '' : 's'} need merging`}
          >
            ({pendingFragmentCount})
          </span>
        </p>
        <p className="software-module-button-purpose whitespace-normal break-words text-xs leading-5 opacity-70">
          {module.purposeSummary || module.description || 'Module purpose summary is not defined yet.'}
        </p>
      </div>
    </ActionButton>
  );
}

export function SoftwareModuleNav({ modules, activeModuleKey, onSelect, introText = 'Software Workspace groups the product, requirements, system design, and decision branches that sit on top of the core project model.' }) {
  const sections = groupModules(modules);

  return (
    <div className="software-module-nav space-y-4">
      <p className="software-module-nav-intro text-sm leading-6 text-ink/70">{introText}</p>
      {sections.map((section) => (
        <div key={section.label} id={`software-module-section-${section.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`} className="software-module-section space-y-2">
          <p className="software-module-section-label text-xs font-semibold uppercase tracking-[0.18em] text-ink/60">{section.label}</p>
          <div className="software-module-section-items space-y-2">
            {section.modules.map((module) => (
              <SoftwareModuleButton
                key={module.moduleKey}
                module={module}
                activeModuleKey={activeModuleKey}
                onSelect={onSelect}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
