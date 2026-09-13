import os
import json
from typing import Optional, Dict, Any
import httpx
from dotenv import load_dotenv

load_dotenv()

class LLMClient:
    """
    Unified LLM Client supporting Google AI Studio (Gemini), OpenAI, and deterministic offline fallback.
    """
    def __init__(self):
        # Supports Google AI Studio API Key
        self.gemini_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        self.openai_key = os.getenv("OPENAI_API_KEY")
        self.gemini_model = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")

    async def generate_json(self, prompt: str, system_instruction: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Invokes LLM and attempts to parse JSON output.
        Falls back to None if no key is configured or on error.
        """
        # 1. Google AI Studio (Gemini)
        if self.gemini_key:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.gemini_model}:generateContent?key={self.gemini_key}"
                
                parts = []
                if system_instruction:
                    parts.append({"text": f"System Instruction: {system_instruction}\n\n"})
                parts.append({"text": prompt})

                payload = {
                    "contents": [{"parts": parts}],
                    "generationConfig": {
                        "temperature": 0.1,
                        "responseMimeType": "application/json"
                    }
                }

                async with httpx.AsyncClient(timeout=15.0) as client:
                    resp = await client.post(url, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        candidates = data.get("candidates", [])
                        if candidates:
                            text_content = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                            # Clean markdown formatting if present
                            clean_text = text_content.strip()
                            if clean_text.startswith("```json"):
                                clean_text = clean_text[7:]
                            if clean_text.startswith("```"):
                                clean_text = clean_text[3:]
                            if clean_text.endswith("```"):
                                clean_text = clean_text[:-3]
                            return json.loads(clean_text.strip())
            except Exception as e:
                print(f"[LLM] Gemini API error: {e}. Falling back to deterministic reasoning.")

        # 2. OpenAI fallback
        if self.openai_key:
            try:
                url = "https://api.openai.com/v1/chat/completions"
                headers = {
                    "Authorization": f"Bearer {self.openai_key}",
                    "Content-Type": "application/json"
                }
                messages = []
                if system_instruction:
                    messages.append({"role": "system", "content": system_instruction})
                messages.append({"role": "user", "content": prompt})

                payload = {
                    "model": "gpt-4o-mini",
                    "messages": messages,
                    "response_format": {"type": "json_object"},
                    "temperature": 0.1
                }
                async with httpx.AsyncClient(timeout=15.0) as client:
                    resp = await client.post(url, headers=headers, json=payload)
                    if resp.status_code == 200:
                        content = resp.json()["choices"][0]["message"]["content"]
                        return json.loads(content)
            except Exception as e:
                print(f"[LLM] OpenAI API error: {e}. Falling back to deterministic reasoning.")

        return None

# Singleton LLM client
llm_client = LLMClient()
