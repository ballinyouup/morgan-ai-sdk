import os
from dotenv import load_dotenv
from google.adk.agents import Agent
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from transformers import pipeline
import asyncio
from google.genai import types


load_dotenv(".env")

MODEL_ID = "gemini-2.5-flash"

class ClientCommunicationAgent:
    def __init__(self):
        self.api_key = os.getenv("GOOGLE_API_KEY")
        if not self.api_key:
            raise ValueError("GOOGLE_API_KEY not set")
    

        self.agent = Agent(
            name="client_communication_agent",
            model=MODEL_ID,
            description="Drafts empathetic and clear communications for clients.",
            instruction=self.get_instruction(),
            tools=[
                self.analyze_emotion,
                self.draft_response,
            ],
        )

    def get_instruction(self):
        return """You are the Client Communication agent for LexiLoop.

Your responsibilities:
1. Analyze client messages for emotional content, urgency, and specific concerns
2. Draft clear, empathetic, and professional responses tailored to the client's emotional state
3. Detect questions in client messages and determine if they require attorney expertise
4. Ensure tone is appropriate for the situation:
   - Supportive and reassuring for anxiety
   - Apologetic and action-oriented for frustration
   - Clear and educational for confusion
   - Warm and encouraging for gratitude
5. Flag messages that require immediate attorney attention
6. NEVER make legal promises or give legal advice - always defer to "your attorney will review"
7. Generate response templates with appropriate tone and structure

Communication Guidelines:
- Be warm but professional
- Use plain language, avoid legalese
- Show empathy and understanding
- Set clear expectations about timelines
- Provide specific next steps when possible
- Acknowledge emotions explicitly ("I understand your frustration...")
- All messages require human approval before sending
- Include legal disclaimer for anything touching on legal advice

Question Handling:
- Identify all questions in the message
- Flag questions that require legal expertise
- Suggest whether AI can draft response or needs attorney
- Provide response frameworks for common questions

You are the gatekeeper ensuring all client communication is excellent, empathetic, and compliant.
Always remember: You draft - humans approve. Client satisfaction is paramount.
"""
    
    def analyze_emotion(self, message: str):
        pipe = pipeline("text-classification", model="tabularisai/multilingual-sentiment-analysis",device=self.device)
        result = pipe(message)[0]
    
        return {
            "primary_emotion": result['label'],
            "confidence": result['score'],
        }
    
    def draft_response(self, client_message: str, context: str = "", case_update: str = ""):
        print(f"\n=== Drafting Client Response ===")
        
        emotion_analysis = self.analyze_emotion(client_message)
        
        response_elements = []
    
        draft = {
            "client_message": client_message,
            "emotion_analysis": emotion_analysis,
            "response_elements": response_elements,
            "requires_review": True,  # always require human approval
            "suggested_priority": "urgent" if emotion_analysis["primary_emotion"] == 'Negative' else "normal",
            "context": context,
            "case_update": case_update,
        }
        
        return draft

    async def process_communication(self, input_data):
        print(f"\n{'='*60}")
        print("Client Communication Agent Initialized")
        print(f"{'='*60}\n")

        APP_NAME = "saulgoodman"

        #prob replace these later with unique ids
        USER_ID = input_data['ID']['userid']
        SESSION_ID = input_data['ID']['sessionid']


        session_service = InMemorySessionService()
        await session_service.create_session(app_name=APP_NAME, user_id=USER_ID, session_id=SESSION_ID)

        runner = Runner(agent=self.agent, app_name=APP_NAME, session_service=session_service)
        content = types.Content(role='user', parts=[types.Part(text=input_data['message'])])
        events = runner.run(user_id=USER_ID, session_id=SESSION_ID, new_message=content)

        for event in events:
            if event.is_final_response():
                return event.content.parts[0].text
 
if __name__ == "__main__":
    agent = ClientCommunicationAgent()
    
    test_message = "I'm really frustrated. It's been 3 weeks and I haven't heard anything about my case!"
    result = asyncio.run(agent.process_communication({
        "message": test_message,
        "ID": {"userid": "user1", "sessionid": "session1"}
    }))

    print("comms agent result:", result)
