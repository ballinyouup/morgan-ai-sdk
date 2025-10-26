# AI Agents System - Quick Start Guide

## Overview

The LexiLoop AI Orchestrator is a multi-agent system that intelligently routes requests to specialized AI agents. The system follows this workflow:

```
Input → Text Conversion → Orchestrator → Agent(s) → Output
```

## Architecture

### 🎭 **Orchestrator** (Main Router)
- Analyzes user intent
- Routes to appropriate agent(s)
- Manages agent-to-agent communication
- Aggregates final responses

### 📄 **Doc Agent** (Document Processor)
- Extracts text from PDF, images, audio
- Classifies documents
- Extracts key info (dates, amounts, names)
- Provides logical, fact-based analysis

### 🔍 **Sherlock Agent** (Strategic Analyst)
- Analyzes case strategy
- Finds patterns and connections
- Provides creative insights
- Evaluates settlement options

### 📧 **Coms Agent** (Communication Handler)
- Drafts emails, texts, messages
- Formats responses for clients
- Handles sentiment analysis
- Multi-channel communication

## Workflows

### 1. Direct Communication
```
API → Orchestrator → Coms Agent → Output
```
**Use for**: Email drafting, client messages

### 2. Document Processing
```
API → Orchestrator → Doc Agent → Output
```
**Use for**: Text extraction, document classification

### 3. Strategic Analysis (Collaborative Mode)
```
API → Orchestrator → Doc Agent ⟷ Sherlock Agent (10 iterations) → Coms Agent → Output
```
**Use for**: Case strategy, complex analysis, recommendations

## Installation

### Prerequisites
- Python 3.9+
- Node.js 18+ (for Next.js frontend)
- Google API Key (for Gemini)

### Setup

1. **Clone the repository**
```bash
cd /Users/michael/Desktop/morgan-ai-sdk
```

2. **Install Python dependencies**
```bash
pip install -r requirements.txt
```

3. **Set up environment variables**
Create a `.env` file in the root directory:
```bash
GOOGLE_API_KEY=your_api_key_here
DATABASE_URL=your_database_url
```

4. **Install Node.js dependencies**
```bash
npm install
```

## Usage

### Option 1: Python API Server (FastAPI)

Start the Python API server:

```bash
cd AI
python api_server.py
```

The server will start on `http://localhost:8000`

**API Documentation**: `http://localhost:8000/docs`

### Option 2: Test Scripts

Run the orchestrator test suite:

```bash
cd AI
python test_orchestrator.py
```

Run in interactive mode:

```bash
cd AI
python test_orchestrator.py --interactive
```

### Option 3: Individual Agents

Test individual agents:

```bash
# Doc Agent
cd AI/agents/docu_agent
python agent.py

# Sherlock Agent  
cd AI/agents/sherlock_agent
python agent.py data/test/case_1

# Coms Agent
cd AI/agents/client_coms_agent
python agent.py
```

## API Endpoints

### POST `/api/chat`
General-purpose endpoint. Orchestrator auto-routes based on intent.

```json
{
  "message": "Analyze this case and recommend a strategy",
  "user_id": "user123",
  "session_id": "session001",
  "case_folder": "/path/to/case"
}
```

### POST `/api/process-documents`
Direct document processing via Doc Agent.

```json
{
  "case_folder": "/path/to/case",
  "user_id": "user123"
}
```

### POST `/api/analyze`
Strategic analysis via Collaborative Mode.

```json
{
  "question": "What settlement strategy should we pursue?",
  "case_folder": "/path/to/case",
  "max_iterations": 10,
  "user_id": "user123"
}
```

### POST `/api/draft-communication`
Draft client communications via Coms Agent.

```json
{
  "message": "Draft an email to client about settlement offer",
  "context": "Settlement offer of $50k received",
  "user_id": "user123"
}
```

### GET `/api/agents`
List all available agents and their capabilities.

### GET `/api/test-cases`
List available test cases for testing.

### GET `/api/health`
Health check endpoint.

## Examples

### Example 1: Simple Document Processing

```python
import requests

response = requests.post("http://localhost:8000/api/chat", json={
    "message": "Process all documents in case_1",
    "case_folder": "/Users/michael/Desktop/morgan-ai-sdk/AI/data/test/case_1",
    "user_id": "user123"
})

print(response.json())
```

### Example 2: Strategic Analysis

