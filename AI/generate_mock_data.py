import asyncio
import os
import sys
from datetime import datetime, timedelta
import random
import json
from typing import List, Dict
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import asyncpg
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv('DATABASE_URL')

CASE_TYPES = [
    "Personal Injury - Car Accident",
    "Personal Injury - Slip and Fall",
    "Workers Compensation",
    "Medical Malpractice",
    "Product Liability",
    "Wrongful Death",
    "Dog Bite Injury",
    "Premises Liability"
]

CLIENT_NAMES = [
    "Sarah Johnson", "Michael Chen", "Emma Rodriguez", "David Williams",
    "Lisa Thompson", "James Martinez", "Amanda Davis", "Robert Garcia",
    "Jennifer Lee", "Christopher Brown", "Maria Gonzalez", "William Taylor"
]

EMAIL_TEMPLATES = [
    {
        "type": "client_update",
        "subject": "Re: My accident claim - medical bills",
        "body": """Hi,

I hope this email finds you well. I just got back from my follow-up appointment with Dr. Anderson and wanted to update you. The pain in my lower back is still pretty bad, especially when I sit for more than 30 minutes. The doctor said I might need physical therapy for another 6-8 weeks.

I'm attaching the bills from my last visit - it was $450 for the consultation and $200 for the X-rays. Also, I haven't heard back from the insurance adjuster since last month. Should I be worried?

Thanks for all your help,
{client_name}""",
        "actionable": True,
        "task_type": "records_request",
        "priority": "medium"
    },
    {
        "type": "insurance_adjuster",
        "subject": "Settlement Offer - Claim #INS-{claim_number}",
        "body": """Dear Counsel,

This letter serves to tender the full policy limits of $100,000 for the above-referenced claim. This offer is valid for 30 days from the date of this letter and is contingent upon receipt of a full and final release.

Please note that our insured maintains their position regarding comparative negligence, but we believe this offer represents a fair resolution given the circumstances.

We request medical records, itemized bills, and a signed settlement agreement by {deadline_date}.

Sincerely,
Claims Adjuster
Pacific Insurance Group""",
        "actionable": True,
        "task_type": "settlement_review",
        "priority": "high"
    },
    {
        "type": "opposing_counsel",
        "subject": "Discovery Responses - Case No. 2024-CV-{case_number}",
        "body": """Counsel,

Please find attached our responses to your First Set of Interrogatories and Request for Production of Documents. We have objected to several requests as overly broad and not reasonably calculated to lead to the discovery of admissible evidence.

We would like to schedule the deposition of your client for sometime in the next 45 days. Please provide three available dates.

Additionally, we will be filing a Motion for Summary Judgment on the issue of causation by {motion_deadline}.

Regards,
Attorney Sarah Mitchell
Mitchell & Associates""",
        "actionable": True,
        "task_type": "scheduling",
        "priority": "high"
    },
    {
        "type": "client_text_messy",
        "subject": "Text Message from Client",
        "body": """hey i know its late but i was thinking about the case and umm i forgot to mention that the store manager actually saw me fall and he even wrote down his contact info on a napkin but i cant find it now... also my neighbor said she knows someone who fell there too like 6 months ago?? should i try to find them? oh and the medical bills keep coming i got another one today for $1200 from the ER visit 😞 let me know what to do thx""",
        "actionable": True,
        "task_type": "evidence_gathering",
        "priority": "medium"
    },
    {
        "type": "medical_provider",
        "subject": "RE: Medical Records Request for Patient {client_name}",
        "body": """Dear Morgan & Morgan,

We are in receipt of your request for medical records dated {request_date}. Please note that we require the following to process your request:

1. Signed HIPAA authorization form (we did not receive this)
2. Payment of $50.00 for copying fees
3. Clarification of date range - you requested "all records" which spans 15 years

Once we receive the above items, please allow 10-15 business days for processing.

Medical Records Department
City General Hospital""",
        "actionable": True,
        "task_type": "records_request",
        "priority": "medium"
    },
    {
        "type": "call_transcript",
        "subject": "Call Transcript - Client Check-in with {client_name}",
        "body": """[Call Duration: 8:34]
[Timestamp: {call_time}]

Paralegal: Hi {client_name}, this is Jessica from Morgan & Morgan. How are you doing today?

Client: Oh, hi Jessica. Uhh, I'm okay I guess. Still dealing with all this.

Paralegal: I understand. I wanted to check in about your treatment. Are you still seeing Dr. Roberts?

Client: Yeah, yeah I am. Actually, umm, he wants me to see a specialist now because the shoulder isn't healing right. He mentioned something about possible surgery? I don't know, it's all so confusing.

Paralegal: I see. Have you scheduled an appointment with the specialist yet?

Client: No, not yet. His office said they need a referral or something and I wasn't sure if insurance would cover it since this is related to the accident. Plus I've been missing so much work already...

Paralegal: Okay, don't worry. We can help coordinate that. Have you been documenting your missed work days?

Client: Kind of? I have some of the dates written down but not all of them. My boss has been pretty understanding but I know I can't keep missing days.

Paralegal: Alright, I'm going to have our team reach out to Dr. Roberts' office about the referral and we'll also help you document the lost wages. Do you have any other questions?

Client: Actually, yeah. The insurance company keeps calling me directly. Should I be talking to them?

Paralegal: No, please don't speak with them directly. All communication should go through us. If they call, just give them our office number.

Client: Okay, got it. Thanks Jessica.

[END TRANSCRIPT]""",
        "actionable": True,
        "task_type": "multi_action",
        "priority": "high"
    },
    {
        "type": "court_filing_reminder",
        "subject": "URGENT: Response Deadline - Case No. {case_number}",
        "body": """DEADLINE ALERT

Case: {client_name} v. {defendant_name}
Case Number: 2024-CV-{case_number}
Court: Circuit Court, 9th Judicial District

Response to Motion for Summary Judgment DUE: {deadline_date}

Opposing counsel filed a Motion for Summary Judgment arguing lack of causation. We need to:
1. Draft opposition memorandum
2. Obtain expert declaration from Dr. Henderson
3. File responsive pleading with supporting evidence
4. Prepare for potential oral argument

This is a critical motion that could dispose of the case. Please prioritize.

Assigned: Senior Attorney Review Required""",
        "actionable": True,
        "task_type": "legal_research",
        "priority": "critical"
    },
    {
        "type": "client_portal_message",
        "subject": "New Message from {client_name} - Document Upload",
        "body": """Subject: Important photos and documents

Hi team,

I'm uploading some photos I took right after the accident. Sorry it took so long, I just found them on my old phone. There are also some text messages between me and the property owner that might be helpful.

Also attaching:
- Repair bill for my car ($4,500)
- Photos of the intersection where it happened
- Screenshots of messages with the other driver
- My work schedule showing days I missed

One more thing - my daughter was in the car with me and she's been having nightmares about the accident. Is that something we should document? She's only 8.

Please let me know if you need anything else.

[Attachments: 8 files uploaded]""",
        "actionable": True,
        "task_type": "evidence_sorting",
        "priority": "medium"
    },
    {
        "type": "demand_letter_prep",
        "subject": "RE: Preparing Demand Package for {client_name}",
        "body": """Team,

We're at the point where we need to prepare the demand letter and package for the insurance company. Client's treatment is complete as of last week.

Here's what we have:
- Total medical bills: $47,350
- Lost wages: $12,800 (documented)
- Property damage: $8,200
- Treatment duration: 14 months
- Permanent impairment rating: 15% (per IME)

What we're missing:
- Final narrative report from treating physician
- Updated photos showing scarring
- Client's personal statement about daily impact
- Comparative case verdicts for similar injuries in our jurisdiction

Can we get the missing items within the next 2 weeks? I'd like to send the demand by end of month while we still have momentum.

Let me know thoughts on demand amount. I'm thinking $275,000 given the policy limits are $300,000.

Thanks,
Lead Attorney""",
        "actionable": True,
        "task_type": "demand_preparation",
        "priority": "high"
    },
    {
        "type": "mediator_scheduling",
        "subject": "Mediation Scheduling - Multiple Parties",
        "body": """Dear Counsel,

I am writing to coordinate the mediation date for the above matter. We have the following parties and counsel that need to attend:

- Plaintiff: {client_name} (Morgan & Morgan)
- Defendant 1: Property Owner (represented by Jenkins & Cole)
- Defendant 2: Management Company (represented by Stewart Law)
- Insurance Carrier Representative (Pacific Insurance)

I have tentative availability on the following dates:
- March 15, 2025 (full day)
- March 22, 2025 (full day)
- April 3, 2025 (full day)

Please respond with your availability at your earliest convenience. The mediation will be held at my office in downtown and we should plan for a full day.

Also, please submit mediation statements one week prior to the scheduled date.

Best regards,
Hon. Thomas Chen (Ret.)
Professional Mediator""",
        "actionable": True,
        "task_type": "scheduling",
        "priority": "medium"
    }
]

