import React, { createContext, useContext, useState, ReactNode } from 'react';
import { fabric } from 'fabric';

interface EditorContextType {
    canvas: fabric.Canvas | null;
    setCanvas: (canvas: fabric.Canvas) => void;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export const EditorProvider = ({ children }: { children: ReactNode }) => {
    const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);

    return (
        <EditorContext.Provider value={{ canvas, setCanvas }}>
            {children}
        </EditorContext.Provider>
    );
};

export const useEditor = () => {
    const context = useContext(EditorContext);
    if (context === undefined) {
        throw new Error('useEditor must be used within an EditorProvider');
    }
    return context;
};