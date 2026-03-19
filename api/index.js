module.exports = function handler(req, res) {
  res.status(200).json({
    status: "ok",
    message: "Pro Auto Voice Backend is running",
    endpoints: [
      "POST /api/voice-command",
      "POST /api/transcribe",
      "POST /api/weather",
    ],
  });
};