MESSY_COMMUNICATIONS = [
    {
        "type": "text_message",
        "body": """yo so i was at physical therapy today and the therapist said something about a lien??? what does that mean?? also they want me to come 3x a week but thats like impossible with my work schedule... can they do 2x instead? also still waiting on that call back about my rental car reimbursement u said u would look into last week"""
    },
    {
        "type": "voicemail_transcript",
        "body": """[VOICEMAIL TRANSCRIPT - Low Quality Audio]

Hi this is, uh, this is {client_name}. I'm calling because... [inaudible] ...the doctor's office and they said something about... [background noise] ...authorization? I don't know. Um, they also gave me this prescription but I don't know if I should fill it because it's really expensive and... [phone beeps] ...anyway, can someone call me back? My number is... [inaudible] ...okay bye.

[END VOICEMAIL - Callback number may be unclear]"""
    },
    {
        "type": "email_thread_mess",
        "body": """---------- Forwarded message ---------
From: {client_name}
Date: [Yesterday at 2:47 PM]
Subject: Fwd: Fwd: RE: claim

forwarding this because i dont understand what theyre asking for

---------- Forwarded message ---------
hey did you get my last email about the bills? also i talked to my neighbor who said her cousin is a lawyer and he said i should be getting way more money is that true? not that i dont trust you guys but just wondering. also can you call me today between 2-4pm i have questions

also i forgot to mention the guy who hit me? i saw him at the grocery store last week and he totally avoided me like pretended he didn't see me. thats weird right? should i have talked to him?

one more thing my back has been worse since the weather changed can i go back to the doctor even though u said im done with treatment?

ok let me know
thx"""
    }
]

