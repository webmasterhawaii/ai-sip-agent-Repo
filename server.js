import "dotenv/config";
import express from "express";
import expressWs from "express-ws";
import { WebSocket } from "ws";
import { runWebSearch, triggerN8n } from "./tools.js";

const app = express();
expressWs(app);

const PORT = process.env.PORT || 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL; // e.g. ai-voice-agent.up.railway.app

// Health check
app.get("/", (_, res) => res.send("AI Voice Agent (Twilio Media Streams ↔ OpenAI Realtime) ✅"));

// Twilio webhook to start Media Stream
app.post("/voice", (req, res) => {
  res.type("text/xml");
  res.send(`
    <Response>
      <Connect>
        <Stream url="wss://${PUBLIC_BASE_URL}/media" />
      </Connect>
    </Response>
  `);
});

// Twilio Media Stream handler
app.ws("/media", (twilioWs) => {
  console.log("📞 Twilio Media Stream connected");

  // Connect to OpenAI Realtime API
  const rt = new WebSocket(
    "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12",
    {
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "OpenAI-Beta": "realtime=v1"
      }
    }
  );

  rt.on("open", () => {
    console.log("🔗 OpenAI Realtime connected");
    rt.send(JSON.stringify({
      type: "session.update",
      session: {
        instructions: "You are a helpful AI voice assistant.",
        voice: "verse",
        modalities: ["text", "audio"]
      }
    }));
  });

  // Forward Twilio → OpenAI
  twilioWs.on("message", (msg) => {
    if (rt.readyState === WebSocket.OPEN) rt.send(msg);
  });

  // Forward OpenAI → Twilio
  rt.on("message", async (buf) => {
    const evt = JSON.parse(buf.toString());

    // Handle audio
    if (evt.type === "response.output_audio.delta" && evt.audio) {
      if (twilioWs.readyState === WebSocket.OPEN) {
        twilioWs.send(JSON.stringify({ event: "media", media: { payload: evt.audio } }));
      }
    }

    // Example: handle tool calls (stubbed)
    if (evt.type === "response.function_call") {
      console.log("🔧 Tool request:", evt);

      if (evt.name === "search") {
        const results = await runWebSearch(evt.arguments.query);
        rt.send(JSON.stringify({
          type: "response.create",
          response: { instructions: `Search results: ${JSON.stringify(results)}` }
        }));
      }

      if (evt.name === "trigger_n8n_workflow") {
        const results = await triggerN8n(evt.arguments.workflow_id, evt.arguments.payload);
        rt.send(JSON.stringify({
          type: "response.create",
          response: { instructions: `n8n workflow response: ${JSON.stringify(results)}` }
        }));
      }
    }
  });

  const closeAll = () => {
    try { rt.close(); } catch {}
    try { twilioWs.close(); } catch {}
  };

  twilioWs.on("close", () => { console.log("📴 Twilio closed"); closeAll(); });
  rt.on("close", () => { console.log("🧵 OpenAI closed"); closeAll(); });
});

// Start server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
