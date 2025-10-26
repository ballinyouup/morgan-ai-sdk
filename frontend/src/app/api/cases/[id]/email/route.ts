import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { to, subject, content, from } = body;

        if (!to || !subject || !content) {
            return NextResponse.json(
                { error: "to, subject, and content are required" },
                { status: 400 }
            );
        }

        // Send email via Resend
        const { data: emailData, error: resendError } = await resend.emails.send({
            from: from || process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
            to: [to],
            subject: subject,
            html: content.replace(/\n/g, '<br>'),
        });

        if (resendError) {
            console.error("Resend error:", resendError);
            throw new Error(resendError.message || "Failed to send email");
        }

        console.log("Email sent successfully:", emailData);

        // Save email to database
        await prisma.email.create({
            data: {
                caseId: id,
                from: from || process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
                to,
                subject,
                content,
            }
        });

        // Update case last activity
        await prisma.case.update({
            where: { id },
            data: {
                lastActivity: new Date()
            }
        });

        // Get updated case data
        const updatedCase = await prisma.case.findUnique({
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

        return NextResponse.json({
            success: true,
            emailId: emailData?.id,
            message: "Email sent successfully",
            case: updatedCase
        });
    } catch (error) {
        console.error("Error sending email:", error);
        return NextResponse.json(
            { 
                error: "Failed to send email", 
                details: error instanceof Error ? error.message : "Unknown error"
            },
            { status: 500 }
        );
    }
}
