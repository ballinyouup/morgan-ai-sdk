import os
from dotenv import load_dotenv
from google.adk.agents import Agent
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
import asyncio
from google.genai import types
from datetime import datetime, timedelta
from typing import Dict, List, Any
import json


load_dotenv(".env")

MODEL_ID = "gemini-2.0-flash-exp"


class RecordWranglerAgent:
    def __init__(self):
        self.api_key = os.getenv("GOOGLE_API_KEY")
        if not self.api_key:
            raise ValueError("GOOGLE_API_KEY not set")
        
        self.reason_chain = []

        # Remove heavy ML dependencies - let the AI agent do the work
        # self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        # self.ner_pipeline = pipeline("ner", model="d4data/biomedical-ner-all", aggregation_strategy="simple", device=0 if torch.cuda.is_available() else -1)

        self.agent = Agent(
            name="records_wrangler",
            model=MODEL_ID,
            description="Extracts medical records, bills, and manages provider outreach for legal cases.",
            instruction=self.get_instruction(),
            tools=[
                self.extract_medical_info,
                self.identify_missing_records,
                self.draft_provider_outreach,
                self.categorize_document,
                self.track_record_request,
            ],
        )

    def get_instruction(self):
        return """You are the Records Wrangler for LexiLoop, a specialized agent for managing medical records and bills.

Your responsibilities:
1. Extract Medical Information:
   - Provider names, addresses, phone numbers
   - Treatment dates and visit information
   - Bill amounts and insurance details
   - Medical record references
   - Injury descriptions and diagnoses

2. Identify Missing Records:
   - Compare mentioned providers against received records
   - Flag gaps in treatment timelines
   - Identify missing bills or invoices
   - Note incomplete documentation

3. Provider Outreach:
   - Draft HIPAA-compliant record requests
   - Create follow-up messages for pending requests
   - Generate authorization forms when needed
   - Track response deadlines

4. Document Organization:
   - Categorize records by type (medical records, bills, imaging, etc.)
   - Tag by provider and date
   - Prioritize by case relevance
   - Flag urgent or high-value documents

5. Reason Chain Logging:
   - Log every decision with clear reasoning
   - Track extraction confidence levels
   - Document all outreach attempts
   - Maintain audit trail for compliance

Guidelines:
- Always be HIPAA compliant in communications
- Use professional medical terminology correctly
- Verify provider information before outreach
- Set appropriate follow-up timelines (typically 30 days)
- Flag potential authorization issues early
- Prioritize records that strengthen the case
- Never share protected health information without proper authorization
- Include request reference numbers for tracking

Record Request Best Practices:
- Use client's full legal name and DOB
- Specify exact date ranges needed
- Request itemized bills separately from medical records
- Include authorization form reference
- Set clear deadline (typically 30 days from request)
- Request electronic delivery when possible
- Include case reference number

You are the backbone of case documentation - thorough, organized, and proactive."""

    def log_reasoning(self, action: str, reasoning: str, data):
        entry = {
            "timestamp": datetime.now().isoformat(),
            "action": action,
            "reasoning": reasoning,
            "data": data or {},
            "confidence": data.get("confidence") if data else None
        }
        self.reason_chain.append(entry)
        print(f"\n[REASON CHAIN] {action}: {reasoning}")
        if data:
            print(f"   Data: {json.dumps(data, indent=2)}")

    def extract_medical_info(self, message: str):
        """
        Extract medical information from text. The AI agent analyzes the message
        and returns structured medical data.
        
        Args:
            message: The text to analyze for medical information
            
        Returns:
            A JSON string containing extracted medical information in the format:
            {
                "providers": [{"name": str, "type": str, "confidence": float}],
                "treatment_dates": [{"date": str, "context": str}],
                "bills": [{"amount": str, "provider": str, "description": str}],
                "injuries": [{"description": str, "severity": str}],
                "insurance_info": {"carrier": str, "policy_number": str, "details": str},
                "contact_info": [{"type": str, "value": str}],
                "confidence": str
            }
        """
        print(f"\n=== Extracting Medical Information ===")
        print(f"Analyzing: {message[:100]}...")
        
        self.log_reasoning(
            "extract_medical_info",
            "Analyzing message for medical entities, dates, bills, and injuries",
            {"message_length": len(message)}
        )
        
        return json.dumps({
            "instruction": "Analyze the provided message and extract ALL medical information including: provider names and types, treatment/visit dates with context, bill amounts with descriptions, injury/diagnosis descriptions with severity, insurance information, and contact details. Return as structured JSON with confidence assessment.",
            "message": message
        })

    def identify_missing_records(self, 
                                 extracted_info: str,
                                 existing_records: str = "[]") -> str:
        """
        Identify missing medical records by comparing mentioned providers against received records.
        The AI agent performs intelligent gap analysis and generates recommendations.
        
        Args:
            extracted_info: JSON string of extracted medical information
            existing_records: JSON string array of existing records with provider, type, and date
            
        Returns:
            A JSON string containing:
            {
                "missing_providers": [{"name": str, "reason": str, "priority": str}],
                "missing_bills": [{"provider": str, "estimated_amount": str}],
                "date_gaps": [{"start": str, "end": str, "days": int, "concern": str}],
                "missing_documents": [{"type": str, "provider": str, "reason": str}],
                "priority": str,
                "recommendations": [{"action": str, "urgency": str, "details": str}],
                "timeline_concerns": [str]
            }
        """
        print(f"\n=== Identifying Missing Records ===")
        
        self.log_reasoning(
            "identify_missing_records",
            "Analyzing extracted info against existing records to find gaps",
            {"has_existing_records": existing_records != "[]"}
        )
        
        return json.dumps({
            "instruction": "Compare the extracted medical information with existing records. Identify: 1) Providers mentioned but records not received, 2) Providers with medical records but missing bills, 3) Timeline gaps in treatment, 4) Missing document types (imaging, labs, etc.), 5) Generate prioritized recommendations for record requests. Be thorough and consider what documents SHOULD exist based on the medical context.",
            "extracted_info": extracted_info,
            "existing_records": existing_records
        })

    def draft_provider_outreach(self,
                                provider_name: str,
                                client_name: str,
                                client_dob: str,
                                treatment_dates: str,
                                record_type: str = "medical records") -> str:
        """
        Draft HIPAA-compliant outreach message to medical provider for records request.
        The AI agent generates professional, legally compliant correspondence.
        
        Args:
            provider_name: Name of the medical provider
            client_name: Full legal name of the client/patient
            client_dob: Client's date of birth (MM/DD/YYYY)
            treatment_dates: Date range of treatment
            record_type: Type of records requested (default: "medical records")
            
        Returns:
            A JSON string containing:
            {
                "reference_number": str,
                "provider": str,
                "client": str,
                "request_date": str,
                "deadline_date": str,
                "request_letter": str,
                "follow_up_email": str,
                "phone_script": str,
                "status": str,
                "requires_review": bool,
                "requires_authorization_form": bool,
                "special_instructions": [str]
            }
        """
        print(f"\n=== Drafting Provider Outreach ===")
        print(f"Provider: {provider_name}")
        print(f"Record Type: {record_type}")
        
        # Generate reference number
        ref_number = f"RR-{datetime.now().strftime('%Y%m%d')}-{hash(provider_name) % 10000:04d}"
        
        self.log_reasoning(
            "draft_provider_outreach",
            f"Generating HIPAA-compliant request for {record_type} from {provider_name}",
            {"reference": ref_number, "deadline_days": 30}
        )
        
        return json.dumps({
            "instruction": f"Draft a complete, professional, HIPAA-compliant medical records request package including: 1) Formal request letter with proper legal formatting, 2) Follow-up email template, 3) Phone call script for checking status. Use reference number {ref_number}. Include deadline of 30 days from today. The letter should be formal, legally sound, and include all necessary patient identifiers and authorization references. Also include specific instructions for the records department.",
            "reference_number": ref_number,
            "provider_name": provider_name,
            "client_name": client_name,
            "client_dob": client_dob,
            "treatment_dates": treatment_dates,
            "record_type": record_type,
            "request_date": datetime.now().strftime('%B %d, %Y'),
            "deadline_date": (datetime.now() + timedelta(days=30)).strftime('%B %d, %Y')
        })

    def categorize_document(self, document_info: str) -> str:
        """
        Categorize and tag medical documents for organization in case management system.
        The AI agent performs intelligent document analysis and classification.
        
        Args:
            document_info: JSON string containing document details:
                {
                    "id": str (optional),
                    "name": str,
                    "content": str,
                    "provider": str (optional),
                    "date": str (optional)
                }
                
        Returns:
            A JSON string containing:
            {
                "document_id": str,
                "original_name": str,
                "type": str,
                "subtype": str,
                "priority": str,
                "provider": str,
                "date_received": str,
                "document_date": str,
                "tags": [str],
                "key_findings": [str],
                "requires_attorney_review": bool,
                "case_relevance": str,
                "case_impact": str,
                "suggested_actions": [str],
                "billing_amount": str (if applicable)
            }
        """
        print(f"\n=== Categorizing Document ===")
        
        self.log_reasoning(
            "categorize_document",
            "Analyzing document for classification, tagging, and case relevance",
            {"timestamp": datetime.now().isoformat()}
        )
        
        return json.dumps({
            "instruction": "Analyze this medical document and provide comprehensive categorization. Determine: 1) Document type (billing, imaging, lab_results, prescription, discharge_summary, operative_report, medical_record, etc.), 2) Priority level based on content (high for surgeries, severe injuries, critical findings), 3) Relevant tags for organization, 4) Case relevance score (critical/high/medium/low), 5) Key findings that impact the case, 6) Whether attorney review is needed, 7) Case impact assessment, 8) Recommended next actions. Be thorough and consider legal case implications.",
            "document_info": document_info,
            "date_received": datetime.now().isoformat()
        })

    def track_record_request(self, 
                           reference_number: str, 
                           status: str, 
                           notes: str = "",
                           provider_name: str = "",
                           days_elapsed: int = 0) -> str:
        """
        Track and manage the status of record requests with intelligent follow-up recommendations.
        The AI agent provides context-aware status updates and next actions.
        
        Args:
            reference_number: Unique reference number for the request
            status: Current status (drafted, sent, pending, received, incomplete, follow_up_needed, overdue)
            notes: Additional notes about the status update
            provider_name: Name of the provider (optional)
            days_elapsed: Days since original request (optional)
            
        Returns:
            A JSON string containing:
            {
                "reference_number": str,
                "provider": str,
                "status": str,
                "last_updated": str,
                "notes": str,
                "next_action": str,
                "action_date": str,
                "urgency": str,
                "escalation_needed": bool,
                "recommended_approach": str,
                "follow_up_message": str (if applicable),
                "history": [{"timestamp": str, "status": str, "notes": str}]
            }
        """
        print(f"\n=== Tracking Record Request ===")
        print(f"Reference: {reference_number}")
        print(f"Status: {status}")
        
        self.log_reasoning(
            "track_record_request",
            f"Updating request {reference_number} status and determining next actions",
            {"status": status, "days_elapsed": days_elapsed}
        )
        
        return json.dumps({
            "instruction": "Analyze this record request status and provide intelligent tracking recommendations. Consider: 1) Current status and appropriate next action, 2) Timing for follow-up based on standard medical records request timelines (typically 30 days), 3) Escalation needs if overdue, 4) Draft follow-up message if needed, 5) Assess urgency level, 6) Recommend best approach (phone, email, certified mail), 7) Consider days elapsed and legal deadlines. Be proactive and strategic.",
            "reference_number": reference_number,
            "status": status,
            "notes": notes,
            "provider_name": provider_name,
            "days_elapsed": days_elapsed,
            "current_date": datetime.now().isoformat(),
            "standard_deadline_days": 30
        })

    def get_reason_chain(self) :
        """Return the complete reason chain for transparency."""
        return self.reason_chain

    async def process_request(self, input_data):
        print(f"\n{'='*60}")
        print("Records Wrangler Agent Initialized")
        print(f"{'='*60}\n")

        APP_NAME = "saulgoodman"
        USER_ID = input_data.get('ID', {}).get('userid', 'default_user')
        SESSION_ID = input_data.get('ID', {}).get('sessionid', f'session_{datetime.now().strftime("%Y%m%d%H%M%S")}')

        session_service = InMemorySessionService()
        await session_service.create_session(app_name=APP_NAME,user_id=USER_ID, session_id=SESSION_ID)

        runner = Runner(agent=self.agent,app_name=APP_NAME,csession_service=session_service)
        
        content = types.Content(role='user',cparts=[types.Part(text=input_data.get('message', ''))])

        events = runner.run(user_id=USER_ID,session_id=SESSION_ID, new_message=content)

        response_text = ""
        for event in events:
            if event.is_final_response():
                response_text = event.content.parts[0].text
        
        return {
            "response": response_text,
            "reason_chain": self.get_reason_chain(),
            "session_id": SESSION_ID
        }


