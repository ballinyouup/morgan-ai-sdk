# AI Agents Architecture Design

## Overview
This document describes the multi-agent architecture for LexiLoop, a legal case processing system that uses specialized AI agents to handle document processing, analysis, and client communication.

## Architecture Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         INPUT LAYER                              │
│  Files: PDF, Audio, Images, Text, etc.                          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CONVERSION LAYER                              │
│  Convert all inputs to text format                               │
│  - PDF → Text extraction                                         │
│  - Audio → Speech-to-text                                        │
│  - Images → OCR                                                  │
│  - Text → Direct pass-through                                    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   AI ORCHESTRATOR (Gemini)                       │
│                                                                   │
│  Analyzes request and routes to appropriate agent:               │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ IF: Email setup, client communications → CLIENT_COMS_AGENT │ │
│  │ IF: Data analysis, document processing → DOC_AGENT         │ │
│  │ IF: Ideas, strategy, investigations → COLLABORATIVE_MODE   │ │
│  └────────────────────────────────────────────────────────────┘ │
└────────────────────────────┬────────────────────────────────────┘
                             │
                ┌────────────┼────────────┐
                │            │            │
                ▼            ▼            ▼
┌──────────────────┐  ┌──────────────┐  ┌──────────────────────┐
│  CLIENT_COMS     │  │   DOC_AGENT  │  │ COLLABORATIVE MODE   │
│     AGENT        │  │              │  │  (Doc + Sherlock)    │
│                  │  │ - Process    │  │                      │
│ - Draft emails   │  │   documents  │  │ ┌─────────────────┐  │
│ - Handle comms   │  │ - Extract    │  │ │   DOC_AGENT     │  │
│ - Direct output  │  │   text       │  │ │   (Logical)     │  │
│   to client      │  │ - Classify   │  │ │                 │  │
└────────┬─────────┘  │ - Extract    │  │ │ Analyzes files  │  │
         │            │   key info   │  │ │ Sticks to logic │  │
         │            └──────┬───────┘  │ │ Forms opinions  │  │
         │                   │          │ └────────┬────────┘  │
         │                   │          │          │           │
         │                   ▼          │          ▼           │
         │            ┌──────────────┐  │ ┌─────────────────┐  │
         │            │ Direct       │  │ │ SHERLOCK_AGENT  │  │
         │            │ Analysis     │  │ │ (Creative)      │  │
         │            │ Output       │  │ │                 │  │
         │            └──────────────┘  │ │ Finds patterns  │  │
         │                              │ │ Creative ideas  │  │
         │                              │ │ Explains data   │  │
         │                              │ └────────┬────────┘  │
         │                              │          │           │
         │                              │          ▼           │
         │                              │ ┌─────────────────┐  │
         │                              │ │  CONVERSATION   │  │
         │                              │ │  (Max 10 iters) │  │
         │                              │ │                 │  │
         │                              │ │ Doc & Sherlock  │  │
         │                              │ │ debate & reach  │  │
         │                              │ │ consensus       │  │
         │                              │ └────────┬────────┘  │
         │                              │          │           │
         │                              │          ▼           │
         │                              │ ┌─────────────────┐  │
         │                              │ │ CONSENSUS       │  │
         │                              │ │ SUMMARY         │  │
         │                              │ └────────┬────────┘  │
         │                              └──────────┼───────────┘
         │                                         │
         │                                         ▼
         │                              ┌─────────────────────┐
         │                              │  CLIENT_COMS_AGENT  │
         │                              │                     │
         │                              │ Formats consensus   │
         │                              │ into client-        │
         │                              │ friendly message    │
         │                              └──────────┬──────────┘
         │                                         │
         └─────────────────┬───────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                        OUTPUT LAYER                              │
