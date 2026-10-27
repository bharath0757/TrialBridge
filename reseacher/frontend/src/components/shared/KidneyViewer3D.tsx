import React from 'react';
import { AnatomySpace3D, type AnatomicalSystem } from './AnatomySpace3D';

export interface KidneyViewer3DProps {
  organ?: string;
  description?: string;
  studyName?: string;
  initialDose?: number;
  formula?: string;
  condition?: string;
  defaultSystem?: AnatomicalSystem;
}

export function KidneyViewer3D({
  formula = 'C₄H₁₁N₅',
  condition = 'Type-2 Diabetes',
  defaultSystem = 'visceral',
}: KidneyViewer3DProps) {
  return (
    <AnatomySpace3D
      currentSystem={defaultSystem}
      drugFormula={formula}
      condition={condition}
    />
  );
}
