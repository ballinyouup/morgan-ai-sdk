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

CLIENT_DATA = [
    {"name": "Sarah Johnson", "dob": "1985-03-15"},
    {"name": "Michael Chen", "dob": "1978-07-22"},
    {"name": "Emma Rodriguez", "dob": "1992-11-08"},
    {"name": "David Williams", "dob": "1980-01-30"},
    {"name": "Lisa Thompson", "dob": "1975-09-12"},
    {"name": "James Martinez", "dob": "1988-05-25"},
    {"name": "Amanda Davis", "dob": "1995-12-03"},
    {"name": "Robert Garcia", "dob": "1983-06-18"},
    {"name": "Jennifer Lee", "dob": "1990-04-07"},
    {"name": "Christopher Brown", "dob": "1987-08-14"},
    {"name": "Maria Gonzalez", "dob": "1982-02-28"},
    {"name": "William Taylor", "dob": "1979-10-19"}
]

PHONE_NUMBERS = [
    "(555) 123-4567", "(555) 234-5678", "(555) 345-6789", "(555) 456-7890",
    "(555) 567-8901", "(555) 678-9012", "(555) 789-0123", "(555) 890-1234"
]

FILE_TYPES = [
    {"name": "Medical_Bill_ER_Visit.pdf", "path": "/cases/{case_id}/medical/bills/"},
    {"name": "Xray_Results_Lower_Back.pdf", "path": "/cases/{case_id}/medical/imaging/"},
    {"name": "Police_Report_Accident.pdf", "path": "/cases/{case_id}/evidence/official/"},
    {"name": "Insurance_Policy_Document.pdf", "path": "/cases/{case_id}/insurance/"},
    {"name": "Witness_Statement_John_Doe.pdf", "path": "/cases/{case_id}/evidence/statements/"},
    {"name": "Property_Damage_Photos.zip", "path": "/cases/{case_id}/evidence/photos/"},
    {"name": "Medical_Records_Dr_Anderson.pdf", "path": "/cases/{case_id}/medical/records/"},
    {"name": "Lost_Wages_Documentation.xlsx", "path": "/cases/{case_id}/financial/"},
    {"name": "Settlement_Demand_Letter.pdf", "path": "/cases/{case_id}/legal/correspondence/"},
    {"name": "Deposition_Transcript.pdf", "path": "/cases/{case_id}/legal/discovery/"},
]

EMAIL_TEMPLATES = [
    {
        "subject": "Re: My accident claim - medical bills",
        "body": """Hi,

I hope this email finds you well. I just got back from my follow-up appointment with Dr. Anderson and wanted to update you. The pain in my lower back is still pretty bad, especially when I sit for more than 30 minutes. The doctor said I might need physical therapy for another 6-8 weeks.

I'm attaching the bills from my last visit - it was $450 for the consultation and $200 for the X-rays. Also, I haven't heard back from the insurance adjuster since last month. Should I be worried?

Thanks for all your help,
{client_name}""",
        "priority": "medium",
        "files": ["Medical_Bill_ER_Visit.pdf", "Xray_Results_Lower_Back.pdf"]
    },
    {
        "subject": "Question about my case timeline",
        "body": """Hello,

I wanted to check in on the status of my case. It's been a few months now and I'm wondering what the next steps are. My employer has been asking about when I can return to work, but I'm still dealing with pain from the injury.

Do you have any updates on when we might hear from the insurance company?

Best regards,
{client_name}""",
        "priority": "low",
        "files": []
    },
    {
        "subject": "Urgent: Settlement offer received",
        "body": """Hi,

I just received a letter from the insurance company with a settlement offer. They're offering $75,000 but saying I need to respond within 30 days. I'm not sure if this is a good offer or not.

Can we schedule a call to discuss this? I'm available anytime this week.

Thanks,
{client_name}""",
        "priority": "high",
        "files": ["Settlement_Demand_Letter.pdf"]
    },
    {
        "subject": "New medical records available",
        "body": """Hi there,

I got my latest medical records from the hospital and wanted to send them over. The doctor mentioned that I might need surgery if the physical therapy doesn't help.

Let me know if you need anything else from me.

{client_name}""",
        "priority": "medium",
        "files": ["Medical_Records_Dr_Anderson.pdf"]
    }
]