│                                                                   │
│  Return to client via API response                               │
│  - Formatted message                                             │
│  - Analysis results                                              │
│  - Recommendations                                               │
└─────────────────────────────────────────────────────────────────┘
```

## Agent Responsibilities

### 1. **AI Orchestrator (Gemini 2.5 Flash)**
- **Role**: Router and traffic controller
- **Responsibilities**:
  - Receives all incoming requests
  - Analyzes user intent
  - Routes to appropriate agent(s)
  - Manages agent-to-agent communication
  - Aggregates final responses

### 2. **Doc Agent (Document Processor)**
- **Role**: Logical analyst
- **Responsibilities**:
  - Process and extract text from all file types
  - Classify documents
  - Extract key information (dates, amounts, names)
  - Stick to facts and data
  - Form objective opinions based on evidence
  - In collaborative mode: Represent logical, data-driven perspective

### 3. **Sherlock Agent (Strategic Analyst)**
- **Role**: Creative investigator
- **Responsibilities**:
  - Find patterns and connections
  - Think creatively about case strategy
  - Explain implications of data
  - Develop theories and ideas
  - In collaborative mode: Represent creative, strategic perspective

### 4. **Client Coms Agent (Communication Handler)**
- **Role**: Client interface
- **Responsibilities**:
  - Draft client communications
  - Format responses appropriately
  - Handle direct client-facing tasks (emails, texts)
  - Translate technical/legal language to plain English
  - Final step before output to client

## Workflow Patterns

### Pattern 1: Direct Communication (Coms Agent Only)
```
API → Orchestrator → Coms Agent → Output
```
**Use Cases**:
- Email drafting
- Text message composition
- General client communication

### Pattern 2: Document Analysis (Doc Agent Only)
```
API → Orchestrator → Doc Agent → Output
```
**Use Cases**:
- Document classification
- Text extraction
- Basic information retrieval

### Pattern 3: Strategic Analysis (Collaborative Mode)
```
API → Orchestrator → Doc Agent → Sherlock Agent ⟷ (10 iterations) → Coms Agent → Output
```
**Use Cases**:
- Case strategy development
- Complex analysis requiring multiple perspectives
- Creative problem-solving
- Idea generation

## Collaborative Mode Details

When the orchestrator determines a request needs creative analysis:

1. **Doc Agent** processes files and forms logical analysis
2. **Sherlock Agent** receives Doc's analysis and adds creative interpretation
3. **Conversation Loop** (max 10 iterations):
   - Doc presents evidence-based arguments
   - Sherlock presents strategic insights
   - They debate, challenge, and refine ideas
   - Loop continues until:
     - Consensus reached
     - 10 iterations completed
     - Clear answer emerges
4. **Consensus Summary** is generated
5. **Coms Agent** formats for client delivery

## Implementation Status

### ✅ Completed
- [x] Doc Agent with file processing capabilities
- [x] Sherlock Agent with analytical tools
- [x] Client Coms Agent with multi-channel support
- [x] Agent-to-Agent communication (Doc → Sherlock)

### 🚧 In Progress
- [ ] AI Orchestrator routing logic
- [ ] Collaborative conversation loop (Doc ⟷ Sherlock)
- [ ] Final integration with Coms Agent
- [ ] API endpoint updates

### 📋 Next Steps
1. Update orchestrator with routing logic
2. Implement conversation manager
3. Create collaboration framework
4. Update API routes
5. Add conversation history tracking
6. Implement consensus detection

## Technology Stack

- **AI Model**: Google Gemini 2.5 Flash (via ADK)
- **Language**: Python 3.x
- **Document Processing**: PyPDF2, pytesseract, OpenCV
- **Speech Recognition**: speech_recognition, pydub
- **API**: FastAPI
- **Database**: Prisma + PostgreSQL
- **Frontend**: Next.js + TypeScript

## File Structure

```
AI/
├── agent_orchastrator.py      # Main orchestrator (to be enhanced)
├── agents/
│   ├── client_coms_agent/
│   │   └── agent.py           # Client communication handler
│   ├── docu_agent/
│   │   └── agent.py           # Document processor
│   └── sherlock_agent/
│       └── agent.py           # Strategic analyst
└── utils/
    └── database.py
```

## API Integration

The orchestrator will be exposed via Next.js API routes:

```typescript
POST /api/chat
POST /api/analyze
POST /api/process-documents
```

Each endpoint will:
1. Receive input (text/files)
2. Route to orchestrator
3. Return formatted response

## Security & Privacy

- All file processing happens server-side
- Client data never stored permanently without consent
- Agent conversations logged for quality assurance
- HIPAA-compliant document handling
- Encrypted communication between agents

## Performance Considerations

- **Doc Agent**: ~2-5 seconds per document
- **Sherlock Analysis**: ~10-30 seconds for full case
- **Collaborative Mode**: ~30-90 seconds (depends on complexity)
- **Coms Agent**: ~1-3 seconds for formatting

## Error Handling

Each agent includes:
- Graceful error recovery
- Fallback to simpler processing
- Error logging and tracking
- User-friendly error messages via Coms Agent
