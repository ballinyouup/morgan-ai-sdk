# AI Agents System - Quick Reference

## 🚀 Quick Start Commands

```bash
# Start the API server
cd AI && python api_server.py

# Run test suite
cd AI && python test_orchestrator.py

# Interactive mode
cd AI && python test_orchestrator.py --interactive

# Test individual agents
cd AI/agents/docu_agent && python agent.py
cd AI/agents/sherlock_agent && python agent.py
cd AI/agents/client_coms_agent && python agent.py
```

## 📊 System Status

Check if everything is working:

```bash
curl http://localhost:8000/api/health
```

## 🎯 Common Use Cases

### 1. Analyze a Case

**Request:**
```bash
curl -X POST http://localhost:8000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What settlement strategy should we pursue?",
    "case_folder": "/path/to/case",
    "user_id": "user123"
  }'
```

**Python:**
```python
import requests

response = requests.post("http://localhost:8000/api/analyze", json={
    "question": "Analyze this case and recommend strategy",
    "case_folder": "/Users/michael/Desktop/morgan-ai-sdk/AI/data/test/case_1",
    "user_id": "user123"
})

result = response.json()
print(result['data']['consensus']['final_recommendation'])
```

### 2. Process Documents

**Request:**
```bash
curl -X POST http://localhost:8000/api/process-documents \
  -H "Content-Type: application/json" \
  -d '{
    "case_folder": "/path/to/case",
    "user_id": "user123"
  }'
```

**Python:**
```python
response = requests.post("http://localhost:8000/api/process-documents", json={
    "case_folder": "/Users/michael/Desktop/morgan-ai-sdk/AI/data/test/case_1",
    "user_id": "user123"
})

result = response.json()
summary = result['data']['results']['summary']
print(f"Processed {summary['successful']} files")
```

### 3. Draft Communication

**Request:**
```bash
curl -X POST http://localhost:8000/api/draft-communication \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Draft email about settlement offer",
    "context": "Received $45k offer",
    "user_id": "user123"
  }'
```

**Python:**
```python
response = requests.post("http://localhost:8000/api/draft-communication", json={
    "message": "Draft an email to John Smith about the settlement offer",
    "context": "Offer: $45,000 for medical expenses",
    "user_id": "user123"
})

draft = response.json()
print(draft['data']['message'])
```

### 4. General Chat (Auto-Route)

**Request:**
```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Analyze this case and tell me what to do",
    "case_folder": "/path/to/case",
    "user_id": "user123"
  }'
```

**Python:**
```python
response = requests.post("http://localhost:8000/api/chat", json={
    "message": "What should I do with this case?",
    "case_folder": "/Users/michael/Desktop/morgan-ai-sdk/AI/data/test/case_1",
    "user_id": "user123"
})

result = response.json()
print(f"Routed to: {result['data']['intent_analysis']['recommended_route']}")
```

## 🔀 Routing Logic

### Keywords that trigger Coms Agent:
- email, draft, write, message, text, communicate
- send, reply, respond, letter, correspondence

### Keywords that trigger Doc Agent:
- process, extract, read, classify, document
- pdf, file, scan, ocr, parse

### Keywords that trigger Collaborative Mode:
- analyze, investigate, strategy, recommend, evaluate
- assess, review, opinion, think, ideas, should i
- advice, settlement, case strength

## 🧪 Test Cases

Available test cases:

| Case | Description | Files | Location |
|------|-------------|-------|----------|
| case_1 | Basic personal injury | ~5 files | `AI/data/test/case_1` |
| case_2 | Complex multi-party | ~10 files | `AI/data/test/case_2` |
| case_3 | Mixed file types | ~8 files | `AI/data/test/case_3` |
| case_4 | Large document set | ~20 files | `AI/data/test/case_4` |

## 📝 Response Formats

### Intent Analysis
```json
{
  "primary_intent": "strategic_analysis",
  "intent_scores": {
    "communication": 0,
    "document_processing": 2,
    "strategic_analysis": 5
  },
  "confidence": 0.71,
  "recommended_route": "collaborative_mode"
}
```

