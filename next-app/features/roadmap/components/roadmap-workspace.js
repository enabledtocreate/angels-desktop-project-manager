'use client';

import { useMemo, useState } from 'react';
import { ActionButton } from '@/components/ui/action-button';
import { AiInstructionsPanel } from '@/components/ui/ai-instructions-panel';
import { DialogFrame } from '@/components/ui/dialog-frame';
import { FragmentBrowserModal } from '@/components/ui/fragment-browser-modal';
import { InfoTile } from '@/components/ui/info-tile';
import { SectionShell } from '@/components/ui/section-shell';
import { StatisticsDisclosure } from '@/components/ui/statistics-disclosure';
import { StatusBadge } from '@/components/ui/status-badge';
import { SurfaceCard } from '@/components/ui/surface-card';
import { RoadmapPhaseCard } from '@/features/roadmap/components/roadmap-phase-card';
import { RoadmapPhaseForm } from '@/features/roadmap/components/roadmap-phase-form';
import { useRoadmap } from '@/features/roadmap/hooks/use-roadmap';

function bucketCount(items, bucket) {
  return items.filter((item) => (item.planningBucket || '').toLowerCase() === bucket).length;
}

function itemsForPhase(items, phaseId) {
  return items.filter((item) => item.roadmapPhaseId === phaseId && !item.archived);
}

