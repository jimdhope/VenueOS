'use client';

import { useState, useEffect } from 'react';
import { getContent, deleteContent } from '@/app/actions/content';
import ContentList from '@/components/ContentList';
import AdminPageLayout from '@/components/AdminPageLayout';
import { useRouter } from 'next/navigation';

type Content = any;

export default function LayoutsPage() {
    const [content, setContent] = useState<Content[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const router = useRouter();

    const fetchData = () => {
        getContent().then(setContent);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreateComposition = () => {
        router.push('/admin/content/editor/new');
    };

    const handleEdit = (c: Content) => {
        router.push(`/admin/content/editor/${c.id}`);
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
            <button onClick={handleCreateComposition} className="btn btn-primary">
                + New Layout
            </button>
        </div>
    );

    return (
        <AdminPageLayout title="Layouts" actions={actions}>
            <ContentList
                initialContent={content}
                allowedTypes={['COMPOSITION']}
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
        </AdminPageLayout>
    );
}