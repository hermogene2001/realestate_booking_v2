const { GoogleGenerativeAI } = require('@google/generative-ai');

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) { console.error('Set GEMINI_API_KEY to run this script.'); process.exit(1); }

async function testGeminiAPI() {
  console.log('🧪 Testing Gemini API Connection...\n');
  
  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    
    // Try different model names
    const modelsToTry = [
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-pro',
      'gemini-1.0-pro'
    ];
    
    for (const modelName of modelsToTry) {
      console.log(`\n📋 Testing model: ${modelName}`);
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent('Say "Gemini is working!" in one sentence.');
        const response = await result.response;
        const text = response.text();
        
        console.log(`✅ SUCCESS with ${modelName}!`);
        console.log(`Response: ${text}\n`);
        console.log('🎉 Gemini API is working correctly!');
        return;
      } catch (error) {
        console.log(`❌ Failed: ${error.message.split('\n')[0]}`);
      }
    }
    
    console.log('\n⚠️  No models worked. Please check:');
    console.log('1. API key is valid');
    console.log('2. Generative Language API is enabled in Google Cloud Console');
    console.log('3. Billing is enabled');
    console.log('4. API key has proper permissions');
    
  } catch (error) {
    console.error('💥 Fatal error:', error.message);
  }
}

testGeminiAPI();