if __name__ == "__main__":
    agent = RecordWranglerAgent()
    
    # Test 1: Extract medical information from a complex message
    print("\n" + "="*60)
    print("TEST 1: Extract Medical Information (AI-Driven)")
    print("="*60)
    print("Testing AI agent's ability to extract structured medical data...")
    
    test_message_1 = """
    I went to Dr. Sarah Johnson at Valley Medical Center on 3/15/2024. 
    They charged me $2,500 for the MRI and $800 for the consultation.
    I also saw Dr. Michael Chen at Riverside Hospital on April 2, 2024 for my back injury.
    My insurance is Blue Cross policy #12345. The nurse called me at 555-123-4567.
    """
    
    test_input_1 = {
        "message": f"Please extract all medical information from this message: {test_message_1}",
        "ID": {
            "userid": "test_user",
            "sessionid": "test_session_1"
        }
    }
    
    print("\n[Running Test 1...]")
    result_1 = asyncio.run(agent.process_request(test_input_1))
    print(f"\nExtraction Result:\n{result_1['response']}")
    

    # Test 2: Identify missing records with AI analysis
    print("\n" + "="*60)
    print("TEST 2: Identify Missing Records (AI-Driven)")
    print("="*60)
    print("Testing AI agent's gap analysis capabilities...")
    
    test_input_2 = {
        "message": """Analyze the following scenario and identify what medical records are missing:

Patient mentioned visiting:
- Dr. Sarah Johnson at Valley Medical Center on 3/15/2024
- Dr. Michael Chen at Riverside Hospital on April 2, 2024
- Emergency room visit on March 10, 2024

Records we currently have:
- Valley Medical Center: Medical record from 3/15/2024

What records are we missing? What should we request?""",
        "ID": {
            "userid": "test_user",
            "sessionid": "test_session_2"
        }
    }
    
    print("\n[Running Test 2...]")
    result_2 = asyncio.run(agent.process_request(test_input_2))
    print(f"\nMissing Records Analysis:\n{result_2['response']}")
    
    # Test 3: Draft provider outreach with AI
    print("\n" + "="*60)
    print("TEST 3: Draft Provider Outreach (AI-Generated)")
    print("="*60)
    print("Testing AI agent's ability to draft HIPAA-compliant correspondence...")
    
    test_input_3 = {
        "message": """Draft a complete medical records request package for:
- Provider: Riverside Hospital
- Patient: John Doe
- DOB: 01/15/1985  
- Treatment dates: April 2, 2024 - Present
- Record type: medical records and itemized billing

Please include the formal request letter, follow-up email, and phone script.""",
        "ID": {
            "userid": "test_user",
            "sessionid": "test_session_3"
        }
    }
    
    print("\n[Running Test 3...]")
    result_3 = asyncio.run(agent.process_request(test_input_3))
    print(f"\nOutreach Package:\n{result_3['response']}")
    
    # Test 4: Categorize document with AI intelligence
    print("\n" + "="*60)
    print("TEST 4: Categorize Document (AI-Driven)")
    print("="*60)
    print("Testing AI agent's document classification and analysis...")
    
    test_input_4 = {
        "message": """Categorize this medical document and assess its case relevance:

Document Name: MRI_Report_20240315.pdf
Provider: Valley Medical Center
Content: "MRI of lumbar spine performed on 3/15/2024. Findings: Severe herniated disc at L4-L5 with significant nerve root compression. Bilateral foraminal stenosis. Moderate degenerative disc disease. Recommendation: Surgical consultation advised. Patient reports severe radiating pain down left leg, numbness in foot. Unable to work for past 3 weeks."

Provide full categorization with tags, priority, case relevance, and recommended actions.""",
        "ID": {
            "userid": "test_user",
            "sessionid": "test_session_4"
        }
    }
    
    print("\n[Running Test 4...]")
    result_4 = asyncio.run(agent.process_request(test_input_4))
    print(f"\nDocument Analysis:\n{result_4['response']}")
    
    # Test 5: Track record request with intelligent follow-up
    print("\n" + "="*60)
    print("TEST 5: Track Record Request (AI-Managed)")
    print("="*60)
    print("Testing AI agent's request tracking and follow-up recommendations...")
    
    test_input_5 = {
        "message": """Track this record request and provide next steps:

Reference Number: RR-20241025-1234
Provider: Riverside Hospital  
Status: sent
Days Since Request: 18
Notes: Initial request sent via certified mail on October 7, 2024. No response received yet.

What should we do next? When should we follow up?""",
        "ID": {
            "userid": "test_user",
            "sessionid": "test_session_5"
        }
    }
    
    print("\n[Running Test 5...]")
    result_5 = asyncio.run(agent.process_request(test_input_5))
    print(f"\nTracking Update:\n{result_5['response']}")
    
    # Test 6: Complex multi-step scenario
    print("\n" + "="*60)
    print("TEST 6: Complex Case Analysis (Full AI Processing)")
    print("="*60)
    print("Testing AI agent with a comprehensive case scenario...")
    
    test_input_6 = {
        "message": """I need help managing medical records for a personal injury case:

Client: Jane Smith, DOB 05/20/1990
Accident Date: September 15, 2024 (car accident)

Client's statement: "After the accident, the ambulance took me to St. Mary's Hospital ER. They did X-rays and a CT scan. I was there for about 6 hours and they charged me $8,500. The next week I started seeing Dr. Anderson at Back & Spine Clinic for physical therapy - I've been going twice a week since then. They bill $250 per session. I also went to Dr. Martinez, an orthopedic surgeon, who ordered an MRI at Valley Imaging Center. The MRI showed two herniated discs. Dr. Martinez says I might need surgery. My insurance is State Farm, but they're being difficult about covering everything."

What medical records do we need to request? Who should we contact first? Draft the most important request letter.""",
        "ID": {
            "userid": "test_user",
            "sessionid": "test_session_6"
        }
    }
    
    print("\n[Running Test 6...]")
    result_6 = asyncio.run(agent.process_request(test_input_6))
    print(f"\nComprehensive Case Analysis:\n{result_6['response']}")
    print(f"\n\nTotal Reason Chain Entries: {len(result_6['reason_chain'])}")
    
    print("\n" + "="*60)
    print("ALL TESTS COMPLETED")
    print("="*60)
    print("The agent is now using AI to perform analysis rather than hardcoded logic.")
    print("Each tool provides context to the AI, which then generates intelligent responses.")


