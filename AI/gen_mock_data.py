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

CLIENT_DOBS = [
    "1985-05-12", "1990-08-23", "1978-11-15", "1982-03-07",
    "1995-09-30", "1988-12-18", "1975-06-25", "1992-04-11"
]

PHONE_NUMBERS = [
    "(555) 123-4567", "(555) 234-5678", "(555) 345-6789", "(555) 456-7890",
    "(555) 567-8901", "(555) 678-9012", "(555) 789-0123", "(555) 890-1234"
]

PRIORITIES = ["low", "medium", "high", "urgent"]
STATUSES = ["open", "in_progress", "pending", "on-hold"]

FILE_TYPES = [
    {
        "name": "Medical_Bill_ER_Visit.pdf",
        "url": "https://simplylaw.s3.us-east-1.amazonaws.com/Medical_Bill_ER_Visit.pdf",
        "type": "pdf",
        "size": "2.3 MB"
    },
    {
        "name": "Xray_Results_Lower_Back.pdf",
        "url": "https://simplylaw.s3.us-east-1.amazonaws.com/Xray_Results_Lower_Back.pdf",
        "type": "pdf",
        "size": "1.8 MB"
    },
    {
        "name": "Police_Report_Accident.pdf",
        "url": "https://simplylaw.s3.us-east-1.amazonaws.com/POLICE+REPORT+(1).pdf",
        "type": "pdf",
        "size": "3.2 MB"
    },
    {
        "name": "Insurance_Policy_Document.pdf",
        "url": "https://simplylaw.s3.us-east-1.amazonaws.com/INSURANCE-+POLICY+PROGRESSIVE++.pdf",
        "type": "pdf",
        "size": "4.5 MB"
    },
    {
        "name": "Witness_Statement_John_Doe.pdf",
        "url": "https://simplylaw.s3.us-east-1.amazonaws.com/Witness_Statement.pdf",
        "type": "pdf",
        "size": "890 KB"
    },
    {
        "name": "Property_Damage_Photos.zip",
        "url": "https://simplylaw.s3.us-east-1.amazonaws.com/EST-PHOTOS-04-15-2019_Redacted.pdf",
        "type": "pdf",
        "size": "5.4 MB"
    },
    {
        "name": "Medical_Records_Dr_Anderson.pdf",
        "url": "https://simplylaw.s3.us-east-1.amazonaws.com/Medical_Records.pdf",
        "type": "pdf",
        "size": "1.5 MB"
    },
    {
        "name": "Lost_Wages_Documentation.xlsx",
        "url": "https://simplylaw.s3.us-east-1.amazonaws.com/Lost_Wages.xlsx",
        "type": "document",
        "size": "67 KB"
    },
]

