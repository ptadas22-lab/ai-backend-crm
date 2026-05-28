require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama3-8b-8192"; // free model on Groq

async function callGroq(prompt) {
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1024,
      temperature: 0.7
    })
  });

  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.choices?.[0]?.message?.content || "";
}

// ── Health check ───────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ status: "✅ AI Business Generator running" });
});

app.get("/test-ai", (req, res) => {
  res.json({
    status: "ok",
    key: GROQ_API_KEY ? "set ✅" : "missing ❌"
  });
});

// ── Generate Ideas ─────────────────────────────────────
app.post("/generate", async (req, res) => {
  const { budget, location, type, count = 3 } = req.body;

  if (!budget || !location || !type) {
    return res.status(400).json({ error: "Missing fields" });
  }

  // Fallback ideas if no API key
  if (!GROQ_API_KEY) {
    const fallback = generateFallback(budget, location, type, count);
    return res.json({ result: fallback });
  }

  try {
    const prompt = `Generate exactly ${count} business ideas for India.
Budget: ₹${budget}
Location: ${location}
Type: ${type}

For each idea use this EXACT format with blank line between ideas:

Idea Name Here

📍 Location: ${location}
💸 Investment: ₹[realistic amount]
📈 Expected Profit: ₹[realistic amount]/month
🔥 [one line market demand]

💡 Tip: [one practical starting tip]

No extra text, no numbering, just the ideas.`;

    const result = await callGroq(prompt);
    res.json({ result });

  } catch (err) {
    console.error("GROQ ERROR:", err.message);
    // fallback if Groq fails
    const fallback = generateFallback(budget, location, type, count);
    res.json({ result: fallback });
  }
});

// ── Business Plan ──────────────────────────────────────
app.post("/plan", async (req, res) => {
  const { name, location, profit } = req.body;

  if (!name || !location) {
    return res.status(400).json({ error: "Missing fields" });
  }

  if (!GROQ_API_KEY) {
    return res.json({ plan: getFallbackPlan(name, location, profit) });
  }

  try {
    const prompt = `Write a practical business guide for an Indian entrepreneur.
Business: ${name}
Location: ${location}
Expected Profit: ${profit}

Use **Section Name** format for these headers:
**Market Demand**
**Why This Works**
**How To Start**
**Marketing Strategy**
**Risks**
**Growth Opportunities**

Keep under 400 words. Be specific and practical for Indian market.`;

    const plan = await callGroq(prompt);
    res.json({ plan });

  } catch (err) {
    console.error("PLAN ERROR:", err.message);
    res.json({ plan: getFallbackPlan(name, location, profit) });
  }
});

// ── Fallback ideas (no API key needed) ────────────────
function generateFallback(budget, location, type, count) {
  const b = Number(budget);
  const ideas = [];
  const baseList = {
    food: ["Cloud Kitchen", "Tiffin Service", "Juice Bar", "Street Food Cart", "Sweets Shop"],
    online: ["Dropshipping Store", "Instagram Reselling", "Digital Products", "Affiliate Blog", "WhatsApp Business"],
    tech: ["Mobile Repair Shop", "IT Support Service", "Computer Classes", "Web Design Service", "CCTV Installation"],
    retail: ["General Store", "Clothing Boutique", "Stationery Shop", "Hardware Store", "Gift Shop"]
  };

  const key = Object.keys(baseList).find(k => type.toLowerCase().includes(k)) || "food";
  const list = baseList[key];
  const demands = [
    "High demand in local markets",
    "Growing demand among young customers",
    "Popular in residential areas",
    "Trending in urban areas",
    "Good demand near colleges"
  ];

  for (let i = 0; i < Math.min(count, 5); i++) {
    const name = list[i] || `${type} Business ${i + 1}`;
    const inv  = Math.floor(b * (0.3 + i * 0.05));
    const prof = Math.floor(b * (0.08 + i * 0.02));
    ideas.push(`${name}\n\n📍 Location: ${location}\n💸 Investment: ₹${inv}\n📈 Expected Profit: ₹${prof}/month\n🔥 ${demands[i]}\n\n💡 Tip: Start small and scale based on demand`);
  }
  return ideas.join("\n\n");
}

function getFallbackPlan(name, location, profit) {
  return `**Market Demand**\nStrong demand in ${location} for ${name}. Customers looking for quality and affordable services.\n\n**Why This Works**\nFits current market trends with high repeat customer potential.\n\n**How To Start**\n- Research local competitors\n- Start with minimum investment\n- Focus on getting first 10 customers\n- Improve based on feedback\n\n**Marketing Strategy**\n- Promote on WhatsApp groups\n- Use Instagram reels\n- Offer launch discounts\n- Collect Google reviews\n\n**Risks**\n- Initial slow growth\n- Building customer trust takes time\n- Competition from existing businesses\n\n**Growth Opportunities**\nExpand via referrals, online orders, and partnerships. Expected profit: ${profit}`;
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
