import express from "express";
import fetch from "node-fetch";

const app = express();

app.use(async (req, res) => {
  const targetUrl = req.url.slice(1);
  if (!targetUrl.startsWith("http")) {
    return res.status(400).send("Please provide a full URL, e.g. /https://example.com");
  }

  try {
    const response = await fetch(targetUrl);
    const text = await response.text();
    res.set("Access-Control-Allow-Origin", "*");
    res.send(text);
  } catch (err) {
    res.status(500).send("Error fetching " + targetUrl + ": " + err.message);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy running on port ${PORT}`));
