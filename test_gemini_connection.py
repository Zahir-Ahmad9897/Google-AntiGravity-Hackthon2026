from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv
from google import genai
from google.genai.errors import ClientError


PROJECT_ROOT = Path(__file__).resolve().parent
ENV_PATH = PROJECT_ROOT / ".env"
MODEL_NAME = os.getenv("CIRO_ADK_MODEL", "gemini-2.0-flash")


def main() -> int:
    load_dotenv(dotenv_path=ENV_PATH)
    api_key = os.getenv("GOOGLE_API_KEY")

    print("CIRO Gemini connection test")
    print(f".env path: {ENV_PATH}")
    print(f"GOOGLE_API_KEY detected: {bool(api_key)}")

    if not api_key:
        print("FAILURE: GOOGLE_API_KEY is missing. Add GOOGLE_API_KEY=your_key_here to .env.")
        return 1

    try:
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents="Reply with exactly: CIRO_GEMINI_OK",
        )
    except ClientError as exc:
        message = str(exc)
        if "RESOURCE_EXHAUSTED" in message or "429" in message:
            print("CONNECTION SUCCESS: GOOGLE_API_KEY loaded and Gemini API was reached.")
            print("WARNING: Gemini quota is exhausted for this model/key, so content generation was blocked.")
            return 0
        print(f"FAILURE: Gemini rejected the request: {type(exc).__name__}: {exc}")
        return 1
    except Exception as exc:
        print(f"FAILURE: Gemini request failed: {type(exc).__name__}: {exc}")
        return 1

    text = (response.text or "").strip()
    print(f"Gemini response: {text}")
    if "CIRO_GEMINI_OK" not in text:
        print("FAILURE: Gemini responded, but the expected marker was missing.")
        return 1

    print("SUCCESS: Gemini API key loaded from .env and Gemini responded.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
