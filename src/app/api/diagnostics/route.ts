import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        // Get all content with URLs
        const content = await prisma.content.findMany({
            where: {
                OR: [
                    { type: 'IMAGE' },
                    { type: 'VIDEO' },
                    { type: 'COMPOSITION' }
                ]
            },
            select: {
                id: true,
                name: true,
                type: true,
                url: true,
                data: true
            }
        });

        // Check uploads directory
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
        let uploadedFiles: Array<{ name: string; size: number }> = [];
        let uploadsDirExists = false;
        
        try {
            uploadsDirExists = fs.existsSync(uploadsDir);
            if (uploadsDirExists) {
                const files = fs.readdirSync(uploadsDir);
                uploadedFiles = files.map(file => {
                    const filePath = path.join(uploadsDir, file);
                    const stats = fs.statSync(filePath);
                    return {
                        name: file,
                        size: stats.size
                    };
                });
            }
        } catch (e) {
            console.error('Error reading uploads directory:', e);
        }

        // Extract image URLs from compositions
        const compositionImages = content
            .filter(c => c.type === 'COMPOSITION' && c.data)
            .flatMap(c => {
                try {
                    if (!c.data) return [];
                    const parsed = JSON.parse(c.data);
                    const objects = parsed.fabric?.objects || parsed.objects || [];
                    return objects
                        .filter((obj: any) => obj.type === 'image' && obj.src)
                        .map((obj: any) => ({
                            contentId: c.id,
                            contentName: c.name,
                            src: obj.src
                        }));
                } catch (e) {
                    return [];
                }
            });

        return NextResponse.json({
            uploadsDir,
            uploadsDirExists,
            uploadedFiles,
            content: content.map(c => ({
                id: c.id,
                name: c.name,
                type: c.type,
                url: c.url
            })),
            compositionImages
        });
    } catch (error) {
        console.error('Diagnostics API error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch diagnostics' },
            { status: 500 }
        );
    }
}
