import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { phoneNumber, message, statusUpdate } = body;

        if (!phoneNumber || !message) {
            return NextResponse.json(
                { error: "phoneNumber and message are required" },
                { status: 400 }
            );
        }

        // Get current case status before update
        const currentCase = await prisma.case.findUnique({
            where: { id },
            select: { status: true }
        });
        const statusBeforeCall = currentCase?.status;

        // Update case status if provided
        if (statusUpdate) {
            await prisma.case.update({
                where: { id },
                data: {
                    status: statusUpdate,
                    lastActivity: new Date()
                }
            });
        }

        // Make the Twilio API call
        // Use environment variable for API URL to avoid DNS blocks
        const twilioApiUrl = process.env.TWILIO_API_URL || "https://api.simplylaw.us";
        
        // Note: Railway's SSL certificate might not be in the default trust store
        // Temporarily disable SSL verification for this request
        const originalNodeTlsRejectUnauthorized = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
        
        let twilioData;
        try {
            const twilioResponse = await fetch(`${twilioApiUrl}/make-call`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    phoneNumber,
                    message,
                }),
            });

            // Restore SSL verification
            process.env.NODE_TLS_REJECT_UNAUTHORIZED = originalNodeTlsRejectUnauthorized;

            if (!twilioResponse.ok) {
                const responseText = await twilioResponse.text();
                console.error("Twilio API error response:", responseText);
                throw new Error(`Failed to initiate call: ${twilioResponse.status} ${twilioResponse.statusText}`);
            }

            const responseText = await twilioResponse.text();
            console.log("Twilio API response:", responseText);
            
            try {
                twilioData = JSON.parse(responseText);
            } catch (parseError) {
                console.error("Failed to parse Twilio response as JSON:", responseText);
                throw new Error(`Invalid response from Twilio API: ${responseText.substring(0, 100)}`);
            }
        } catch (fetchError) {
            // Restore SSL verification in case of error
            process.env.NODE_TLS_REJECT_UNAUTHORIZED = originalNodeTlsRejectUnauthorized;
            throw fetchError;
        }

        // Create phone call record
        await prisma.phoneCall.create({
            data: {
                caseId: id,
                phoneNumber,
                message,
                callSid: twilioData.callSid,
                status: "initiated",
                statusBeforeCall,
                statusAfterCall: statusUpdate || statusBeforeCall
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
            callSid: twilioData.callSid,
            message: "Call initiated successfully",
            case: updatedCase
        });
    } catch (error) {
        console.error("Error making call:", error);
        return NextResponse.json(
            { 
                error: "Failed to initiate call", 
                details: error instanceof Error ? error.message : "Unknown error"
            },
            { status: 500 }
        );
    }
}
