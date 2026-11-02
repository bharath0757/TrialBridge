import { lazy, Suspense } from 'react';
import type { KidneyViewer3DProps } from './KidneyViewer3D';

const Viewer = lazy(() => import('./KidneyViewer3D').then(module => ({ default: module.KidneyViewer3D })));

export function KidneyViewer3D(props: KidneyViewer3DProps) {
  return <Suspense fallback={<p role="status">Loading anatomy viewer…</p>}><Viewer {...props} /></Suspense>;
}

interface TrialAnatomyProps {
  organ?: string;
  description?: string;
  studyName?: string;
  formula?: string;
  condition?: string;
}

export function TrialAnatomy({
  organ = 'Kidneys',
  description = 'Affected part (Kidneys) highlighted in red for Type 2 Diabetes molecular trial.',
  studyName = 'Type 2 Diabetes Study',
  formula = 'C₄H₁₁N₅',
  condition = 'Type 2 Diabetes'
}: TrialAnatomyProps) {
  return (
    <KidneyViewer3D
      organ={organ}
      description={description}
      studyName={studyName}
      formula={formula}
      condition={condition}
    />
  );
}