async def create_chat_with_messages(conn, messages: List[Dict[str, str]]):
    chat_id = await conn.fetchval(
        'INSERT INTO "Chat" (id) VALUES (gen_random_uuid()::text) RETURNING id'
    )
    
    for msg in messages:
        await conn.execute(
            '''
            INSERT INTO "Message" (id, role, text, "chatId")
            VALUES (gen_random_uuid()::text, $1, $2, $3)
            ''',
            msg['role'], msg['text'], chat_id
        )
    
    return chat_id

def generate_conversation(template: Dict, client_name: str):
    messages = []
    
    messages.append({
        "role": "system",
        "text": "You are an AI legal assistant for Morgan & Morgan helping to analyze incoming communications and identify actionable tasks. You should detect what type of specialist agent should handle this task and what specific actions need to be taken."
    })
    
    case_number = random.randint(10000, 99999)
    claim_number = f"{random.randint(100000, 999999)}"
    deadline_date = (datetime.now() + timedelta(days=random.randint(15, 45))).strftime("%B %d, %Y")
    request_date = (datetime.now() - timedelta(days=random.randint(5, 20))).strftime("%B %d, %Y")
    call_time = (datetime.now() - timedelta(hours=random.randint(1, 48))).strftime("%B %d, %Y at %I:%M %p")
    defendant_name = random.choice(["Acme Properties LLC", "Smith Enterprises", "Valley View Corp", "Metro Services Inc"])
    motion_deadline = (datetime.now() + timedelta(days=random.randint(20, 35))).strftime("%B %d, %Y")
    
    body = template['body'].format(
        client_name=client_name,
        case_number=case_number,
        claim_number=claim_number,
        deadline_date=deadline_date,
        request_date=request_date,
        call_time=call_time,
        defendant_name=defendant_name,
        motion_deadline=motion_deadline
    )
    
    communication_text = f"**Subject:** {template['subject'].format(client_name=client_name, case_number=case_number, claim_number=claim_number)}\n\n**Type:** {template['type']}\n\n**Content:**\n{body}"
    
    if template.get('actionable'):
        communication_text += f"\n\n**Priority:** {template['priority']}\n**Suggested Task Type:** {template['task_type']}"
    
    messages.append({
        "role": "user",
        "text": communication_text
    })
    
    response = generate_assistant_response(template, client_name)
    messages.append({
        "role": "assistant",
        "text": response
    })
    
    return messages

