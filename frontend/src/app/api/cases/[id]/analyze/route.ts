import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { userRequest, fileUrls } = body;

    if (!userRequest || !fileUrls || !Array.isArray(fileUrls)) {
      return NextResponse.json(
        { error: "userRequest and fileUrls array are required" },
        { status: 400 }
      );
    }

    // Verify case exists
    const case_ = await prisma.case.findUnique({
      where: { id },
      include: {
        files: true,
      },
    });

    if (!case_) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    // Call Python AI Orchestrator with longer timeout
    const pythonBackendUrl = process.env.PYTHON_BACKEND_URL || "http://localhost:8000";
    
    // Create AbortController with 5 minute timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5 * 60 * 1000); // 5 minutes
    
    try {
      const orchestratorResponse = await fetch(`${pythonBackendUrl}/api/orchestrator/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_request: userRequest,
          file_urls: fileUrls,
          case_id: id,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!orchestratorResponse.ok) {
        throw new Error(`Orchestrator returned ${orchestratorResponse.status}`);
      }

      const analysisResult = await orchestratorResponse.json();

    // Sanitize strings to remove null bytes that PostgreSQL can't handle
    const sanitizeString = (str: string): string => {
      if (!str) return str;
      return str.replace(/\u0000/g, '');
    };

    const sanitizeObject = (obj: any): any => {
      if (typeof obj === 'string') {
        return sanitizeString(obj);
      }
      if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
      }
      if (obj && typeof obj === 'object') {
        const sanitized: any = {};
        for (const [key, value] of Object.entries(obj)) {
          sanitized[key] = sanitizeObject(value);
        }
        return sanitized;
      }
      return obj;
    };

    const sanitizedResult = sanitizeObject(analysisResult);

    // Store the analysis result as a ReasonChain entry
    const reasonChain = await prisma.reasonChain.create({
      data: {
        caseId: id,
        agentType: sanitizedResult.agent_type || "orchestrator",
        action: "AI Case Analysis",
        reasoning: sanitizeString(sanitizedResult.response || JSON.stringify(sanitizedResult)),
        status: "approved",
        impact: "high",
        confidence: 0.85,
        data: sanitizedResult,
      },
    });

    // Store AI-generated tasks if present
    let createdTasks = [];
    if (sanitizedResult.analysis?.tasks && Array.isArray(sanitizedResult.analysis.tasks)) {
      for (const task of sanitizedResult.analysis.tasks) {
        const aiTask = await prisma.aITask.create({
          data: {
            caseId: id,
            title: sanitizeString(task.title || "Untitled Task"),
            description: sanitizeString(task.description || ""),
            priority: task.priority || "medium",
            category: task.category || "follow-up",
            estimatedTime: task.estimatedTime ? sanitizeString(task.estimatedTime) : null,
            reasoning: task.reasoning ? sanitizeString(task.reasoning) : null,
            createdBy: sanitizedResult.agent_type || "orchestrator",
            relatedTo: reasonChain.id,
          },
        });
        createdTasks.push(aiTask);
      }
    }

    // Update case lastActivity
    await prisma.case.update({
      where: { id },
      data: { lastActivity: new Date() },
    });

      return NextResponse.json({
        success: true,
        analysis: sanitizedResult,
        reasonChainId: reasonChain.id,
        tasksCreated: createdTasks.length,
        tasks: createdTasks,
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        return NextResponse.json(
          { error: "Analysis timed out after 5 minutes. Please try with fewer files or a simpler request." },
          { status: 504 }
        );
      }
      throw fetchError;
    }
  } catch (error) {
    console.error("Error analyzing case:", error);
    return NextResponse.json(
      { error: "Failed to analyze case", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve past analyses
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const analyses = await prisma.reasonChain.findMany({
      where: {
        caseId: id,
        agentType: {
          in: ["orchestrator", "docu", "sherlock", "client_coms", "analysis"],
        },
      },
      orderBy: { timestamp: "desc" },
    });

    return NextResponse.json(analyses);
  } catch (error) {
    console.error("Error fetching analyses:", error);
    return NextResponse.json(
      { error: "Failed to fetch analyses" },
      { status: 500 }
    );
  }
}
