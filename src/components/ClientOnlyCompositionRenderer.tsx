// src/components/ClientOnlyCompositionRenderer.tsx
import dynamic from 'next/dynamic';
import React from 'react';

const CompositionRenderer = dynamic(
  () => import('./CompositionRenderer'),
  { ssr: false }
);

interface ClientOnlyCompositionRendererProps {
  composition: any; // Adjust type as needed
  width: number;
  height: number;
  effect: 'none' | 'snow' | 'rain';
  matrixPosition: { x: number; y: number; width: number; height: number };
}

const ClientOnlyCompositionRenderer: React.FC<ClientOnlyCompositionRendererProps> = (props) => {
  return <CompositionRenderer {...props} />;
};

export default ClientOnlyCompositionRenderer;
