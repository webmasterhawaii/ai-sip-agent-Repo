import 'dotenv/config';
import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;
const WEBHOOK_SECRET = process.env.OPENAI_WEBHOOK_SECRET;

// Health check
app.get('/', (_, res) => res.send('AI SIP Agent (SIP Connector + Tools) ✅'));

// Middleware to verify OpenAI webhook secret
function verifyOpenAI(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || authHeader !== `Bearer ${WEBHOOK_SECRET}`) {
    return res.status(401).send('Unauthorized');
  }
  next();
}

// SIP Connector webhook
app.post('/session', express.json(), verifyOpenAI, (req, res) => {
  console.log('📞 Verified SIP call from OpenAI');

  res.json({
    instructions: "You are a friendly AI voice agent. Greet the caller and tell them this line: 'Hello, you’re connected to AI.'",
    voice: "verse",
    modalities: ["text", "audio"],
    tools: [
      {
        type: "web_search",
        name: "search",
        description: "Search the web for recent information"
      },
      {
        type: "function",
        name: "trigger_n8n_workflow",
        description: "Trigger an n8n workflow with structured data",
        parameters: {
          workflow_id: { type: "string" },
          payload: { type: "object" }
        }
      }
    ]
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
