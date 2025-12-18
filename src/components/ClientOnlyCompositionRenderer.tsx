// src/components/ClientOnlyCompositionRenderer.tsx
import dynamic from 'next/dynamic';
import React from 'react';

const CompositionRenderer = dynamic(
  () => import('./CompositionRenderer'),
  { ssr: false }
);

interface ClientOnlyCompositionRendererProps {
  data: string;
  width?: number;
  height?: number;
  effect?: 'none' | 'snow' | 'rain';
  matrixRow?: number;
  matrixCol?: number;
  totalRows?: number;
  totalCols?: number;
}

const ClientOnlyCompositionRenderer: React.FC<ClientOnlyCompositionRendererProps> = (props) => {
  return <CompositionRenderer {...props} /> as any;
};

export default ClientOnlyCompositionRenderer;
