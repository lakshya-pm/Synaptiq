import json

class LLMService:
    async def generate_message(self, lead, step, persona_config, previous_reply=None):
        return {
            "subject": f"Quick thought on {lead.get('company', 'your company')}",
            "body": f"Hi {lead.get('first_name', 'there')},\n\nSaw what you're doing at {lead.get('company', 'your company')}. Would love to connect and show you ChronoReach.\n\nBest,\nRavi",
            "hooks_used": ["company_name"],
            "language": "en"
        }

    async def fix_message(self, body, issues):
        return body + "\n\n(Fixed version)"
        
    async def natural_language_to_workflow(self, description):
        # Return a simple chain for stub
        return {
            "nodes": [
                {"id": "n1", "node_type": "trigger"},
                {"id": "n2", "node_type": "ai_message", "config": {"step_number": 1}}
            ],
            "edges": [
                {"source": "n1", "target": "n2"}
            ]
        }

    async def get_persona_preview(self, config):
        return {"preview_line": "Hey! Looking forward to chatting soon."}

    async def extract_ghost_voice(self, sample_emails):
        return {
            "system_prompt": "You are a friendly, assertive founder.",
            "fingerprint_summary": "Friendly, assertive, direct."
        }
        
    async def transcribe_voice(self, audio_bytes):
        return {"transcript": "I want to send a 3 step email campaign to founders."}

    async def classify_objection(self, reply_text):
        return {"type": "not_interested", "confidence": 0.9}

    async def generate_objection_response(self, lead, objection_type, reply_text):
        return "Thanks for letting me know. I'll check back next quarter."

llm_service = LLMService()
