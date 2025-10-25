import asyncio
from typing import Optional, List, Dict, Any
from prisma import Prisma
from datetime import datetime
import json

class DatabaseTool:
    def __init__(self):
        self.db = Prisma()
        self._connected = False
    
    async def connect(self):
        if not self._connected:
            await self.db.connect()
            self._connected = True
    
    async def disconnect(self):
        """Close database connection"""
        if self._connected:
            await self.db.disconnect()
            self._connected = False
    
    async def __aenter__(self):
        """Context manager entry"""
        await self.connect()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit"""
        await self.disconnect()
    
    # ==================== CASE OPERATIONS ====================
    
    async def create_case(self, status: str = "open") -> Dict[str, Any]:
        """
        Create a new case.
        
        Args:
            status: Case status (default: "open")
        
        Returns:
            Dictionary containing the created case data
        """
        await self.connect()
        case = await self.db.case.create(
            data={"status": status}
        )
        return case.model_dump()
    
    async def get_case(self, case_id: str, include_relations: bool = False) -> Optional[Dict[str, Any]]:
        """
        Retrieve a case by ID.
        
        Args:
            case_id: The case ID
            include_relations: Whether to include related chats, emails, files, etc.
        
        Returns:
            Dictionary containing case data or None if not found
        """
        await self.connect()
        
        include_dict = None
        if include_relations:
            include_dict = {
                "chats": {"include": {"messages": True}},
                "emails": True,
                "files": True,
                "textMessages": True,
                "reasonChains": True
            }
        
        case = await self.db.case.find_unique(
            where={"id": case_id},
            include=include_dict
        )
        return case.model_dump() if case else None
    
    async def update_case(self, case_id: str, status: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Update a case.
        
        Args:
            case_id: The case ID
            status: New status for the case
        
        Returns:
            Dictionary containing updated case data or None if not found
        """
        await self.connect()
        
        update_data = {}
        if status is not None:
            update_data["status"] = status
        
        case = await self.db.case.update(
            where={"id": case_id},
            data=update_data
        )
        return case.model_dump() if case else None
    
    async def delete_case(self, case_id: str) -> bool:
        """
        Delete a case (cascades to related records).
        
        Args:
            case_id: The case ID
        
        Returns:
            True if deleted, False if not found
        """
        await self.connect()
        try:
            await self.db.case.delete(where={"id": case_id})
            return True
        except Exception:
            return False
    
    async def list_cases(
        self, 
        status: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """
        List cases with optional filtering.
        
        Args:
            status: Filter by status (optional)
            skip: Number of records to skip (pagination)
            limit: Maximum number of records to return
        
        Returns:
            List of case dictionaries
        """
        await self.connect()
        
        where_dict = {}
        if status:
            where_dict["status"] = status
        
        cases = await self.db.case.find_many(
            where=where_dict if where_dict else None,
            skip=skip,
            take=limit,
            order={"createdAt": "desc"}
        )
        return [case.model_dump() for case in cases]
    
    # ==================== CHAT OPERATIONS ====================
    
    async def create_chat(self, case_id: str) -> Dict[str, Any]:
        """
        Create a new chat for a case.
        
        Args:
            case_id: The case ID
        
        Returns:
            Dictionary containing the created chat data
        """
        await self.connect()
        chat = await self.db.chat.create(
            data={"caseId": case_id}
        )
        return chat.model_dump()
    
    async def get_chat(self, chat_id: str, include_messages: bool = True) -> Optional[Dict[str, Any]]:
        """
        Retrieve a chat by ID.
        
        Args:
            chat_id: The chat ID
            include_messages: Whether to include messages
        
        Returns:
            Dictionary containing chat data or None if not found
        """
        await self.connect()
        chat = await self.db.chat.find_unique(
            where={"id": chat_id},
            include={"messages": True} if include_messages else None
        )
        return chat.model_dump() if chat else None
    
    async def list_chats_for_case(self, case_id: str) -> List[Dict[str, Any]]:
        """
        List all chats for a specific case.
        
        Args:
            case_id: The case ID
        
        Returns:
            List of chat dictionaries
        """
        await self.connect()
        chats = await self.db.chat.find_many(
            where={"caseId": case_id},
            include={"messages": True}
        )
        return [chat.model_dump() for chat in chats]
    
    async def delete_chat(self, chat_id: str) -> bool:
        """
        Delete a chat (cascades to messages).
        
        Args:
            chat_id: The chat ID
        
        Returns:
            True if deleted, False if not found
        """
        await self.connect()
        try:
            await self.db.chat.delete(where={"id": chat_id})
            return True
        except Exception:
            return False
    
    # ==================== MESSAGE OPERATIONS ====================
    
    async def create_message(
        self, 
        chat_id: str, 
        role: str, 
        text: str
    ) -> Dict[str, Any]:
        """
        Create a new message in a chat.
        
        Args:
            chat_id: The chat ID
            role: Message role (e.g., "user", "assistant", "system")
            text: Message content
        
        Returns:
            Dictionary containing the created message data
        """
        await self.connect()
        message = await self.db.message.create(
            data={
                "chatId": chat_id,
                "role": role,
                "text": text
            }
        )
        return message.model_dump()
    
    async def get_message(self, message_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve a message by ID.
        
        Args:
            message_id: The message ID
        
        Returns:
            Dictionary containing message data or None if not found
        """
        await self.connect()
        message = await self.db.message.find_unique(
            where={"id": message_id}
        )
        return message.model_dump() if message else None
    
    async def list_messages_for_chat(self, chat_id: str) -> List[Dict[str, Any]]:
        """
        List all messages for a specific chat.
        
        Args:
            chat_id: The chat ID
        
        Returns:
            List of message dictionaries ordered by creation time
        """
        await self.connect()
        messages = await self.db.message.find_many(
            where={"chatId": chat_id},
            order={"id": "asc"}  # Messages in order they were created
        )
        return [message.model_dump() for message in messages]
    
    async def delete_message(self, message_id: str) -> bool:
        """
        Delete a message.
        
        Args:
            message_id: The message ID
        
        Returns:
            True if deleted, False if not found
        """
        await self.connect()
        try:
            await self.db.message.delete(where={"id": message_id})
            return True
        except Exception:
            return False
    
    # ==================== EMAIL OPERATIONS ====================
    
    async def create_email(
        self, 
        case_id: str, 
        subject: str, 
        body: str
    ) -> Dict[str, Any]:
        """
        Create a new email record for a case.
        
        Args:
            case_id: The case ID
            subject: Email subject
            body: Email body content
        
        Returns:
            Dictionary containing the created email data
        """
        await self.connect()
        email = await self.db.email.create(
            data={
                "caseId": case_id,
                "subject": subject,
                "body": body
            }
        )
        return email.model_dump()
    
    async def get_email(self, email_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve an email by ID.
        
        Args:
            email_id: The email ID
        
        Returns:
            Dictionary containing email data or None if not found
        """
        await self.connect()
        email = await self.db.email.find_unique(
            where={"id": email_id}
        )
        return email.model_dump() if email else None
    
    async def list_emails_for_case(self, case_id: str) -> List[Dict[str, Any]]:
        """
        List all emails for a specific case.
        
        Args:
            case_id: The case ID
        
        Returns:
            List of email dictionaries
        """
        await self.connect()
        emails = await self.db.email.find_many(
            where={"caseId": case_id},
            order={"createdAt": "desc"}
        )
        return [email.model_dump() for email in emails]
    
    async def update_email(
        self, 
        email_id: str, 
        subject: Optional[str] = None, 
        body: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Update an email.
        
        Args:
            email_id: The email ID
            subject: New subject (optional)
            body: New body (optional)
        
        Returns:
            Dictionary containing updated email data or None if not found
        """
        await self.connect()
        
        update_data = {}
        if subject is not None:
            update_data["subject"] = subject
        if body is not None:
            update_data["body"] = body
        
        if not update_data:
            return await self.get_email(email_id)
        
        email = await self.db.email.update(
            where={"id": email_id},
            data=update_data
        )
        return email.model_dump() if email else None
    
    async def delete_email(self, email_id: str) -> bool:
        """
        Delete an email.
        
        Args:
            email_id: The email ID
        
        Returns:
            True if deleted, False if not found
        """
        await self.connect()
        try:
            await self.db.email.delete(where={"id": email_id})
            return True
        except Exception:
            return False
    
    # ==================== FILE OPERATIONS ====================
    
    async def create_file(
        self, 
        case_id: str, 
        name: str, 
        path: str
    ) -> Dict[str, Any]:
        """
        Create a new file record for a case.
        
        Args:
            case_id: The case ID
            name: File name
            path: File path/URL
        
        Returns:
            Dictionary containing the created file data
        """
        await self.connect()
        file = await self.db.files.create(
            data={
                "caseId": case_id,
                "name": name,
                "path": path
            }
        )
        return file.model_dump()
    
    async def get_file(self, file_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve a file by ID.
        
        Args:
            file_id: The file ID
        
        Returns:
            Dictionary containing file data or None if not found
        """
        await self.connect()
        file = await self.db.files.find_unique(
            where={"id": file_id}
        )
        return file.model_dump() if file else None
    
    async def list_files_for_case(self, case_id: str) -> List[Dict[str, Any]]:
        """
        List all files for a specific case.
        
        Args:
            case_id: The case ID
        
        Returns:
            List of file dictionaries
        """
        await self.connect()
        files = await self.db.files.find_many(
            where={"caseId": case_id},
            order={"createdAt": "desc"}
        )
        return [file.model_dump() for file in files]
    
    async def update_file(
        self, 
        file_id: str, 
        name: Optional[str] = None, 
        path: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Update a file record.
        
        Args:
            file_id: The file ID
            name: New name (optional)
            path: New path (optional)
        
        Returns:
            Dictionary containing updated file data or None if not found
        """
        await self.connect()
        
        update_data = {}
        if name is not None:
            update_data["name"] = name
        if path is not None:
            update_data["path"] = path
        
        if not update_data:
            return await self.get_file(file_id)
        
        file = await self.db.files.update(
            where={"id": file_id},
            data=update_data
        )
        return file.model_dump() if file else None
    
    async def delete_file(self, file_id: str) -> bool:
        """
        Delete a file record.
        
        Args:
            file_id: The file ID
        
        Returns:
            True if deleted, False if not found
        """
        await self.connect()
        try:
            await self.db.files.delete(where={"id": file_id})
            return True
        except Exception:
            return False
    
    # ==================== TEXT MESSAGE OPERATIONS ====================
    
    async def create_text_message(
        self, 
        case_id: str, 
        text: str, 
        from_number: str, 
        to_number: str
    ) -> Dict[str, Any]:
        """
        Create a new text message record for a case.
        
        Args:
            case_id: The case ID
            text: Message text content
            from_number: Sender's phone number
            to_number: Recipient's phone number
        
        Returns:
            Dictionary containing the created text message data
        """
        await self.connect()
        text_message = await self.db.textmessage.create(
            data={
                "caseId": case_id,
                "text": text,
                "from": from_number,
                "to": to_number
            }
        )
        return text_message.model_dump()
    
    async def get_text_message(self, message_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve a text message by ID.
        
        Args:
            message_id: The text message ID
        
        Returns:
            Dictionary containing text message data or None if not found
        """
        await self.connect()
        text_message = await self.db.textmessage.find_unique(
            where={"id": message_id}
        )
        return text_message.model_dump() if text_message else None
    
    async def list_text_messages_for_case(self, case_id: str) -> List[Dict[str, Any]]:
        """
        List all text messages for a specific case.
        
        Args:
            case_id: The case ID
        
        Returns:
            List of text message dictionaries
        """
        await self.connect()
        text_messages = await self.db.textmessage.find_many(
            where={"caseId": case_id},
            order={"createdAt": "desc"}
        )
        return [msg.model_dump() for msg in text_messages]
    
    async def delete_text_message(self, message_id: str) -> bool:
        """
        Delete a text message.
        
        Args:
            message_id: The text message ID
        
        Returns:
            True if deleted, False if not found
        """
        await self.connect()
        try:
            await self.db.textmessage.delete(where={"id": message_id})
            return True
        except Exception:
            return False
    
    # ==================== REASON CHAIN OPERATIONS ====================
    
    async def create_reason_chain(
        self,
        case_id: str,
        agent_type: str,
        action: str,
        reasoning: str,
        data: Optional[Dict[str, Any]] = None,
        confidence: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Create a new reason chain entry for transparency and explainability.
        
        Args:
            case_id: The case ID
            agent_type: Type of agent (e.g., "client_communication", "records_wrangler")
            action: Action taken by the agent
            reasoning: Explanation of why the action was taken
            data: Additional data as JSON (optional)
            confidence: Confidence score 0-1 (optional)
        
        Returns:
            Dictionary containing the created reason chain data
        """
        await self.connect()
        
        create_data = {
            "caseId": case_id,
            "agentType": agent_type,
            "action": action,
            "reasoning": reasoning
        }
        
        if data is not None:
            create_data["data"] = json.dumps(data)
        if confidence is not None:
            create_data["confidence"] = confidence
        
        reason_chain = await self.db.reasonchain.create(data=create_data)
        return reason_chain.model_dump()
    
    async def get_reason_chain(self, reason_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve a reason chain entry by ID.
        
        Args:
            reason_id: The reason chain ID
        
        Returns:
            Dictionary containing reason chain data or None if not found
        """
        await self.connect()
        reason_chain = await self.db.reasonchain.find_unique(
            where={"id": reason_id}
        )
        return reason_chain.model_dump() if reason_chain else None
    
    async def list_reason_chains_for_case(
        self, 
        case_id: str,
        agent_type: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        List all reason chain entries for a specific case.
        
        Args:
            case_id: The case ID
            agent_type: Filter by agent type (optional)
        
        Returns:
            List of reason chain dictionaries
        """
        await self.connect()
        
        where_dict = {"caseId": case_id}
        if agent_type:
            where_dict["agentType"] = agent_type
        
        reason_chains = await self.db.reasonchain.find_many(
            where=where_dict,
            order={"timestamp": "desc"}
        )
        return [rc.model_dump() for rc in reason_chains]
    
    async def delete_reason_chain(self, reason_id: str) -> bool:
        """
        Delete a reason chain entry.
        
        Args:
            reason_id: The reason chain ID
        
        Returns:
            True if deleted, False if not found
        """
        await self.connect()
        try:
            await self.db.reasonchain.delete(where={"id": reason_id})
            return True
        except Exception:
            return False
    
    # ==================== HELPER/UTILITY METHODS ====================
    
    async def get_case_summary(self, case_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a comprehensive summary of a case with all related data.
        
        Args:
            case_id: The case ID
        
        Returns:
            Dictionary containing case summary with counts and recent activity
        """
        await self.connect()
        
        case = await self.get_case(case_id, include_relations=True)
        if not case:
            return None
        
        summary = {
            "case": {
                "id": case["id"],
                "status": case["status"],
                "createdAt": case["createdAt"],
                "updatedAt": case["updatedAt"]
            },
            "counts": {
                "chats": len(case.get("chats", [])),
                "emails": len(case.get("emails", [])),
                "files": len(case.get("files", [])),
                "textMessages": len(case.get("textMessages", [])),
                "reasonChains": len(case.get("reasonChains", []))
            },
            "recentActivity": {
                "latestEmail": case.get("emails", [{}])[0] if case.get("emails") else None,
                "latestTextMessage": case.get("textMessages", [{}])[0] if case.get("textMessages") else None,
                "latestReasonChain": case.get("reasonChains", [{}])[0] if case.get("reasonChains") else None
            }
        }
        
        return summary
    
    async def search_cases_by_date_range(
        self,
        start_date: datetime,
        end_date: datetime,
        status: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Search for cases within a date range.
        
        Args:
            start_date: Start date for the range
            end_date: End date for the range
            status: Filter by status (optional)
        
        Returns:
            List of case dictionaries
        """
        await self.connect()
        
        where_dict = {
            "createdAt": {
                "gte": start_date,
                "lte": end_date
            }
        }
        
        if status:
            where_dict["status"] = status
        
        cases = await self.db.case.find_many(
            where=where_dict,
            order={"createdAt": "desc"}
        )
        return [case.model_dump() for case in cases]

async def get_database_tool() -> DatabaseTool:
    tool = DatabaseTool()
    await tool.connect()
    return tool

if __name__ == "__main__":
    async def demo():
        """Demonstration of database tool usage"""
        
        # Using context manager (automatically connects/disconnects)
        async with DatabaseTool() as db:
            # Create a new case
            print("Creating a new case...")
            case = await db.create_case(status="open")
            print(f"Created case: {case['id']}")
            
            # Create a chat for the case
            print("\nCreating a chat...")
            chat = await db.create_chat(case_id=case['id'])
            print(f"Created chat: {chat['id']}")
            
            # Add messages to the chat
            print("\nAdding messages...")
            msg1 = await db.create_message(
                chat_id=chat['id'],
                role="user",
                text="Hello, I need help with my case."
            )
            msg2 = await db.create_message(
                chat_id=chat['id'],
                role="assistant",
                text="I'm here to help. What can I assist you with?"
            )
            print(f"Created {2} messages")
            
            # Create an email
            print("\nCreating an email...")
            email = await db.create_email(
                case_id=case['id'],
                subject="Case Update",
                body="Your case has been assigned to an attorney."
            )
            print(f"Created email: {email['id']}")
            
            # Create a file record
            print("\nCreating a file record...")
            file = await db.create_file(
                case_id=case['id'],
                name="evidence.pdf",
                path="/storage/cases/evidence.pdf"
            )
            print(f"Created file: {file['id']}")
            
            # Create a reason chain entry
            print("\nCreating a reason chain entry...")
            reason = await db.create_reason_chain(
                case_id=case['id'],
                agent_type="client_communication",
                action="drafted_response",
                reasoning="Client expressed frustration; drafted empathetic response.",
                data={"emotion": "frustrated", "urgency": "high"},
                confidence=0.87
            )
            print(f"Created reason chain: {reason['id']}")
            
            # Get case summary
            print("\nFetching case summary...")
            summary = await db.get_case_summary(case['id'])
            print(f"Case Summary: {json.dumps(summary, indent=2, default=str)}")
            
            # List all messages in the chat
            print("\nFetching messages...")
            messages = await db.list_messages_for_chat(chat['id'])
            for msg in messages:
                print(f"  {msg['role']}: {msg['text']}")
            
            print("\n✅ Demo completed successfully!")
    
    asyncio.run(demo())
