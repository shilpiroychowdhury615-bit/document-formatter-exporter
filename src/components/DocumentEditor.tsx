import React, { useState, useRef } from "react";
import { DocumentState, TemplateType, DEFAULT_TEMPLATES } from "../types";
import { exportToDocx } from "../utils/docxExporter";
import html2canvasPro from "html2canvas-pro";
import { jsPDF } from "jspdf";
import { 
  Sparkles, 
  Upload, 
  Trash2, 
  RotateCcw, 
  Download, 
  AlertCircle, 
  FileCheck, 
  Check, 
  ChevronRight,
  HelpCircle,
  FileDown
} from "lucide-react";

// Helper to sanitize any markdown text received from Gemini or entered in editor
const sanitizeMarkdownText = (text: string): string => {
  if (!text) return "";
  let sanitized = text.trim();

  // 1. Strip markdown code block fences (e.g. ```markdown ... ```) if Gemini wraps the whole response in it
  sanitized = sanitized.replace(/^```(markdown|html|text|css|json)?\s*\n/gi, "");
  sanitized = sanitized.replace(/\n\s*```$/g, "");
  sanitized = sanitized.trim();

  // 2. Remove raw <style>...</style> and <script>...</script> blocks entirely
  sanitized = sanitized.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, "");
  sanitized = sanitized.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, "");

  // 3. Remove HTML comments entirely
  sanitized = sanitized.replace(/<!--[\s\S]*?-->/g, "");

  // 4. Strip any CSS variable / custom property declarations (e.g., --primary-color: oklch(...);) from text
  sanitized = sanitized.replace(/--[a-zA-Z0-9_-]+\s*:[^;\n]+;?/gi, "");
  sanitized = sanitized.replace(/var\(\s*--[a-zA-Z0-9_-]+\s*\)/gi, "currentColor");

  // 5. Strip CSS Color Level 4 functions: oklch, oklab, lab, lch, color, color-mix, light-dark
  const fns = ["oklch", "oklab", "lab", "lch", "color-mix", "light-dark", "color"];
  for (const fn of fns) {
    let index = sanitized.toLowerCase().indexOf(`${fn}(`);
    while (index !== -1) {
      // Find matching closing parenthesis
      let depth = 1;
      let end = -1;
      for (let i = index + fn.length + 1; i < sanitized.length; i++) {
        if (sanitized[i] === "(") depth++;
        else if (sanitized[i] === ")") depth--;
        if (depth === 0) {
          end = i;
          break;
        }
      }
      if (end !== -1) {
        // Strip the entire function call
        sanitized = sanitized.substring(0, index) + sanitized.substring(end + 1);
      } else {
        // No matching parenthesis, remove the function call start
        sanitized = sanitized.substring(0, index) + sanitized.substring(index + fn.length + 1);
      }
      index = sanitized.toLowerCase().indexOf(`${fn}(`);
    }
  }

  // 6. Strip any other HTML tags entirely to convert to plain Markdown/text
  sanitized = sanitized.replace(/<[^>]+>/g, "");

  // 7. Decode common HTML entities to ensure correct rendering in plain text
  sanitized = sanitized
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  return sanitized.trim();
};

// Mathematical converters for CSS Color Level 4 to Standard RGB
const oklabToRgb = (L: number, a_val: number, b_val: number): [number, number, number] => {
  const l_ = L + 0.3963377774 * a_val + 0.2158037573 * b_val;
  const m_ = L - 0.1055613458 * a_val - 0.0638541728 * b_val;
  const s_ = L - 0.0894841775 * a_val - 1.2914855480 * b_val;

  const l_cube = l_ * l_ * l_;
  const m_cube = m_ * m_ * m_;
  const s_cube = s_ * s_ * s_;

  const r_lin = +4.0767416621 * l_cube - 3.3077115913 * m_cube + 0.2309699292 * s_cube;
  const g_lin = -1.2684380046 * l_cube + 2.6097574011 * m_cube - 0.3413193965 * s_cube;
  const b_lin = -0.0041960863 * l_cube - 0.7034186147 * m_cube + 1.7076147010 * s_cube;

  const gamma = (c: number) => {
    if (c <= 0.0031308) {
      return Math.max(0, Math.min(255, Math.round(12.92 * c * 255)));
    } else {
      return Math.max(0, Math.min(255, Math.round((1.055 * Math.pow(c, 1 / 2.4) - 0.055) * 255)));
    }
  };

  return [gamma(r_lin), gamma(g_lin), gamma(b_lin)];
};

