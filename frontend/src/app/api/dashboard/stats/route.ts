import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        // Get total cases count
        const totalCases = await prisma.case.count();

        // Get active cases count
        const activeCases = await prisma.case.count({
            where: { status: "active" }
        });

        // Get pending actions count (reason chains without a specific status field)
        // We'll count all reason chains as potential actions
        const pendingActions = await prisma.reasonChain.count();

        // Get recent communications (emails from last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const recentCommunications = await prisma.email.count({
            where: {
                createdAt: {
                    gte: sevenDaysAgo
                }
            }
        });

        return NextResponse.json({
            totalCases,
            activeCases,
            pendingActions,
            recentCommunications
        });
    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        return NextResponse.json(
            { error: "Failed to fetch dashboard stats" },
            { status: 500 }
        );
    }
}
