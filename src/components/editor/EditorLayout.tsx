import React, { ReactNode } from 'react';

interface EditorLayoutProps {
    sidebar: ReactNode;
    canvas: ReactNode;
    properties: ReactNode;
}

const EditorLayout: React.FC<EditorLayoutProps> = ({ sidebar, canvas, properties }) => {
    return (
        <div style={{ display: 'flex', height: '100%' }}>
            <div style={{ width: '250px', borderRight: '1px solid #27272a', overflowY: 'auto' }}>
                {sidebar}
            </div>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                {canvas}
            </div>
            <div style={{ width: '250px', borderLeft: '1px solid #27272a', overflowY: 'auto' }}>
                {properties}
            </div>
        </div>
    );
};

export default EditorLayout;