import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
    request: Request,
    context: { params: Promise<{ path: string[] }> }
) {
    try {
        console.log('=== UPLOADS ROUTE HIT ===');
        console.log('Request URL:', request.url);
        
        const params = await context.params;
        console.log('Params:', params);
        
        const filePath = params.path.join('/');
        console.log('Requested file path:', filePath);
        
        const fullPath = path.join(process.cwd(), 'public', 'uploads', filePath);
        console.log('Full path:', fullPath);

        // Security check - ensure the path is within uploads directory
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
        const normalizedFullPath = path.normalize(fullPath);
        const normalizedUploadsDir = path.normalize(uploadsDir);
        
        console.log('Normalized full path:', normalizedFullPath);
        console.log('Normalized uploads dir:', normalizedUploadsDir);
        
        if (!normalizedFullPath.startsWith(normalizedUploadsDir)) {
            console.log('Security check failed - path outside uploads directory');
            return new NextResponse('Forbidden', { status: 403 });
        }

        // Check if file exists
        if (!fs.existsSync(fullPath)) {
            console.log('❌ File not found:', fullPath);
            
            // List files in the directory to help debug
            try {
                const files = fs.readdirSync(uploadsDir);
                console.log('Available files in uploads:', files);
            } catch (e) {
                console.log('Could not list uploads directory:', e);
            }
            
            return new NextResponse('File not found', { status: 404 });
        }

        console.log('✅ File found, reading...');
        
        // Read the file
        const fileBuffer = fs.readFileSync(fullPath);
        console.log('File size:', fileBuffer.length, 'bytes');
        
        // Determine content type based on extension
        const ext = path.extname(filePath).toLowerCase();
        const contentTypeMap: Record<string, string> = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp',
            '.svg': 'image/svg+xml',
            '.mp4': 'video/mp4',
            '.webm': 'video/webm',
            '.mov': 'video/quicktime',
        };

        const contentType = contentTypeMap[ext] || 'application/octet-stream';
        console.log('Content-Type:', contentType);
        console.log('=== UPLOADS ROUTE SUCCESS ===');

        return new NextResponse(fileBuffer, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000, immutable',
                'Access-Control-Allow-Origin': '*',
            },
        });
    } catch (error) {
        console.error('❌ Error serving file:', error);
        return new NextResponse(`Internal Server Error: ${error}`, { status: 500 });
    }
}
