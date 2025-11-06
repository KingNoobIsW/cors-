// Simple secure CORS proxy for personal use
const express = require("express");
const rateLimit = require("express-rate-limit");
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));

const app = express();

// ✅ 1. Whitelist allowed websites that can use your proxy
const allowedOrigins = [
  "https://your-website.com",   // ← replace this with your actual site domain
  "http://localhost:5500"       // ← optional: for local testing
];

// ✅ 2. CORS middleware to only allow requests from your domains
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.set("Access-Control-Allow-Origin", origin);
  }
  res.set("Vary", "Origin");
  next();
});

// ✅ 3. Rate limiting — limit to 30 requests per minute per IP
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // limit each IP to 30 requests per minute
  message: "Rate limit exceeded. Please try again later."
});
app.use(limiter);

// ✅ 4. Proxy logic
app.use(async (req, res) => {
  const targetUrl = req.url.slice(1); // everything after the first "/"
  if (!targetUrl.startsWith("http")) {
    return res
      .status(400)
      .send("Please provide a full URL, e.g. /https://example.com");
  }

  try {
    const response = await fetch(targetUrl);
    const text = await response.text();
    res.send(text);
  } catch (err) {
    res.status(500).send("Error fetching " + targetUrl + ": " + err.message);
  }
});

// ✅ 5. Start the server (Render automatically assigns a PORT)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Secure proxy running on port ${PORT}`));
