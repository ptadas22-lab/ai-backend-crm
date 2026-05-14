const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors({
  origin: "https://ptadas22-lab.github.io"
}));

app.use(express.json()); // 
app.post("/generate", (req, res) => {
  try {
    const { budget, location, type, count } = req.body;

    const b = Number(budget);
    const c = Number(count) || 3;

    if (!b || !location || !type) {
  return res.status(400).json({ error: "Missing fields" });
}
const baseIdeas = [
  `Start a small ${type} shop near market in ${location}`,
  `Run a home-based ${type} service with WhatsApp orders`,
  `Open a roadside ${type} stall in high footfall area`,
  `Sell ${type} products through Instagram in ${location}`,
  `Launch a delivery-based ${type} business`,
  `Create a niche ${type} service for offices`,
  `Start a budget ${type} subscription service`,
  `Resell ${type} items locally`,
  `Open a weekend ${type} pop-up shop`,
  `Offer customized ${type} services`
];
const ideas = [];
for (let i = 0; i < c; i++) {
  const ideaText = baseIdeas[i % baseIdeas.length];
  const demand = demandTypes[i % demandTypes.length];

  ideas.push(`
${ideaText}
${demand} in ${location}
Profit: ₹${Math.floor(b * (0.08 + i * 0.015))}/month
`);
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
Profit: ₹${Math.floor(b * (0.08 + i * 0.015))}/month
`);
});
    

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
