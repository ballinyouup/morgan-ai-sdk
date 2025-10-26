from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uvicorn
import asyncio
from datetime import datetime
import os

from agent_orchastrator import AIOrchestrator
app = FastAPI(
    title="Morgan AI Agent System",
    description="AI-powered legal case analysis and communication system",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize orchestrator
orchestrator = None

# In-memory task storage (use Redis/DB in production)
tasks: Dict[str, Dict[str, Any]] = {}


# Request/Response Models
class ProcessFilesRequest(BaseModel):
    user_request: str = Field(..., description="User's question or request")
    file_urls: List[str] = Field(..., description="List of file URLs to process")
    return_address: Optional[str] = Field(None, description="Optional return email address")
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_request": "What are the key facts of this case?",
                "file_urls": [
                    "https://simplylaw.s3.us-east-1.amazonaws.com/POLICE+REPORT+(1).pdf",
                    "https://simplylaw.s3.us-east-1.amazonaws.com/File+Notes.docx"
                ],
                "return_address": "attorney@lawfirm.com"
            }
        }


class ProcessFilesResponse(BaseModel):
    task_id: str
    status: str
    message: str


class TaskStatusResponse(BaseModel):
    task_id: str
    status: str
    created_at: str
    completed_at: Optional[str]
    result: Optional[Dict[str, Any]]
    error: Optional[str]


class HealthResponse(BaseModel):
    status: str
    timestamp: str
    orchestrator_ready: bool


# API Endpoints
@app.on_event("startup")
async def startup_event():
    global orchestrator
    try:
        orchestrator = AIOrchestrator()
        print("✅ AI Orchestrator initialized")
    except Exception as e:
        print(f"❌ Failed to initialize orchestrator: {e}")
        print("⚠️  Server starting without orchestrator - set GOOGLE_API_KEY environment variable")


