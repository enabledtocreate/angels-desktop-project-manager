import { ActionButton } from '@/components/ui/action-button';
import { DialogFrame } from '@/components/ui/dialog-frame';
import { InfoTile } from '@/components/ui/info-tile';
import { NavSection } from '@/components/ui/nav-section';
import { SectionShell } from '@/components/ui/section-shell';
import { StatusBadge } from '@/components/ui/status-badge';
import { SurfaceCard } from '@/components/ui/surface-card';

const coreModules = [
  'Roadmap',
  'Kanban',
  'Gantt',
  'Work Items',
  'Documents',
];

const softwareModules = [
  'Features',
  'Bugs',
  'PRD',
  'Architecture',
  'Database Schema',
];

export default function MigrationAppShell() {
  return (
    <main className="min-h-screen px-6 py-8 md:px-8">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <SurfaceCard>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-100/60">Pass 4</p>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white">Next.js Migration Shell</h1>
            <p className="mt-3 text-sm leading-6 text-sky-100/75">
              This workspace will replace the legacy browser script gradually. The current Electron app still runs from
              the existing frontend while we migrate feature-by-feature into React components.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <StatusBadge tone="foundation">Shared UI primitives</StatusBadge>
              <StatusBadge tone="migration">Designer shell active</StatusBadge>
            </div>
          </SurfaceCard>
          <NavSection label="Core Workspace" items={coreModules} />
          <NavSection label="Software Designer" items={softwareModules} />
        </aside>
        <section className="space-y-6">
          <SectionShell
            eyebrow="Migration Status"
            title="React app shell is live"
            description="Pass 4 establishes the shared component foundation. We now have reusable cards, buttons, badges, dialog frames, and section shells ready for the later feature passes."
            actions={(
              <>
                <ActionButton variant="accent">Inspect core workspace</ActionButton>
                <ActionButton variant="subtle">Review software modules</ActionButton>
              </>
            )}
          >
            <p className="max-w-3xl text-sm leading-7 text-sky-100/80">
              Pass 2 establishes the new frontend foundation. We now have a separate Next.js application, Tailwind
              theme, and a component-based shell ready for the later feature passes.
            </p>
          </SectionShell>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <InfoTile
              eyebrow="Current Goal"
              title="Preserve the working desktop app"
              body="The old UI remains the runtime source of truth until each domain reaches parity in the new frontend."
            />
            <InfoTile
              eyebrow="Next Passes"
              title="Shared primitives and shell behavior"
              body="The next migration work will focus on reusable layout, dialog, preview, and navigation components."
            />
            <InfoTile
              eyebrow="Testing"
              title="Tests move with each pass"
              body="Backend contract tests stay in place while new frontend shell tests and build checks are added pass by pass."
            />
          </div>

          <DialogFrame
            eyebrow="Ready For Migration"
            title="Component primitives are available for real screens"
            description="Roadmap, project settings, PRD, Architecture, and Database Schema can now migrate onto a shared UI kit instead of bringing giant one-off markup across."
          >
            <div className="grid gap-3 md:grid-cols-2">
              <SurfaceCard className="p-4" tone="muted">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-100/60">Included now</p>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-sky-100/75">
                  <li>Buttons</li>
                  <li>Surface cards</li>
                  <li>Status badges</li>
                  <li>Section shells</li>
                  <li>Dialog frames</li>
                </ul>
              </SurfaceCard>
              <SurfaceCard className="p-4" tone="muted">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-100/60">What this unlocks</p>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-sky-100/75">
                  <li>Consistent React migration patterns</li>
                  <li>Smaller focused UI files</li>
                  <li>Easier visual refinement with Tailwind</li>
                  <li>Cleaner component-level tests next</li>
                </ul>
              </SurfaceCard>
            </div>
          </DialogFrame>
        </section>
      </div>
    </main>
  );
}
