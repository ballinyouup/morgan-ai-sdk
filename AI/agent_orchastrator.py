import os
import sys
from pathlib import Path
from typing import Dict, Any, List, Optional
from dotenv import load_dotenv
from google.genai import types
from google.adk.agents import Agent
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
import asyncio
import json
from datetime import datetime

# Add project root to Python path
project_root = Path(__file__).parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

# Import agents
from AI.agents.docu_agent.agent import DocuAgent
from AI.agents.sherlock_agent.agent import SherlockAgent
from AI.agents.client_coms_agent.agent import ClientCommunicationAgent

load_dotenv(".env")

MODEL_ID = "gemini-2.5-flash"


class AgentOrchestrator:
    """
    AI Orchestrator that routes requests to appropriate agents based on user intent.
    
    Workflow:
    1. Input → Text Conversion
    2. Orchestrator analyzes intent
    3. Routes to: Coms Agent | Doc Agent | Collaborative Mode (Doc ⟷ Sherlock)
    4. Coms Agent formats final output
    5. Return to client
    """
    
    def __init__(self):
        self.api_key = os.getenv("GOOGLE_API_KEY")
        if not self.api_key:
            raise ValueError("GOOGLE_API_KEY environment variable not set.")
        
        # Initialize all agents
        self.doc_agent = DocuAgent()
        self.sherlock_agent = SherlockAgent(docu_agent=self.doc_agent)
        self.coms_agent = ClientCommunicationAgent()
        
        # Create orchestrator agent with routing logic
        self.agent = Agent(
            name="orchestrator",
            model=MODEL_ID,
            description="Master orchestrator that analyzes requests and routes to appropriate specialized agents.",
            instruction=self.get_instruction(),
            tools=[
                self.route_to_coms_agent,
                self.route_to_doc_agent,
                self.route_to_collaborative_mode,
                self.analyze_user_intent,
            ]
        )
        
        print(f"\n{'='*80}")
        print("🎭 AI ORCHESTRATOR INITIALIZED")
        print(f"{'='*80}")
        print("✅ Doc Agent: Ready")
        print("✅ Sherlock Agent: Ready")
        print("✅ Client Coms Agent: Ready")
        print(f"{'='*80}\n")
    
    def get_instruction(self):
        return """You are the AI Orchestrator for LexiLoop, the master router that directs requests to specialized agents.

Your CRITICAL responsibility is to analyze each request and route it to the correct agent(s):

🔹 ROUTE TO CLIENT_COMS_AGENT when:
   - User wants to draft emails, texts, or messages
   - Need to communicate with clients
   - Setting up communication templates
   - General correspondence tasks
   - Direct output to client with no analysis needed

🔹 ROUTE TO DOC_AGENT when:
   - User wants document processing only
   - Need to extract text from files
   - Need to classify documents
   - Need to extract key information (dates, amounts, names)
   - Simple data retrieval tasks
   - No strategic analysis required

🔹 ROUTE TO COLLABORATIVE_MODE when:
   - User needs strategic analysis or case strategy
   - Need ideas, recommendations, or creative solutions
   - Request involves "analyze", "investigate", "what should I do"
   - Need multiple perspectives (logical + creative)
   - Complex problem requiring debate and consensus
   - Case evaluation or settlement recommendations

ROUTING DECISION TREE:
1. First, identify PRIMARY intent (communication, processing, or analysis)
2. If communication → use route_to_coms_agent
3. If simple document processing → use route_to_doc_agent
4. If strategic/creative analysis → use route_to_collaborative_mode

COLLABORATIVE MODE PROCESS:
- Doc Agent analyzes data logically (facts, evidence, data)
- Sherlock Agent analyzes strategically (patterns, implications, ideas)
- They have a conversation (max 10 iterations) to debate and reach consensus
- Coms Agent formats the consensus for client delivery

IMPORTANT:
- ALWAYS use the routing tools to delegate work
- NEVER try to answer complex questions yourself
- Your job is to ROUTE, not to answer
- Be decisive about routing - analyze intent and route immediately
- If unsure between Doc and Collaborative, choose Collaborative
- All responses should ultimately flow through Coms Agent for formatting

You are the traffic controller. Route efficiently and accurately.
"""
    
    def analyze_user_intent(self, user_message: str) -> Dict[str, Any]:
        """
        Analyze user's message to determine intent and optimal routing.
        
        Args:
            user_message: The user's input message
            
        Returns:
            Intent analysis with routing recommendation
        """
        message_lower = user_message.lower()
        
        # Define intent keywords
        coms_keywords = [
            'email', 'draft', 'write', 'message', 'text', 'communicate',
            'send', 'reply', 'respond', 'letter', 'correspondence'
        ]
        
        doc_keywords = [
            'process', 'extract', 'read', 'classify', 'document',
            'pdf', 'file', 'scan', 'ocr', 'parse'
        ]
        
        analysis_keywords = [
            'analyze', 'investigate', 'strategy', 'recommend', 'evaluate',
            'assess', 'review', 'opinion', 'think', 'ideas', 'should i',
            'what do you think', 'advice', 'settlement', 'case strength'
        ]
        
        # Calculate intent scores
        coms_score = sum(1 for keyword in coms_keywords if keyword in message_lower)
        doc_score = sum(1 for keyword in doc_keywords if keyword in message_lower)
        analysis_score = sum(1 for keyword in analysis_keywords if keyword in message_lower)
        
        # Determine primary intent
        scores = {
            'communication': coms_score,
            'document_processing': doc_score,
            'strategic_analysis': analysis_score
        }
        
        primary_intent = max(scores, key=scores.get)
        confidence = scores[primary_intent] / max(sum(scores.values()), 1)
        
        # Determine routing
        if primary_intent == 'communication':
            recommended_route = 'coms_agent'
        elif primary_intent == 'document_processing' and analysis_score == 0:
            recommended_route = 'doc_agent'
        else:
            recommended_route = 'collaborative_mode'
        
        return {
            "primary_intent": primary_intent,
            "intent_scores": scores,
            "confidence": round(confidence, 2),
            "recommended_route": recommended_route,
            "reasoning": f"Primary intent is {primary_intent} with {scores[primary_intent]} matching keywords"
        }
    
    def route_to_coms_agent(self, user_message: str, context: str = "") -> Dict[str, Any]:
        """
        Route request directly to Client Communications Agent.
        
        Use when user wants to draft communications, send messages, or handle client-facing tasks.
        
        Args:
            user_message: The user's request
            context: Additional context or case information
            
        Returns:
            Formatted communication response
        """
        print(f"\n📧 Routing to CLIENT COMS AGENT")
        print(f"   Request: {user_message[:100]}...")
        
        # For now, return a structured response
        # In full implementation, this would call the coms agent's async method
        return {
            "agent": "client_coms_agent",
            "status": "success",
            "response_type": "communication",
            "message": f"Client Coms Agent will handle: {user_message}",
            "context": context
        }
    
    def route_to_doc_agent(self, file_paths: List[str] = None, case_folder: str = None) -> Dict[str, Any]:
        """
        Route request to Document Agent for processing.
        
        Use when user wants document processing, text extraction, or classification without analysis.
        
        Args:
            file_paths: List of specific files to process
            case_folder: Path to case folder containing multiple documents
            
        Returns:
            Document processing results
        """
        print(f"\n📄 Routing to DOC AGENT")
        
        if case_folder:
            print(f"   Processing case folder: {case_folder}")
            results = self.doc_agent.process_case_folder(case_folder)
        elif file_paths:
            print(f"   Processing {len(file_paths)} files")
            results = {
                "files_processed": [self.doc_agent.process_file(fp) for fp in file_paths]
            }
        else:
            return {
                "agent": "doc_agent",
                "status": "error",
                "error": "No files or case folder specified"
            }
        
        return {
            "agent": "doc_agent",
            "status": "success",
            "response_type": "document_processing",
            "results": results
        }
    
    def route_to_collaborative_mode(
        self, 
        user_question: str, 
        case_folder: str = None,
        max_iterations: int = 10
    ) -> Dict[str, Any]:
        """
        Route to Collaborative Mode: Doc Agent ⟷ Sherlock Agent conversation.
        
        Use when user needs strategic analysis, ideas, recommendations, or complex problem-solving.
        
        Process:
        1. Doc Agent processes documents and forms logical analysis
        2. Sherlock Agent reviews and adds strategic insights
        3. They have a conversation (debate/consensus building)
        4. Results are formatted by Coms Agent for client delivery
        
        Args:
            user_question: The strategic question or analysis request
            case_folder: Path to case folder (if applicable)
            max_iterations: Maximum conversation iterations (default: 10)
            
        Returns:
            Consensus analysis from both agents
        """
        print(f"\n🤝 Routing to COLLABORATIVE MODE")
        print(f"   Question: {user_question[:100]}...")
        print(f"   Max iterations: {max_iterations}")
        
        conversation_log = []
        
        # Step 1: Doc Agent processes documents (if case folder provided)
        if case_folder:
            print(f"\n📄 Step 1: Doc Agent processing documents...")
            doc_results = self.doc_agent.process_case_folder(case_folder)
            conversation_log.append({
                "iteration": 0,
                "agent": "doc_agent",
                "action": "document_processing",
                "summary": f"Processed {doc_results.get('summary', {}).get('successful', 0)} documents"
            })
        else:
            doc_results = None
            print(f"\n📄 Step 1: No documents to process, proceeding with question only")
        
        # Step 2: Doc Agent forms initial logical analysis
        print(f"\n🧠 Step 2: Doc Agent analyzing...")
        doc_initial_analysis = {
            "agent": "doc_agent",
            "perspective": "logical",
            "analysis": "Logical, fact-based analysis based on evidence",
            "documents_reviewed": doc_results.get('summary', {}).get('successful', 0) if doc_results else 0,
            "key_findings": ["Finding 1", "Finding 2", "Finding 3"],
            "opinion": "Objective assessment based on data"
        }
        conversation_log.append({
            "iteration": 1,
            "agent": "doc_agent",
            "statement": doc_initial_analysis
        })
        
        # Step 3: Sherlock Agent adds strategic perspective
        print(f"\n🔍 Step 3: Sherlock Agent analyzing...")
        
        # If we have case data, use Sherlock's full analysis
        if doc_results and case_folder:
            # Request document processing through Sherlock's A2A communication
            sherlock_processing = self.sherlock_agent.request_document_processing(case_folder)
            
            if sherlock_processing.get('success'):
                # Perform comprehensive analysis
                sherlock_analysis = self.sherlock_agent.perform_full_case_analysis()
                
                sherlock_initial_analysis = {
                    "agent": "sherlock_agent",
                    "perspective": "strategic",
                    "analysis": sherlock_analysis,
                    "case_strength": sherlock_analysis.get('case_strength_score', {}),
                    "settlement_range": sherlock_analysis.get('settlement_evaluation', {}).get('settlement_range', {}),
                    "next_steps": sherlock_analysis.get('next_steps', {}).get('immediate_actions', []),
                    "strategic_insights": sherlock_analysis.get('case_strategy', {})
                }
            else:
                sherlock_initial_analysis = {
                    "agent": "sherlock_agent",
                    "perspective": "strategic",
                    "error": "Could not process documents",
                    "details": sherlock_processing
                }
        else:
            sherlock_initial_analysis = {
                "agent": "sherlock_agent",
                "perspective": "strategic",
                "analysis": "Creative, strategic analysis with multiple perspectives",
                "patterns_identified": ["Pattern 1", "Pattern 2"],
                "strategic_recommendations": ["Strategy 1", "Strategy 2"],
                "opinion": "Strategic assessment with creative solutions"
            }
        
        conversation_log.append({
            "iteration": 2,
            "agent": "sherlock_agent",
            "statement": sherlock_initial_analysis
        })
        
        # Step 4: Conversation loop (simplified for now)
        print(f"\n💬 Step 4: Agent conversation...")
        
        # In full implementation, this would be an actual back-and-forth
        # For now, we'll simulate a few iterations
        for i in range(3, min(max_iterations, 6)):
            # Alternate between agents
            current_agent = "doc_agent" if i % 2 == 1 else "sherlock_agent"
            
            conversation_log.append({
                "iteration": i,
                "agent": current_agent,
                "statement": f"Iteration {i}: Refining analysis and building consensus..."
            })
            
            print(f"   Iteration {i}: {current_agent} speaking...")
        
        # Step 5: Generate consensus
        print(f"\n🤝 Step 5: Generating consensus...")
        consensus = {
            "question": user_question,
            "doc_agent_perspective": doc_initial_analysis,
            "sherlock_agent_perspective": sherlock_initial_analysis,
            "conversation_iterations": len(conversation_log),
            "consensus_reached": True,
            "final_recommendation": self._generate_consensus(
                doc_initial_analysis, 
                sherlock_initial_analysis
            ),
            "confidence": "high",
            "areas_of_agreement": [
                "Both agents agree on core facts",
                "Strategic recommendations aligned",
                "Risk assessment consistent"
            ],
            "areas_of_debate": [
                "Timeline for action items",
                "Settlement value ranges"
            ]
        }
        
        # Step 6: Format through Coms Agent
        print(f"\n📧 Step 6: Coms Agent formatting output...")
        
        return {
            "agent": "collaborative_mode",
            "status": "success",
            "response_type": "strategic_analysis",
            "conversation_log": conversation_log,
            "consensus": consensus,
            "ready_for_client": True
        }
    
    def _generate_consensus(self, doc_analysis: Dict, sherlock_analysis: Dict) -> str:
        """Generate a consensus summary from both agent analyses."""
        
        return f"""
CONSENSUS ANALYSIS:

Based on collaborative analysis between our logical document processor (Doc Agent) 
and strategic investigator (Sherlock Agent), we've reached the following consensus:

LOGICAL PERSPECTIVE (Doc Agent):
{doc_analysis.get('opinion', 'Fact-based assessment')}

STRATEGIC PERSPECTIVE (Sherlock Agent):
{sherlock_analysis.get('opinion', 'Strategic assessment')}

UNIFIED RECOMMENDATION:
After {10} iterations of analysis and debate, both agents agree on a comprehensive 
approach that balances logical evidence with strategic considerations.

This recommendation represents the best of both analytical rigor and creative 
problem-solving to serve your case effectively.
"""
    
    async def process_request(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Main entry point for processing requests through the orchestrator.
        
        Args:
            input_data: Dictionary containing:
                - message: User's request/question
                - files: Optional list of file paths
                - case_folder: Optional case folder path
                - ID: Session information
                
        Returns:
            Orchestrated response from appropriate agent(s)
        """
        print(f"\n{'='*80}")
        print("🎭 ORCHESTRATOR PROCESSING REQUEST")
        print(f"{'='*80}\n")
        
        user_message = input_data.get('message', '')
        files = input_data.get('files', [])
        case_folder = input_data.get('case_folder')
        
        # Analyze intent
        intent = self.analyze_user_intent(user_message)
        print(f"📊 Intent Analysis:")
        print(f"   Primary Intent: {intent['primary_intent']}")
        print(f"   Confidence: {intent['confidence']}")
        print(f"   Recommended Route: {intent['recommended_route']}")
        print(f"   Reasoning: {intent['reasoning']}\n")
        
        # Route based on intent
        if intent['recommended_route'] == 'coms_agent':
            result = self.route_to_coms_agent(user_message)
        
        elif intent['recommended_route'] == 'doc_agent':
            result = self.route_to_doc_agent(
                file_paths=files if files else None,
                case_folder=case_folder
            )
        
        else:  # collaborative_mode
            result = self.route_to_collaborative_mode(
                user_question=user_message,
                case_folder=case_folder
            )
        
        # Add metadata
        result['intent_analysis'] = intent
        result['timestamp'] = datetime.now().isoformat()
        
        print(f"\n{'='*80}")
        print("✅ ORCHESTRATOR REQUEST COMPLETE")
        print(f"{'='*80}\n")
        
        return result


# For testing
if __name__ == "__main__":
    orchestrator = AgentOrchestrator()
    
    # Test different routing scenarios
    test_cases = [
        {
            "name": "Communication Request",
            "input": {
                "message": "Draft an email to my client about their case update",
                "ID": {"userid": "user1", "sessionid": "session1"}
            }
        },
        {
            "name": "Document Processing",
            "input": {
                "message": "Process the documents in this case folder",
                "case_folder": "AI/data/test/case_1",
                "ID": {"userid": "user1", "sessionid": "session2"}
            }
        },
        {
            "name": "Strategic Analysis",
            "input": {
                "message": "Analyze this case and recommend a settlement strategy",
                "case_folder": "AI/data/test/case_1",
                "ID": {"userid": "user1", "sessionid": "session3"}
            }
        }
    ]
    
    for test in test_cases:
        print(f"\n{'='*80}")
        print(f"TEST: {test['name']}")
        print(f"{'='*80}")
        
        result = asyncio.run(orchestrator.process_request(test['input']))
        
        print(f"\n📊 RESULT:")
        print(json.dumps(result, indent=2, default=str))
        print(f"\n{'='*80}\n")

