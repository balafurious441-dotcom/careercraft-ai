from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google import genai

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 🔑 Unga Gemini API Key-a inge paste pannunga
GEMINI_API_KEY = "AQ.Ab8RN6JQqU71k56j5a_zKZS9sfQsTKGr--hhU86Zp5RqPzY_WA"

client = genai.Client(api_key=GEMINI_API_KEY)

class ChatRequest(BaseModel):
    message: str

@app.post("/chat")
def chat_with_ai(data: ChatRequest):
    if not GEMINI_API_KEY or GEMINI_API_KEY == "YOUR_GEMINI_API_KEY_HERE":
        raise HTTPException(status_code=400, detail="Gemini API Key missing in app.py!")

    try:
        response = client.models.generate_content(
            model="gemini-1.5-flash-8b", # Light-weight model 
            contents=data.message,
        )
        return {"reply": response.text}
    except Exception as e:
        print("Error Details:", str(e))
        raise HTTPException(status_code=500, detail=str(e))