```python
import requests

response = requests.post("http://localhost:8000/api/analyze", json={
    "question": "Analyze this personal injury case and recommend a settlement strategy",
    "case_folder": "/Users/michael/Desktop/morgan-ai-sdk/AI/data/test/case_1",
    "max_iterations": 10,
    "user_id": "user123"
})

result = response.json()
consensus = result['data']['consensus']

print(f"Consensus reached: {consensus['consensus_reached']}")
print(f"Iterations: {consensus['conversation_iterations']}")
print(f"Recommendation: {consensus['final_recommendation']}")
```

### Example 3: Draft Email

```python
import requests

response = requests.post("http://localhost:8000/api/draft-communication", json={
    "message": "Draft an email to John Smith explaining the settlement offer",
    "context": "Received offer of $45,000 for medical malpractice case",
    "user_id": "user123"
})

print(response.json())
```

## Collaborative Mode Details

When strategic analysis is needed, the orchestrator initiates Collaborative Mode:

1. **Doc Agent** processes documents and provides logical analysis
2. **Sherlock Agent** reviews and adds strategic insights
3. **Conversation Loop** (max 10 iterations):
   - Agents debate different perspectives
   - Doc focuses on facts and evidence
   - Sherlock focuses on patterns and strategy
   - Continue until consensus or max iterations
4. **Consensus** is generated combining both perspectives
5. **Coms Agent** formats for client delivery

## Testing

### Test Cases

The system includes test cases in `AI/data/test/`:
- `case_1/` - Basic personal injury case
- `case_2/` - Complex case with multiple documents
- `case_3/` - Case with various file types
- `case_4/` - Large case folder

### Running Tests

```bash
# Test all workflows
cd AI
python test_orchestrator.py

# Test specific agent
cd AI/agents/sherlock_agent
python agent.py ../data/test/case_1

# Interactive testing
cd AI
python test_orchestrator.py --interactive
```

## Integration with Next.js

To integrate with your Next.js frontend, update `src/app/api/chat/route.ts`:

```typescript
export async function POST(req: Request) {
    const { messages, chatId } = await req.json();
    
    // Extract last user message
    const userMessage = messages[messages.length - 1];
    
    // Call Python orchestrator
    const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            message: userMessage.content,
            user_id: chatId || 'default',
            session_id: chatId
        })
    });
    
    const result = await response.json();
    
    // Return result to frontend
    return Response.json(result);
}
```

## Deployment

### Development
```bash
# Terminal 1: Python API
cd AI && python api_server.py

# Terminal 2: Next.js dev server
npm run dev
```

### Production

1. **Deploy Python API** (e.g., AWS Lambda, Google Cloud Run)
2. **Deploy Next.js** (e.g., Vercel)
3. **Configure environment variables** in both environments
4. **Update API endpoint** in Next.js to point to production API

## Troubleshooting

### "GOOGLE_API_KEY not set"
- Create `.env` file in project root
- Add `GOOGLE_API_KEY=your_key_here`

### "Case folder not found"
- Use absolute paths for case folders
- Or use relative paths from project root: `AI/data/test/case_1`

### "Import error: No module named..."
- Install requirements: `pip install -r requirements.txt`
- Verify Python path includes project root

### OCR not working
- Install Tesseract: `brew install tesseract` (macOS)
- Or: `apt-get install tesseract-ocr` (Linux)

## File Structure

```
AI/
├── agent_orchastrator.py          # Main orchestrator
├── api_server.py                  # FastAPI server
├── test_orchestrator.py           # Test suite
├── agents/
│   ├── client_coms_agent/
│   │   └── agent.py              # Communication handler
│   ├── docu_agent/
│   │   └── agent.py              # Document processor
│   └── sherlock_agent/
│       └── agent.py              # Strategic analyst
├── utils/
│   ├── conversation_manager.py   # Agent conversation handler
│   └── database.py               # Database utilities
└── data/
    └── test/                     # Test cases
        ├── case_1/
        ├── case_2/
        ├── case_3/
        └── case_4/
```

## Next Steps

1. ✅ **Architecture designed** - Multi-agent system with routing
2. ✅ **Agents implemented** - Doc, Sherlock, Coms agents ready
3. ✅ **Orchestrator created** - Intent analysis and routing
4. ✅ **API server built** - FastAPI endpoints
5. ⏳ **Next.js integration** - Connect frontend to Python API
6. ⏳ **Enhanced conversation** - Improve agent-to-agent dialogue
7. ⏳ **Database integration** - Store conversations and results
8. ⏳ **Authentication** - Add user auth and sessions

## Support

For questions or issues:
1. Check API docs: `http://localhost:8000/docs`
2. Review architecture: `AI_AGENTS_ARCHITECTURE.md`
3. Test individual components before full integration

## License

Proprietary - LexiLoop AI System
