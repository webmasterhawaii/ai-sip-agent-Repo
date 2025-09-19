import express from "express";
import expressWs from "express-ws";
import { WebSocket } from "ws";

const app = express();
expressWs(app);

const PORT = process.env.PORT || 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Health check
app.get("/", (_, res) => res.send("AI SIP Agent is running ✅"));

// Twilio SIP webhook (responds with TwiML to stream audio)
app.post("/sip", (req, res) => {
  console.log("Incoming SIP call");
  res.type("text/xml");
  res.send(`
    <Response>
      <Connect>
        <Stream url="wss://${process.env.RAILWAY_STATIC_URL}/media" />
      </Connect>
    </Response>
  `);
});

// Media WebSocket from Twilio
app.ws("/media", (ws, req) => {
  console.log("Twilio media stream started");

  // Connect to OpenAI Realtime API
  const openaiWs = new WebSocket(
    "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12",
    {
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "OpenAI-Beta": "realtime=v1",
      },
    }
  );

  // Pipe Twilio → OpenAI
  ws.on("message", (msg) => {
    if (openaiWs.readyState === WebSocket.OPEN) {
      openaiWs.send(msg);
    }
  });

  // Pipe OpenAI → Twilio
  openaiWs.on("message", (msg) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(msg);
    }
  });

  ws.on("close", () => {
    console.log("Twilio media stream closed");
    openaiWs.close();
  });

  openaiWs.on("close", () => {
    console.log("OpenAI realtime closed");
    ws.close();
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
