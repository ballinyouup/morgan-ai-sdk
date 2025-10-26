import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const lawCase = await prisma.case.findUnique({
            where: { id },
            include: {
                emails: {
                    orderBy: { createdAt: 'desc' }
                },
                files: {
                    orderBy: { uploadedAt: 'desc' }
                },
                textMessages: {
                    orderBy: { createdAt: 'desc' }
                },
                reasonChains: {
                    orderBy: { timestamp: 'desc' }
                }
            }
        });

        if (!lawCase) {
            return NextResponse.json(
                { error: "Case not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(lawCase);
    } catch (error) {
        console.error("Error fetching case:", error);
        return NextResponse.json(
            { error: "Failed to fetch case" },
            { status: 500 }
        );
    }
}