const oklchToRgb = (L: number, C: number, H: number): [number, number, number] => {
  const hRad = (H * Math.PI) / 180;
  const a_val = C * Math.cos(hRad);
  const b_val = C * Math.sin(hRad);
  return oklabToRgb(L, a_val, b_val);
};

const parseOklch = (str: string): string => {
  const regex = /oklch\(\s*([0-9.]+%?)\s+([0-9.]+)\s+([0-9.]+)(?:\s*\/\s*([0-9.]+%?))?\s*\)/gi;
  return str.replace(regex, (match, lStr, cStr, hStr, aStr) => {
    let L = parseFloat(lStr);
    if (lStr.includes("%")) L /= 100;
    const C = parseFloat(cStr);
    const H = parseFloat(hStr);
    let A = 1.0;
    if (aStr) {
      A = parseFloat(aStr);
      if (aStr.includes("%")) A /= 100;
    }
    const [r, g, b] = oklchToRgb(L, C, H);
    return A < 1 ? `rgba(${r}, ${g}, ${b}, ${A})` : `rgb(${r}, ${g}, ${b})`;
  });
};

const parseOklab = (str: string): string => {
  const regex = /oklab\(\s*([0-9.]+%?)\s+([-+0-9.]+)\s+([-+0-9.]+)(?:\s*\/\s*([0-9.]+%?))?\s*\)/gi;
  return str.replace(regex, (match, lStr, aStrVal, bStrVal, aStr) => {
    let L = parseFloat(lStr);
    if (lStr.includes("%")) L /= 100;
    const a_val = parseFloat(aStrVal);
    const b_val = parseFloat(bStrVal);
    let A = 1.0;
    if (aStr) {
      A = parseFloat(aStr);
      if (aStr.includes("%")) A /= 100;
    }
    const [r, g, b] = oklabToRgb(L, a_val, b_val);
    return A < 1 ? `rgba(${r}, ${g}, ${b}, ${A})` : `rgb(${r}, ${g}, ${b})`;
  });
};

const parseColorFn = (str: string): string => {
  const regex = /color\(\s*[a-zA-Z0-9_-]+\s+([0-9.%]+)\s+([0-9.%]+)\s+([0-9.%]+)(?:\s*\/\s*([0-9.%]+))?\s*\)/gi;
  return str.replace(regex, (match, rStr, gStr, bStr, aStr) => {
    let rVal = parseFloat(rStr);
    let gVal = parseFloat(gStr);
    let bVal = parseFloat(bStr);
    if (rStr.includes("%")) rVal /= 100;
    if (gStr.includes("%")) gVal /= 100;
    if (bStr.includes("%")) bVal /= 100;
    
    const r = Math.min(255, Math.max(0, Math.round(rVal * 255)));
    const g = Math.min(255, Math.max(0, Math.round(gVal * 255)));
    const b = Math.min(255, Math.max(0, Math.round(bVal * 255)));
    
    let A = 1.0;
    if (aStr) {
      A = parseFloat(aStr);
      if (aStr.includes("%")) A /= 100;
    }
    return A < 1 ? `rgba(${r}, ${g}, ${b}, ${A})` : `rgb(${r}, ${g}, ${b})`;
  });
};

const sanitizeColorString = (val: string): string => {
  if (!val) return "";
  let clean = val;

  // Process oklch()
  clean = parseOklch(clean);

  // Process oklab()
  clean = parseOklab(clean);

  // Process color()
  clean = parseColorFn(clean);

  // Also catch other functions like color-mix, light-dark, lab, lch
  if (
    clean.toLowerCase().includes("oklch") ||
    clean.toLowerCase().includes("oklab") ||
    clean.toLowerCase().includes("color(") ||
    clean.toLowerCase().includes("color-mix") ||
    clean.toLowerCase().includes("light-dark") ||
    clean.toLowerCase().includes("lab(") ||
    clean.toLowerCase().includes("lch(")
  ) {
    if (clean.toLowerCase().includes("indigo") || clean.toLowerCase().includes("border") || clean.toLowerCase().includes("text-indigo") || clean.toLowerCase().includes("79")) {
      return "rgb(79, 70, 229)"; // Indigo 600
    }
    if (clean.toLowerCase().includes("bg-") || clean.toLowerCase().includes("background")) {
      return "rgb(255, 255, 255)"; // White bg
    }
    return "rgb(30, 41, 59)"; // Slate 800
  }

  return clean;
};

