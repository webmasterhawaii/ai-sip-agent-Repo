import 'dotenv/config';
import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

// Health check
app.get('/', (_, res) => res.send('AI SIP Agent (SIP Connector) ✅'));

// OpenAI SIP Connector webhook
app.post('/session', express.json(), (req, res) => {
  console.log('📞 New SIP call received from OpenAI');
  
  // Minimal response: agent just greets the caller
  res.json({
    instructions: "You are a friendly AI voice agent. Greet the caller and tell them this line: 'Hello, you’re connected to AI.'",
    voice: "verse",
    modalities: ["text", "audio"]
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
