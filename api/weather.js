const fetch = require("node-fetch");

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  try {
    const { lat, lon } = req.body || {};

    if (lat === undefined || lon === undefined) {
      return res.status(400).json({ error: "Missing 'lat' and/or 'lon' fields" });
    }

    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Weather API key not configured on server" });
    }

    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;

    const weatherRes = await fetch(url);
    const data = await weatherRes.json();

    if (!weatherRes.ok) {
      return res.status(weatherRes.status).json({ error: data.message || "Weather API error" });
    }

    return res.status(200).json({
      temp: data.main?.temp ?? 0,
      description: data.weather?.[0]?.main ?? "Unknown",
      city_name: data.name ?? "Unknown",
      icon: data.weather?.[0]?.icon ?? "01d",
    });
  } catch (err) {
    console.error("weather error:", err);
    return res.status(500).json({ error: err.message });
  }
};
