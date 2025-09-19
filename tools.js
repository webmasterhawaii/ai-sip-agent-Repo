import fetch from "node-fetch";

/**
 * Call OpenAI Responses API with web_search tool
 */
export async function runWebSearch(query) {
  const resp = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini", // fast reasoning model
      input: query,
      tools: [{ type: "web_search" }]
    })
  });
  return await resp.json();
}

/**
 * Trigger an n8n workflow via webhook
 */
export async function triggerN8n(workflowId, payload) {
  const resp = await fetch(`${process.env.N8N_BASE_URL}/webhook/${workflowId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return await resp.json();
}
