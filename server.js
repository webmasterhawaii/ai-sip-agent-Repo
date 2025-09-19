import 'dotenv/config';
import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

// Health check
app.get('/', (_, res) => res.send('AI SIP Agent (SIP Connector) ✅'));

// OpenAI calls this webhook when a new SIP call arrives
app.post('/session', express.json(), (req, res) => {
  console.log('New SIP session request from OpenAI');

  // Define agent behavior + voice
  res.json({
    instructions: "You are an AI voice assistant. Answer naturally and helpfully.",
    voice: "verse", // OpenAI built-in voice
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
        description: "Trigger an n8n automation workflow",
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
