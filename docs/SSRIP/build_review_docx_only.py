"""Generate SSRIP Review Report DOCX only (no pptx dependency)."""

from __future__ import annotations

import shutil
import sys
from pathlib import Path

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.shared import Pt

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

# Import constants without loading pptx (split module load)
from generate_ssrip_deliverables import (  # noqa: E402
    CHALLENGES,
    COMMENTS,
    FUTURE_WORK,
    PROJECT,
    SIGNATURES,
    WEEKS,
)


def main() -> None:
    doc = Document()
    style = doc.styles["Normal"]
    style.font.name = "Calibri"
    style.font.size = Pt(11)

    title = doc.add_paragraph()
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = title.add_run(
        "GUNI Summer Student Research Internship Program\n(GUNI-SSRIP 2026)\nReview Report"
    )
    run.bold = True
    run.font.size = Pt(14)

    doc.add_paragraph()

    fields = [
        ("Project Title:", PROJECT["title"]),
        ("Project Mentor(s):", PROJECT["mentors"]),
        ("Name of Student:", PROJECT["students"]),
        ("Faculty Name:", PROJECT["faculty"]),
        ("Institute Name / Address:", PROJECT["institute"]),
        ("Start Date of SSRP Project:", PROJECT["start_date"]),
        ("Review Period (Date):", PROJECT["review_period"]),
    ]

    for label, value in fields:
        p = doc.add_paragraph()
        p.add_run(f"{label} ").bold = True
        p.add_run(value)

    doc.add_paragraph()
    h = doc.add_paragraph()
    h.add_run(
        "Details of Work done (Weekly) (Please attach detailed report if necessary):"
    ).bold = True

    for week in WEEKS:
        doc.add_paragraph()
        wp = doc.add_paragraph()
        wp.add_run(f"{week['label']}: ").bold = True
        wp.add_run(week["report"])

    doc.add_paragraph()
    p = doc.add_paragraph()
    p.add_run("Future Work Plan: ").bold = True
    doc.add_paragraph(FUTURE_WORK)

    doc.add_paragraph()
    p = doc.add_paragraph()
    p.add_run("Comments given by Expert / Suggestion:").bold = True
    doc.add_paragraph(COMMENTS)

    doc.add_paragraph()
    p = doc.add_paragraph()
    p.add_run("Challenges / Support Required: ").bold = True
    doc.add_paragraph(CHALLENGES)

    doc.add_paragraph()
    for label, value in SIGNATURES:
        p = doc.add_paragraph()
        p.add_run(label).bold = True
        if value and value != "-":
            doc.add_paragraph(value)
        elif value == "-":
            doc.add_paragraph("-")

    out = HERE / "OpinionPulse_SSRIP_Review_Report.docx"
    doc.save(out)

    downloads = Path.home() / "Downloads" / "OpinionPulse_SSRIP_Review_Report_Updated.docx"
    try:
        shutil.copy2(out, downloads)
        print(f"Copied to: {downloads}")
    except PermissionError:
        alt = HERE / "OpinionPulse_SSRIP_Review_Report_Updated.docx"
        shutil.copy2(out, alt)
        print(f"Downloads folder locked (close open Word file). Saved copy to: {alt}")
    print(f"Created: {out}")


if __name__ == "__main__":
    main()
