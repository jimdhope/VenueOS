'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';

const ContentSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    type: z.enum(['IMAGE', 'VIDEO', 'WEBSITE', 'MENU_HTML', 'COMPOSITION']),
    url: z.string().optional(),
    body: z.string().optional(),
    data: z.string().optional(), // JSON string
    duration: z.coerce.number().min(1, 'Duration must be at least 1 second').default(10),
});

async function handleUploadFromForm(formData: FormData): Promise<string | undefined> {
    try {
        const file = formData.get('file');
        if (!file || typeof file === 'string') return undefined;
        // In Next.js server actions, this will be a File-like object
        if ((file as any).size === 0) return undefined;

        const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const originalName = (file as any).name || 'upload';
        const safeName = String(originalName).replace(/[^a-zA-Z0-9.\-_]/g, '_');
        const fileName = `${Date.now()}-${safeName}`;
        const filePath = path.join(uploadsDir, fileName);
        const arrayBuffer = await (file as any).arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        await fs.promises.writeFile(filePath, buffer);

        // This URL will be served from Next's public/ directory
        return `/uploads/${fileName}`;
    } catch (err) {
        console.error('Failed to handle file upload in create/update content:', err);
        return undefined;
    }
}

export async function createContent(prevState: any, formData: FormData) {
    // Decide final URL: uploaded file URL takes precedence over text URL
    const uploadedUrl = await handleUploadFromForm(formData);
    const rawUrl = formData.get('url');

    const rawData = {
        name: formData.get('name'),
        type: formData.get('type'),
        url: (uploadedUrl || (!rawUrl || rawUrl === '' ? undefined : rawUrl)) as string | undefined,
        body: formData.get('body') || undefined,
        data: formData.get('data') || undefined,
        duration: formData.get('duration') === '' ? undefined : formData.get('duration'),
    };
    console.log('DEBUG: createContent rawData:', JSON.stringify(rawData, null, 2));

    const validatedFields = ContentSchema.safeParse(rawData);

    if (!validatedFields.success) {
        console.log('DEBUG: Validation errors:', validatedFields.error.flatten().fieldErrors);
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing Fields. Failed to Create Content.',
        };
    }

    const { name, type, url, body, data, duration } = validatedFields.data;

    // Basic validation based on type
    if ((type === 'IMAGE' || type === 'VIDEO' || type === 'WEBSITE') && !url) {
        return {
            message: 'A URL or uploaded file is required for Image, Video, or Website content.',
        };
    }

    if (type === 'MENU_HTML' && !body) {
        return {
            message: 'HTML Body is required for Menu content.',
        };
    }

    try {
        console.log('DEBUG: Attempting Raw SQL Create...');
        // Workaround for stale Prisma Client not seeing 'data' column
        const id = crypto.randomUUID();
        const now = new Date().toISOString();

        await prisma.$executeRawUnsafe(
            `INSERT INTO "Content" ("id", "name", "type", "url", "body", "data", "duration", "createdAt", "updatedAt") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            id,
            name,
            type,
            url || null,
            body || null,
            data || null,
            duration,
            now,
            now
        );
        console.log('DEBUG: Raw SQL Create Success:', id);
        return { success: true, message: 'Content created successfully.' };
    } catch (error) {
        console.error('DEBUG: Prisma Create Error:', error);
        return {
            message: 'Database Error: Failed to Create Content.',
        };
    }

    revalidatePath('/admin/layouts');
    revalidatePath('/admin/media');
    return { success: true, message: 'Content created successfully.' };
}

export async function updateContent(
    id: string,
    prevState: any,
    formData: FormData
) {
    const uploadedUrl = await handleUploadFromForm(formData);
    const rawUrl = formData.get('url');

    const validatedFields = ContentSchema.safeParse({
        name: formData.get('name'),
        type: formData.get('type'),
        url: (uploadedUrl || (!rawUrl || rawUrl === '' ? undefined : rawUrl)) as string | undefined,
        body: formData.get('body') || undefined,
        data: formData.get('data') || undefined,
        duration: formData.get('duration') === '' ? undefined : formData.get('duration'),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing Fields. Failed to Update Content.',
        };
    }

    const { name, type, url, body, data, duration } = validatedFields.data;

    try {
        const now = new Date().toISOString();
        await prisma.$executeRawUnsafe(
            `UPDATE "Content" SET "name" = ?, "type" = ?, "url" = ?, "body" = ?, "data" = ?, "duration" = ?, "updatedAt" = ? WHERE "id" = ?`,
            name,
            type,
            url || null,
            body || null,
            data || null,
            duration,
            now,
            id
        );
    } catch (error) {
        return {
            message: 'Database Error: Failed to Update Content.',
        };
    }

    revalidatePath('/admin/layouts');
    revalidatePath('/admin/media');
    return { success: true, message: 'Content updated successfully.' };
}

// Simple variants suitable for direct form actions (no form state tracking)
export async function createContentDirect(formData: FormData): Promise<void> {
    await createContent({}, formData);
}

export async function updateContentDirect(formData: FormData): Promise<void> {
    await updateContentAction({}, formData);
}

// Wrapper suitable for useFormState when editing content
export async function updateContentAction(
    prevState: any,
    formData: FormData
) {
    const id = formData.get('id');
    if (!id || typeof id !== 'string') {
        return {
            message: 'Missing content id.',
        };
    }
    return updateContent(id, prevState, formData);
}

export async function deleteContent(id: string) {
    try {
        await prisma.content.delete({
            where: { id },
        });
        revalidatePath('/admin/layouts');
        revalidatePath('/admin/media');
        return { message: 'Content deleted.' };
    } catch (error) {
        return { message: 'Database Error: Failed to Delete Content.' };
    }
}

export async function getMediaAssets() {
    try {
        const media = await prisma.content.findMany({
            where: {
                type: {
                    in: ['IMAGE', 'VIDEO']
                }
            },
            orderBy: { updatedAt: 'desc' }
        });
        return media;
    } catch (error) {
        console.error('Failed to fetch media:', error);
        return [];
    }
}
