const axios = require('axios');
const fs = require('fs');

async function listModels() {
    try {
        const response = await axios.get('https://api.groq.com/openai/v1/models', {
            headers: {
                'Authorization': 'Bearer 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'
            }
        });

        const models = response.data.data.map(m => m.id);
        fs.writeFileSync('groq_models.txt', models.join('\n'));
        console.log("Models written to groq_models.txt");

    } catch (error) {
        console.error('Error fetching models:', error.response ? error.response.data : error.message);
    }
}

listModels();
