import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } from "docx";

// Parse a line of markdown into TextRun array supporting Bold (**text**) and Italic (*text*) formatting
function parseInlineMarkdown(text: string): TextRun[] {
  // Simple regex parser for bold and italic
  // We'll process bold first, then italic
  const runs: TextRun[] = [];
  
  // If line is empty
  if (!text) return [new TextRun({ text: "" })];

  // Let's tokenise the string
  // We look for ** (bold) or * (italic)
  let currentIndex = 0;
  const length = text.length;

  while (currentIndex < length) {
    // Check for bold **
    if (text.startsWith("**", currentIndex)) {
      const closingIndex = text.indexOf("**", currentIndex + 2);
      if (closingIndex !== -1) {
        const content = text.substring(currentIndex + 2, closingIndex);
        runs.push(new TextRun({ text: content, bold: true }));
        currentIndex = closingIndex + 2;
        continue;
      }
    }
    
    // Check for italic *
    if (text.startsWith("*", currentIndex) && !text.startsWith("**", currentIndex)) {
      const closingIndex = text.indexOf("*", currentIndex + 1);
      if (closingIndex !== -1) {
        const content = text.substring(currentIndex + 1, closingIndex);
        runs.push(new TextRun({ text: content, italics: true }));
        currentIndex = closingIndex + 1;
        continue;
      }
    }

    // Regular character
    // Scan until we find a formatting indicator
    let nextFormatIndex = length;
    const nextBold = text.indexOf("**", currentIndex);
    const nextItalic = text.indexOf("*", currentIndex);
    
    if (nextBold !== -1 && nextBold < nextFormatIndex) nextFormatIndex = nextBold;
    if (nextItalic !== -1 && nextItalic < nextFormatIndex) nextFormatIndex = nextItalic;

    const plainText = text.substring(currentIndex, nextFormatIndex);
    runs.push(new TextRun({ text: plainText }));
    currentIndex = nextFormatIndex;
  }

  return runs.length > 0 ? runs : [new TextRun({ text })];
}

export async function exportToDocx(title: string, text: string, template: string) {
  const lines = text.split("\n");
  const children: any[] = [];

  // Define styling presets based on template
  const isResume = template === "resume";
  const isLetter = template === "business_letter";
  const isReport = template === "project_report";

  // Margins & general document colors
  const primaryColor = isResume ? "1B365D" : isLetter ? "2C3E50" : "2E4053"; // Dark Slate / Blue tones
  const grayColor = "555555";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines, but add a spacer paragraph for formatting
    if (line === "") {
      children.push(
        new Paragraph({
          spacing: { before: 80, after: 80 },
        })
      );
      continue;
    }

    // 1. Heading 1 (e.g. # Title)
    if (line.startsWith("# ")) {
      const titleText = line.substring(2);
      children.push(
        new Paragraph({
          text: titleText,
          heading: HeadingLevel.TITLE,
          alignment: isResume || isLetter ? AlignmentType.CENTER : AlignmentType.LEFT,
          spacing: { before: 240, after: 120 },
        })
      );

      // Add a modern visual bottom border/line for report cover title
      if (isReport) {
        children.push(
          new Paragraph({
            border: {
              bottom: {
                color: primaryColor,
                space: 4,
                style: BorderStyle.SINGLE,
                size: 12,
              },
            },
            spacing: { after: 200 },
          })
        );
      }
      continue;
    }

    // 2. Heading 2 (e.g. ## Section Header)
    if (line.startsWith("## ")) {
      const headingText = line.substring(3);
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 280, after: 100 },
          children: [
            new TextRun({
              text: headingText,
              bold: true,
              color: primaryColor,
              size: 28, // 14pt
            }),
          ],
          // Add bottom divider for Resume headers for that professional Look
          border: isResume ? {
            bottom: {
              color: primaryColor,
              space: 4,
              style: BorderStyle.SINGLE,
              size: 6,
            },
          } : undefined,
        })
      );
      continue;
    }

    // 3. Heading 3 (e.g. ### Subsection)
    if (line.startsWith("### ")) {
      const headingText = line.substring(4);
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 180, after: 60 },
          children: [
            new TextRun({
              text: headingText,
              bold: true,
              color: isResume ? "2C3E50" : primaryColor,
              size: 24, // 12pt
            }),
          ],
        })
      );
      continue;
    }

    // 4. Bullet Points (e.g. - list item)
    if (line.startsWith("- ") || line.startsWith("* ")) {
      const bulletText = line.substring(2);
      children.push(
        new Paragraph({
          bullet: {
            level: 0,
          },
          spacing: { before: 60, after: 60, line: 240 },
          children: parseInlineMarkdown(bulletText),
        })
      );
      continue;
    }

    // 5. Letter/Resume metadata headers e.g. "Lead Software Engineer | alex@email.com..." or Contact detail lines
    // If it's a resume and has "|" pipe characters, we style it elegantly
    if (isResume && line.includes("|") && !line.startsWith("-") && !line.startsWith("#")) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 40, after: 160 },
          children: parseInlineMarkdown(line),
        })
      );
      continue;
    }

    // 6. Metadata tags in brackets or status lines e.g. *Jan 2023 - Present | San Francisco, CA*
    if (line.startsWith("*") && line.endsWith("*") && line.includes("|")) {
      const metaText = line.replace(/\*/g, ""); // strip the italics markers
      children.push(
        new Paragraph({
          spacing: { before: 40, after: 80 },
          children: [
            new TextRun({
              text: metaText,
              italics: true,
              color: grayColor,
              size: 20, // 10pt
            }),
          ],
        })
      );
      continue;
    }

    // 7. Regular paragraph text
    children.push(
      new Paragraph({
        spacing: { before: 100, after: 100, line: 240 }, // elegant line height
        children: parseInlineMarkdown(line),
      })
    );
  }

  // Create document
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch
              bottom: 1440,
              left: 1440,
              right: 1440,
            },
          },
        },
        children,
      },
    ],
  });

  // Pack document to Blob and download
  const blob = await Packer.toBlob(doc);
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
