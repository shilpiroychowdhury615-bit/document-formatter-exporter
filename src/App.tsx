import { useState } from "react";
import { DocumentState, DEFAULT_TEMPLATES, TemplateType } from "./types";
import { DocumentEditor } from "./components/DocumentEditor";
import { DocumentPreview } from "./components/DocumentPreview";
import { FileText, HelpCircle, FileCheck, Sparkles, AlertCircle } from "lucide-react";

export default function App() {
  const initialTemplate: TemplateType = "resume";
  
  const [docState, setDocState] = useState<DocumentState>({
    title: DEFAULT_TEMPLATES[initialTemplate].title,
    text: DEFAULT_TEMPLATES[initialTemplate].text,
    template: initialTemplate,
    customInstruction: "",
    isImproving: false,
  });

  const handleStateChange = (newState: Partial<DocumentState>) => {
    setDocState((prev) => ({ ...prev, ...newState }));
  };

  const handleReset = () => {
    const currentTemplate = docState.template;
    setDocState({
      title: DEFAULT_TEMPLATES[currentTemplate].title,
      text: DEFAULT_TEMPLATES[currentTemplate].text,
      template: currentTemplate,
      customInstruction: "",
      isImproving: false,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col antialiased">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-md shadow-indigo-600/15">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-slate-900 tracking-tight leading-none">
                Document Formatter & Exporter
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Draft, structure, and export professional files
              </p>
            </div>
          </div>

          {/* Quick Help Badges */}
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 bg-slate-100 py-1.5 px-3 rounded-full self-start sm:self-auto">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>Gemini Refined Layouts</span>
          </div>
        </div>
      </header>

      {/* Main Grid Content Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Editor Control Panel */}
        <section className="lg:col-span-5 xl:col-span-4 flex flex-col gap-6">
          <DocumentEditor
            documentState={docState}
            onChange={handleStateChange}
            onReset={handleReset}
          />

          {/* Guidelines info card for users */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm text-xs text-slate-500 flex gap-2.5">
            <HelpCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed flex flex-col gap-1.5">
              <span className="font-bold text-slate-700">Writing Guidelines:</span>
              <p>
                Use markdown syntax inside the editor to manage hierarchy easily:
              </p>
              <ul className="list-disc pl-4 space-y-1">
                <li><code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-[11px]"># Heading 1</code> for the primary Title</li>
                <li><code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-[11px]">## Heading 2</code> for Major Sections</li>
                <li><code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-[11px]">- list item</code> for lists/bullet points</li>
                <li><code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-[11px]">**text**</code> for bold text block</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Right Side: Immersive Paper Preview Stage */}
        <section className="lg:col-span-7 xl:col-span-8 bg-slate-100 border border-slate-200/80 rounded-2xl p-4 sm:p-8 overflow-auto flex flex-col items-center">
          <DocumentPreview
            text={docState.text}
            template={docState.template}
            title={docState.title}
          />
        </section>

      </main>

      {/* Elegant Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 px-6 text-center text-xs text-slate-400 font-medium">
        <p>Document Formatter & Exporter • Beautifully polished using Gemini AI</p>
      </footer>
    </div>
  );
}
