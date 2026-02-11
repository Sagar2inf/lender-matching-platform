import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()
EMAIL = os.getenv("SYSTEM_EMAIL")
APP_PASSWORD = os.getenv("SYSTEM_EMAIL_PASSWORD")
# EMAIL = "builderteam06@gmail.com"
# APP_PASSWORD = "smrmgeoicxongytk"

def send_email(to_email, subject, body):
    msg = MIMEMultipart()
    msg["From"] = EMAIL
    msg["To"] = to_email
    msg["Subject"] = subject

    msg.attach(MIMEText(body, "plain"))

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(EMAIL, APP_PASSWORD)
            server.send_message(msg)
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False

# if __name__ == "__main__":
#     print("--- Starting Email Test ---")
    
#     test_recipient = "ck2sagar@gmail.com" # Best to test by sending to yourself first!
#     test_subject = "Python Test Email"
#     test_body = "If you are reading this, your Python script is working perfectly."

#     success = send_email(test_recipient, test_subject, test_body)

#     if success:
#         print(f" Success! Email sent to {test_recipient}")
#     else:
#         print(" Failed to send email. Check your credentials or internet connection.")