export function RoadmapWorkspace({ project }) {
  const roadmapEnabled = project.type === 'folder';
  const { roadmap, status, error, saveStatus, refresh, createPhase, updatePhase, deletePhase, mergeFragment, integrateFragment } = useRoadmap(project, roadmapEnabled);
  const [editingPhase, setEditingPhase] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [fragmentsOpen, setFragmentsOpen] = useState(false);
  const phases = roadmap?.phases || [];
  const tasks = roadmap?.tasks || [];
  const features = roadmap?.features || [];
  const bugs = roadmap?.bugs || [];
  const fragments = roadmap?.fragments || [];

  const phaseStats = useMemo(() => {
    const nextStats = new Map();
    phases.forEach((phase) => {
      nextStats.set(phase.id, {
        tasks: itemsForPhase(tasks, phase.id).length,
        features: itemsForPhase(features, phase.id).length,
        bugs: itemsForPhase(bugs, phase.id).length,
      });
    });
    return nextStats;
  }, [phases, tasks, features, bugs]);

  async function handleSavePhase(formState) {
    const payload = {
      ...formState,
      afterPhaseId: formState.afterPhaseId || null,
    };
    if (editingPhase && editingPhase.id) {
      await updatePhase(editingPhase.id, payload);
    } else {
      await createPhase(payload);
    }
    setEditorOpen(false);
    setEditingPhase(null);
  }

  async function handleDeletePhase(phaseId) {
    await deletePhase(phaseId);
    if (editingPhase && editingPhase.id === phaseId) {
      setEditingPhase(null);
      setEditorOpen(false);
    }
  }

  if (!roadmapEnabled) {
    return (
      <SectionShell
        eyebrow="Roadmap"
        title="Roadmap editing needs a folder project"
        description="The current backend roadmap flow is document-backed and only available for folder-based projects right now."
      />
    );
  }

  if (status === 'loading' || status === 'idle') {
    return (
      <SectionShell eyebrow="Roadmap" title="Loading roadmap…" description="Fetching live roadmap state from the current backend." />
    );
  }

  if (status === 'error') {
    return (
      <SectionShell
        eyebrow="Roadmap"
        title="Roadmap load failed"
        description={error ? error.message : 'Unknown roadmap error'}
      />
    );
  }

  return (
    <div className="space-y-6">
      <SectionShell
        eyebrow="Roadmap"
        title="Roadmap workspace"
        description="This is the first migrated complex editor. It reads live roadmap state, shows phase planning context, and saves phase changes back to the existing backend."
        actions={(
          <>
            <StatusBadge tone="foundation">Template {roadmap?.templateVersion || 'n/a'}</StatusBadge>
            <StatusBadge tone="migration">{saveStatus === 'saving' ? 'Saving' : 'Synced'}</StatusBadge>
            <ActionButton variant="subtle" onClick={refresh}>Refresh roadmap</ActionButton>
            <ActionButton variant="ghost" onClick={() => setFragmentsOpen(true)}>Load Fragments</ActionButton>
            <ActionButton variant="accent" onClick={() => { setEditingPhase(null); setEditorOpen(true); }}>Add phase</ActionButton>
          </>
        )}
      >
        <StatisticsDisclosure>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <InfoTile eyebrow="Phases" title={`${phases.filter((phase) => !phase.archived).length} active`} body={`${phases.filter((phase) => phase.archived).length} archived`} />
            <InfoTile eyebrow="Features" title={`${features.length} total`} body={`Planned: ${bucketCount(features, 'planned')} • Considered: ${bucketCount(features, 'considered')}`} />
            <InfoTile eyebrow="Bugs" title={`${bugs.length} total`} body={`Planned: ${bucketCount(bugs, 'planned')} • Considered: ${bucketCount(bugs, 'considered')}`} />
            <InfoTile eyebrow="Fragments" title={`${fragments.length} available`} body="Roadmap fragments still flow through the current backend and markdown sync system." />
          </div>
        </StatisticsDisclosure>
      </SectionShell>

      <AiInstructionsPanel
        title="Roadmap AI Instructions"
        instructions={[
          'Treat phases as the canonical delivery sequence and keep features, bugs, and work items aligned with that sequence.',
          'Use roadmap fragments for proposed roadmap changes instead of editing the canonical roadmap directly.',
          'If roadmap work changes implementation scope, the AI agent should create the needed downstream fragments as follow-up work.',
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.85fr)]">
        <SectionShell
          eyebrow="Phases"
          title="Phase planner"
          description="This view is now reading real roadmap phase data instead of placeholder copy. Editing here persists through the existing roadmap endpoints."
        >
          <div className="space-y-3">
            {phases.filter((phase) => !phase.archived).length ? phases.filter((phase) => !phase.archived).map((phase) => (
              <RoadmapPhaseCard
                key={phase.id}
                phase={phase}
                stats={phaseStats.get(phase.id) || { tasks: 0, features: 0, bugs: 0 }}
                onEdit={(nextPhase) => {
                  setEditingPhase(nextPhase);
                  setEditorOpen(true);
                }}
                onDelete={handleDeletePhase}
              />
            )) : (
              <SurfaceCard tone="muted">
                <p className="text-sm leading-6 text-sky-100/75">No phases yet. Add the first roadmap phase to start the migrated planner flow.</p>
              </SurfaceCard>
            )}
          </div>
        </SectionShell>

        <div className="space-y-4">
          <SurfaceCard>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-100/60">Fragments</p>
            <p className="mt-3 text-sm leading-6 text-sky-100/75">
              Use <span className="font-semibold text-white">Load Fragments</span> to process roadmap fragments in code order, then revisit archived integrations from one place.
            </p>
          </SurfaceCard>
          <DialogFrame
            eyebrow="Migration Scope"
            title="Roadmap editor is now live in React"
            description="The planner still relies on the current backend contract, but the UI is now moving out of the giant browser script. Later steps can bring over the richer flowchart, fragments, and drag/drop planning behaviors."
          >
            <SurfaceCard className="p-4" tone="muted">
              <p className="text-sm leading-7 text-sky-100/75">
                Markdown length: <span className="font-semibold text-white">{(roadmap?.markdown || '').length}</span>
              </p>
              <p className="mt-2 text-sm leading-7 text-sky-100/75">
                Mermaid length: <span className="font-semibold text-white">{(roadmap?.mermaid || '').length}</span>
              </p>
            </SurfaceCard>
          </DialogFrame>
        </div>
      </div>

      {editorOpen ? (
        <RoadmapPhaseForm
          phase={editingPhase}
          phases={phases}
          onCancel={() => {
            setEditorOpen(false);
            setEditingPhase(null);
          }}
          onSave={handleSavePhase}
          saveStatus={saveStatus}
        />
      ) : null}

      <FragmentBrowserModal
        eyebrow="Roadmap Fragments"
        title="Roadmap fragments"
        isOpen={fragmentsOpen}
        fragments={fragments}
        storageKey={`roadmap-${project.id}`}
        onClose={() => setFragmentsOpen(false)}
        onMerge={(fragment) => mergeFragment(fragment.id)}
        onIntegrate={(fragment) => integrateFragment(fragment.id)}
      />
    </div>
  );
}