def generate_assistant_response(template: Dict, client_name: str):
    task_type = template.get('task_type', 'general')
    priority = template.get('priority', 'medium')
    
    responses = {
        "records_request": f"""## Analysis Complete

**Communication Type:** Medical Records Request
**Priority:** {priority.upper()}
**Actionable:** Yes

### Identified Tasks:
1. **Specialist:** Records Wrangler
   - Action: Request missing medical records from Dr. Anderson
   - Details: Need follow-up visit notes, X-ray reports, and physical therapy prescription
   
2. **Specialist:** Client Communication Guru
   - Action: Send acknowledgment to {client_name}
   - Details: Confirm receipt of bills and provide update on insurance adjuster communication timeline

### Required Information:
- Medical provider contact information
- Signed HIPAA authorization (verify on file)
- Itemized bill verification ($450 consultation + $200 X-rays)

### Recommended Next Steps:
- Draft medical records request letter (template MR-001)
- Follow up with insurance adjuster regarding claim status
- Update client on expected timeline

**Would you like me to draft the records request letter and client communication?**""",
        
        "settlement_review": f"""## Analysis Complete

**Communication Type:** Policy Limits Tender Offer
**Priority:** CRITICAL
**Actionable:** Yes - TIME SENSITIVE

### Identified Tasks:
1. **Specialist:** Legal Researcher
   - Action: Review settlement offer against case value
   - Details: $100,000 policy limits tender with 30-day deadline
   
2. **Specialist:** Records Wrangler
   - Action: Compile complete medical records and bills
   - Details: Ensure all treatment documentation is current and itemized
   
3. **Specialist:** Client Communication Guru
   - Action: Schedule client consultation to discuss offer
   - Details: Explain policy limits, comparative negligence implications, and settlement recommendation

### Critical Deadlines:
- Settlement offer expires: 30 days from tender date
- Response required by: {(datetime.now() + timedelta(days=25)).strftime("%B %d, %Y")}

### Financial Analysis Needed:
- Total medical expenses to date
- Future medical needs assessment
- Lost wage calculation
- Pain and suffering valuation
- Policy limits vs. case value comparison

**URGENT: This requires immediate attorney review and client consultation.**""",
        
        "scheduling": f"""## Analysis Complete

**Communication Type:** Deposition/Mediation Scheduling
**Priority:** {priority.upper()}
**Actionable:** Yes

### Identified Tasks:
1. **Specialist:** Voice Bot Scheduler
   - Action: Coordinate deposition dates for {client_name}
   - Details: Provide 3 available dates within next 45 days, coordinate with client schedule
   
2. **Specialist:** Legal Researcher
   - Action: Monitor Motion for Summary Judgment deadline
   - Details: Research causation standards and prepare opposition strategy

### Scheduling Requirements:
- Client availability check
- Conference room booking
- Court reporter scheduling
- Prepare client for deposition (schedule prep session)

### Legal Deadlines to Track:
- Deposition date selection
- Motion for Summary Judgment filing deadline
- Opposition response due date

**Would you like me to send calendar availability options to the client?**""",
        
        "evidence_gathering": f"""## Analysis Complete

**Communication Type:** Unstructured Client Communication
**Priority:** {priority.upper()}
**Actionable:** Yes - Multiple Tasks Identified

### Identified Tasks:
1. **Specialist:** Evidence Sorter
   - Action: Document witness information (store manager)
   - Details: Attempt to locate manager's contact information, create witness contact list
   
2. **Specialist:** Legal Researcher
   - Action: Investigate similar incidents at location
   - Details: Research potential notice issues, prior complaints, pattern evidence
   
3. **Specialist:** Records Wrangler
   - Action: Process new medical bill ($1,200 ER visit)
   - Details: Add to case ledger, verify against EOB, update damages calculation

4. **Specialist:** Client Communication Guru
   - Action: Send guidance to {client_name}
   - Details: Clear instructions on witness outreach, bill organization, evidence preservation

### Evidence to Preserve:
- Store manager contact information (search for receipt, security footage)
- Neighbor's witness lead (potential similar incident)
- Medical bill verification
- Timeline documentation

**This communication requires task prioritization and clear client guidance.**""",
        
        "evidence_sorting": f"""## Analysis Complete

**Communication Type:** Client Portal Document Upload
**Priority:** {priority.upper()}
**Actionable:** Yes

### Identified Tasks:
1. **Specialist:** Evidence Sorter
   - Action: Process 8 uploaded files
   - Details: Extract, label, and organize into case management system (Salesforce)
   - Files: Accident photos, repair bills, text messages, work schedule
   
2. **Specialist:** Legal Researcher
   - Action: Evaluate emotional distress claim for minor passenger
   - Details: Daughter (age 8) experiencing nightmares - research child passenger claims
   
3. **Specialist:** Client Communication Guru
   - Action: Acknowledge document receipt and address emotional distress question
   - Details: Request additional documentation for child's psychological impact

### Document Processing Checklist:
- ✓ Accident scene photos → Evidence folder
- ✓ Vehicle repair bill ($4,500) → Property damage
- ✓ Text message screenshots → Communications evidence
- ✓ Work schedule → Lost wages documentation

### Additional Investigation:
- Potential derivative claim for child passenger
- Psychological evaluation referral
- Impact statement from parent

**Files are ready for Salesforce integration. Should I proceed with organization?**""",
        
        "demand_preparation": f"""## Analysis Complete

**Communication Type:** Demand Package Preparation
**Priority:** {priority.upper()}
**Actionable:** Yes

### Identified Tasks:
1. **Specialist:** Records Wrangler
   - Action: Obtain missing documentation
   - Details: Final narrative report from physician, updated injury photos
   
2. **Specialist:** Legal Researcher
   - Action: Find comparable case verdicts
   - Details: Research similar injury cases in jurisdiction for valuation support
   
3. **Specialist:** Client Communication Guru
   - Action: Request client personal impact statement
   - Details: Guide client on documenting daily life limitations

### Demand Package Status:
**Complete:**
- Total medical bills: $47,350
- Lost wages: $12,800 (documented)
- Property damage: $8,200
- Treatment duration: 14 months
- Permanent impairment: 15%

**Missing:**
- Final physician narrative report
- Updated scarring photographs
- Client impact statement
- Comparable verdict research

### Valuation Analysis:
- Proposed demand: $275,000
- Policy limits: $300,000
- Economic damages: $68,350
- Non-economic multiplier: 3-4x recommended

**Timeline: 2 weeks to completion. Should I initiate missing document requests?**""",
        
        "legal_research": f"""## Analysis Complete

**Communication Type:** Critical Motion Response Required
**Priority:** CRITICAL - DEADLINE APPROACHING
**Actionable:** Yes

### Identified Tasks:
1. **Specialist:** Legal Researcher
   - Action: Research causation standards for opposition
   - Details: Find supporting case law, expert testimony requirements, similar successful oppositions
   
2. **Specialist:** Records Wrangler
   - Action: Coordinate expert declaration from Dr. Henderson
   - Details: Schedule expert review, draft declaration outline, obtain CV
   
3. **Specialist:** Evidence Sorter
   - Action: Compile all supporting medical evidence
   - Details: Organize treatment records, diagnostic reports, expert opinions

### Critical Deadline:
**Response Due:** Motion for Summary Judgment opposition must be filed
**Status:** Requires immediate senior attorney review

### Research Topics:
- Causation standards in personal injury cases
- Expert testimony admissibility (Daubert/Frye)
- Summary judgment burden of proof
- Medical causation case law in jurisdiction

### Required Deliverables:
1. Opposition memorandum of law
2. Expert declaration (Dr. Henderson)
3. Supporting evidence exhibits
4. Proposed order denying motion

**This motion could dispose of the entire case. Immediate escalation required.**""",
        
        "multi_action": f"""## Analysis Complete

**Communication Type:** Client Call Transcript
**Priority:** {priority.upper()}
**Actionable:** Yes - Multiple Coordinated Tasks

### Identified Tasks:
1. **Specialist:** Records Wrangler
   - Action: Coordinate specialist referral with Dr. Roberts
   - Details: Obtain referral documentation, verify insurance pre-authorization
   
2. **Specialist:** Client Communication Guru
   - Action: Provide insurance communication guidance
   - Details: Confirm no direct contact with insurance adjuster, provide script for redirecting calls
   
3. **Specialist:** Evidence Sorter
   - Action: Compile lost wage documentation
   - Details: Create timeline of missed work days, obtain wage verification from employer

### Client Concerns Addressed:
- ✓ Specialist referral coordination
- ✓ Insurance coverage for treatment
- ✓ Lost wage documentation
- ✓ Direct insurance communication protocol

### Follow-up Required:
- Call Dr. Roberts' office regarding referral
- Send client lost wage documentation template
- Document missed work dates provided by client
- Confirm understanding of insurance communication rules

### Timeline:
- Immediate: Contact medical provider
- 24 hours: Send client follow-up email with instructions
- 3 days: Follow up on referral status

**Multiple specialists needed for coordinated response. Shall I create task assignments?**"""
    }
    
    return responses.get(task_type, f"""## Analysis Complete

**Communication Type:** General Legal Communication
**Priority:** {priority.upper()}
**Actionable:** {template.get('actionable', False)}

This communication requires review and appropriate specialist assignment based on content analysis.

**Suggested next steps:** Route to appropriate AI specialist for detailed task breakdown.""")