### Collaborative Mode Response
```json
{
  "agent": "collaborative_mode",
  "status": "success",
  "response_type": "strategic_analysis",
  "consensus": {
    "consensus_reached": true,
    "conversation_iterations": 6,
    "doc_agent_perspective": {...},
    "sherlock_agent_perspective": {...},
    "final_recommendation": "...",
    "confidence": "high"
  }
}
```

### Document Processing Response
```json
{
  "agent": "doc_agent",
  "status": "success",
  "response_type": "document_processing",
  "results": {
    "case_name": "case_1",
    "summary": {
      "total_files": 5,
      "successful": 5,
      "failed": 0,
      "by_type": {
        "pdf": 3,
        "image": 1,
        "text": 1
      }
    }
  }
}
```

## ⚙️ Environment Variables

Required in `.env`:

```bash
# Google AI
GOOGLE_API_KEY=your_gemini_api_key

# Database (optional)
DATABASE_URL=postgresql://...

# API Settings (optional)
API_HOST=0.0.0.0
API_PORT=8000
```

## 🐛 Troubleshooting

### Server won't start
```bash
# Check if port 8000 is in use
lsof -i :8000

# Kill process if needed
kill -9 <PID>

# Or use different port
uvicorn api_server:app --port 8001
```

### Import errors
```bash
# Reinstall dependencies
pip install -r requirements.txt

# Check Python version (needs 3.9+)
python --version
```

### OCR not working
```bash
# Install Tesseract
brew install tesseract  # macOS
apt-get install tesseract-ocr  # Linux

# Verify installation
tesseract --version
```

### API Key issues
```bash
# Check .env file exists
ls -la .env

# Verify API key is set
echo $GOOGLE_API_KEY

# Or check in Python
python -c "import os; print(os.getenv('GOOGLE_API_KEY'))"
```

## 🔍 Monitoring & Debugging

### View API logs
```bash
# API server shows all requests
cd AI && python api_server.py
# Watch terminal for request logs
```

### Enable debug mode
```python
# In agent files, add:
import logging
logging.basicConfig(level=logging.DEBUG)
```

### Check conversation history
```python
from AI.utils.conversation_manager import ConversationManager

manager = ConversationManager()
# ... run conversation ...
manager.export_conversation("/tmp/conversation.json")
```

## 📊 Performance

**Expected Response Times:**

| Operation | Time |
|-----------|------|
| Intent Analysis | < 0.5s |
| Document Processing | 2-5s per file |
| Doc Agent Analysis | 5-15s |
| Sherlock Analysis | 10-30s |
| Collaborative Mode | 30-90s |
| Coms Agent Format | 1-3s |

## 🔐 Security Notes

- All file processing is server-side
- No client data stored permanently by default
- Agent conversations logged for quality assurance
- Use HTTPS in production
- Implement authentication for production use
- Validate all file paths to prevent directory traversal

## 📚 Additional Resources

- **Full Documentation**: `AI/README.md`
- **Architecture**: `AI_AGENTS_ARCHITECTURE.md`
- **Workflow Diagrams**: `AI/WORKFLOW_DIAGRAMS.md`
- **API Docs**: `http://localhost:8000/docs` (when server running)

## 🆘 Getting Help

1. Check health endpoint: `http://localhost:8000/api/health`
2. Review API docs: `http://localhost:8000/docs`
3. Test individual agents first
4. Check logs for error details
5. Verify all dependencies installed
6. Ensure API key is valid

## 💡 Pro Tips

1. **Use auto-routing**: Let orchestrator decide the route with `/api/chat`
2. **Cache document processing**: Store processed results to avoid re-processing
3. **Adjust iterations**: Lower max_iterations for faster responses during testing
4. **Test incrementally**: Start with single agent tests before full workflow
5. **Monitor token usage**: Gemini API has rate limits
6. **Use absolute paths**: For file paths to avoid confusion

## 📞 Quick Contact

For implementation questions or issues, reference:
- Main README: Core architecture and design
- This file: Quick commands and troubleshooting
- API Docs: Detailed endpoint specifications
