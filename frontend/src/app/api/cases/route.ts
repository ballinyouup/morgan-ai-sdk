import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const cases = await prisma.case.findMany({
            orderBy: { lastActivity: 'desc' },
            include: {
                emails: {
                    select: { id: true }
                },
                files: {
                    select: { id: true }
                },
                reasonChains: {
                    select: { id: true }
                }
            }
        });

        return NextResponse.json(cases);
    } catch (error) {
        console.error("Error fetching cases:", error);
        return NextResponse.json(
            { error: "Failed to fetch cases" },
            { status: 500 }
        );
    }
}
