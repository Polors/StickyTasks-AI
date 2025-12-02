import dotenv from 'dotenv';
dotenv.config();

async function testAI() {
    console.log('Testing AI API...');
    console.log('URL:', process.env.AI_API_URL);
    console.log('Key:', process.env.AI_API_KEY ? 'Present' : 'Missing');

    try {
        const response = await fetch(process.env.AI_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.AI_API_KEY}`
            },
            body: JSON.stringify({
                model: "LongCat-Flash-Chat",
                messages: [{ role: "user", content: "Hello" }],
                max_tokens: 100,
                temperature: 0.7
            })
        });

        console.log('Status:', response.status);
        const text = await response.text();
        console.log('Body:', text);

    } catch (error) {
        console.error('Test failed:', error);
    }
}

testAI();
