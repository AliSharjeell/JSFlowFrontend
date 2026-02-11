const axios = require('axios');
const fs = require('fs');

async function testTTS() {
    const GROQ_API_KEY = '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';

    console.log("Testing Groq TTS...");
    console.log("Model: canopylabs/orpheus-v1-english");

    try {
        const response = await axios.post(
            'https://api.groq.com/openai/v1/audio/speech',
            {
                model: 'canopylabs/orpheus-v1-english',
                input: 'Hello, this is a test of the Groq Text to Speech API.',
                voice: 'Fritz-PlayAI', // Trying with the voice from the code
                response_format: 'wav',
            },
            {
                headers: {
                    'Authorization': `Bearer ${GROQ_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                responseType: 'arraybuffer',
            }
        );

        console.log(`Success! Status: ${response.status}`);
        console.log(`Response size: ${response.data.length} bytes`);
        fs.writeFileSync('test_output.wav', response.data);
        console.log('Saved to test_output.wav');

    } catch (error) {
        if (error.response) {
            console.error('Error Status:', error.response.status);
            console.error('Error Data:', error.response.data.toString()); // Convert buffer to string to see error message
        } else {
            console.error('Error:', error.message);
        }
    }
}

testTTS();
