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
]

TEXT_MESSAGE_TEMPLATES = [
    {"text": "hey i know its late but forgot to mention the store manager saw me fall. also my neighbor knows someone who fell there too??", "priority": "medium"},
    {"text": "hi! went to physical therapy today. they said 3x per week for 2 months. will insurance cover this?", "priority": "low"},
    {"text": "URGENT: insurance company called me directly. i didnt answer. what should i do???", "priority": "high"},
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
]

async def create_case_with_data(conn, client_name: str, case_type: str):
    case_id = await conn.fetchval(
        'INSERT INTO "Case" (id, status, "createdAt", "updatedAt") VALUES (gen_random_uuid()::text, $1, $2, $3) RETURNING id',
        random.choice(["open", "open", "in_progress"]),
        datetime.now() - timedelta(days=random.randint(30, 180)),
        datetime.now()
    )
    
    num_chats = random.randint(1, 2)
    for i in range(num_chats):
        chat_template = random.choice(CHAT_TEMPLATES)
        chat_id = await conn.fetchval('INSERT INTO "Chat" (id, "caseId") VALUES (gen_random_uuid()::text, $1) RETURNING id', case_id)
        for msg in chat_template["messages"]:
            await conn.execute('INSERT INTO "Message" (id, role, text, "chatId") VALUES (gen_random_uuid()::text, $1, $2, $3)', msg["role"], msg["text"], chat_id)
    
    num_emails = random.randint(2, 4)
    for i in range(num_emails):
        template = EMAIL_TEMPLATES[0]
        subject = template["subject"]
        body = template["body"].format(client_name=client_name)
        await conn.execute('INSERT INTO "Email" (id, "caseId", subject, body, "createdAt", "updatedAt") VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5)',
            case_id, subject, body, datetime.now() - timedelta(days=random.randint(1, 30)), datetime.now())
        for file_name in template.get("files", []):
            file_info = next((f for f in FILE_TYPES if f["name"] == file_name), None)
            if file_info:
                path = file_info["path"].format(case_id=case_id) + file_info["name"]
                await conn.execute('INSERT INTO "Files" (id, "caseId", name, path, "createdAt", "updatedAt") VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5)',
                    case_id, file_info["name"], path, datetime.now() - timedelta(days=random.randint(1, 20)), datetime.now())
    
    num_texts = random.randint(1, 3)
    for i in range(num_texts):
        text_template = random.choice(TEXT_MESSAGE_TEMPLATES)
        phone = random.choice(PHONE_NUMBERS)
        await conn.execute('INSERT INTO "TextMessage" (id, "caseId", text, "from", "to", "createdAt", "updatedAt") VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6)',
            case_id, text_template["text"], phone, "(555) 000-0000", datetime.now() - timedelta(hours=random.randint(1, 72)), datetime.now())
    
    num_extra_files = random.randint(3, 6)
    for i in range(num_extra_files):
        file_info = random.choice(FILE_TYPES)
        path = file_info["path"].format(case_id=case_id) + file_info["name"]
        await conn.execute('INSERT INTO "Files" (id, "caseId", name, path, "createdAt", "updatedAt") VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5)',
            case_id, file_info["name"], path, datetime.now() - timedelta(days=random.randint(1, 60)), datetime.now())
    
    reason_chains = [
        {"agentType": "document_classifier", "action": "classified_medical_records", "reasoning": f"Classified {num_extra_files} documents based on content analysis", "confidence": 0.95},
        {"agentType": "priority_analyzer", "action": "flagged_urgent_communication", "reasoning": "Settlement offer requires immediate attorney attention", "confidence": 0.88},
        {"agentType": "task_orchestrator", "action": "created_follow_up_tasks", "reasoning": "Generated tasks based on deadlines", "confidence": 0.92}
    ]
    for entry in reason_chains:
        await conn.execute('INSERT INTO "ReasonChain" (id, "caseId", "agentType", action, reasoning, confidence, timestamp, data) VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7)',
            case_id, entry["agentType"], entry["action"], entry["reasoning"], entry["confidence"], datetime.now() - timedelta(minutes=random.randint(10, 500)), json.dumps({"case_type": case_type}))
    
    return case_id

async def populate_database():
    print("🏛️  Morgan & Morgan AI - Mock Data Generation")
    print("=" * 80)
    if not DATABASE_URL:
        print("❌ ERROR: DATABASE_URL not found")
        return
    try:
        print("\n📊 Connecting to database...")
        conn = await asyncpg.connect(DATABASE_URL, statement_cache_size=0)
        print("✅ Connected")
        print("\n🧹 Clearing existing data...")
        for table in ["ReasonChain", "TextMessage", "Files", "Email", "Message", "Chat", "Case"]:
            await conn.execute(f'DELETE FROM "{table}"')
        print("✅ Cleared")
        print("\n📝 Generating cases...")

        case_count = 0
        stats = {"chats": 0, "emails": 0, "files": 0, "texts": 0, "reasons": 0}
        for i, client_name in enumerate(CLIENT_NAMES[:8]):
            case_type = CASE_TYPES[i % len(CASE_TYPES)]
            case_id = await create_case_with_data(conn, client_name, case_type)
            case_count += 1
            for key, table in [("chats", "Chat"), ("emails", "Email"), ("files", "Files"), ("texts", "TextMessage"), ("reasons", "ReasonChain")]:
                stats[key] += await conn.fetchval(f'SELECT COUNT(*) FROM "{table}" WHERE "caseId" = $1', case_id)
            print(f"  ✓ Case {case_count}: {client_name} - {case_type}")
            
        await conn.close()
        print("\n" + "=" * 80)
        print(f"✅ SUCCESS! Generated {case_count} cases")
        print(f"\n📋 Summary: {stats['chats']} chats, {stats['emails']} emails, {stats['files']} files, {stats['texts']} texts, {stats['reasons']} reason chains")
        print("\n🤖 Database ready!")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(populate_database())
