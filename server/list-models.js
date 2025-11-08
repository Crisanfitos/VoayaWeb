require('dotenv').config({ path: __dirname + '/.env' });
const { GoogleGenerativeAI } = require('@google/generative-ai');
async function main() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
        console.error('GEMINI_API_KEY not set');
        process.exit(1);
    }
    const client = new GoogleGenerativeAI(key);
    try {
        const resp = await client.listModels();
        console.log('Models:', JSON.stringify(resp, null, 2));
    } catch (err) {
        console.error('Error listing models:', err);
        process.exit(1);
    }
}

main();
