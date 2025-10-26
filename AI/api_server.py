"""
FastAPI server for AI Orchestrator

Exposes the orchestrator through REST API endpoints.
"""

import os
import sys
from pathlib import Path
from typing import List, Optional
from fastapi import FastAPI, HTTPException, File, UploadFile, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import asyncio
import json
from datetime import datetime

# Add project root to path
project_root = Path(__file__).parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

from AI.agent_orchastrator import AgentOrchestrator

# Initialize FastAPI app
app = FastAPI(
    title="LexiLoop AI Orchestrator API",
    description="Multi-agent AI system for legal case processing",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize orchestrator (singleton)
orchestrator = None


@app.on_event("startup")
async def startup_event():
    """Initialize orchestrator on startup."""
    global orchestrator
    print("\n🚀 Starting AI Orchestrator API...")
    orchestrator = AgentOrchestrator()
    print("✅ Orchestrator initialized and ready\n")


# Request models
class ChatRequest(BaseModel):
    message: str
    user_id: str = "default_user"
    session_id: Optional[str] = None
    case_folder: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "message": "Analyze this case and recommend a settlement strategy",
                "user_id": "user123",
                "session_id": "session001",
                "case_folder": "/path/to/case/folder"
            }
        }


class DocumentProcessingRequest(BaseModel):
    case_folder: str
    user_id: str = "default_user"
    session_id: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "case_folder": "/path/to/case/folder",
                "user_id": "user123",
                "session_id": "session001"
            }
        }


class AnalysisRequest(BaseModel):
    question: str
    case_folder: Optional[str] = None
    max_iterations: int = 10
    user_id: str = "default_user"
    session_id: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "question": "What settlement strategy should we pursue?",
                "case_folder": "/path/to/case/folder",
                "max_iterations": 10,
                "user_id": "user123",
                "session_id": "session001"
            }
        }


# Response models
class APIResponse(BaseModel):
    success: bool
    data: dict
    timestamp: str
    error: Optional[str] = None


# Endpoints
@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "status": "online",
        "service": "LexiLoop AI Orchestrator",
        "version": "1.0.0",
        "agents": {
            "doc_agent": "ready",
            "sherlock_agent": "ready",
            "coms_agent": "ready",
            "orchestrator": "ready"
        }
    }


