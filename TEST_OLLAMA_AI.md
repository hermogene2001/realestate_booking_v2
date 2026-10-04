# 🧪 Test Ollama AI Setup

## Prerequisites

Make sure you have:
1. ✅ Ollama installed and running (`ollama serve`)
2. ✅ Model pulled (`ollama pull mistral`)
3. ✅ Backend running (`npm run dev`)

---

## Test 1: Verify Ollama is Running

```bash
curl http://localhost:11434/v1/models
```

**Expected Response:**
```json
{
  "object": "list",
  "data": [
    {
      "id": "mistral",
      "object": "model",
      ...
    }
  ]
}
```

If this fails: **Ollama is not running. Run `ollama serve`**

---

## Test 2: Test Chat Endpoint

First, get a JWT token by logging in:

```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

Then use the token to test chat:

```bash
curl -X POST http://localhost:5001/api/ai/chat \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"message": "What are the best neighborhoods in Kigali?"}'
```

**Expected Response:**
```json
{
  "success": true,
  "response": "Top neighborhoods in Kigali...",
  "fallback": false,
  "source": "ollama"
}
```

---

## Test 3: Test Price Prediction

```bash
curl -X POST http://localhost:5001/api/ai/predict-price \
  -H "Content-Type: application/json" \
  -d '{
    "district": "Kacyiru",
    "bedrooms": 3,
    "bathrooms": 2,
    "area": 150,
    "amenities": ["wifi", "parking", "pool"]
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "prediction": {
    "predictedPriceEth": "0.6234",
    "predictedPriceUsd": "1558.50",
    "predictedPriceRwf": "1948125",
    "confidence": 0.7,
    "comparableCount": 12,
    "aiAdjusted": true,
    "source": "ollama"
  }
}
```

---

## Test 4: Test Smart Search

```bash
curl -X POST http://localhost:5001/api/ai/smart-search \
  -H "Content-Type: application/json" \
  -d '{"query": "3 bedroom house with pool in Kacyiru under 0.8 ETH"}'
```

**Expected Response:**
```json
{
  "success": true,
  "properties": [...],
  "count": 5,
  "query": "3 bedroom house with pool in Kacyiru under 0.8 ETH",
  "source": "ollama"
}
```

---

## Troubleshooting

### Error: "Connection refused"
**Problem:** Ollama is not running  
**Solution:** Run `ollama serve` in a terminal

### Error: "Model not found"
**Problem:** Model not pulled  
**Solution:** Run `ollama pull mistral`

### Error: "Cannot GET /api/ai/chat"
**Problem:** Backend is not running  
**Solution:** Run `npm run dev` in backend folder

### Response: `"fallback": true`
**Problem:** Ollama is not responding, using local fallback  
**Solution:** Check Ollama is running and responding

### Error: "401 Unauthorized"
**Problem:** JWT token is invalid or missing  
**Solution:** Get a valid token by logging in first

---

## Quick Verification Script

Save this as `test-ai.sh`:

```bash
#!/bin/bash

echo "🧪 Testing Ollama AI Setup..."
echo ""

# Test 1: Ollama
echo "1️⃣ Testing Ollama..."
if curl -s http://localhost:11434/v1/models > /dev/null; then
  echo "✅ Ollama is running"
else
  echo "❌ Ollama is NOT running"
  echo "   Run: ollama serve"
  exit 1
fi

# Test 2: Backend
echo ""
echo "2️⃣ Testing Backend..."
if curl -s http://localhost:5001/api/health > /dev/null 2>&1; then
  echo "✅ Backend is running"
else
  echo "❌ Backend is NOT running"
  echo "   Run: npm run dev"
  exit 1
fi

# Test 3: Price Prediction
echo ""
echo "3️⃣ Testing Price Prediction..."
RESPONSE=$(curl -s -X POST http://localhost:5001/api/ai/predict-price \
  -H "Content-Type: application/json" \
  -d '{
    "district": "Kacyiru",
    "bedrooms": 3,
    "bathrooms": 2,
    "area": 150,
    "amenities": ["pool"]
  }')

if echo "$RESPONSE" | grep -q "success"; then
  echo "✅ Price Prediction works"
  echo "   Response: $RESPONSE"
else
  echo "❌ Price Prediction failed"
  echo "   Response: $RESPONSE"
fi

echo ""
echo "✅ All tests passed!"
```

Run it:
```bash
chmod +x test-ai.sh
./test-ai.sh
```

---

## Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| "Connection refused" | Ollama not running | `ollama serve` |
| "Model not found" | Model not pulled | `ollama pull mistral` |
| "Cannot GET /api/ai/chat" | Backend not running | `npm run dev` |
| Slow responses | Model too large | `ollama pull neural-chat` |
| "401 Unauthorized" | No JWT token | Login first to get token |

---

## Success Indicators

✅ Ollama responds to `/v1/models`  
✅ Backend responds to `/api/ai/predict-price`  
✅ Chat returns `"source": "ollama"`  
✅ Price prediction returns confidence score  
✅ Smart search returns properties  

If all these work, your AI setup is complete! 🎉

