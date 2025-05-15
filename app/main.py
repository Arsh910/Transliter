from fastapi import FastAPI, Request
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from models.model_script import start_engine, get_word

app = FastAPI()

# Enable CORS for local React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://transliteration-1-2z1l.onrender.com"],
    allow_methods=["*"],
    allow_headers=["*"]
)

engines = {}

class TransliterateRequest(BaseModel):
    text: str
    model_id: int

@app.post("/transliterate")
def transliterate(request: TransliterateRequest):
    text = request.text.strip()
    model_id = request.model_id

    if model_id not in engines:
        encoder, decoder, input_stoi, target_itos, target_stoi, model = start_engine(model_id)
        engines[model_id] = (encoder, decoder, input_stoi, target_itos, target_stoi, model)

    encoder, decoder, input_stoi, target_itos, target_stoi, model = engines[model_id]
    words = text.split()
    transliterated = []

    for word in words:
        try:
            result = get_word(word, encoder, decoder, input_stoi, target_itos, target_stoi, model)
            transliterated.append(result)
        except:
            transliterated.append(word)

    return {"output": " ".join(transliterated)}
