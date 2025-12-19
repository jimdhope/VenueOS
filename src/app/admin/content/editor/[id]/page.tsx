import { prisma } from '@/lib/db';
import EditorMain from '@/components/editor/EditorMain';
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "VenueOS - Content Editor",
};

export default async function EditorPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    let initialData = null;

    if (id !== 'new') {
        // Use Raw SQL to bypass Prisma Client staleness for the 'data' column
        const result = await prisma.$queryRawUnsafe<any[]>(
            `SELECT * FROM "Content" WHERE "id" = ? LIMIT 1`,
            id
        );

        if (result && result.length > 0) {
            initialData = result[0];
        }
    }

    return <EditorMain contentId={id} initialData={initialData} />;
    // return <div>Test Editor Page Loaded. ID: {id}</div>;
}
