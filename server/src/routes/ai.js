import express from 'express';

const router = express.Router();

router.post('/chat', async (req, res) => {
    try {
        const { messages, context } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'Messages array is required' });
        }

        // Construct system prompt with context
        const systemPrompt = {
            role: 'system',
            content: `You are StickyTasks AI, a helpful and efficient assistant for a sticky note application.
      
      Your Role:
      - Help users organize their tasks and notes.
      - Provide suggestions based on the user's current notes.
      - Be concise, friendly, and professional.
      - If the user asks to create a note, guide them on how to do it (or suggest the content).
      
      Current User Context (Notes):
      ${JSON.stringify(context, null, 2)}
      
      Answer the user's question based on this context if relevant.`
        };

        const conversation = [systemPrompt, ...messages];

        const response = await fetch(process.env.AI_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.AI_API_KEY}`
            },
            body: JSON.stringify({
                model: "LongCat-Flash-Chat",
                messages: conversation,
                max_tokens: 1000,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('AI API Error Status:', response.status);
            console.error('AI API Error Body:', errorText);
            return res.status(response.status).json({ error: 'Failed to communicate with AI service', details: errorText });
        }

        const data = await response.json();
        res.json(data);

    } catch (error) {
        console.error('AI Route Exception:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

export default router;
