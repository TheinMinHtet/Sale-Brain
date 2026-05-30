#!/usr/bin/env node

/**
 * Test script for chat-with-tools Edge Function
 * 
 * Usage:
 *   node test-tool-chat.cjs "Show me all shops"
 *   node test-tool-chat.cjs "What products are available?"
 */

const https = require('https');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'your-anon-key';

const userMessage = process.argv[2] || "Show me all shops";

const payload = JSON.stringify({
  messages: [
    { role: "user", content: userMessage }
  ]
});

const url = new URL('/functions/v1/chat-with-tools', SUPABASE_URL);

const options = {
  hostname: url.hostname,
  port: 443,
  path: url.pathname,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Length': Buffer.byteLength(payload)
  }
};

console.log(`\n🧪 Testing chat-with-tools Edge Function`);
console.log(`📝 User: "${userMessage}"\n`);

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log(`📡 Status: ${res.statusCode}\n`);
    
    try {
      const json = JSON.parse(data);
      
      if (json.error) {
        console.error(`❌ Error: ${json.error}`);
      } else if (json.reply) {
        console.log(`🤖 Assistant: ${json.reply}\n`);
        
        if (json.usage) {
          console.log(`📊 Usage:`);
          console.log(`   Prompt tokens: ${json.usage.promptTokenCount || 0}`);
          console.log(`   Response tokens: ${json.usage.candidatesTokenCount || 0}`);
          console.log(`   Total tokens: ${json.usage.totalTokenCount || 0}\n`);
        }
      } else {
        console.log(`📦 Response:`, JSON.stringify(json, null, 2));
      }
    } catch (e) {
      console.error(`❌ Parse error:`, e.message);
      console.log(`Raw response:`, data);
    }
  });
});

req.on('error', (e) => {
  console.error(`❌ Request error: ${e.message}`);
});

req.write(payload);
req.end();
