import os
from dotenv import load_dotenv
from google.adk.agents import Agent
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types
from google.adk.tools import google_search
import pytesseract
import cv2
import asyncio
import re
import json

MODEL_ID = "gemini-2.5-flash"

class SherlockAgent:
    def __init__(self):
        self.agent = Agent(name="sherlock_agent", )