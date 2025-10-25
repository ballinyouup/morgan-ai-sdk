import os
from dotenv import load_dotenv
from google.adk.agents import Agent
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types
import pytesseract
import cv2
import asyncio
import re
import json

load_dotenv(".env")

MODEL_ID = "gemini-2.5-flash"

class DocuAgent:
    def __init__(self):
        self.api_key = os.getenv("GOOGLE_API_KEY")
        if not self.api_key:
            raise ValueError("GOOGLE_API_KEY not set")
        
        self.agent = Agent(
            name="docu_agent",
            model=MODEL_ID,
            description="Assists with document-related tasks such as summarization, extraction, and analysis.",
            instruction=self.get_instruction(),
            tools=[
                self.extract_text_from_image,
                self.summarize_document,
                self.classify_document,
                self.extract_key_information,
            ])
        
    
    def get_instruction(self):
        return """You are the Docu Agent for LexiLoop, specializing in document-related tasks.

Your responsibilities:
1. Extract text from images and scanned documents using OCR
2. Summarize legal documents into clear, actionable insights
3. Classify documents by type (medical records, police reports, bills, correspondence, etc.)
4. Extract key information like dates, amounts, parties involved, and critical facts
5. Identify missing documents that may be needed for the case
6. Organize documents logically for attorney review
7. Flag urgent or time-sensitive content in documents

Document Classification Types:
- Medical Records (bills, treatment notes, diagnoses)
- Police/Incident Reports
- Insurance Documents (policies, claims, correspondence)
- Financial Documents (bills, wages, expenses)
- Legal Documents (contracts, agreements, court filings)
- Communications (emails, letters, text messages)
- Evidence (photos, videos, physical evidence documentation)

Extraction Guidelines:
- Always note document date and source
- Highlight dollar amounts, deadlines, and dates
- Identify all parties mentioned (names, organizations)
- Extract contact information when present
- Flag inconsistencies or missing information
- Preserve legal terminology while adding plain language summaries

Quality Standards:
- High accuracy in OCR and extraction
- Clear, structured summaries
- Consistent classification
- Actionable insights for attorneys
- Privacy-conscious handling of sensitive information

You help attorneys process documents faster and clients understand their case materials better.
Always maintain confidentiality and accuracy in all document processing tasks.
"""
    
    def extract_text_from_image(self, image_path: str) -> dict:
            if not os.path.exists(image_path):
                return {
                    "success": False,
                    "error": f"Image file not found: {image_path}",
                    "text": ""
                }
            
            image = cv2.imread(image_path)
            if image is None:
                return {
                    "success": False,
                    "error": f"Failed to read image: {image_path}",
                    "text": ""
                }

            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            text = pytesseract.image_to_string(thresh)
            
            return {
                "success": True,
                "text": text,
                "image_path": image_path,
                "confidence": "high" if len(text) > 50 else "low",
                "preprocessed": True
            }
    
    def summarize_document(self, document_text: str, document_type: str = "general"):
        word_count = len(document_text.split())
        
        summary_template = {
            "document_type": document_type,
            "word_count": word_count,
            "summary_sections": {
                "overview": "Brief overview will be generated",
                "key_points": [],
                "action_items": [],
                "dates_mentioned": [],
                "amounts_mentioned": [],
            },
            "requires_attorney_review": True,
            "priority": "normal"
        }
        
        return summary_template
    
    def classify_document(self, document_text: str, filename: str = ""):
        document_text_lower = document_text.lower()
        filename_lower = filename.lower()
        
        # Simple keyword-based classification, not gonna use text l
        classifications = {
            "medical": ["medical", "doctor", "hospital", "diagnosis", "treatment", "prescription", "patient"],
            "police_report": ["police", "incident", "report", "officer", "accident", "citation"],
            "insurance": ["insurance", "policy", "claim", "coverage", "premium", "insured"],
            "financial": ["invoice", "bill", "payment", "amount due", "receipt", "statement"],
            "legal": ["contract", "agreement", "court", "filing", "motion", "plaintiff", "defendant"],
            "correspondence": ["dear", "sincerely", "email", "letter", "correspondence"],
            "evidence": ["photo", "image", "video", "evidence", "exhibit"]
        }
        
        scores = {}
        for doc_type, keywords in classifications.items():
            score = sum(1 for keyword in keywords if keyword in document_text_lower or keyword in filename_lower)
            scores[doc_type] = score
        
        primary_type = max(scores, key=scores.get) if max(scores.values()) > 0 else "general"
        confidence = min(max(scores.values()) / 3, 1.0)
        
        return {
            "primary_type": primary_type,
            "confidence": confidence,
            "filename": filename,
            "suggested_category": primary_type.replace("_", " ").title()
        }
    
    def extract_key_information(self, document_text: str):
        date_pattern = r'\b\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\b|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4}\b'
        dates = re.findall(date_pattern, document_text, re.IGNORECASE)
        amount_pattern = r'\$\s*\d{1,3}(?:,\d{3})*(?:\.\d{2})?'
        amounts = re.findall(amount_pattern, document_text)
        
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        emails = re.findall(email_pattern, document_text)
        
        phone_pattern = r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b|\(\d{3}\)\s*\d{3}[-.]?\d{4}'
        phones = re.findall(phone_pattern, document_text)
        
        return {
            "dates": dates[:10],  # Limit to first 10
            "amounts": amounts[:10],
            "emails": emails[:5],
            "phones": phones[:5],
            "extracted_count": {
                "dates": len(dates),
                "amounts": len(amounts),
                "contacts": len(emails) + len(phones)
            }
        }

    async def process_document(self, input_data):
        print(f"\n{'='*60}")
        print("Document Agent Initialized")
        print(f"{'='*60}\n")

        APP_NAME = "saulgoodman"

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
    agent = DocuAgent()
    print("=" * 60)
    print("Testing Docu Agent - Image and Text Processing")
    print("=" * 60)
    
    image_path = "AI/data/test/case_1/norwood.jpg"
    print(f"\n[Test 1] Extracting text from image: {image_path}")
    
    if os.path.exists(image_path):
        ocr_result = agent.extract_text_from_image(image_path)
        print(f"OCR Success: {ocr_result['success']}")
        if ocr_result['success']:
            print(f"Extracted Text Preview: {ocr_result['text'][:200]}...")
            print(f"Confidence: {ocr_result['confidence']}")
            extracted_text = ocr_result['text']
        else:
            print(f"OCR Error: {ocr_result['error']}")
            extracted_text = ""
    else:
        print(f"Image not found at {image_path}, using sample text instead")
        extracted_text = ""

    
    if extracted_text:
        document_to_analyze = extracted_text
        print("\n[Using extracted text from image for analysis]")
    

    print("\n" + "=" * 60)
    print("[Test 2] Document Classification")
    print("=" * 60)
    classification = agent.classify_document(document_to_analyze, "medical_bill.pdf")
    print("Classification Result:")
    print(json.dumps(classification, indent=2))
    

    print("\n" + "=" * 60)
    print("[Test 3] Key Information Extraction")
    print("=" * 60)
    extracted = agent.extract_key_information(document_to_analyze)
    print("Extracted Information:")
    print(json.dumps(extracted, indent=2))
    
    print("\n" + "=" * 60)
    print("[Test 4] Document Summary")
    print("=" * 60)
    summary = agent.summarize_document(document_to_analyze, classification['primary_type'])
    print("Summary:")
    print(json.dumps(summary, indent=2))
    
    print("\n" + "=" * 60)
    print("[Test 5] Async Agent Processing")
    print("=" * 60)
    
    analysis_request = f"""
    I have a document that needs analysis. Here's the content:
    
    {document_to_analyze[:500]}...
    
    Please:
    1. Classify this document
    2. Extract all key information (dates, amounts, contacts)
    3. Identify any urgent items or deadlines
    4. Provide a brief summary for the attorney
    """
    
    test_input = {
        "message": analysis_request,
        "ID": {"userid": "user1", "sessionid": "session1"}
    }
    
    print("Processing document with agent...")
    result = asyncio.run(agent.process_document(test_input))
    print("\nAgent Response:")
    print(result)
    
    print("\n" + "=" * 60)
    print("All tests completed!")
    print("=" * 60)