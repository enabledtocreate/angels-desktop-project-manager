import { DialogFrame } from '@/components/ui/dialog-frame';
import { InfoTile } from '@/components/ui/info-tile';
import { SectionShell } from '@/components/ui/section-shell';
import { StatisticsDisclosure } from '@/components/ui/statistics-disclosure';
import { StatusBadge } from '@/components/ui/status-badge';
import { SurfaceCard } from '@/components/ui/surface-card';

function dependencyCount(moduleKey, dependencies) {
  return dependencies.filter((edge) => edge.sourceEntityId === moduleKey).length;
}

function dependentCount(moduleKey, dependencies) {
  return dependencies.filter((edge) => edge.targetEntityId === moduleKey).length;
}

function ModuleExtensionCard({ project, module }) {
  const showParentExtension = Boolean(project?.isParentProject && module?.parentExtensionSummary);
  const showChildExtension = Boolean(project?.parentSummary && module?.childExtensionSummary);
  if (!showParentExtension && !showChildExtension) return null;

  return (
    <DialogFrame
      eyebrow="Project Family Extension"
      title={`${module.label || module.moduleKey} is parent/child aware`}
      description="The normal module remains autonomous, but project-family context adds orchestration responsibilities and reference points."
    >
      <div className="grid gap-3 md:grid-cols-2">
        {showParentExtension ? (
          <SurfaceCard id={`module-parent-extension-${module.moduleKey}`} className="module-parent-extension-card p-4" tone="muted">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-100/55">Parent Extension</p>
            <p className="mt-2 text-sm leading-7 text-sky-100/75">{module.parentExtensionSummary}</p>
          </SurfaceCard>
        ) : null}
        {showChildExtension ? (
          <SurfaceCard id={`module-child-extension-${module.moduleKey}`} className="module-child-extension-card p-4" tone="muted">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-100/55">Child Extension</p>
            <p className="mt-2 text-sm leading-7 text-sky-100/75">{module.childExtensionSummary}</p>
          </SurfaceCard>
        ) : null}
      </div>
    </DialogFrame>
  );
}

export function SoftwareModuleSurface({ project, module, dependencies }) {
  if (!module) {
    return (
      <SectionShell
        eyebrow="Software Designer"
        title="No software module selected"
        description="Select an enabled software module to view its migrated shell."
      />
    );
  }

  const moduleTitle = module.label || module.name || module.moduleKey;

  return (
    <SectionShell
      eyebrow="Software Branch"
      title={moduleTitle}
      description={module.description || `${moduleTitle} is now represented in the Next workspace. This shell keeps the module visible while the deeper editing surface migrates out of the legacy frontend.`}
      actions={(
        <>
          <StatusBadge tone="foundation">{module.enabled ? 'Enabled' : 'Disabled'}</StatusBadge>
          <StatusBadge tone="migration">{project.projectType || 'general'}</StatusBadge>
        </>
      )}
    >
      <StatisticsDisclosure>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <InfoTile
            eyebrow="Module Key"
            title={module.moduleKey}
            body="This comes from the real module registry, so the Next workspace is using the same project capability model as the current app."
          />
          <InfoTile
            eyebrow="Dependencies"
            title={`${dependencyCount(module.moduleKey, dependencies)} upstream`}
            body="Dependency edges are read from the current backend relationship model."
          />
          <InfoTile
            eyebrow="Dependents"
            title={`${dependentCount(module.moduleKey, dependencies)} downstream`}
            body="This helps us keep module relationships visible while the software surfaces migrate."
          />
        </div>
      </StatisticsDisclosure>

      <ModuleExtensionCard project={project} module={module} />

      <DialogFrame
        eyebrow="Hierarchy Context"
        title={`${moduleTitle} branch is live in Next.js`}
        description="This view keeps the document hierarchy visible while deeper module editing surfaces continue to mature."
      >
        <SurfaceCard className="p-4" tone="muted">
          <p className="text-sm leading-7 text-sky-100/75">
            Project: <span className="font-semibold text-white">{project.name}</span>
          </p>
          <p className="mt-2 text-sm leading-7 text-sky-100/75">
            Module: <span className="font-semibold text-white">{moduleTitle}</span>
          </p>
          <p className="mt-2 text-sm leading-7 text-sky-100/75">
            Branch group: <span className="font-semibold text-white">{module.hierarchyGroup || 'Software'}</span>
          </p>
        </SurfaceCard>
      </DialogFrame>
    </SectionShell>
  );
}
