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

// ✅ 4a. Serve minimal proxy page at "/"
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8" />
        <title>Proxy Input</title>
        <style>
            body { font-family: sans-serif; margin: 24px; position: relative; }
            input { width: 100%; padding: 10px; font-size: 16px; box-sizing: border-box; }
            #status { 
                position: absolute; top: 10px; right: 10px; 
                font-size: 14px; color: green; display: none;
            }
        </style>
    </head>
    <body>
        <input id="urlInput" type="text" placeholder="Enter full URL, e.g. https://example.com" />
        <div id="status">Opening...</div>

        <script>
            const input = document.getElementById('urlInput');
            const status = document.getElementById('status');

            function showStatus() {
                status.style.display = 'block';
                setTimeout(() => status.style.display = 'none', 1000); // hide after 1 second
            }

            function openProxy() {
                const url = input.value.trim();
                if (!url || !url.startsWith("http")) return;

                showStatus(); // show opening indicator

                const proxiedPath = "/" + url;
                const newTab = window.open("about:blank", "_blank");

                if (newTab) {
                    try {
                        newTab.location.href = proxiedPath;
                    } catch (err) {
                        window.open(proxiedPath, "_blank");
                    }
                } else {
                    window.open(proxiedPath, "_blank");
                }
            }

            // Trigger only with the '!' key
            document.addEventListener('keydown', function(event) {
                if (event.key === '!') openProxy();
            });

            // Focus input on load
            window.addEventListener('load', () => input.focus());
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