TEXT_MESSAGE_TEMPLATES = [
    {"text": "hey i know its late but forgot to mention the store manager saw me fall. also my neighbor knows someone who fell there too??", "priority": "medium"},
    {"text": "hi! went to physical therapy today. they said 3x per week for 2 months. will insurance cover this?", "priority": "low"},
    {"text": "URGENT: insurance company called me directly. i didnt answer. what should i do???", "priority": "high"},
    {"text": "just got the bill from the ER. its $8000!! is this normal?", "priority": "medium"},
    {"text": "my boss is pressuring me to come back to work but im still in pain. help!", "priority": "high"},
    {"text": "thank you so much for all your help. feeling hopeful about this case", "priority": "low"},
]

CHAT_TEMPLATES = [
    {"messages": [
        {"role": "user", "text": "I received an email from insurance offering $100,000 to settle. 30-day deadline. What should I do?"},
        {"role": "assistant", "text": "## Settlement Offer Analysis\n**Priority:** CRITICAL\n**Time Sensitive:** 30 days\n\nI recommend:\n1. Schedule attorney consultation\n2. Review case value vs offer\n3. Compile medical documentation\n\nShall I proceed?"}
    ]},
    {"messages": [
        {"role": "user", "text": "Client uploaded 8 documents - accident photos, bills, texts. Can you organize these?"},
        {"role": "assistant", "text": "## Document Processing\n\n**Medical (3):** Bills and records\n**Evidence (4):** Photos\n**Communications (1):** Text messages\n\nFiles organized and ready for review."}
    ]},
    {"messages": [
        {"role": "user", "text": "Can you summarize all communications from this case in the last 30 days?"},
        {"role": "assistant", "text": "## 30-Day Communication Summary\n\n**Emails:** 3 received\n- Medical updates (2)\n- Settlement inquiry (1)\n\n**Text Messages:** 5 received\n- Urgent matters (2)\n- General updates (3)\n\n**Key Items:** Settlement offer requires immediate attention."}
    ]},
    {"messages": [
        {"role": "user", "text": "What's the total value of medical bills so far?"},
        {"role": "assistant", "text": "## Medical Expenses Summary\n\n**Total Documented:** $12,450\n- ER visit: $8,000\n- Follow-up appointments: $1,650\n- Physical therapy: $2,800\n\n**Note:** Additional bills may be pending from recent treatments."}
    ]},
]

def generate_case_number(year: int, index: int) -> str:
    """Generate a realistic case number format: YYYY-PI-XXXXX"""
    return f"{year}-PI-{str(index).zfill(5)}"