@app.get("/", response_model=Dict[str, str])
async def root():
    return {
        "message": "Morgan AI Agent System API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }


@app.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(
        status="healthy",
        timestamp=datetime.now().isoformat(),
        orchestrator_ready=orchestrator is not None
    )


@app.post("/api/process", response_model=ProcessFilesResponse)
async def process_files(
    request: ProcessFilesRequest,
    background_tasks: BackgroundTasks
):
    if orchestrator is None:
        raise HTTPException(
            status_code=503,
            detail="Service unavailable: Orchestrator not initialized. Set GOOGLE_API_KEY environment variable."
        )
    
    # Validate request
    if not request.file_urls:
        raise HTTPException(status_code=400, detail="At least one file URL required")
    
    if not request.user_request:
        raise HTTPException(status_code=400, detail="User request is required")
    
    # Create task
    task_id = f"task_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{len(tasks)}"
    tasks[task_id] = {
        "id": task_id,
        "status": "processing",
        "created_at": datetime.now().isoformat(),
        "request": request.dict(),
        "result": None,
        "error": None,
        "completed_at": None
    }
    
    # Process in background
    background_tasks.add_task(process_task, task_id, request)
    
    return ProcessFilesResponse(
        task_id=task_id,
        status="processing",
        message=f"Task created. Processing {len(request.file_urls)} files."
    )


@app.get("/api/tasks/{task_id}", response_model=TaskStatusResponse)
async def get_task_status(task_id: str):
    if task_id not in tasks:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task = tasks[task_id]
    return TaskStatusResponse(
        task_id=task["id"],
        status=task["status"],
        created_at=task["created_at"],
        completed_at=task.get("completed_at"),
        result=task.get("result"),
        error=task.get("error")
    )


@app.get("/api/tasks", response_model=List[TaskStatusResponse])
async def list_tasks(limit: int = 10):
    task_list = list(tasks.values())[-limit:]
    return [
        TaskStatusResponse(
            task_id=task["id"],
            status=task["status"],
            created_at=task["created_at"],
            completed_at=task.get("completed_at"),
            result=task.get("result"),
            error=task.get("error")
        )
        for task in task_list
    ]


@app.post("/api/convert", response_model=Dict[str, Any])
async def convert_files(file_urls: List[str]):
    if orchestrator is None:
        raise HTTPException(
            status_code=503,
            detail="Service unavailable: Orchestrator not initialized"
        )
    
    if not file_urls:
        raise HTTPException(status_code=400, detail="At least one file URL required")
    
    try:
        file_contents = await orchestrator.convert_files(file_urls)
        return {
            "status": "success",
            "files_processed": len(file_contents),
            "files": file_contents
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Conversion failed: {str(e)}")


@app.delete("/api/tasks/{task_id}")
async def delete_task(task_id: str):
    if task_id not in tasks:
        raise HTTPException(status_code=404, detail="Task not found")
    
    del tasks[task_id]
    return {"status": "deleted", "task_id": task_id}


# Background task processor
async def process_task(task_id: str, request: ProcessFilesRequest):
    try:
        print(f"🚀 Starting task {task_id}")
        
        # Process through orchestrator
        result = await orchestrator.process_request(
            user_request=request.user_request,
            file_urls=request.file_urls,
            return_address=request.return_address
        )
        
        # Update task
        tasks[task_id]["status"] = "completed"
        tasks[task_id]["result"] = result
        tasks[task_id]["completed_at"] = datetime.now().isoformat()
        
        print(f"✅ Task {task_id} completed")
        
    except Exception as e:
        print(f"❌ Task {task_id} failed: {e}")
        tasks[task_id]["status"] = "failed"
        tasks[task_id]["error"] = str(e)
        tasks[task_id]["completed_at"] = datetime.now().isoformat()


# Error handlers
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return {
        "error": "Internal server error",
        "detail": str(exc),
        "timestamp": datetime.now().isoformat()
    }


# Development/Testing endpoints
@app.get("/api/test/file-urls")
async def get_test_file_urls():
    file_urls_path = "../frontend/file_urls.txt"
    
    if not os.path.exists(file_urls_path):
        return {
            "status": "not_found",
            "message": "file_urls.txt not found",
            "example_urls": [
                "https://simplylaw.s3.us-east-1.amazonaws.com/POLICE+REPORT+(1).pdf",
                "https://simplylaw.s3.us-east-1.amazonaws.com/File+Notes.docx"
            ]
        }
    
    with open(file_urls_path, 'r') as f:
        urls = [line.strip() for line in f if line.strip() and line.startswith('http')]
    
    return {
        "status": "success",
        "count": len(urls),
        "urls": urls
    }


@app.get("/api/test/scenarios")
async def get_test_scenarios():
    return {
        "scenarios": [
            {
                "name": "Case Analysis",
                "request": "Analyze this case and provide strategic recommendations",
                "file_urls": [
                    "https://simplylaw.s3.us-east-1.amazonaws.com/POLICE+REPORT+(1).pdf",
                    "https://simplylaw.s3.us-east-1.amazonaws.com/File+Notes.docx"
                ]
            },
            {
                "name": "Email Communication",
                "request": "Draft a professional email to the client explaining the settlement offer",
                "file_urls": [
                    "https://simplylaw.s3.us-east-1.amazonaws.com/Ltr+from+AutoOwners+with+offer+of+%2418k_Redacted.pdf"
                ]
            },
            {
                "name": "Document Review",
                "request": "Review these insurance documents and identify key coverage limits",
                "file_urls": [
                    "https://simplylaw.s3.us-east-1.amazonaws.com/INSURANCE-+POLICY+PROGRESSIVE++.pdf",
                    "https://simplylaw.s3.us-east-1.amazonaws.com/Progressive+Dec_Redacted.pdf"
                ]
            }
        ]
    }


# Main entry point
if __name__ == "__main__":
    print("""
    ╔═══════════════════════════════════════════════════════════╗
    ║        Morgan AI Agent System - API Server                ║
    ║                                                           ║
    ║  Workflow: API → Orchestrator → Doc → Sherlock → Com     ║
    ╚═══════════════════════════════════════════════════════════╝
    """)
    
    # Check for API key
    if not os.getenv("GOOGLE_API_KEY"):
        print("⚠️  WARNING: GOOGLE_API_KEY environment variable not set")
        print("    The server will start but won't be able to process requests")
        print("    Set it with: export GOOGLE_API_KEY='your-api-key'")
    else:
        print("✅ GOOGLE_API_KEY found")
    
    print("\n📡 Starting server on http://localhost:8000")
    print("📚 API documentation: http://localhost:8000/docs")
    print("🔧 Health check: http://localhost:8000/health\n")
    
    uvicorn.run(
        "api_server:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