def generate_messy_communication(template: Dict, client_name: str):
    messages = []
    
    messages.append({
        "role": "system",
        "text": "You are an AI legal assistant for Morgan & Morgan. You excel at parsing messy, unstructured communications and extracting actionable tasks."
    })
    
    body = template['body'].format(client_name=client_name)
    
    messages.append({
        "role": "user",
        "text": f"**Incoming {template['type'].replace('_', ' ').title()}**\n\nFrom: {client_name}\n\n{body}"
    })
    
    messages.append({
        "role": "assistant",
        "text": """## Communication Parsed

**Type:** Unstructured Client Message
**Priority:** MEDIUM
**Clarity:** Low - Multiple topics, unclear questions

### Extracted Tasks:
1. **Specialist:** Client Communication Guru
   - Clarify lien question (likely medical provider lien)
   - Explain physical therapy schedule flexibility
   - Address rental car reimbursement status
   
2. **Specialist:** Records Wrangler
   - Contact physical therapy provider regarding schedule adjustment
   - Verify lien documentation
   
3. **Follow-up Required:**
   - Rental car reimbursement status check
   - Client education on lien process

### Recommended Response:
Draft clear, organized response addressing each concern separately with actionable information.

**Should I prepare a structured response for client?**"""
    })
    
    return messages

