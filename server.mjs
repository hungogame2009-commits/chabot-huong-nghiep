// server.js
// Cài đặt: npm install express cors @google/genai dotenv
// Chạy: node server.js

const express = require("express");
const cors = require("cors");
const { GoogleGenAI } = require("@google/genai");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const ai = new GoogleGenAI({ apiKey: "AIzaSyCUaagb-AKumX_IVK92z2RdOn_HOuk9nac" });
const MODEL = "gemini-2.5-flash-preview-04-17";

// ── 1. CHATBOT: Hỏi đáp nhiều lượt ──────────────────────────────────────────
// Body: { history: [{role, parts}], message: string }
app.post("/api/chat", async (req, res) => {
  try {
    const { history = [], message } = req.body;
    if (!message) return res.status(400).json({ error: "Thiếu message" });

    const contents = [
      ...history,
      { role: "user", parts: [{ text: message }] },
    ];

    const result = await ai.models.generateContent({
      model: MODEL,
      contents,
      config: { maxOutputTokens: 1000 },
    });
    const reply = result.text;

    res.json({
      reply,
      newHistory: [
        ...history,
        { role: "user",  parts: [{ text: message }] },
        { role: "model", parts: [{ text: reply   }] },
      ],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ── 2. PHÂN TÍCH VĂN BẢN ────────────────────────────────────────────────────
// Body: { text: string, mode: "summarize" | "sentiment" | "keywords" | "custom", customPrompt?: string }
app.post("/api/analyze", async (req, res) => {
  try {
    const { text, mode = "summarize", customPrompt } = req.body;
    if (!text) return res.status(400).json({ error: "Thiếu text" });

    const prompts = {
      summarize: `Tóm tắt đoạn văn sau trong 3-5 câu, bằng tiếng Việt:\n\n${text}`,
      sentiment: `Phân tích cảm xúc (tích cực/tiêu cực/trung lập) của đoạn văn sau. Trả về JSON: {"sentiment":"positive|negative|neutral","score":0-100,"reason":"..."}\n\n${text}`,
      keywords:  `Trích xuất 5-10 từ khóa quan trọng nhất từ đoạn văn sau. Trả về JSON: {"keywords":["..."]}\n\n${text}`,
      custom:    `${customPrompt}\n\n${text}`,
    };

    const result = await ai.models.generateContent({
      model: MODEL,
      contents: [{ role: "user", parts: [{ text: prompts[mode] || prompts.summarize }] }],
    });
    const output = result.text;

    if (mode === "sentiment" || mode === "keywords") {
      try {
        const clean = output.replace(/```json|```/g, "").trim();
        return res.json({ result: JSON.parse(clean), raw: output });
      } catch {
        return res.json({ result: output, raw: output });
      }
    }

    res.json({ result: output });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, "127.0.0.1", () => console.log(`✅ Server đang chạy tại http://127.0.0.1:${PORT}`));