EMAIL_TEMPLATES = [
    {
        "subject": "Re: My accident claim - medical bills",
        "content": """Hi,

I hope this email finds you well. I just got back from my follow-up appointment with Dr. Anderson and wanted to update you. The pain in my lower back is still pretty bad, especially when I sit for more than 30 minutes. The doctor said I might need physical therapy for another 6-8 weeks.

I'm attaching the bills from my last visit - it was $450 for the consultation and $200 for the X-rays. Also, I haven't heard back from the insurance adjuster since last month. Should I be worried?

Thanks for all your help,
{client_name}""",
        "priority": "medium",
        "files": ["Medical_Bill_ER_Visit.pdf", "Xray_Results_Lower_Back.pdf"]
    },
    {
        "subject": "Question about settlement offer",
        "content": """Hello,

The insurance company contacted me directly with a settlement offer. I didn't accept anything yet because I remembered you said to talk to you first. The offer is $15,000 but I'm not sure if that's fair given all my medical expenses and lost work time.

Can we schedule a call to discuss this?

Best,
{client_name}""",
        "priority": "high",
        "files": []
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

CASE_DESCRIPTIONS = [
    "Slip and fall incident at retail location. Client sustained back injuries.",
    "Car accident on I-4, rear-end collision. Multiple injuries including whiplash.",
    "Workers compensation claim for repetitive strain injury.",
    "Medical malpractice during routine surgery. Seeking compensation for additional procedures.",
    "Product liability case involving defective household appliance.",
    "Wrongful death claim following workplace accident.",
    "Dog bite injury requiring emergency medical treatment.",
    "Premises liability - inadequate security leading to assault."
]

NEXT_ACTIONS = [
    "Schedule medical evaluation",
    "Review contract terms",
    "Gather employment records",
    "Awaiting survey results",
    "Prepare court documents",
    "File motion with court",
    "Contact insurance adjuster",
    "Schedule client consultation"
]

async def get_column_names(conn, table_name):
    """Helper to get actual column names from database"""
    query = """
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = $1
            ORDER BY ordinal_position \
            """
    rows = await conn.fetch(query, table_name)
    return [row['column_name'] for row in rows]

async def create_case_with_data(conn, client_name: str, client_dob: str, case_type: str, case_number: str):
    """Create a case with all related data matching the actual database schema"""

    status = random.choice(STATUSES)
    priority = random.choice(PRIORITIES)
    created_at = datetime.now() - timedelta(days=random.randint(30, 180))

    # Use exact column names as they appear in the database
    case_id = await conn.fetchval(
        '''INSERT INTO "Case"
           (id, "caseType", "clientName", "clientDob", "caseNumber", status, priority,
            "assignedTo", description, "nextAction", "createdAt", "lastActivity")
           VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
               RETURNING id''',
        case_type,
        client_name,
        client_dob,
        case_number,
        status,
        priority,
        "Emily Rodriguez",
        random.choice(CASE_DESCRIPTIONS),
        random.choice(NEXT_ACTIONS),
        created_at,
        datetime.now()
    )

    # Create chats with messages
    num_chats = random.randint(1, 2)
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

    # Create emails
    num_emails = random.randint(2, 4)
    for i in range(num_emails):
        template = random.choice(EMAIL_TEMPLATES)
        subject = template["subject"]
        content = template["content"].format(client_name=client_name)

        await conn.execute(
            '''INSERT INTO "Email"
               (id, "caseId", subject, content, "from", "to", "createdAt", "updatedAt")
               VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7)''',
            case_id,
            subject,
            content,
            f"{client_name.lower().replace(' ', '.')}@email.com",
            "emily.rodriguez@lawfirm.com",
            datetime.now() - timedelta(days=random.randint(1, 30)),
            datetime.now()
        )

        # Add file attachments for emails
        for file_name in template.get("files", []):
            file_info = next((f for f in FILE_TYPES if f["name"] == file_name), None)
            if file_info:
                await conn.execute(
                    '''INSERT INTO "Files"
                           (id, "caseId", name, url, type, size, "uploadedAt", "uploadedBy")
                       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7)''',
                    case_id,
                    file_info["name"],
                    file_info["url"],
                    file_info["type"],
                    file_info["size"],
                    datetime.now() - timedelta(days=random.randint(1, 20)),
                    "Emily Rodriguez"
                )

    # Create text messages
    num_texts = random.randint(1, 3)
    for i in range(num_texts):
        text_template = random.choice(TEXT_MESSAGE_TEMPLATES)
        phone = random.choice(PHONE_NUMBERS)

        await conn.execute(
            '''INSERT INTO "TextMessage"
                   (id, "caseId", text, "from", "to", "createdAt", "updatedAt")
               VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6)''',
            case_id,
            text_template["text"],
            phone,
            "(555) 000-0000",
            datetime.now() - timedelta(hours=random.randint(1, 72)),
            datetime.now()
        )

    # Create additional files
    num_extra_files = random.randint(3, 6)
    for i in range(num_extra_files):
        file_info = random.choice(FILE_TYPES)

        await conn.execute(
            '''INSERT INTO "Files"
                   (id, "caseId", name, url, type, size, "uploadedAt", "uploadedBy")
               VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7)''',
            case_id,
            file_info["name"],
            file_info["url"],
            file_info["type"],
            file_info["size"],
            datetime.now() - timedelta(days=random.randint(1, 60)),
            "Emily Rodriguez"
        )

    # Create reason chains
    reason_chains = [
        {
            "agentType": "document_classifier",
            "action": "classified_medical_records",
            "reasoning": f"Classified {num_extra_files} documents based on content analysis",
            "confidence": 0.95
        },
        {
            "agentType": "priority_analyzer",
            "action": "flagged_urgent_communication",
            "reasoning": "Settlement offer requires immediate attorney attention",
            "confidence": 0.88
        },
        {
            "agentType": "task_orchestrator",
            "action": "created_follow_up_tasks",
            "reasoning": "Generated tasks based on deadlines",
            "confidence": 0.92
        }
    ]

    for entry in reason_chains:
        await conn.execute(
            '''INSERT INTO "ReasonChain"
               (id, "caseId", "agentType", action, reasoning, confidence, timestamp, data)
               VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7)''',
            case_id,
            entry["agentType"],
            entry["action"],
            entry["reasoning"],
            entry["confidence"],
            datetime.now() - timedelta(minutes=random.randint(10, 500)),
            json.dumps({"case_type": case_type})
        )

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

        # Debug: Print actual column names
        print("\n🔍 Checking database schema...")
        case_columns = await get_column_names(conn, "Case")
        print(f"   Case table columns: {', '.join(case_columns)}")

        print("\n🧹 Clearing existing data...")
        for table in ["ReasonChain", "TextMessage", "Files", "Email", "Message", "Chat", "Case"]:
            await conn.execute(f'DELETE FROM "{table}"')
        print("✅ Cleared")

        print("\n📝 Generating cases...")

        case_count = 0
        stats = {"chats": 0, "emails": 0, "files": 0, "texts": 0, "reasons": 0}

        for i, client_name in enumerate(CLIENT_NAMES[:8]):
            case_type = CASE_TYPES[i % len(CASE_TYPES)]
            client_dob = CLIENT_DOBS[i % len(CLIENT_DOBS)]
            case_number = f"CASE-{2025}-{str(i+1).zfill(4)}"

            case_id = await create_case_with_data(conn, client_name, client_dob, case_type, case_number)
            case_count += 1

            # Update stats
            for key, table in [
                ("chats", "Chat"),
                ("emails", "Email"),
                ("files", "Files"),
                ("texts", "TextMessage"),
                ("reasons", "ReasonChain")
            ]:
                stats[key] += await conn.fetchval(
                    f'SELECT COUNT(*) FROM "{table}" WHERE "caseId" = $1',
                    case_id
                )

            print(f"  ✓ Case {case_count}: {client_name} - {case_type} ({case_number})")

        await conn.close()

        print("\n" + "=" * 80)
        print(f"✅ SUCCESS! Generated {case_count} cases")
        print(f"\n📋 Summary:")
        print(f"   • {stats['chats']} chats")
        print(f"   • {stats['emails']} emails")
        print(f"   • {stats['files']} files")
        print(f"   • {stats['texts']} text messages")
        print(f"   • {stats['reasons']} reason chains")
        print("\n🤖 Database ready!")

    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(populate_database())