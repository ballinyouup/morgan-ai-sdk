import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const pendingActions = await prisma.reasonChain.findMany({
            orderBy: { timestamp: 'desc' },
            take: 3,
            include: {
                case: {
                    select: {
                        id: true,
                        clientName: true,
                        caseType: true
                    }
                }
            }
        });

        return NextResponse.json(pendingActions);
    } catch (error) {
        console.error("Error fetching pending actions:", error);
        return NextResponse.json(
            { error: "Failed to fetch pending actions" },
            { status: 500 }
        );
    }
}
