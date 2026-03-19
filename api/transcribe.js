const OpenAI = require("openai");
const Busboy = require("busboy");

// Parse multipart form data from the request
function parseMultipart(req) {
  return new Promise((resolve, reject) => {
    const busboy = Busboy({ headers: req.headers });
    let fileBuffer = null;
    let fileName = "audio.m4a";

    busboy.on("file", (fieldname, file, info) => {
      const chunks = [];
      fileName = info.filename || fileName;
      file.on("data", (chunk) => chunks.push(chunk));
      file.on("end", () => {
        fileBuffer = Buffer.concat(chunks);
      });
    });

    busboy.on("finish", () => {
      if (fileBuffer) {
        resolve({ buffer: fileBuffer, name: fileName });
      } else {
        reject(new Error("No audio file received"));
      }
    });

    busboy.on("error", reject);
    req.pipe(busboy);
  });
}

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const fileData = await parseMultipart(req);

    // Convert buffer to a File-like object for OpenAI SDK
    const file = new File([fileData.buffer], fileData.name, {
      type: "audio/mp4",
    });

    const transcription = await openai.audio.transcriptions.create({
      model: "whisper-1",
      file: file,
    });

    return res.status(200).json({ text: transcription.text || "" });
  } catch (err) {
    console.error("transcribe error:", err);
    return res.status(500).json({ error: err.message });
  }
};

// Vercel needs raw body for multipart parsing
module.exports.config = {
  api: {
    bodyParser: false,
  },
};
