// index.js
const express = require("express");
const rateLimit = require("express-rate-limit");
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));

const app = express();

// ✅ 1. Whitelist allowed websites
const allowedOrigins = [
  "https://your-website.com",
  "http://localhost:5500"
];

// ✅ 2. CORS middleware
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.set("Access-Control-Allow-Origin", origin);
  }
  res.set("Vary", "Origin");
  next();
});

// ✅ 3. Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: "Rate limit exceeded. Please try again later."
});
app.use(limiter);

// ✅ 4a. Serve secret dynamic iframe page at "/"
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8" />
        <title>Dynamic Proxy Iframe</title>
        <style>
            body { font-family: sans-serif; }
            #container { margin: 24px; }
            #iframe { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; border: 0; z-index: 999; background: white; }
            input { width: 80%; padding: 6px; margin-right: 6px; }
            button { padding: 6px 12px; }
        </style>
    </head>
    <body>
        <div id="container">
            <input id="urlInput" type="text" placeholder="Enter full URL, e.g. https://example.com" />
            <button id="openBtn">Open</button>
            <p>Press '!' to open iframe with entered URL.</p>
        </div>
        <iframe id="iframe" sandbox="allow-forms allow-same-origin" title="Embedded site"></iframe>

        <script>
            const input = document.getElementById('urlInput');
            const iframe = document.getElementById('iframe');
            const container = document.getElementById('container');
            const openBtn = document.getElementById('openBtn');

            function openIframe() {
                let url = input.value.trim();
                if (!url.startsWith("http")) {
                    alert("Please enter a valid full URL starting with http or https.");
                    return;
                }
                // Add proxy prefix
                iframe.src = "/" + url;
                container.style.display = 'none';
                iframe.style.display = 'block';
            }

            openBtn.addEventListener('click', openIframe);
            document.addEventListener('keydown', function(event) {
                if (event.key === '!') openIframe();
            });
        </script>
    </body>
    </html>
  `);
});

// ✅ 4b. Proxy logic for all other routes
app.use(async (req, res) => {
  const targetUrl = req.url.slice(1); // remove leading "/"
  if (!targetUrl.startsWith("http")) {
    return res.status(400).send("Please provide a full URL, e.g. /https://example.com");
  }

  try {
    const response = await fetch(targetUrl);
    const text = await response.text();
    res.send(text);
  } catch (err) {
    res.status(500).send("Error fetching " + targetUrl + ": " + err.message);
  }
});

// ✅ 5. Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Secure proxy running on port ${PORT}`));
