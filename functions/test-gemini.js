const fs = require('fs');
const envFile = fs.readFileSync('.env', 'utf-8');
const apiKey = envFile.split('=')[1].trim();

async function test() {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
  const data = await response.json();
  const models = data.models.map(m => m.name);
  console.log("AVAILABLE MODELS:", models);
}

test();
