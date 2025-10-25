from google.adk.agents import Agent
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types

MODEL_ID = "gemini-2.5-flash"

class DocuAgent:
    def __init__(self):
        self.agent = Agent(
            name="docu_agent",
            model=MODEL_ID,
            description="Assists with document-related tasks such as summarization, extraction, and analysis.",
            instruction=self.get_instruction(),
            tools=[])
    
    def get_instruction(self):
        return """You are the Docu Agent, specializing in document-related tasks such as summarization, extraction, and analysis."""