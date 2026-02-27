import express from "express";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL = "gemini-2.5-flash";

const SYSTEM = `Bạn là mentor hướng nghiệp 27 tuổi — thân thiện, từng trải, nói chuyện như bạn bè. KHÔNG sáo rỗng. Hỏi lại để hiểu thêm.
Trả về JSON DUY NHẤT, KHÔNG có text thừa, KHÔNG có markdown, KHÔNG có backtick:
{"msg":"tiếng Việt tự nhiên 2-4 câu, kết thúc câu hỏi mở","db":{"mood":null,"fear":null,"root":null,"values":[],"work":[],"motive":[],"careers":[],"insight":null,"uni":{"target":null,"safe":null,"backup":null},"score":{"cur":null,"tgt":null},"road":{"m3":[],"m6":[],"y1":[]}}}
values/work/motive:[{"l":"tên","v":"high|mid|low"}]. careers chỉ dùng: Marketing,Thiết kế UX/UI,Kỹ thuật phần mềm,Kinh doanh / Sales,Tài chính,Giáo dục / Đào tạo.
insight: 1 câu sâu sắc về tính cách/xu hướng người dùng. Null nếu chưa đủ thông tin.
Null/[] nếu chưa biết.
QUAN TRỌNG: Chỉ trả về JSON thuần túy, bắt đầu bằng { và kết thúc bằng }.`;

const app = express();
app.use(cors({ origin: "*", methods: ["GET","POST","OPTIONS"], allowedHeaders: ["Content-Type"] }));
app.options("/{*path}", cors());
app.use(express.json());

function cleanJSON(text) {
  return text.replace(/```json|```/g, "").trim();
}

async function handleChat(req, res) {
  try {
    const { history = [], message } = req.body;
    if (!message) return res.status(400).json({ error: "Thiếu message" });

    console.log("📩 message:", message);
    console.log("🔑 API key set:", !!process.env.GEMINI_API_KEY);

    const contents = [
      ...history,
      { role: "user", parts: [{ text: message }] },
    ];

    const result = await ai.models.generateContent({
      model: MODEL,
      contents,
      config: {
        maxOutputTokens: 1000,
        responseMimeType: "application/json",
        systemInstruction: { parts: [{ text: SYSTEM }] },
      },
    });

    const reply = cleanJSON(result.text);
    console.log("✅ reply:", reply.slice(0, 100));

    res.json({
      reply,
      newHistory: [
        ...history,
        { role: "user",  parts: [{ text: message }] },
        { role: "model", parts: [{ text: reply   }] },
      ],
    });
  } catch (err) {
    console.error("❌ ERROR:", err.message);
    console.error("❌ STATUS:", err.status);
    console.error("❌ DETAIL:", JSON.stringify(err, null, 2));
    res.status(500).json({ error: err.message, status: err.status });
  }
}

app.post("/api/chat", handleChat);
app.post("/chat",     handleChat);

app.post("/api/analyze", async (req, res) => {
  try {
    const { text, mode = "summarize", customPrompt } = req.body;
    if (!text) return res.status(400).json({ error: "Thiếu text" });

    const prompts = {
      summarize: `Tóm tắt đoạn văn sau trong 3-5 câu, bằng tiếng Việt:\n\n${text}`,
      sentiment: `Phân tích cảm xúc của đoạn văn sau. Trả về JSON: {"sentiment":"positive|negative|neutral","score":0-100,"reason":"..."}\n\n${text}`,
      keywords:  `Trích xuất 5-10 từ khóa quan trọng nhất. Trả về JSON: {"keywords":["..."]}\n\n${text}`,
      custom:    `${customPrompt}\n\n${text}`,
    };

    const result = await ai.models.generateContent({
      model: MODEL,
      contents: [{ role: "user", parts: [{ text: prompts[mode] || prompts.summarize }] }],
    });

    const output = cleanJSON(result.text);

    if (mode === "sentiment" || mode === "keywords") {
      try { return res.json({ result: JSON.parse(output), raw: output }); }
      catch { return res.json({ result: output, raw: output }); }
    }

    res.json({ result: output });
  } catch (err) {
    console.error("❌ ANALYZE ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get("/", (req, res) => res.json({ status: "ok", model: MODEL, keySet: !!process.env.GEMINI_API_KEY }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server chạy tại http://localhost:${PORT}`));