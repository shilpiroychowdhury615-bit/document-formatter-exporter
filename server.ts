import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parser middleware
  app.use(express.json({ limit: "10mb" }));

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Rewrite endpoint using Gemini API
  app.post("/api/gemini/rewrite", async (req, res) => {
    try {
      const { text, template, instruction } = req.body;

      if (!text || !text.trim()) {
        return res.status(400).json({ error: "Document text is required." });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
        return res.status(400).json({
          error: "Gemini API Key is not configured.",
          details: "Please add your GEMINI_API_KEY in the Secrets / Environment Variables panel of Google AI Studio (located under top-right Settings/Secrets or the sidebar)."
        });
      }

      // Lazy initialization of GoogleGenAI client
      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const templateNameMap: Record<string, string> = {
        resume: "Resume / CV",
        business_letter: "Formal Business Letter",
        project_report: "Structured Project Report / Executive Summary",
      };

      const selectedTemplateName = templateNameMap[template] || "Professional Document";

      const systemInstruction = `You are an elite executive assistant, professional resume writer, and expert business communicator.
Your task is to rewrite, refine, and structure the user's text into a pristine, high-impact, and beautifully formatted ${selectedTemplateName} using clean Markdown.
- Respect the true content and keep actual details like real names, numbers, dates, emails, and credentials, but dramatically upgrade the vocabulary, sentence flow, active verbs, and readability.
- Structure the document logically using clear Markdown headers (# for main title, ## for major sections, ### for subsections). Use bullet points for bulleted lists.
- Avoid low-quality filler words.
- Ensure the formatting perfectly matches the standard convention of a ${selectedTemplateName}. If a crucial section is missing, suggest it or structure the existing text to imply it naturally.
- Output ONLY the clean Markdown text. Do not include any conversational intro, outro, or wrapper block (like backticks \`\`\`markdown) in your response.`;

      const prompt = `Please rewrite, improve, and format this text into a top-tier ${selectedTemplateName}.
      
Additional custom rewriting goals: ${instruction || "Make the language extremely crisp, professional, and clear with strong action verbs."}

Input text to rewrite:
${text}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.2, // lower temperature for professional consistency
        },
      });

      const rewrittenText = response.text || "";
      res.json({ success: true, text: rewrittenText.trim() });
    } catch (error: any) {
      console.error("Gemini API error:", error);
      res.status(500).json({
        error: "Failed to improve document with Gemini AI.",
        details: error?.message || String(error),
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
