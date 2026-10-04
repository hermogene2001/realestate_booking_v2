# ⚡ Quick Start - Ollama Local AI

## 30-Second Setup

### 1. Download Ollama
https://ollama.ai → Download & Install

### 2. Pull Model
```bash
ollama pull mistral
```

### 3. Start Server
```bash
ollama serve
```

### 4. Start Backend
```bash
cd backend
npm run dev
```

**Done!** Your AI is now running locally. 🎉

---

## Test It

### Chat
```bash
curl -X POST http://localhost:5001/api/ai/chat \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello!"}'
```

### Price Prediction
```bash
curl -X POST http://localhost:5001/api/ai/predict-price \
  -H "Content-Type: application/json" \
  -d '{"district":"Kacyiru","bedrooms":3,"bathrooms":2,"area":150,"amenities":["pool"]}'
```

### Smart Search
```bash
curl -X POST http://localhost:5001/api/ai/smart-search \
  -H "Content-Type: application/json" \
  -d '{"query":"3 bed house with pool in Kacyiru"}'
```

---

## 3 AI Features

| Feature | What It Does | Endpoint |
|---------|-------------|----------|
| **Chat** | Answer user questions | `POST /api/ai/chat` |
| **Price** | Predict property prices | `POST /api/ai/predict-price` |
| **Search** | Natural language search | `POST /api/ai/smart-search` |

---

## Models

```bash
ollama pull mistral        # ⭐ Recommended (4GB, fast)
ollama pull neural-chat    # Smaller (2GB, faster)
ollama pull llama2         # Larger (7GB, better)
```

Change in `.env`:
```env
OLLAMA_MODEL=mistral
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Connection refused | Run `ollama serve` |
| Model not found | Run `ollama pull mistral` |
| Slow responses | Use `neural-chat` model |
| AI not working | Check logs - fallback works anyway |

---

## Cost

**$0** - Runs on your machine, no API fees!

---

## Full Docs

See: `OLLAMA_SETUP_GUIDE.md` and `LOCAL_AI_IMPLEMENTATION.md`

