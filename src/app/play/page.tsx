import { prisma } from '@/lib/db';
import ScreenPicker from '@/components/ScreenPicker';
import styles from '@/components/screen-picker.module.css';
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "VenueOS - Player",
};

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