async def create_case_with_data(conn, client_data: Dict, case_type: str, case_index: int):
    """Create a case with all related mock data"""
    created_date = datetime.now() - timedelta(days=random.randint(30, 180))
    case_number = generate_case_number(created_date.year, case_index)

    # Create Case with client info
    case_id = await conn.fetchval(
        '''INSERT INTO "Case" (id, status, "clientName", "clientDob", "caseNumber", "createdAt", "updatedAt")
           VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6) RETURNING id''',
        random.choice(["open", "open", "in_progress"]),
        client_data["name"],
        client_data["dob"],
        case_number,
        created_date,
        datetime.now()
    )

    # Create Chats with Messages
    num_chats = random.randint(1, 3)
    for i in range(num_chats):
        chat_template = random.choice(CHAT_TEMPLATES)
        chat_id = await conn.fetchval(
            'INSERT INTO "Chat" (id, "caseId") VALUES (gen_random_uuid()::text, $1) RETURNING id',
            case_id
        )
        for msg in chat_template["messages"]:
            await conn.execute(
                'INSERT INTO "Message" (id, role, text, "chatId") VALUES (gen_random_uuid()::text, $1, $2, $3)',
                msg["role"], msg["text"], chat_id
            )

    # Create Emails
    num_emails = random.randint(2, 4)
    for i in range(num_emails):
        template = random.choice(EMAIL_TEMPLATES)
        subject = template["subject"]
        body = template["body"].format(client_name=client_data["name"])
        email_date = datetime.now() - timedelta(days=random.randint(1, 30))

        await conn.execute(
            '''INSERT INTO "Email" (id, "caseId", subject, body, "createdAt", "updatedAt")
               VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5)''',
            case_id, subject, body, email_date, datetime.now()
        )

        # Add files mentioned in email
        for file_name in template.get("files", []):
            file_info = next((f for f in FILE_TYPES if f["name"] == file_name), None)
            if file_info:
                path = file_info["path"].format(case_id=case_id) + file_info["name"]
                await conn.execute(
                    '''INSERT INTO "Files" (id, "caseId", name, path, "createdAt", "updatedAt")
                       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5)''',
                    case_id, file_info["name"], path,
                    datetime.now() - timedelta(days=random.randint(1, 20)),
                    datetime.now()
                )

    # Create Text Messages
    num_texts = random.randint(2, 4)
    for i in range(num_texts):
        text_template = random.choice(TEXT_MESSAGE_TEMPLATES)
        phone = random.choice(PHONE_NUMBERS)
        text_date = datetime.now() - timedelta(hours=random.randint(1, 720))

        await conn.execute(
            '''INSERT INTO "TextMessage" (id, "caseId", text, "from", "to", "createdAt", "updatedAt")
               VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6)''',
            case_id, text_template["text"], phone, "(555) 000-0000",
            text_date, datetime.now()
        )

    # Create additional Files
    num_extra_files = random.randint(4, 8)
    for i in range(num_extra_files):
        file_info = random.choice(FILE_TYPES)
        path = file_info["path"].format(case_id=case_id) + file_info["name"]
        file_date = datetime.now() - timedelta(days=random.randint(1, 60))

        await conn.execute(
            '''INSERT INTO "Files" (id, "caseId", name, path, "createdAt", "updatedAt")
               VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5)''',
            case_id, file_info["name"], path, file_date, datetime.now()
        )

    # Create Reason Chains
    reason_chains = [
        {
            "agentType": "document_classifier",
            "action": "classified_medical_records",
            "reasoning": f"Classified {num_extra_files} documents based on content analysis and metadata",
            "confidence": round(random.uniform(0.85, 0.98), 2),
            "data": {"categories": ["medical", "legal", "evidence"], "total_files": num_extra_files}
        },
        {
            "agentType": "priority_analyzer",
            "action": "flagged_urgent_communication",
            "reasoning": "Settlement offer detected with time-sensitive deadline requiring immediate attorney attention",
            "confidence": round(random.uniform(0.82, 0.95), 2),
            "data": {"deadline_days": 30, "offer_amount": 100000}
        },
        {
            "agentType": "task_orchestrator",
            "action": "created_follow_up_tasks",
            "reasoning": "Generated prioritized task list based on case deadlines and client communications",
            "confidence": round(random.uniform(0.88, 0.96), 2),
            "data": {"tasks_created": 5, "high_priority": 2}
        },
        {
            "agentType": "records_wrangler",
            "action": "extracted_medical_data",
            "reasoning": "Parsed medical records and extracted key injury details, treatment dates, and provider information",
            "confidence": round(random.uniform(0.90, 0.99), 2),
            "data": {"injuries_found": 3, "providers": 2, "treatment_duration_weeks": 8}
        },
        {
            "agentType": "client_communication",
            "action": "drafted_response",
            "reasoning": "Prepared response to client inquiry regarding settlement timeline with clear next steps",
            "confidence": round(random.uniform(0.75, 0.92), 2),
            "data": {"response_type": "email", "tone": "professional"}
        }
    ]

    num_reason_chains = random.randint(3, 5)
    for entry in random.sample(reason_chains, num_reason_chains):
        await conn.execute(
            '''INSERT INTO "ReasonChain" (id, "caseId", "agentType", action, reasoning, confidence, timestamp, data)
               VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7)''',
            case_id, entry["agentType"], entry["action"], entry["reasoning"],
            entry["confidence"], datetime.now() - timedelta(minutes=random.randint(10, 500)),
            json.dumps(entry["data"])
        )

    return case_id