async def populate_database():
    print("🏛️  Starting Mock Data Generation for Morgan & Morgan AI Legal Tender Challenge")
    print("=" * 80)
    
    if not DATABASE_URL:
        print("❌ ERROR: DATABASE_URL not found in environment variables")
        print("Please set DATABASE_URL in your .env file")
        return
    
    try:
        print("\n📊 Connecting to database...")
        conn = await asyncpg.connect(DATABASE_URL, statement_cache_size=0)
        print("✅ Database connected successfully")
        
        print("\n🧹 Clearing existing data...")
        await conn.execute('DELETE FROM "Message"')
        await conn.execute('DELETE FROM "Chat"')
        print("✅ Existing data cleared")
        
        print("\n📝 Generating mock conversations...")
        chat_count = 0
        
        for i, template in enumerate(EMAIL_TEMPLATES):
            client_name = random.choice(CLIENT_NAMES)
            messages = generate_conversation(template, client_name)
            chat_id = await create_chat_with_messages(conn, messages)
            chat_count += 1
            print(f"  ✓ Created chat {chat_count}: {template['type']} - {client_name}")
        
        for i, template in enumerate(MESSY_COMMUNICATIONS):
            client_name = random.choice(CLIENT_NAMES)
            messages = generate_messy_communication(template, client_name)
            chat_id = await create_chat_with_messages(conn, messages)
            chat_count += 1
            print(f"  ✓ Created chat {chat_count}: {template['type']} - {client_name}")
        
        print("\n💬 Generating multi-turn conversations...")
        for i in range(3):
            client_name = random.choice(CLIENT_NAMES)
            messages = [
                {
                    "role": "system",
                    "text": "You are an AI legal assistant coordinating multiple tasks for a personal injury case."
                },
                {
                    "role": "user",
                    "text": f"I need help organizing all the tasks for {client_name}'s case. We have medical records to request, a settlement offer to review, and the client has been asking about their case status."
                },
                {
                    "role": "assistant",
                    "text": """I'll help you organize these tasks by priority and assign the appropriate specialists:

**Immediate Priority:**
1. Settlement Offer Review (Legal Researcher + Client Communication Guru)
2. Medical Records Request (Records Wrangler)
3. Client Status Update (Client Communication Guru)

Would you like me to create the task assignments?"""
                },
                {
                    "role": "user",
                    "text": "Yes, please create the tasks and draft the client status update email."
                },
                {
                    "role": "assistant",
                    "text": f"""**Tasks Created:**

Task #1: Settlement Review
- Assigned: Legal Researcher
- Priority: High
- Deadline: 48 hours

Task #2: Medical Records Request  
- Assigned: Records Wrangler
- Priority: High
- Provider: [To be specified]

Task #3: Client Update
- Assigned: Client Communication Guru
- Priority: Medium
- Draft below for approval:

---

Dear {client_name},

I wanted to provide you with an update on your case. We are currently reviewing a settlement proposal and gathering the final medical records needed to support your claim.

Here's where we stand:
- Medical treatment: Complete
- Records collection: In progress
- Settlement negotiations: Active

I'll be in touch within the next few days with more specific information. Please don't hesitate to reach out if you have any questions.

Best regards,
Morgan & Morgan Team

---

**Approve to send?**"""
                }
            ]
            chat_id = await create_chat_with_messages(conn, messages)
            chat_count += 1
            print(f"  ✓ Created multi-turn chat {chat_count}: Case Coordination - {client_name}")
        
        # Close connection
        await conn.close()
        
        print("\n" + "=" * 80)
        print(f"✅ SUCCESS! Generated {chat_count} mock conversations")
        print("\n📋 Summary:")
        print(f"  • Structured legal communications: {len(EMAIL_TEMPLATES)}")
        print(f"  • Messy client messages: {len(MESSY_COMMUNICATIONS)}")
        print(f"  • Multi-turn conversations: 3")
        print(f"  • Total chats: {chat_count}")
        print("\n🎯 The mock data includes:")
        print("  ✓ Settlement offers requiring immediate response")
        print("  ✓ Medical records requests")
        print("  ✓ Court filing deadlines")
        print("  ✓ Client communications (structured and messy)")
        print("  ✓ Opposing counsel correspondence")
        print("  ✓ Scheduling coordination")
        print("  ✓ Evidence organization tasks")
        print("  ✓ Demand letter preparation")
        print("\n🤖 Ready for AI Legal Tender Challenge testing!")
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(populate_database())
