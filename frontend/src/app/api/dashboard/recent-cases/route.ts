import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const recentCases = await prisma.case.findMany({
            where: { status: "active" },
            orderBy: { lastActivity: 'desc' },
            take: 3
        });

        return NextResponse.json(recentCases);
    } catch (error) {
        console.error("Error fetching recent cases:", error);
        return NextResponse.json(
            { error: "Failed to fetch recent cases" },
            { status: 500 }
        );
    }
}
