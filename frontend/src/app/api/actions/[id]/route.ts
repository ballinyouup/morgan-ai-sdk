import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { status } = body;

        if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
            return NextResponse.json(
                { error: "Invalid status. Must be 'pending', 'approved', or 'rejected'" },
                { status: 400 }
            );
        }

        const updatedAction = await prisma.reasonChain.update({
            where: { id },
            data: { status },
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

        // Transform to match the expected format
        const formattedAction = {
            id: updatedAction.id,
            caseId: updatedAction.caseId,
            caseName: `${updatedAction.case.clientName} - ${updatedAction.case.caseType}`,
            actionType: updatedAction.action,
            description: updatedAction.action,
            suggestedBy: updatedAction.agentType,
            status: updatedAction.status,
            createdAt: updatedAction.timestamp.toISOString(),
            reasoning: updatedAction.reasoning,
            impact: updatedAction.impact,
            confidence: updatedAction.confidence,
            case: updatedAction.case
        };

        return NextResponse.json(formattedAction);
    } catch (error) {
        console.error("Error updating action:", error);
        return NextResponse.json(
            { error: "Failed to update action" },
            { status: 500 }
        );
    }
}
