import re
from pathlib import Path
from xml.sax.saxutils import escape
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Preformatted

ROOT = Path(r"c:\Users\Deepa\Downloads\behavioural-biometrics\behavioural-biometrics\secure-rhythm")
md_path = ROOT / "docs" / "Secure-Rhythm-Complete-Project-Explanation.md"
pdf_path = ROOT / "docs" / "Secure-Rhythm-Complete-Project-Explanation.pdf"

text = md_path.read_text(encoding="utf-8")
lines = text.splitlines()

styles = getSampleStyleSheet()
base = styles["BodyText"]

h1 = ParagraphStyle(
    "H1",
    parent=styles["Heading1"],
    fontName="Helvetica-Bold",
    fontSize=19,
    leading=23,
    spaceAfter=10,
)
h2 = ParagraphStyle(
    "H2",
    parent=styles["Heading2"],
    fontName="Helvetica-Bold",
    fontSize=14,
    leading=18,
    spaceBefore=8,
    spaceAfter=6,
)
h3 = ParagraphStyle(
    "H3",
    parent=styles["Heading3"],
    fontName="Helvetica-Bold",
    fontSize=12,
    leading=15,
    spaceBefore=6,
    spaceAfter=4,
)
body = ParagraphStyle(
    "Body",
    parent=base,
    fontName="Helvetica",
    fontSize=10,
    leading=14,
    spaceAfter=4,
)
bullet = ParagraphStyle(
    "Bullet",
    parent=body,
    leftIndent=12,
    firstLineIndent=-8,
)
code = ParagraphStyle(
    "Code",
    parent=body,
    fontName="Courier",
    fontSize=8.2,
    leading=10.5,
    backColor="#F4F4F4",
    borderPadding=6,
)


def format_inline_code(raw: str) -> str:
    escaped = escape(raw)
    return re.sub(
        r"`([^`]+)`",
        lambda m: f"<font name='Courier'>{escape(m.group(1))}</font>",
        escaped,
    )


def wrap_code_line(line: str, width: int = 110):
    if len(line) <= width:
        return [line]
    out = []
    current = line
    while len(current) > width:
        cut = current.rfind(" ", 0, width)
        if cut < 20:
            cut = width
        out.append(current[:cut])
        current = current[cut:].lstrip()
    out.append(current)
    return out


story = []
inside_code = False
code_lines = []
paragraph_buffer = []


def flush_paragraph():
    global paragraph_buffer
    if not paragraph_buffer:
        return
    text_block = " ".join(p.strip() for p in paragraph_buffer if p.strip())
    if text_block:
        story.append(Paragraph(format_inline_code(text_block), body))
    paragraph_buffer = []


for line in lines:
    if line.strip().startswith("```"):
        flush_paragraph()
        if not inside_code:
            inside_code = True
            code_lines = []
        else:
            wrapped = []
            for c in code_lines:
                wrapped.extend(wrap_code_line(c))
            story.append(Preformatted("\n".join(wrapped), code))
            story.append(Spacer(1, 0.15 * cm))
            inside_code = False
            code_lines = []
        continue

    if inside_code:
        code_lines.append(line)
        continue

    stripped = line.strip()

    if not stripped:
        flush_paragraph()
        story.append(Spacer(1, 0.12 * cm))
        continue

    if stripped.startswith("# "):
        flush_paragraph()
        story.append(Paragraph(escape(stripped[2:].strip()), h1))
        continue

    if stripped.startswith("## "):
        flush_paragraph()
        story.append(Paragraph(escape(stripped[3:].strip()), h2))
        continue

    if stripped.startswith("### "):
        flush_paragraph()
        story.append(Paragraph(escape(stripped[4:].strip()), h3))
        continue

    if stripped.startswith("- "):
        flush_paragraph()
        story.append(Paragraph(format_inline_code(f"• {stripped[2:]}"), bullet))
        continue

    if re.match(r"^\d+\.\s", stripped):
        flush_paragraph()
        story.append(Paragraph(format_inline_code(stripped), bullet))
        continue

    paragraph_buffer.append(stripped)

flush_paragraph()

doc = SimpleDocTemplate(
    str(pdf_path),
    pagesize=A4,
    leftMargin=1.6 * cm,
    rightMargin=1.6 * cm,
    topMargin=1.6 * cm,
    bottomMargin=1.6 * cm,
    title="Secure Rhythm Complete Project Explanation",
)
doc.build(story)
print(f"Created: {pdf_path}")
