const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors({
  origin: "https://ptadas22-lab.github.io"
}));

app.use(express.json()); // 
app.post("/generate", (req, res) => {
  try {
    const { budget, location, type } = req.body;

    const b = Number(budget);

    if (!b || !location || !type) {
      return res.status(400).json({ error: "Missing fields" });
    }

    res.json({
      result: `
${type} Shop
High demand in ${location}
Profit: ₹${Math.floor(b / 10)}K/month

Home ${type} Business
Low investment
Profit: ₹${Math.floor(b / 8)}K/month

Street ${type} Stall
Fast customers
Profit: ₹${Math.floor(b / 12)}K/month
`
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});