import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        // Fetch all emails with case information
        const emails = await prisma.email.findMany({
            orderBy: { createdAt: 'desc' },
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

        // Fetch all text messages with case information
        const textMessages = await prisma.textMessage.findMany({
            orderBy: { createdAt: 'desc' },
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

        // Transform emails to communication format
        const emailCommunications = emails.map(email => ({
            id: email.id,
            caseId: email.caseId,
            caseName: `${email.case.clientName} - ${email.case.caseType}`,
            type: 'email' as const,
            subject: email.subject,
            from: email.from,
            to: email.to,
            date: email.createdAt.toISOString(),
            content: email.content,
            case: email.case
        }));

        // Transform text messages to communication format
        const textCommunications = textMessages.map(msg => ({
            id: msg.id,
            caseId: msg.caseId,
            caseName: `${msg.case.clientName} - ${msg.case.caseType}`,
            type: 'sms' as const,
            subject: `SMS: ${msg.from} → ${msg.to}`,
            from: msg.from,
            to: msg.to,
            date: msg.createdAt.toISOString(),
            content: msg.text,
            case: msg.case
        }));

        // Combine and sort by date
        const allCommunications = [...emailCommunications, ...textCommunications]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return NextResponse.json(allCommunications);
    } catch (error) {
        console.error("Error fetching communications:", error);
        return NextResponse.json(
            { error: "Failed to fetch communications" },
            { status: 500 }
        );
    }
}
