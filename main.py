from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import requests

app = FastAPI()

# Enable CORS for Netlify
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str

GROQ_API_KEY = os.getenv("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")

@app.get("/")
def read_root():
    return {"status": "CareerCraft AI Backend is Live!"}

@app.post("/chat")
def chat(req: ChatRequest):
    if not GROQ_API_KEY:
        raise HTTPException(status_code=500, detail="API Key not configured on server!")
    
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": [
            {"role": "system", "content": "You are CareerCraft AI, an expert career advisor and resume helper. Provide clear, direct, and professional answers."},
            {"role": "user", "content": req.message}
        ]
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers)
        res_data = response.json()
        if response.status_code == 200:
            reply = res_data["choices"][0]["message"]["content"]
            return {"reply": reply}
        else:
            raise HTTPException(status_code=500, detail=f"AI Error: {res_data.get('error', {}).get('message', 'Unknown Error')}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))