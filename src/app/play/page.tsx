import { prisma } from '@/lib/db';
import ScreenPicker from '@/components/ScreenPicker';
import styles from '@/components/screen-picker.module.css';

export const dynamic = 'force-dynamic';

export default async function PlayIndexPage() {
    const screens = await prisma.screen.findMany({
        include: {
            space: {
                include: {
                    venue: true,
                },
            },
        },
        orderBy: { name: 'asc' },
    });

    return (
        <main className={styles.main}>
            <ScreenPicker screens={screens} />
        </main>
    );
}
