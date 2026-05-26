require("dotenv").config();
const axios = require("axios");
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const HF_TOKEN = process.env.HF_TOKEN;
const HF_MODEL = process.env.HF_MODEL || "google/flan-t5-large";
const HF_URL   = `https://api-inference.huggingface.co/models/${HF_MODEL}`;
const hasHfConfig = Boolean(HF_TOKEN && HF_TOKEN.trim() !== "");

if (!hasHfConfig) console.log("⚠️ No HF token — AI disabled, using fallback");

async function generateWithHuggingFace(prompt) {
  if (!hasHfConfig) return "";
  const response = await axios.post(
    HF_URL,
    { inputs: prompt },
    { headers: { Authorization: `Bearer ${HF_TOKEN}` } }
  );
  return response.data?.[0]?.generated_text || "";
}

app.post("/generate", async (req, res) => {
  try {
    const { budget, location, type, count } = req.body;
    if (!budget || !location || !type)
      return res.status(400).json({ error: "Missing fields" });

    let baseIdeas = [];
    if (type.toLowerCase().includes("food")) {
      baseIdeas = [
        `Cloud kitchen for ${location}`,
        `Street food cart (evening crowd focus)`,
        `Healthy tiffin service for offices`,
        `Late-night snacks delivery`,
        `Homemade sweets business`,
        `Juice & smoothie bar`,
        `College area fast food stall`
      ];
    } else if (type.toLowerCase().includes("online")) {
      baseIdeas = [
        `Instagram store selling trending products`,
        `Dropshipping business`,
        `Digital products (ebooks/templates)`,
        `Affiliate marketing store`,
        `Print-on-demand T-shirt brand`,
        `Local products selling via WhatsApp`
      ];
    } else {
      baseIdeas = [
        `Local service business for ${type}`,
        `${type} consulting service`,
        `${type} reselling`,
        `${type} for small businesses`,
        `Freelance ${type} services`,
        `Subscription-based ${type}`
      ];
    }

    const demandTypes = [
      "High demand in local markets",
      "Growing demand among young customers",
      "Popular in residential areas",
      "High repeat customers potential",
      "Trending business in urban areas",
      "Good demand near colleges/offices",
      "Increasing demand via online orders"
    ];

    let aiIdeas = [];
    try {
      const prompt = `Generate ${count || 10} unique business ideas.\nBudget: ₹${budget}\nLocation: ${location}\nBusiness Type: ${type}\nReturn only idea names, one per line.`;
      const text = await generateWithHuggingFace(prompt);
      aiIdeas = text.split("\n").map(i => i.replace(/[-*0-9.]/g,"").trim()).filter(i => i.length > 3);
    } catch (aiErr) {
      console.error("HF ERROR:", aiErr.message);
    }

    const ideas = [];
    const c = Number(count) || 5;
    const b = Number(budget);

    for (let i = 0; i < c; i++) {
      const ideaText    = aiIdeas[i] || baseIdeas[i % baseIdeas.length];
      const demand      = demandTypes[i % demandTypes.length];
      const investment  = Math.floor(b * (0.3 + i * 0.05));
      const profitValue = Math.floor(b * (0.08 + i * 0.02));
      ideas.push(`${ideaText}\n\n📍 Location: ${location}\n💸 Investment: ₹${investment}\n📈 Expected Profit: ₹${profitValue}/month\n🔥 ${demand}\n\n💡 Tip: Start small and scale based on demand`);
    }

    console.log("FINAL AI IDEAS USED:", aiIdeas);
    res.json({ result: ideas.join("\n\n") });

  } catch (err) {
    console.error("GENERATE ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/plan", async (req, res) => {
  try {
    const { name, location, profit } = req.body;
    if (!name || !location) return res.json({ plan: "Missing required data" });

    let plan = `📰 ${name} Business Guide\n\n📍 Location: ${location}\n💰 Expected Profit: ${profit}\n\n📊 Market Demand:\nThis business has strong demand in ${location} because customers are actively looking for affordable and quality services.\n\n💡 Why This Business Works:\nThis idea fits current trends and can attract repeat customers if managed properly.\n\n🛠️ How To Start:\n- Research local competitors\n- Start with minimum setup\n- Focus on first customers\n- Improve based on feedback\n\n📣 Marketing Strategy:\n- Promote through WhatsApp\n- Use Instagram reels\n- Offer launch discounts\n- Collect customer reviews\n\n⚠️ Risks:\n- Initial competition\n- Slow growth in beginning\n- Customer trust building\n\n📈 Growth Opportunities:\nExpand using referrals, online platforms, and repeat customers.`;

    try {
      const prompt = `Write a detailed business guide.\nBusiness: ${name}\nLocation: ${location}\nExpected Profit: ${profit}\nInclude: Market demand, Why it works, How to start, Marketing, Risks, Growth`;
      console.log("Calling Hugging Face PLAN...");
      const aiText = await generateWithHuggingFace(prompt);
      if (aiText && aiText.length > 20) plan = aiText;
    } catch (err) {
      console.error("HF PLAN ERROR:", err.message);
    }

    res.json({ plan });
  } catch (err) {
    console.error("PLAN ERROR:", err);
    res.json({ plan: "Server error occurred" });
  }
});

app.get("/test-ai", async (req, res) => {
  try {
    const text = await generateWithHuggingFace("Say hello in one short sentence.");
    res.json({ text: text || "AI not configured" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
