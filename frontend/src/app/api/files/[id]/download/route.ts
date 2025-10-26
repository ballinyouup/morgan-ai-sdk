import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Get file from database
        const file = await prisma.files.findUnique({
            where: { id }
        });

        if (!file) {
            return NextResponse.json(
                { error: "File not found" },
                { status: 404 }
            );
        }

        if (!file.url) {
            return NextResponse.json(
                { error: "File URL not available" },
                { status: 404 }
            );
        }

        // Fetch the file from S3 and proxy it through our API
        // This avoids CORS issues and access denied errors
        const fileResponse = await fetch(file.url);

        if (!fileResponse.ok) {
            console.error(`Failed to fetch file from S3: ${fileResponse.status} ${fileResponse.statusText}`);
            return NextResponse.json(
                { error: "Failed to fetch file from storage" },
                { status: 502 }
            );
        }

        // Get the file content
        const fileBlob = await fileResponse.blob();
        const buffer = Buffer.from(await fileBlob.arrayBuffer());

        // Determine content type
        const contentType = fileResponse.headers.get('content-type') || 'application/octet-stream';

        // Return the file with proper headers
        return new NextResponse(buffer, {
            headers: {
                'Content-Type': contentType,
                'Content-Disposition': `attachment; filename="${file.name}"`,
                'Cache-Control': 'public, max-age=3600',
            },
        });
    } catch (error) {
        console.error("Error downloading file:", error);
        return NextResponse.json(
            { error: "Failed to download file" },
            { status: 500 }
        );
    }
}
