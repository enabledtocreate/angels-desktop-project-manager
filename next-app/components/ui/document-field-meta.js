'use client';

import { WorkItemReferenceTags } from '@/components/ui/work-item-reference-tags';

export function DocumentFieldMeta({ stableId = '', sourceRefs = [], workItemLookup = {} }) {
  return (
    <>
      <p className="text-[11px] font-mono text-sky-100/45">
        ID: {stableId || 'pending-save'}
      </p>
      <WorkItemReferenceTags sourceRefs={sourceRefs} workItemLookup={workItemLookup} />
    </>
  );
}
