'use client';

import { useState, useEffect } from 'react';
import { getContent, deleteContent } from '@/app/actions/content';
import ContentList from '@/components/ContentList';
import AdminPageLayout from '@/components/AdminPageLayout';
import ContentModal from '@/components/ContentModal';
import { useRouter } from 'next/navigation';
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "VenueOS - Media Library",
};

type Content = any;

export default function MediaPage() {
    const [content, setContent] = useState<Content[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedContent, setSelectedContent] = useState<Content | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const router = useRouter();

    const fetchData = () => {
        getContent().then(setContent);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreate = () => {
        setSelectedContent(null);
        setIsModalOpen(true);
    };

    const handleEdit = (c: Content) => {
        if (c.type === 'COMPOSITION') {
            router.push(`/admin/content/editor/${c.id}`);
            return;
        }
        setSelectedContent(c);
        setIsModalOpen(true);
    };
    
    const handleCreateComposition = () => {
        router.push('/admin/content/editor/new');
    };

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;
        if (!confirm(`Delete ${selectedIds.size} item(s)? This cannot be undone.`)) return;

        for (const id of selectedIds) {
            await deleteContent(id);
        }
        setSelectedIds(new Set());
        fetchData();
    };

    const actions = (
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {selectedIds.size > 0 && (
                <button onClick={handleBulkDelete} className="btn btn-danger">
                    Delete {selectedIds.size}
                </button>
            )}
            <button onClick={handleCreateComposition} className="btn btn-secondary">
                + New Composition
            </button>
            <button onClick={handleCreate} className="btn btn-primary">
                + Add Asset
            </button>
        </div>
    );

    return (
        <AdminPageLayout title="Media Library" actions={actions}>
            <ContentList
                initialContent={content}
                allowedTypes={['IMAGE', 'VIDEO', 'WEBSITE', 'MENU_HTML']}
                selectedIds={selectedIds}
                setSelectedIds={setSelectedIds}
                onEdit={handleEdit}
                onDelete={async (id) => {
                    if (confirm('Are you sure you want to delete this content?')) {
                        await deleteContent(id);
                        fetchData();
                    }
                }}
            />
            <ContentModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    fetchData();
                }}
                content={selectedContent}
            />
        </AdminPageLayout>
    );
}