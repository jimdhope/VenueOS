// src/components/ClientOnlyCompositionPreview.tsx
import dynamic from 'next/dynamic';
import React from 'react';

const CompositionPreview = dynamic(
  () => import('./CompositionPreview'),
  { ssr: false }
);

interface ClientOnlyCompositionPreviewProps {
  data: string;
}

const ClientOnlyCompositionPreview: React.FC<ClientOnlyCompositionPreviewProps> = ({ data }) => {
  return <CompositionPreview data={data} />;
};

export default ClientOnlyCompositionPreview;
