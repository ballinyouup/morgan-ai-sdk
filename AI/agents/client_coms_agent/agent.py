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
                self.draft_email,
                self.draft_text_message,
                self.draft_portal_message,
                self.analyze_call_transcript,
            ],
        )

    def get_instruction(self):
        return """You are the Client Communication agent for SimplyLaw.

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

Multi-Channel Communication:
- EMAILS: Use for detailed case updates, formal communications, document delivery
  * Include proper greeting/closing based on tone
  * Keep professional but warm
  * Ideal for complex information that clients can reference later
  
- TEXT MESSAGES: Use for quick updates, reminders, time-sensitive alerts
  * Keep under 320 characters (2 SMS segments)
  * Be concise and action-oriented
  * Best for appointment reminders, quick status updates
  * Send during business hours only
  
- CLIENT PORTAL: Use for secure document sharing, case updates, formal requests
  * Categorize messages appropriately
  * Can include attachments and links
  * Allows threaded conversations
  * Automatic notifications for urgent items
  
- CALL TRANSCRIPTS: Analyze phone conversations to:
  * Extract action items and commitments made
  * Identify questions that need follow-up
  * Assess emotional tone and satisfaction
  * Generate follow-up communications summarizing the call

Communication Guidelines:
- Be warm but professional
- Use plain language, avoid legalese
- Show empathy and understanding
- Set clear expectations about timelines
- Provide specific next steps when possible
- Acknowledge emotions explicitly ("I understand your frustration...")
- All messages require human approval before sending
- Include legal disclaimer for anything touching on legal advice

Channel Selection Guide:
- Urgent + Simple → Text Message
- Urgent + Complex → Portal Message + Email notification
- Routine Update → Client Portal
- Formal Communication → Email
- Document Delivery → Portal with Email notification
- Quick Confirmation → Text Message

Question Handling:
- Identify all questions in the message
- Flag questions that require legal expertise
- Suggest whether AI can draft response or needs attorney
- Provide response frameworks for common questions
- Extract action items from any communication

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
    
    def draft_email(self, subject: str, recipient_name: str, message_body: str, case_info: str = "", tone: str = "professional"):
        print(f"\n=== Drafting Email ===")
        
        emotion_analysis = self.analyze_emotion(message_body)
        
        email_draft = {
            "channel": "email",
            "subject": subject,
            "recipient": recipient_name,
            "greeting": f"Dear {recipient_name}," if tone == "professional" else f"Hi {recipient_name},",
            "body": message_body,
            "case_reference": case_info,
            "closing": self._get_email_closing(tone),
            "signature": "Your Legal Team at LexiLoop",
            "tone": tone,
            "emotion_context": emotion_analysis,
            "includes_disclaimer": True,
            "requires_review": True,
            "estimated_read_time": len(message_body.split()) // 200 + 1  # minutes
        }
        
        return email_draft
    
    def draft_text_message(self, recipient_name: str, message: str, include_case_number: bool = False):
        print(f"\n=== Drafting Text Message ===")
        
        max_length = 320  
        if len(message) > max_length:
            message = message[:max_length-3] + "..."
        
        text_draft = {
            "channel": "sms",
            "recipient": recipient_name,
            "message": message,
            "character_count": len(message),
            "sms_segments": (len(message) // 160) + 1,
            "include_case_ref": include_case_number,
            "urgency": self.detect_urgency_level(message),
            "requires_review": True,
            "best_send_time": "business_hours"  # 9am-6pm local time
        }
        
        return text_draft
    
    def draft_portal_message(self, recipient_name: str, subject: str, message: str,attachments: list = None, category: str = "general"):
        print(f"\n=== Drafting Portal Message ===")
        
        emotion_analysis = self.analyze_emotion(message)
        urgency = self.detect_urgency_level(message)
        
        portal_draft = {
            "channel": "client_portal",
            "recipient": recipient_name,
            "subject": subject,
            "message": message,
            "category": category,
            "attachments": attachments or [],
            "emotion_context": emotion_analysis,
            "urgency_level": urgency,
            "notification_settings": {
                "send_email_notification": urgency in ["high", "urgent"],
                "send_sms_notification": urgency == "urgent"
            },
            "requires_review": True,
            "allow_client_reply": True
        }
        
        return portal_draft
    
    def analyze_call_transcript(self, transcript: str, call_duration: int = 0, participant_names: list = None):
        print(f"\n=== Analyzing Call Transcript ===")
        
        emotion_analysis = self.analyze_emotion(transcript)
        action_items = self.extract_action_items(transcript)
        urgency = self.detect_urgency_level(transcript)
        
        questions = [line for line in transcript.split('\n') if '?' in line]
        
        analysis = {
            "channel": "phone_call",
            "call_duration_minutes": call_duration,
            "participants": participant_names or [],
            "emotion_analysis": emotion_analysis,
            "key_topics": self._extract_keywords(transcript),
            "questions_asked": questions,
            "action_items": action_items,
            "urgency_level": urgency,
            "follow_up_required": len(action_items) > 0 or urgency in ["high", "urgent"],
            "summary_length": len(transcript.split()),
            "requires_attorney_review": urgency == "urgent" or len(questions) > 3,
            "suggested_next_steps": []
        }
        
        return analysis
    

    async def process_communication(self, input_data):
        print(f"\n{'='*60}")
        print("Client Communication Agent Initialized")
        print(f"{'='*60}\n")

        APP_NAME = "SimplyLaw"

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
    
    test_message = "I'm really frustrated. It's been 3 weeks and I haven't heard anything about my case :("
    result = asyncio.run(agent.process_communication({
        "message": test_message,
        "ID": {"userid": "user1", "sessionid": "session1"}
    }))

    print("comms agent result:", result)