@app.post("/api/chat", response_model=APIResponse)
async def chat(request: ChatRequest):
    """
    General chat endpoint that routes to appropriate agent(s) based on intent.
    
    This is the main entry point for most requests. The orchestrator will
    analyze the message and route to the best agent(s) automatically.
    """
    try:
        # Generate session ID if not provided
        session_id = request.session_id or f"session_{datetime.now().timestamp()}"
        
        # Prepare orchestrator input
        orchestrator_input = {
            "message": request.message,
            "case_folder": request.case_folder,
            "ID": {
                "userid": request.user_id,
                "sessionid": session_id
            }
        }
        
        # Process through orchestrator
        result = await orchestrator.process_request(orchestrator_input)
        
        return APIResponse(
            success=True,
            data=result,
            timestamp=datetime.now().isoformat()
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/process-documents", response_model=APIResponse)
async def process_documents(request: DocumentProcessingRequest):
    """
    Process documents in a case folder.
    
    Routes directly to Doc Agent for document processing without analysis.
    """
    try:
        session_id = request.session_id or f"session_{datetime.now().timestamp()}"
        
        # Check if case folder exists
        if not os.path.exists(request.case_folder):
            raise HTTPException(status_code=404, detail=f"Case folder not found: {request.case_folder}")
        
        # Route to doc agent
        result = orchestrator.route_to_doc_agent(case_folder=request.case_folder)
        
        return APIResponse(
            success=True,
            data=result,
            timestamp=datetime.now().isoformat()
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/analyze", response_model=APIResponse)
async def analyze(request: AnalysisRequest):
    """
    Perform strategic analysis using collaborative mode (Doc + Sherlock).
    
    Routes to collaborative mode for complex analysis requiring multiple perspectives.
    """
    try:
        session_id = request.session_id or f"session_{datetime.now().timestamp()}"
        
        # Check case folder if provided
        if request.case_folder and not os.path.exists(request.case_folder):
            raise HTTPException(status_code=404, detail=f"Case folder not found: {request.case_folder}")
        
        # Route to collaborative mode
        result = orchestrator.route_to_collaborative_mode(
            user_question=request.question,
            case_folder=request.case_folder,
            max_iterations=request.max_iterations
        )
        
        return APIResponse(
            success=True,
            data=result,
            timestamp=datetime.now().isoformat()
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/draft-communication", response_model=APIResponse)
async def draft_communication(
    message: str = Body(..., embed=True),
    context: str = Body("", embed=True),
    user_id: str = Body("default_user", embed=True),
    session_id: Optional[str] = Body(None, embed=True)
):
    """
    Draft client communication (email, text, etc).
    
    Routes directly to Coms Agent for communication drafting.
    """
    try:
        session_id = session_id or f"session_{datetime.now().timestamp()}"
        
        # Route to coms agent
        result = orchestrator.route_to_coms_agent(
            user_message=message,
            context=context
        )
        
        return APIResponse(
            success=True,
            data=result,
            timestamp=datetime.now().isoformat()
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/agents")
async def list_agents():
    """List all available agents and their capabilities."""
    return {
        "agents": [
            {
                "name": "orchestrator",
                "description": "Master router that directs requests to appropriate agents",
                "capabilities": [
                    "Intent analysis",
                    "Request routing",
                    "Agent coordination",
                    "Response aggregation"
                ]
            },
            {
                "name": "doc_agent",
                "description": "Document processor and logical analyst",
                "capabilities": [
                    "PDF text extraction",
                    "Image OCR",
                    "Audio transcription",
                    "Document classification",
                    "Key information extraction"
                ]
            },
            {
                "name": "sherlock_agent",
                "description": "Strategic analyst and investigator",
                "capabilities": [
                    "Pattern recognition",
                    "Case analysis",
                    "Strategic recommendations",
                    "Settlement evaluation",
                    "Evidence assessment"
                ]
            },
            {
                "name": "coms_agent",
                "description": "Client communication handler",
                "capabilities": [
                    "Email drafting",
                    "Text message composition",
                    "Portal messages",
                    "Sentiment analysis",
                    "Multi-channel communication"
                ]
            }
        ]
    }


@app.get("/api/test-cases")
async def list_test_cases():
    """List available test cases."""
    test_data_path = Path(__file__).parent / "data" / "test"
    
    if not test_data_path.exists():
        return {"test_cases": []}
    
    test_cases = []
    for case_dir in test_data_path.iterdir():
        if case_dir.is_dir() and not case_dir.name.startswith('.'):
            # Count files in case
            file_count = sum(1 for f in case_dir.rglob('*') if f.is_file() and not f.name.startswith('.'))
            
            test_cases.append({
                "name": case_dir.name,
                "path": str(case_dir),
                "file_count": file_count
            })
    
    return {"test_cases": test_cases}


@app.get("/api/health")
async def health_check():
    """Detailed health check."""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "components": {
            "orchestrator": "operational",
            "doc_agent": "operational",
            "sherlock_agent": "operational",
            "coms_agent": "operational"
        },
        "api_version": "1.0.0"
    }


# Run server
if __name__ == "__main__":
    import uvicorn
    
    print("\n" + "="*80)
    print("🚀 STARTING LEXILOOP AI ORCHESTRATOR API")
    print("="*80)
    print("\nDocumentation will be available at: http://localhost:8000/docs")
    print("Interactive API testing at: http://localhost:8000/redoc")
    print("\n" + "="*80 + "\n")
    
    uvicorn.run(
        "api_server:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
