import { prisma } from '@/lib/db';
import ContentList from '@/components/ContentList';
import styles from '@/components/content-list.module.css';

export const dynamic = 'force-dynamic';

export default async function MediaPage() {
    const content = await prisma.content.findMany({
        orderBy: { updatedAt: 'desc' },
    });

    return (
        <div className={styles.container}>
            <ContentList
                initialContent={content}
                allowedTypes={['IMAGE', 'VIDEO', 'WEBSITE', 'MENU_HTML']}
            />
        </div>
    );
}
