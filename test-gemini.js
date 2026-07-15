const crypto = require('crypto');

// Load .env
require('dotenv').config();

// Read SDK version
let sdkVersion = 'unknown';
try {
  const pkg = require('./package.json');
  sdkVersion = pkg.dependencies['@google/genai'] || 'unknown';
} catch (e) {}

const apiKey = process.env.GEMINI_API_KEY
  ? process.env.GEMINI_API_KEY.trim()
  : '';

console.log('====================================');
console.log('STANDALONE GEMINI SDK DIAGNOSTIC');
console.log('====================================');
console.log('Current Working Directory :', process.cwd());
console.log('Node Version              :', process.version);
console.log('SDK Version               :', sdkVersion);
console.log('Platform                  :', process.platform);
console.log('Architecture              :', process.arch);
console.log('API Key Loaded            :', apiKey ? 'YES' : 'NO');

if (apiKey) {
  console.log('API Key Prefix (10)       :', apiKey.substring(0, 10));
  console.log('API Key Suffix (10)       :', apiKey.substring(apiKey.length - 10));
  console.log('API Key Length            :', apiKey.length);

  console.log(
    'API Key Fingerprint       :',
    crypto.createHash('sha256').update(apiKey).digest('hex')
  );

  console.log('Starts With              :', apiKey.substring(0, 2));
  console.log('Ends With                :', apiKey.substring(apiKey.length - 2));
  console.log('Contains Spaces          :', /\s/.test(apiKey));
  console.log('First Character Code     :', apiKey.charCodeAt(0));
  console.log(
    'Last Character Code      :',
    apiKey.charCodeAt(apiKey.length - 1)
  );
}

console.log('Configured Main Model     :', process.env.GEMINI_MAIN_MODEL);
console.log('Configured Fast Model     :', process.env.GEMINI_FAST_MODEL);
console.log('Configured Embedding      :', process.env.GEMINI_EMBEDDING_MODEL);
console.log('NODE_ENV                  :', process.env.NODE_ENV);
console.log('====================================');

if (!apiKey) {
  console.log('\nERROR: GEMINI_API_KEY is missing.\n');
  process.exit(1);
}

const { GoogleGenAI } = require('@google/genai');

async function runTest() {
  const model =
    process.env.GEMINI_FAST_MODEL || 'gemini-2.5-flash';

  console.log('\nSending request...');
  console.log('Model:', model);

  try {
    const ai = new GoogleGenAI({
      apiKey: apiKey
    });

    const response = await ai.models.generateContent({
      model: model,
      contents: 'Reply ONLY with the word SUCCESS'
    });

    console.log('\n==================================');
    console.log('✅ GEMINI API WORKING');
    console.log('==================================');
    console.log('Model Used      :', model);
    console.log('Model Version   :', response.modelVersion);

    console.log(
      'Response Text   :',
      response.text ||
        response.candidates?.[0]?.content?.parts?.[0]?.text
    );

    console.log(
      'Usage Metadata  :',
      JSON.stringify(response.usageMetadata, null, 2)
    );

    console.log('\nFull Response:\n');
    console.log(JSON.stringify(response, null, 2));

    console.log('\n==================================');
  } catch (err) {
    console.log('\n==================================');
    console.log('❌ GEMINI API FAILED');
    console.log('==================================');

    console.log('Status Code     :', err.status || err.statusCode);
    console.log('Error Code      :', err.code || 'N/A');
    console.log('Error Name      :', err.name);
    console.log('Error Message   :', err.message);

    if (err.response) {
      console.log('\nHTTP Response:\n');
      console.log(JSON.stringify(err.response, null, 2));
    }

    console.log('\nComplete Error:\n');
    console.log(JSON.stringify(err, null, 2));

    console.log('\nStack:\n');
    console.log(err.stack);

    console.log('\n==================================');
  }
}

runTest();