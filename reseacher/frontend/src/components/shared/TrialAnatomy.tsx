import { KidneyViewer3D } from './KidneyViewer3D';

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

export { KidneyViewer3D };
