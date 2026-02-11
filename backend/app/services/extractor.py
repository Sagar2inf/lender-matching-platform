import os
from pathlib import Path
from typing import List, Optional, Dict, Any
from google import genai
import json
from uuid import UUID
from datetime import datetime
from dotenv import load_dotenv
import pdfplumber
import json

from  app.schemas.lender import LenderPolicyCreate

load_dotenv()

gemini_api_key = os.getenv("GEMINI_API_KEYS")
client = genai.Client(api_key = gemini_api_key)
def get_extracted_json(schema, content):
    response = client.models.generate_content(
        model = "gemini-2.5-flash",
        contents = content,
        config = {
            "response_mime_type": "application/json",
            "response_schema": schema
        }
    )
    return response.parsed


def extract_text_and_tables(pdf_path):
    text_blocks = []
    table_blocks = []

    with pdfplumber.open(pdf_path) as pdf:
        for page_num, page in enumerate(pdf.pages, start=1):

            # ---- TEXT ----
            text = page.extract_text()
            if text:
                text_blocks.append(
                    f"[Page {page_num}]\n{text}"
                )

            # ---- TABLES ----
            tables = page.extract_tables()
            for t_idx, table in enumerate(tables):
                table_blocks.append({
                    "page": page_num,
                    "table_index": t_idx,
                    "rows": table
                })

    return {
        "text": "\n\n".join(text_blocks),
        "tables": table_blocks
    }


def extract_policy_with_pyplumber(file_path):
    raw = extract_text_and_tables(file_path)
    text = raw["text"][:8000]
    tables = json.dumps(raw["tables"])
    prompt = f"""
    # PERSONA
    You are a Senior Equipment Finance Underwriter with 20 years of experience.

    # TASK
    Extract lender credit guidelines and normalize them into the provided JSON schema.

    # IMPORTANT
    - Tables contain authoritative numeric thresholds.
    - Prefer table values over prose if conflicts exist.
    - Normalize Time in Business to MONTHS.
    - Normalize the state names to 2-letter codes.
    - If number written in english, give it in decimal format (e.g., 'twenty' -> 20)
    - If a field is not explicitly stated, return null.
    - Do NOT hallucinate.

    # TEXT CONTENT
    <<<
    {text}
    >>>

    # TABLE CONTENT (JSON)
    <<<
    {tables}
    >>>
    """
    content = [prompt]
    return get_extracted_json(LenderPolicyCreate, content)


def extract_policy(file_path):
    policy = extract_policy_with_pyplumber(file_path)
    print(policy.model_dump_json(indent = 2))
    return policy

if __name__ == "__main__":
    BASE_DIR = Path(__file__).resolve().parents[2]  

    pdf_dir = BASE_DIR / "pdf"
    pdf_path = r"C:\Users\csaga\OneDrive\Desktop\lender-matching-platform\pdf\2025 Program Guidelines UPDATED.pdf"
    policy = extract_policy(pdf_path)
    print(policy.model_dump_json(indent = 2))
