const OpenAI = require("openai");

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  try {
    const { command } = req.body || {};

    if (!command || typeof command !== "string" || command.trim() === "") {
      return res.status(400).json({ error: "Missing 'command' field" });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const systemPrompt = `You are a car voice assistant AI. Parse the user's voice command and respond with a JSON object.
The user may speak in ANY language. Understand the intent regardless of language.

Supported actions:
- "PLAY_MUSIC" - Play music or a specific song. Target = song/artist name or empty.
- "PAUSE_MUSIC" - Pause music.
- "NEXT_TRACK" - Next track.
- "PREVIOUS_TRACK" - Previous track.
- "CALL_CONTACT" - Make a phone call. Target = contact name or phone number.
- "SEND_MESSAGE" - Send a text message. Target = contact name. Details = message content.
- "NAVIGATE" - Open navigation/GPS. Target = destination address or place name.
- "READ_NOTIFICATIONS" - Read out notifications.
- "VOLUME_UP" - Increase volume.
- "VOLUME_DOWN" - Decrease volume.
- "UNKNOWN" - If the command is not recognized.

Respond ONLY with a valid JSON object (no markdown, no extra text):
{"action": "...", "confidence": 0.0, "target": "...", "details": "...", "display_text": "human readable description"}

The confidence should be a number between 0 and 1.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: command },
      ],
      temperature: 0.3,
      max_tokens: 200,
    });

    const raw = completion.choices[0]?.message?.content || "";
    const cleaned = raw
      .trim()
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return res.status(500).json({ error: "Failed to parse AI response", raw: cleaned });
    }

    return res.status(200).json({
      action: parsed.action || "UNKNOWN",
      confidence: parsed.confidence || 0.0,
      target: parsed.target || "",
      details: parsed.details || "",
      display_text: parsed.display_text || "",
    });
  } catch (err) {
    console.error("voice-command error:", err);
    return res.status(500).json({ error: err.message });
  }
};