async def populate_database():
    """Main function to populate database with mock data"""
    print("🏛️  Morgan & Morgan AI - Mock Data Generation")
    print("=" * 80)

    if not DATABASE_URL:
        print("❌ ERROR: DATABASE_URL not found in environment variables")
        return

    try:
        print("\n📊 Connecting to database...")
        conn = await asyncpg.connect(DATABASE_URL, statement_cache_size=0)
        print("✅ Connected successfully")

        print("\n🧹 Clearing existing data...")
        tables = ["ReasonChain", "TextMessage", "Files", "Email", "Message", "Chat", "Case"]
        for table in tables:
            count = await conn.fetchval(f'SELECT COUNT(*) FROM "{table}"')
            await conn.execute(f'DELETE FROM "{table}"')
            print(f"  ✓ Cleared {count} records from {table}")

        print("\n📝 Generating cases with mock data...")
        case_count = 0
        stats = {"chats": 0, "messages": 0, "emails": 0, "files": 0, "texts": 0, "reasons": 0}

        for i, client_data in enumerate(CLIENT_DATA[:10]):
            case_type = CASE_TYPES[i % len(CASE_TYPES)]
            case_id = await create_case_with_data(conn, client_data, case_type, i + 1)
            case_count += 1

            # Collect statistics
            chats = await conn.fetchval(f'SELECT COUNT(*) FROM "Chat" WHERE "caseId" = $1', case_id)
            messages = await conn.fetchval(f'SELECT COUNT(*) FROM "Message" m JOIN "Chat" c ON m."chatId" = c.id WHERE c."caseId" = $1', case_id)
            emails = await conn.fetchval(f'SELECT COUNT(*) FROM "Email" WHERE "caseId" = $1', case_id)
            files = await conn.fetchval(f'SELECT COUNT(*) FROM "Files" WHERE "caseId" = $1', case_id)
            texts = await conn.fetchval(f'SELECT COUNT(*) FROM "TextMessage" WHERE "caseId" = $1', case_id)
            reasons = await conn.fetchval(f'SELECT COUNT(*) FROM "ReasonChain" WHERE "caseId" = $1', case_id)

            stats["chats"] += chats
            stats["messages"] += messages
            stats["emails"] += emails
            stats["files"] += files
            stats["texts"] += texts
            stats["reasons"] += reasons

            print(f"  ✓ Case {case_count}: {client_data['name']} ({client_data['dob']}) - {case_type}")
            print(f"    → {chats} chats, {messages} msgs, {emails} emails, {files} files, {texts} texts, {reasons} reason chains")

        await conn.close()

        print("\n" + "=" * 80)
        print(f"✅ SUCCESS! Generated {case_count} cases with comprehensive mock data")
        print(f"\n📋 Total Summary:")
        print(f"   • Chats: {stats['chats']}")
        print(f"   • Messages: {stats['messages']}")
        print(f"   • Emails: {stats['emails']}")
        print(f"   • Files: {stats['files']}")
        print(f"   • Text Messages: {stats['texts']}")
        print(f"   • Reason Chains: {stats['reasons']}")
        print("\n🤖 Database ready for testing!")

    except Exception as e:
        print(f"\n❌ Error occurred: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(populate_database())