interface DocumentEditorProps {
  documentState: DocumentState;
  onChange: (newState: Partial<DocumentState>) => void;
  onReset: () => void;
}

export const DocumentEditor: React.FC<DocumentEditorProps> = ({
  documentState,
  onChange,
  onReset,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [aiStatusMessage, setAiStatusMessage] = useState("");
  const [showTemplateOverrideConfirm, setShowTemplateOverrideConfirm] = useState<TemplateType | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Quick preset instructions for Gemini AI
  const AI_PRESETS = [
    "Upgrade to executive-level tone",
    "Add strong action verbs",
    "Dramatically condense content",
    "Make highly formal and diplomatic",
    "Add professional section structure"
  ];

  // Drag and Drop File Handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
    if (!file) return;

    const fileExtension = file.name.split(".").pop()?.toLowerCase();
    if (fileExtension !== "txt" && fileExtension !== "md") {
      setErrorMessage("Unsupported file format. Please upload .txt or .md files only.");
      setSuccessMessage("");
      setTimeout(() => setErrorMessage(""), 4000);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === "string") {
        const fileTitle = file.name.substring(0, file.name.lastIndexOf("."));
        onChange({
          title: fileTitle,
          text: result,
        });
        setSuccessMessage(`Imported "${file.name}" successfully!`);
        setErrorMessage("");
        setTimeout(() => setSuccessMessage(""), 4000);
      }
    };
    reader.onerror = () => {
      setErrorMessage("Error reading file.");
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Template select trigger with UX Confirmation
  const handleTemplateSelect = (newTemplate: TemplateType) => {
    if (documentState.text.trim() !== DEFAULT_TEMPLATES[documentState.template].text.trim()) {
      // User has customized the current text. Show prompt.
      setShowTemplateOverrideConfirm(newTemplate);
    } else {
      // Clean swap
      onChange({
        template: newTemplate,
        title: DEFAULT_TEMPLATES[newTemplate].title,
        text: DEFAULT_TEMPLATES[newTemplate].text,
      });
    }
  };

  const confirmTemplateSwap = (loadDefaultText: boolean) => {
    if (!showTemplateOverrideConfirm) return;
    
    const targetTemplate = showTemplateOverrideConfirm;
    if (loadDefaultText) {
      onChange({
        template: targetTemplate,
        title: DEFAULT_TEMPLATES[targetTemplate].title,
        text: DEFAULT_TEMPLATES[targetTemplate].text,
      });
    } else {
      // Just change visual layout, preserve active text
      onChange({
        template: targetTemplate,
      });
    }
    setShowTemplateOverrideConfirm(null);
  };

  // Call Gemini Rewrite Endpoint
  const handleImproveWithGemini = async () => {
    if (!documentState.text.trim()) {
      setErrorMessage("Please input some text to improve.");
      return;
    }

    onChange({ isImproving: true });
    setErrorMessage("");

    // Setup progressive user-reassuring messages
    const statusMessages = [
      "Analyzing document flow...",
      "Polishing vocabulary and sentence structure...",
      "Refining professional formatting...",
      "Finalizing document polishing..."
    ];
    let msgIdx = 0;
    setAiStatusMessage(statusMessages[0]);
    
    const interval = setInterval(() => {
      if (msgIdx < statusMessages.length - 1) {
        msgIdx++;
        setAiStatusMessage(statusMessages[msgIdx]);
      }
    }, 2000);

    try {
      const response = await fetch("/api/gemini/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: documentState.text,
          template: documentState.template,
          instruction: documentState.customInstruction,
        }),
      });

      const data = await response.json();
      clearInterval(interval);

      if (response.ok && data.success) {
        const sanitizedText = sanitizeMarkdownText(data.text);
        onChange({ text: sanitizedText });
        setSuccessMessage("Document improved with Gemini AI!");
        setTimeout(() => setSuccessMessage(""), 4000);
      } else {
        const fullError = data.details 
          ? `${data.error} \n\n${data.details}` 
          : (data.error || "Failed to polish document. Please try again.");
        setErrorMessage(fullError);
      }
    } catch (err: any) {
      clearInterval(interval);
      console.error(err);
      setErrorMessage("Failed to connect to AI server. Check your connection.");
    } finally {
      onChange({ isImproving: false });
      setAiStatusMessage("");
    }
  };

  // PDF Export
  const handleExportPDF = async () => {
    const originalElement = document.getElementById("document-preview-paper");
    if (!originalElement) {
      setErrorMessage("Could not locate live preview document page.");
      return;
    }

    const cleanedFileName = documentState.title.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    setSuccessMessage("Generating PDF...");

    try {
      const html2canvas = (html2canvasPro as any).default || html2canvasPro;
      
      const canvas = await html2canvas(originalElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      const pdf = new jsPDF("p", "in", "letter");
      const pageHeightInIn = 11.0;
      const pageWidthInIn = 8.5;
      const margin = 0.5;
      const contentWidth = pageWidthInIn - (margin * 2); // 7.5
      const contentHeight = pageHeightInIn - (margin * 2); // 10.0

      // Calculate the height of one PDF page in canvas pixels based on our target scale & width ratio
      const canvasPageHeight = (canvas.width * contentHeight) / contentWidth;
      
      let sourceY = 0;
      let isFirstPage = true;

      while (sourceY < canvas.height) {
        const chunkHeight = Math.min(canvasPageHeight, canvas.height - sourceY);
        
        // Create a separate canvas for each page slice
        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = canvas.width;
        pageCanvas.height = canvasPageHeight;
        
        const pageCtx = pageCanvas.getContext("2d");
        if (pageCtx) {
          pageCtx.fillStyle = "#ffffff";
          pageCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
          
          pageCtx.drawImage(
            canvas,
            0, sourceY,                 // sx, sy
            canvas.width, chunkHeight,  // sw, sh
            0, 0,                       // dx, dy
            canvas.width, chunkHeight   // dw, dh
          );
        }
        
        const pageImgData = pageCanvas.toDataURL("image/jpeg", 0.98);
        
        if (!isFirstPage) {
          pdf.addPage();
        } else {
          isFirstPage = false;
        }
        
        pdf.addImage(pageImgData, "JPEG", margin, margin, contentWidth, contentHeight);
        
        sourceY += canvasPageHeight;
      }

      pdf.save(`${cleanedFileName}.pdf`);
      setSuccessMessage("PDF downloaded successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err: any) {
      console.error("PDF generation error:", err);
      setErrorMessage(`Failed to generate PDF document: ${err?.message || String(err)}`);
    }
  };

  // DOCX Export
  const handleExportDOCX = async () => {
    try {
      setSuccessMessage("Generating Word document...");
      await exportToDocx(documentState.title, documentState.text, documentState.template);
      setSuccessMessage("DOCX downloaded successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err: any) {
      console.error(err);
      setErrorMessage("Failed to generate Word (.docx) document.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Title & Metadata Panel */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex flex-col gap-3">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Document Details
        </label>
        <input
          type="text"
          value={documentState.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Document Title (e.g. My Resume)"
          className="w-full text-base font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
        />
      </div>

      {/* Selector: Choose Template */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex flex-col gap-3">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Template Styles
        </label>
        <div className="grid grid-cols-3 gap-2.5">
          {(["resume", "business_letter", "project_report"] as TemplateType[]).map((t) => {
            const isActive = documentState.template === t;
            const labels: Record<TemplateType, string> = {
              resume: "Resume / CV",
              business_letter: "Formal Letter",
              project_report: "Project Report",
            };
            return (
              <button
                key={t}
                onClick={() => handleTemplateSelect(t)}
                className={`flex flex-col items-center justify-center py-2.5 px-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-all gap-1.5 ${
                  isActive
                    ? "bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm"
                    : "bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100 text-slate-600"
                }`}
              >
                <div className="text-[10px] opacity-75 uppercase tracking-wide">Template</div>
                <div className="truncate text-[11px] font-bold">{labels[t]}</div>
              </button>
            );
          })}
        </div>

        {/* Override Warning Popover */}
        {showTemplateOverrideConfirm && (
          <div className="mt-3.5 p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 leading-relaxed flex flex-col gap-2.5 animate-fadeIn">
            <div className="flex gap-2 font-medium">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>You have modified the current document content. How would you like to apply the new template style?</span>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => confirmTemplateSwap(false)}
                className="bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 font-semibold px-2.5 py-1.5 rounded text-[11px] transition-all"
              >
                Keep My Text (Change Style Only)
              </button>
              <button
                onClick={() => confirmTemplateSwap(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-2.5 py-1.5 rounded text-[11px] shadow-sm transition-all"
              >
                Load Preset Text (Overwrites)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Core Document Editor Input Area */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Document Editor (Markdown Supported)
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={onReset}
              title="Reset to Template Defaults"
              className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors px-1 py-0.5 rounded hover:bg-slate-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Draft
            </button>
          </div>
        </div>

        <textarea
          value={documentState.text}
          onChange={(e) => onChange({ text: e.target.value })}
          placeholder="Paste, type, or upload your document here... Support Markdown syntax."
          className="w-full h-80 text-[13.5px] font-mono leading-relaxed text-slate-800 bg-slate-50/50 border border-slate-200 rounded-lg p-3.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-y"
        />

        {/* Drag and Drop File Uploader */}
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={triggerFileInput}
          className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-1.5 ${
            dragActive
              ? "border-indigo-500 bg-indigo-50/50 text-indigo-700 scale-[0.98]"
              : "border-slate-200 bg-slate-50/40 text-slate-500 hover:border-slate-300 hover:bg-slate-50/80"
          }`}
        >
          <Upload className={`w-5 h-5 ${dragActive ? "text-indigo-500" : "text-slate-400"}`} />
          <div className="text-xs font-medium">
            <span className="text-indigo-600 font-semibold">Click to upload</span> or drag and drop
          </div>
          <p className="text-[10px] text-slate-400">Supports .txt and .md formats</p>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".txt,.md"
            className="hidden"
          />
        </div>
      </div>

      {/* AI Assistant Polish Tool (Gemini Integration) */}
      <div className="bg-gradient-to-br from-indigo-50 to-slate-50 p-5 rounded-xl border border-indigo-100 shadow-sm flex flex-col gap-3.5">
        <div className="flex items-center gap-2">
          <div className="p-1 bg-indigo-500 rounded text-white">
            <Sparkles className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">Gemini AI Polish</h3>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Let Gemini structure and rewrite your pasted content with executive level wording, grammar correction, and beautiful Markdown layout organization.
        </p>

        {/* Custom AI Instructions */}
        <div className="flex flex-col gap-2">
          <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">
            Custom AI Rewriting Focus (Optional)
          </label>
          <input
            type="text"
            value={documentState.customInstruction}
            onChange={(e) => onChange({ customInstruction: e.target.value })}
            placeholder="e.g. Focus on leadership metrics, write in a warm diplomatic style"
            className="w-full text-xs text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* AI Presets */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Quick Directives:</span>
          <div className="flex flex-wrap gap-1.5">
            {AI_PRESETS.map((p) => (
              <button
                key={p}
                onClick={() => onChange({ customInstruction: p })}
                className="text-[10px] bg-white border border-slate-200/60 hover:border-indigo-400 text-slate-600 hover:text-indigo-700 px-2 py-1 rounded-md transition-all cursor-pointer font-medium"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleImproveWithGemini}
          disabled={documentState.isImproving || !documentState.text.trim()}
          className={`w-full py-2.5 px-4 rounded-lg font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer ${
            documentState.isImproving
              ? "bg-slate-300 text-slate-500 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-md active:scale-95"
          }`}
        >
          {documentState.isImproving ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <span>{aiStatusMessage || "Working magic..."}</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 animate-pulse" />
              <span>Improve with Gemini</span>
            </>
          )}
        </button>
      </div>

      {/* Export & Actions Block */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex flex-col gap-3">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Export Document
        </label>
        
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleExportPDF}
            className="flex items-center justify-center gap-2 py-2.5 px-3 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200/80 rounded-lg text-xs font-bold transition-all hover:shadow-sm active:scale-95 cursor-pointer"
          >
            <Download className="w-4 h-4 text-red-600" />
            Export as PDF
          </button>
          
          <button
            onClick={handleExportDOCX}
            className="flex items-center justify-center gap-2 py-2.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 rounded-lg text-xs font-bold transition-all hover:shadow-sm active:scale-95 cursor-pointer"
          >
            <FileDown className="w-4 h-4 text-blue-600" />
            Export as DOCX
          </button>
        </div>
      </div>

      {/* Status Notifications */}
      {successMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 border border-slate-800 text-slate-100 text-xs py-2.5 px-4 rounded-xl shadow-xl flex items-center gap-2.5 animate-slideUp">
          <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Check className="w-2.5 h-2.5" />
          </div>
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-red-900 border border-red-800 text-red-100 text-xs py-2.5 px-4 rounded-xl shadow-xl flex items-center gap-2.5 animate-slideUp">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span className="font-medium">{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
