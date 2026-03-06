import os
import smtplib
from email.message import EmailMessage

class EmailSender:
    def __init__(self):
        self.mock_mode = os.getenv("MOCK_MODE", "true").lower() == "true"
        self.smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_user = os.getenv("SMTP_USER", "")
        self.smtp_pass = os.getenv("SMTP_PASS", "")

    async def send(self, to: str, subject: str, body: str):
        if self.mock_mode:
            print(f"[MOCK EMAIL] To: {to} | Subject: {subject} | Body: {body[:30]}...")
            return True
            
        try:
            msg = EmailMessage()
            msg.set_content(body)
            msg['Subject'] = subject
            msg['From'] = self.smtp_user
            msg['To'] = to
            
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                if self.smtp_user and self.smtp_pass:
                    server.login(self.smtp_user, self.smtp_pass)
                server.send_message(msg)
            return True
        except Exception as e:
            print(f"[EMAIL ERROR] Failed sending to {to}: {e}")
            return False

email_sender = EmailSender()
