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
                phoneCalls: {
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

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { status } = body;

        if (!status) {
            return NextResponse.json(
                { error: "Status is required" },
                { status: 400 }
            );
        }

        // Validate status value
        const validStatuses = ['open', 'pending', 'closed', 'on-hold', 'active'];
        if (!validStatuses.includes(status)) {
            return NextResponse.json(
                { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
                { status: 400 }
            );
        }

        const updatedCase = await prisma.case.update({
            where: { id },
            data: { 
                status,
                lastActivity: new Date()
            },
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
                phoneCalls: {
                    orderBy: { createdAt: 'desc' }
                },
                reasonChains: {
                    orderBy: { timestamp: 'desc' }
                }
            }
        });

        return NextResponse.json(updatedCase);
    } catch (error) {
        console.error("Error updating case:", error);
        return NextResponse.json(
            { error: "Failed to update case" },
            { status: 500 }
        );
    }
}