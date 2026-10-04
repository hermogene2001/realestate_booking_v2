# 🔍 Diagnose Your Setup

If you're seeing "Sorry, I encountered an error. Please try again.", follow these steps:

---

## Step 1: Check Ollama

### Is Ollama Running?

```bash
curl http://localhost:11434/v1/models
```

**If you see an error:**
- Ollama is NOT running
- **Fix:** Run `ollama serve` in a terminal

**If you see a list of models:**
- ✅ Ollama is running correctly

---

## Step 2: Check Backend

### Is Backend Running?

```bash
curl http://localhost:5001/api/health
```

**If you see an error:**
- Backend is NOT running
- **Fix:** Run `npm run dev` in the backend folder

**If you see a response:**
- ✅ Backend is running correctly

---

## Step 3: Check AI Service

### Test Price Prediction (No Auth Required)

```bash
curl -X POST http://localhost:5001/api/ai/predict-price \
  -H "Content-Type: application/json" \
  -d '{
    "district": "Kacyiru",
    "bedrooms": 3,
    "bathrooms": 2,
    "area": 150,
    "amenities": ["pool"]
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "prediction": {
    "predictedPriceEth": "0.6234",
    ...
  }
}
```

**If you see an error:**
- Check backend logs for details
- Make sure database is running

---

## Step 4: Check Frontend

### Is Frontend Running?

Open browser: http://localhost:3000

**If you see a blank page or error:**
- Frontend is NOT running
- **Fix:** Run `npm run dev` in the frontend folder

**If you see the app:**
- ✅ Frontend is running correctly

---

## Complete Checklist

Run these commands in separate terminals:

### Terminal 1: Ollama
```bash
ollama serve
```
✅ Should show: "Listening on 127.0.0.1:11434"

### Terminal 2: Backend
```bash
cd backend
npm run dev
```
✅ Should show: "Server running on port 5001"

### Terminal 3: Frontend
```bash
cd frontend
npm run dev
```
✅ Should show: "Local: http://localhost:3000"

---

## Verify Everything Works

Once all 3 are running, test:

```bash
# 1. Ollama
curl http://localhost:11434/v1/models

# 2. Backend
curl http://localhost:5001/api/health

# 3. Frontend
curl http://localhost:3000
```

All should respond without errors.

---

## If Still Getting Error

### Check Backend Logs

Look for errors like:
- `[AI] Ollama not available` - Ollama is not running
- `Cannot connect to database` - Database is not running
- `ECONNREFUSED` - Service not running

### Check Frontend Console

Open browser DevTools (F12) → Console tab

Look for errors like:
- `Failed to fetch` - Backend not running
- `401 Unauthorized` - Need to login
- `CORS error` - Backend CORS configuration issue

### Check Network Tab

Open browser DevTools (F12) → Network tab

Make a request and check:
- **Status 200** - Success
- **Status 500** - Backend error
- **Status 0** - Connection refused (backend not running)

---

## Quick Diagnosis Script

Save as `diagnose.sh`:

```bash
#!/bin/bash

echo "🔍 Diagnosing Setup..."
echo ""

# Check Ollama
echo "1️⃣ Checking Ollama..."
if curl -s http://localhost:11434/v1/models > /dev/null; then
  echo "✅ Ollama is running"
else
  echo "❌ Ollama is NOT running"
  echo "   Fix: Run 'ollama serve'"
fi

# Check Backend
echo ""
echo "2️⃣ Checking Backend..."
if curl -s http://localhost:5001/api/health > /dev/null 2>&1; then
  echo "✅ Backend is running"
else
  echo "❌ Backend is NOT running"
  echo "   Fix: Run 'npm run dev' in backend folder"
fi

# Check Frontend
echo ""
echo "3️⃣ Checking Frontend..."
if curl -s http://localhost:3000 > /dev/null 2>&1; then
  echo "✅ Frontend is running"
else
  echo "❌ Frontend is NOT running"
  echo "   Fix: Run 'npm run dev' in frontend folder"
fi

# Check Database
echo ""
echo "4️⃣ Checking Database..."
if curl -s http://localhost:5001/api/health | grep -q "database"; then
  echo "✅ Database is connected"
else
  echo "⚠️  Database status unknown"
  echo "   Make sure MySQL is running"
fi

echo ""
echo "🔍 Diagnosis complete!"
```

Run it:
```bash
chmod +x diagnose.sh
./diagnose.sh
```

---

## Most Common Issues

### Issue 1: "Connection refused"
**Cause:** Ollama or Backend not running  
**Fix:** Run `ollama serve` and `npm run dev`

### Issue 2: "Cannot GET /api/ai/chat"
**Cause:** Backend not running  
**Fix:** Run `npm run dev` in backend folder

### Issue 3: Blank page in browser
**Cause:** Frontend not running  
**Fix:** Run `npm run dev` in frontend folder

### Issue 4: "401 Unauthorized"
**Cause:** Not logged in  
**Fix:** Login first to get JWT token

### Issue 5: Slow responses
**Cause:** Ollama model too large  
**Fix:** Use smaller model: `ollama pull neural-chat`

---

## Need Help?

1. Check the logs in each terminal
2. Run the diagnosis script
3. Verify all 3 services are running
4. Check the TEST_OLLAMA_AI.md file for detailed tests

**Everything should work once all 3 services are running!** ✅

