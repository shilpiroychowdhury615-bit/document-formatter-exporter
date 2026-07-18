import React from "react";
import { TemplateType } from "../types";
import { 
  Mail, 
  Phone, 
  MapPin, 
  Link2, 
  Calendar, 
  FileText, 
  Sparkles, 
  Building, 
  User, 
  GraduationCap, 
  Briefcase, 
  Award,
  Info
} from "lucide-react";

interface DocumentPreviewProps {
  text: string;
  template: TemplateType;
  title: string;
}

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({ text, template, title }) => {
  
  // Custom inline Markdown parser for basic formatting (**bold**, *italics*)
  const renderFormattedText = (lineText: string) => {
    if (!lineText) return null;
    
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    
    // Pattern to catch **bold** and *italic*
    const regex = /(\*\*.*?\*\*|\*.*?\*)/g;
    let match;
    let keyIndex = 0;

    const tempRegex = new RegExp(regex);
    while ((match = tempRegex.exec(lineText)) !== null) {
      const matchText = match[0];
      const matchIndex = match.index;

      // Add preceding plain text
      if (matchIndex > lastIndex) {
        parts.push(<span key={`text-${keyIndex++}`}>{lineText.substring(lastIndex, matchIndex)}</span>);
      }

      // Add formatted text
      if (matchText.startsWith("**") && matchText.endsWith("**")) {
        parts.push(
          <strong key={`bold-${keyIndex++}`} className="font-semibold text-slate-900">
            {matchText.slice(2, -2)}
          </strong>
        );
      } else if (matchText.startsWith("*") && matchText.endsWith("*")) {
        parts.push(
          <em key={`italic-${keyIndex++}`} className="italic text-slate-700">
            {matchText.slice(1, -1)}
          </em>
        );
      }

      lastIndex = tempRegex.lastIndex;
    }

    // Add trailing plain text
    if (lastIndex < lineText.length) {
      parts.push(<span key={`text-${keyIndex++}`}>{lineText.substring(lastIndex)}</span>);
    }

    return parts.length > 0 ? parts : lineText;
  };

  // Helper: Try to render a row of contact icons for resumes
  const renderContactInfo = (line: string, key: string) => {
    const parts = line.split("|").map((p) => p.trim());
    return (
      <div key={key} className="flex flex-wrap justify-center items-center gap-x-4 gap-y-2 text-slate-600 text-xs sm:text-[13px] border-b border-slate-100 pb-4 mb-6">
        {parts.map((part, pIdx) => {
          let icon = null;
          if (part.includes("@")) {
            icon = <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
          } else if (part.match(/\+?\d[\d-\s()]{7,}/)) {
            icon = <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
          } else if (part.includes(".com") || part.includes("linkedin.com") || part.includes("github.com")) {
            icon = <Link2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
          } else if (part.length < 35 && (part.includes(",") || part.match(/[A-Z]{2}\s\d{5}/))) {
            icon = <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
          }
          return (
            <span key={pIdx} className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/50 px-2.5 py-1 rounded-full text-slate-600">
              {icon}
              <span className="font-medium">{renderFormattedText(part)}</span>
            </span>
          );
        })}
      </div>
    );
  };

  // Helper: Detect and split Subheading and Date (e.g. Lead Engineer | company on left, date/location on right)
  const renderSubheadingWithMetadata = (titleLine: string, nextLine: string | undefined, i: number) => {
    const isNextLineDate = nextLine && nextLine.trim().startsWith("*") && nextLine.trim().endsWith("*") && nextLine.trim().includes("|");
    const cleanTitle = titleLine.startsWith("### ") ? titleLine.substring(4) : titleLine;

    // Split title by pipe if present (e.g. Lead Software Engineer | TechVanguard Solutions)
    const titleParts = cleanTitle.split("|").map(t => t.trim());
    
    let dateAndLoc = "";
    if (isNextLineDate && nextLine) {
      dateAndLoc = nextLine.trim().replace(/\*/g, "");
    }

    return {
      element: (
        <div key={`subhead-block-${i}`} className="mt-5 mb-3 flex flex-col md:flex-row md:items-start md:justify-between gap-1 border-l-2 border-slate-300 pl-3">
          <div>
            <h3 className="text-[15px] font-bold text-slate-800 tracking-tight leading-tight">
              {titleParts[0]}
            </h3>
            {titleParts[1] && (
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 mt-0.5">
                <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                {titleParts[1]}
              </span>
            )}
          </div>
          {dateAndLoc && (
            <div className="text-xs text-slate-500 md:text-right font-medium shrink-0 flex items-center gap-1.5 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 self-start md:self-auto">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{dateAndLoc}</span>
            </div>
          )}
        </div>
      ),
      skipNextLine: isNextLineDate
    };
  };

  // RENDER METHOD 1: RESUME LAYOUT (Clean, ultra-structured, skills as badge tags)
  const renderResumeLayout = () => {
    const lines = text.split("\n");
    const elements: React.ReactNode[] = [];
    let bulletGroup: React.ReactNode[] = [];
    let bulletGroupKey = 0;
    let inSkillsSection = false;

    const flushBullets = (isSkills: boolean) => {
      if (bulletGroup.length === 0) return;
      
      if (isSkills) {
        // Render skills as beautiful modern tags
        elements.push(
          <div key={`skills-group-${bulletGroupKey++}`} className="flex flex-wrap gap-2 mb-5 mt-1.5">
            {bulletGroup}
          </div>
        );
      } else {
        // Standard high-quality list items
        elements.push(
          <ul key={`bullets-group-${bulletGroupKey++}`} className="list-disc pl-5 mb-5 space-y-2 text-slate-600 leading-relaxed text-[13.5px]">
            {...bulletGroup}
          </ul>
        );
      }
      bulletGroup = [];
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (!line) {
        flushBullets(inSkillsSection);
        continue;
      }

      // 1. Heading 1: Candidate Name
      if (line.startsWith("# ")) {
        flushBullets(inSkillsSection);
        elements.push(
          <div key={`resume-name-${i}`} className="text-center pt-2 mb-2">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight uppercase">
              {line.substring(2)}
            </h1>
          </div>
        );
        continue;
      }

      // 2. Contact Details (Pipes)
      if (line.includes("|") && !line.startsWith("#") && !line.startsWith("##") && !line.startsWith("###") && !line.startsWith("-") && !line.startsWith("*")) {
        flushBullets(inSkillsSection);
        elements.push(renderContactInfo(line, `resume-contact-${i}`));
        continue;
      }

      // 3. Heading 2: Section Titles
      if (line.startsWith("## ")) {
        flushBullets(inSkillsSection);
        const sectionTitle = line.substring(3);
        
        // Check if this is a skills section to format items differently
        inSkillsSection = sectionTitle.toLowerCase().includes("skills") || sectionTitle.toLowerCase().includes("technologies");

        elements.push(
          <div key={`section-hdr-${i}`} className="mt-7 mb-4 border-b-2 border-slate-200 pb-1 flex items-center gap-2">
            {sectionTitle.toLowerCase().includes("experience") && <Briefcase className="w-4 h-4 text-indigo-600 shrink-0" />}
            {sectionTitle.toLowerCase().includes("education") && <GraduationCap className="w-4 h-4 text-indigo-600 shrink-0" />}
            {sectionTitle.toLowerCase().includes("skills") && <Award className="w-4 h-4 text-indigo-600 shrink-0" />}
            {sectionTitle.toLowerCase().includes("summary") && <User className="w-4 h-4 text-indigo-600 shrink-0" />}
            <h2 className="text-sm font-bold text-slate-800 tracking-widest uppercase">
              {sectionTitle}
            </h2>
          </div>
        );
        continue;
      }

      // 4. Heading 3: Job Entries / Degrees
      if (line.startsWith("### ")) {
        flushBullets(inSkillsSection);
        const nextLine = lines[i + 1];
        const { element, skipNextLine } = renderSubheadingWithMetadata(line, nextLine, i);
        elements.push(element);
        if (skipNextLine) i++;
        continue;
      }

      // 5. Bullet points
      if (line.startsWith("- ") || line.startsWith("* ")) {
        const bulletText = line.substring(2);
        
        if (inSkillsSection) {
          // If in skills section, parse tags
          // Formats like: "**Languages:** TypeScript, JavaScript" -> highlight label, badges for items
          if (bulletText.includes(":** ")) {
            const splitIdx = bulletText.indexOf(":** ");
            const category = bulletText.substring(0, splitIdx + 3);
            const itemsStr = bulletText.substring(splitIdx + 4);
            const items = itemsStr.split(",").map(itm => itm.trim());
            
            bulletGroup.push(
              <div key={`skill-cat-${i}`} className="w-full bg-slate-50/50 border border-slate-200/50 p-2.5 rounded-lg flex flex-col sm:flex-row sm:items-center gap-2 text-[12.5px] mb-2.5">
                <span className="font-bold text-slate-700 sm:w-1/4 shrink-0">{renderFormattedText(category)}</span>
                <div className="flex flex-wrap gap-1.5 sm:w-3/4">
                  {items.map((itm, itmIdx) => (
                    <span key={itmIdx} className="bg-indigo-50 border border-indigo-100 text-indigo-700 font-semibold px-2 py-0.5 rounded text-[11.5px] shadow-sm">
                      {itm}
                    </span>
                  ))}
                </div>
              </div>
            );
          } else {
            // General bullet in skills section
            bulletGroup.push(
              <span key={`skill-tag-${i}`} className="bg-slate-100 border border-slate-200 text-slate-700 font-medium px-2.5 py-1 rounded-md text-[12px] shadow-sm">
                {renderFormattedText(bulletText)}
              </span>
            );
          }
        } else {
          // Normal bullet point
          bulletGroup.push(
            <li key={`bullet-${i}`} className="leading-relaxed">
              {renderFormattedText(bulletText)}
            </li>
          );
        }
        continue;
      }

      // 6. Styled italic date lines (if they stand alone)
      if (line.startsWith("*") && line.endsWith("*") && line.includes("|")) {
        flushBullets(inSkillsSection);
        const metaText = line.replace(/\*/g, "");
        elements.push(
          <div key={`stand-alone-meta-${i}`} className="text-xs text-slate-500 font-medium italic mt-[-8px] mb-3">
            {metaText}
          </div>
        );
        continue;
      }

      // 7. Regular paragraph
      flushBullets(inSkillsSection);
      elements.push(
        <p key={`resume-p-${i}`} className="text-[13.5px] text-slate-600 leading-relaxed mb-4 text-justify">
          {renderFormattedText(line)}
        </p>
      );
    }

    // Final flush
    flushBullets(inSkillsSection);
    return elements;
  };


  // RENDER METHOD 2: BUSINESS LETTER (High-end elegant serif, formal blocks, signature line)
  const renderBusinessLetterLayout = () => {
    const lines = text.split("\n");
    const elements: React.ReactNode[] = [];
    
    // We'll analyze segments:
    // Sender: lines at start, up to first date/empty line
    // Date: line with standard dates
    // Recipient: lines after date, up to "Dear"
    // Subject: starts with "Subject:"
    // Signature block: lines at the end starting with "Sincerely" or "Best regards"
    
    let senderLines: string[] = [];
    let dateLine = "";
    let recipientLines: string[] = [];
    let greetingLine = "";
    let subjectLine = "";
    let bodyLines: string[] = [];
    let closingLine = "";
    let signatureLines: string[] = [];

    // Simple heuristic parser
    let currentSection: "sender" | "date" | "recipient" | "greeting" | "subject" | "body" | "closing" | "signature" = "sender";
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Let's identify the line's nature
      const isGreeting = line.toLowerCase().startsWith("dear ") || line.toLowerCase().startsWith("to whom");
      const isClosing = line.toLowerCase().startsWith("sincerely") || line.toLowerCase().startsWith("best regards") || line.toLowerCase().startsWith("warm regards") || line.toLowerCase().startsWith("regards");
      const isSubject = line.toLowerCase().startsWith("subject:");
      const isDate = line.match(/^(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}$/) || line.match(/^\d{1,2}\/\d{1,2}\/\d{2,4}$/);

      if (isGreeting) {
        currentSection = "greeting";
        greetingLine = line;
        continue;
      }
      if (isSubject) {
        currentSection = "subject";
        subjectLine = line;
        continue;
      }
      if (isClosing) {
        currentSection = "closing";
        closingLine = line;
        currentSection = "signature";
        continue;
      }

      if (currentSection === "sender") {
        if (isDate) {
          dateLine = line;
          currentSection = "recipient";
        } else if (!line && senderLines.length > 0) {
          // Empty line after sender could mean next is date or recipient
          // We'll stay in sender until a date or recipient content is clear
        } else if (line) {
          senderLines.push(line);
        }
      } else if (currentSection === "recipient") {
        if (line) {
          recipientLines.push(line);
        }
      } else if (currentSection === "signature") {
        if (line) {
          signatureLines.push(line);
        }
      } else {
        // Body paragraphs
        if (line) {
          bodyLines.push(line);
        } else if (bodyLines.length > 0) {
          // Keep empty lines as spacers
          bodyLines.push("");
        }
      }
    }

    // FALLBACK check: if parsing didn't find clear blocks, we'll render sequentially
    const isCustomStructure = senderLines.length === 0 || bodyLines.length === 0;

    if (isCustomStructure) {
      // Just render the text in a highly formal letter format sequentially
      return (
        <div className="font-serif text-slate-800 text-[15px] leading-relaxed space-y-4">
          {/* Elegant header band representing a premium letterhead */}
          <div className="border-b-2 border-slate-300 pb-4 mb-8 text-center sm:text-left flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3">
            <div>
              <span className="text-xl font-bold tracking-widest text-slate-800 uppercase font-sans">
                {title.replace("Business Letter - ", "").substring(0, 25)}
              </span>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1 font-sans font-semibold">Formal Document Correspondence</p>
            </div>
            <div className="text-xs text-slate-500 font-sans font-medium text-right self-center sm:self-auto">
              Date: {new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
          
          {lines.map((line, idx) => {
            const trimmed = line.trim();
            if (!trimmed) return <div key={idx} className="h-4" />;
            if (trimmed.startsWith("# ")) {
              return <h1 key={idx} className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-1 mb-4">{trimmed.substring(2)}</h1>;
            }
            if (trimmed.startsWith("## ")) {
              return <h2 key={idx} className="text-base font-bold text-slate-800 mt-4 mb-2">{trimmed.substring(3)}</h2>;
            }
            return (
              <p key={idx} className="text-justify indent-0 leading-relaxed text-[15px]">
                {renderFormattedText(trimmed)}
              </p>
            );
          })}
        </div>
      );
    }

    // If beautifully structured, render slots
    return (
      <div className="font-serif text-slate-800 text-[15px] leading-relaxed relative">
        
        {/* Modern Minimalistic Letterhead */}
        <div className="border-b border-slate-200 pb-5 mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          {/* Logo Badge & Company */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center text-white font-sans font-black text-sm tracking-tighter">
              {senderLines[0] ? senderLines[0].substring(0, 2).toUpperCase() : "LT"}
            </div>
            <div>
              <span className="font-sans font-extrabold text-sm text-slate-900 uppercase tracking-wider block">
                {senderLines[2] || senderLines[0]}
              </span>
              <span className="font-sans font-medium text-[10px] text-slate-400 uppercase tracking-widest block">
                Official Letterhead
              </span>
            </div>
          </div>
          
          {/* Sender Details Block */}
          <div className="text-left sm:text-right text-xs text-slate-500 font-sans space-y-0.5">
            {senderLines.map((line, idx) => (
              <div key={idx} className={idx === 0 ? "font-bold text-slate-800" : ""}>{line}</div>
            ))}
          </div>
        </div>

        {/* Date of the Letter */}
        <div className="mb-6 text-[14px] font-medium text-slate-600 font-sans">
          {dateLine || new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })}
        </div>

        {/* Recipient Block */}
        <div className="mb-8 text-[14px] text-slate-700 space-y-0.5 border-l-2 border-slate-300 pl-4 py-0.5">
          <span className="font-sans text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Recipient Info:</span>
          {recipientLines.map((line, idx) => (
            <div key={idx} className={idx === 0 ? "font-bold text-slate-800" : ""}>{line}</div>
          ))}
        </div>

        {/* Formal Salutation / Greeting */}
        <div className="mb-4 text-[15px] font-bold text-slate-900">
          {greetingLine}
        </div>

        {/* Subject Line Callout Card */}
        {subjectLine && (
          <div className="mb-6 p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold text-[13.5px] font-sans tracking-wide">
            {subjectLine}
          </div>
        )}

        {/* Letter Core Body */}
        <div className="space-y-4 text-justify text-[15px] leading-relaxed">
          {bodyLines.map((line, idx) => {
            if (!line) return <div key={idx} className="h-4" />;
            return (
              <p key={idx} className="indent-0">
                {renderFormattedText(line)}
              </p>
            );
          })}
        </div>

        {/* Sign-off & Closing block */}
        <div className="mt-10 pt-2 shrink-0">
          <div className="text-[15px] mb-8">{closingLine || "Sincerely,"}</div>
          
          {/* Simulated Handwritten Signature Graphic */}
          <div className="h-10 text-indigo-600 font-sans italic text-2xl pl-2 select-none pointer-events-none opacity-85 tracking-tighter transform -rotate-2 origin-left border-b border-dashed border-slate-200/80 w-44">
            {signatureLines[0] || "Alex Carter"}
          </div>
          
          {/* Printed Signature Details */}
          <div className="mt-2 text-xs font-sans text-slate-500 space-y-0.5">
            {signatureLines.map((line, idx) => (
              <div key={idx} className={idx === 0 ? "font-bold text-slate-800 text-[13px]" : ""}>{line}</div>
            ))}
          </div>
        </div>

      </div>
    );
  };


  // RENDER METHOD 3: PROJECT REPORT (Beautiful cover style header, numbered segments, info boxes)
  const renderProjectReportLayout = () => {
    const lines = text.split("\n");
    const elements: React.ReactNode[] = [];
    let bulletGroup: React.ReactNode[] = [];
    let bulletGroupKey = 0;
    let sectionCounter = 0;

    const flushBullets = () => {
      if (bulletGroup.length === 0) return;
      elements.push(
        <ul key={`bullets-group-${bulletGroupKey++}`} className="list-disc pl-6 mb-5 space-y-1.5 text-slate-700 leading-relaxed text-[13.5px]">
          {...bulletGroup}
        </ul>
      );
      bulletGroup = [];
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (!line) {
        flushBullets();
        continue;
      }

      // Handle Callouts starting with quote block
      if (line.startsWith("> ")) {
        flushBullets();
        elements.push(
          <div key={`callout-${i}`} className="my-5 p-4 bg-indigo-50/50 border-l-4 border-indigo-600 text-slate-700 rounded-r-lg text-[13px] italic flex gap-2.5 items-start">
            <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div>{renderFormattedText(line.substring(2))}</div>
          </div>
        );
        continue;
      }

      // 1. Heading 1: Report Title Card
      if (line.startsWith("# ")) {
        flushBullets();
        const reportTitle = line.substring(2);
        
        // Peek if next line is metadata info
        let metaDetails: React.ReactNode = null;
        if (lines[i + 1] && lines[i + 1].trim().includes("|")) {
          const rawMeta = lines[i + 1].trim().replace(/\*/g, "");
          const metaParts = rawMeta.split("|").map(p => p.trim());
          
          metaDetails = (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-4 pt-4 border-t border-indigo-100">
              {metaParts.map((part, pIdx) => {
                const parts = part.split(":");
                const label = parts[0] ? parts[0].trim() : "Details";
                const value = parts[1] ? parts[1].trim() : "";
                
                return (
                  <div key={pIdx} className="bg-slate-50 border border-slate-200/55 rounded-lg px-3 py-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">{label}</span>
                    <span className="text-xs font-semibold text-slate-700 mt-0.5 block truncate">{value || label}</span>
                  </div>
                );
              })}
            </div>
          );
          i++; // skip next line
        }

        elements.push(
          <div key={`report-cover-${i}`} className="bg-slate-900 text-white rounded-xl p-6 md:p-8 mb-8 border border-slate-800 shadow-md relative overflow-hidden">
            {/* Ambient visual overlay */}
            <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-indigo-600 text-white font-mono text-[9px] font-bold tracking-widest px-2 py-0.5 rounded uppercase">
                Technical Dossier
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-[10px] text-slate-400 font-mono tracking-widest">PROJ-RE-Q2</span>
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white leading-tight">
              {reportTitle}
            </h1>

            {metaDetails}
          </div>
        );
        continue;
      }

      // 2. Heading 2: Structured Chapters with Dynamic Number Tagging
      if (line.startsWith("## ")) {
        flushBullets();
        const originalTitle = line.substring(3);
        
        // Remove any existing numbering if we want to apply a strict clean theme index
        let cleanTitle = originalTitle.replace(/^\d+[\.\s]*/, "");
        sectionCounter++;

        elements.push(
          <div key={`report-sec-${i}`} className="mt-8 mb-4 border-b border-slate-100 pb-2 flex items-center justify-between gap-3">
            <h2 className="text-lg font-extrabold text-indigo-950 tracking-tight flex items-center gap-2.5">
              <span className="bg-indigo-100 text-indigo-700 w-6 h-6 rounded-md flex items-center justify-center font-mono text-[11px] font-black shrink-0">
                {sectionCounter}
              </span>
              <span>{cleanTitle}</span>
            </h2>
            <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest font-mono hidden sm:inline">Chapter {sectionCounter}</span>
          </div>
        );
        continue;
      }

      // 3. Heading 3: Project Deliverables / Focus Areas
      if (line.startsWith("### ")) {
        flushBullets();
        const subhead = line.substring(4);
        elements.push(
          <h3 key={`report-subhead-${i}`} className="text-[14.5px] font-bold text-slate-800 mt-5 mb-2.5 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
            {subhead}
          </h3>
        );
        continue;
      }

      // 4. Bullet list items
      if (line.startsWith("- ") || line.startsWith("* ")) {
        const bulletText = line.substring(2);
        bulletGroup.push(
          <li key={`report-bullet-${i}`} className="leading-relaxed">
            {renderFormattedText(bulletText)}
          </li>
        );
        continue;
      }

      // 5. Normal paragraphs (Abstract, Introductions etc.)
      flushBullets();
      elements.push(
        <p key={`report-p-${i}`} className="text-[13.5px] text-slate-600 leading-relaxed mb-4 text-justify">
          {renderFormattedText(line)}
        </p>
      );
    }

    // final flush
    flushBullets();
    return elements;
  };

  // Select layout based on selected template type
  const renderTemplateSpecificLayout = () => {
    switch (template) {
      case "resume":
        return renderResumeLayout();
      case "business_letter":
        return renderBusinessLetterLayout();
      case "project_report":
        return renderProjectReportLayout();
      default:
        return (
          <div className="prose prose-slate max-w-none">
            {text.split("\n").map((l, idx) => (
              <p key={idx} className="mb-2 text-slate-700 leading-relaxed text-[14px]">
                {renderFormattedText(l)}
              </p>
            ))}
          </div>
        );
    }
  };

  // Watermark description
  const getTemplateWatermark = () => {
    switch (template) {
      case "resume":
        return "Executive CV Layout";
      case "business_letter":
        return "Standard Letterhead Style";
      case "project_report":
        return "Corporate Technical Report";
    }
  };

  // Select card background style based on selected template
  const getTemplateContainerStyles = () => {
    switch (template) {
      case "resume":
        return "font-sans max-w-[800px] mx-auto bg-white p-8 sm:p-12 md:p-16 border border-slate-100 shadow-xl rounded-lg text-slate-800 relative ring-1 ring-slate-100";
      case "business_letter":
        return "font-serif max-w-[800px] mx-auto bg-white p-10 sm:p-14 md:p-18 border border-slate-100 shadow-xl rounded-lg text-slate-800 relative leading-loose ring-1 ring-slate-100";
      case "project_report":
        return "font-sans max-w-[800px] mx-auto bg-white p-8 sm:p-12 md:p-16 border border-indigo-50 shadow-xl rounded-lg text-slate-800 relative border-t-8 border-t-indigo-600 ring-1 ring-indigo-50/50";
      default:
        return "font-sans max-w-[800px] mx-auto bg-white p-12 border border-slate-100 shadow-xl rounded-lg text-slate-800";
    }
  };

  return (
    <div className="w-full">
      {/* Synchronization Bar Header */}
      <div className="flex items-center justify-between mb-4 bg-white/90 border border-slate-200/60 rounded-xl py-2 px-4 shadow-sm backdrop-blur-sm w-full max-w-[800px] mx-auto">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
          <span className="text-xs font-bold text-slate-700 tracking-wider uppercase font-sans">
            {getTemplateWatermark()}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live Preview Synchronized
        </div>
      </div>

      {/* Actual paper block */}
      <div id="document-preview-paper" className={getTemplateContainerStyles()}>
        {template === "business_letter" && (
          <div className="absolute top-12 left-12 w-12 h-12 border-t-2 border-l-2 border-slate-100 pointer-events-none" />
        )}
        {template === "project_report" && (
          <div className="absolute top-12 right-12 text-[10px] text-slate-400 font-mono tracking-widest uppercase">
            Confidential
          </div>
        )}

        <div className="max-w-none">
          {renderTemplateSpecificLayout()}
        </div>
      </div>
    </div>
  );
};
