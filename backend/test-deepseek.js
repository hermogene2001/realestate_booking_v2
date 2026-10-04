const https = require('https');

const API_KEY = process.env.DEEPSEEK_API_KEY;
if (!API_KEY) { console.error('Set DEEPSEEK_API_KEY to run this script.'); process.exit(1); }

const data = JSON.stringify({
  model: 'deepseek-chat',
  messages: [{ role: 'user', content: 'Say "DeepSeek is working!" in one sentence.' }]
});

const options = {
  hostname: 'api.deepseek.com',
  path: '/v1/chat/completions',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Length': data.length
  }
};

console.log('🧪 Testing DeepSeek API Key...\n');
console.log('📍 Endpoint: https://api.deepseek.com/v1/chat/completions');
console.log('API key is provided via DEEPSEEK_API_KEY.');
console.log('🤖 Model: deepseek-chat\n');

const req = https.request(options, (res) => {
  console.log(`📡 Response Status: ${res.statusCode}`);
  console.log(`📡 Response Headers:`, res.headers);
  console.log('');
  
  let body = '';
  
  res.on('data', (chunk) => {
    body += chunk;
  });
  
  res.on('end', () => {
    try {
      const response = JSON.parse(body);
      
      if (response.error) {
        console.log('❌ ERROR:');
        console.log(`   Message: ${response.error.message}`);
        console.log(`   Type: ${response.error.type}`);
        console.log(`   Code: ${response.error.code}`);
      } else if (response.choices && response.choices[0]) {
        console.log('✅ SUCCESS! DeepSeek API is working!');
        console.log('\n💬 Response:');
        console.log(`   ${response.choices[0].message.content}`);
        console.log('\n📊 Usage:');
        console.log(`   Prompt Tokens: ${response.usage?.prompt_tokens || 'N/A'}`);
        console.log(`   Completion Tokens: ${response.usage?.completion_tokens || 'N/A'}`);
        console.log(`   Total Tokens: ${response.usage?.total_tokens || 'N/A'}`);
      } else {
        console.log('⚠️  Unexpected response:');
        console.log(JSON.stringify(response, null, 2));
      }
    } catch (e) {
      console.log('❌ Failed to parse response:');
      console.log(body);
    }
  });
});

req.on('error', (error) => {
  console.log('❌ Network Error:');
  console.log(`   ${error.message}`);
  console.log('\nPossible causes:');
  console.log('   - DNS resolution failed');
  console.log('   - Network/firewall blocking api.deepseek.com');
  console.log('   - DeepSeek API is down');
});

req.write(data);
req.end();
