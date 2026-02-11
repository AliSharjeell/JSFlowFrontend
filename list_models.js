const axios = require('axios');

async function listModels() {
    try {
        const response = await axios.get('https://api.groq.com/openai/v1/models', {
            headers: {
                'Authorization': 'Bearer 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'
            }
        });
        const models = response.data.data.map(m => m.id);
        for (let i = 0; i < models.length; i += 10) {
            console.log(models.slice(i, i + 10).join('\n'));
            await new Promise(r => setTimeout(r, 500)); // Small delay to help flush buffer
        }
    } catch (error) {
        console.error('Error fetching models:', error.response ? error.response.data : error.message);
    }
}

listModels();
