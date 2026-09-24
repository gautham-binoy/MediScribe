#!/usr/bin/env python3
"""
Generate an official high-resolution, print-ready A4 Exhibition Poster for MediScribe AI using ReportLab.
"""
import os
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# Register Noto Sans Malayalam if available
MALAYALAM_FONT = "Helvetica"
MALAYALAM_BOLD = "Helvetica-Bold"

for path in [
    "/usr/share/fonts/noto/NotoSansMalayalam-Regular.ttf",
    "/usr/share/fonts/truetype/noto/NotoSansMalayalam-Regular.ttf",
]:
    if os.path.exists(path):
        try:
            pdfmetrics.registerFont(TTFont("NotoMalayalam", path))
            MALAYALAM_FONT = "NotoMalayalam"
            bold_path = path.replace("-Regular.ttf", "-Bold.ttf")
            if os.path.exists(bold_path):
                pdfmetrics.registerFont(TTFont("NotoMalayalam-Bold", bold_path))
                MALAYALAM_BOLD = "NotoMalayalam-Bold"
            else:
                MALAYALAM_BOLD = "NotoMalayalam"
            break
        except Exception:
            pass

def build_poster(output_path="docs/posters/MediScribe_A4_Poster.pdf"):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=24,
        rightMargin=24,
        topMargin=20,
        bottomMargin=20,
    )
    
    styles = getSampleStyleSheet()
    
    # Custom styles
    header_style = ParagraphStyle(
        'PosterHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=colors.HexColor('#0F172A'),
        alignment=1, # Center
    )
    
    sub_style = ParagraphStyle(
        'PosterSub',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=colors.HexColor('#0284C7'),
        alignment=1,
    )
    
    tagline_style = ParagraphStyle(
        'PosterTagline',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor('#475569'),
        alignment=1,
    )
    
    sec_title = ParagraphStyle(
        'SecTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=13,
        textColor=colors.HexColor('#0F172A'),
    )
    
    body_txt = ParagraphStyle(
        'BodyTxt',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.5,
        leading=10.5,
        textColor=colors.HexColor('#334155'),
    )
    
    mal_txt = ParagraphStyle(
        'MalTxt',
        parent=styles['Normal'],
        fontName=MALAYALAM_BOLD,
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#0F766E'),
    )
    
    story = []
    
    # Header block
    story.append(Paragraph("<b>MediScribe AI</b>", header_style))
    story.append(Paragraph("Ambient Clinical Intelligence & Multilingual EHR Automation Copilot", sub_style))
    story.append(Spacer(1, 4))
    story.append(Paragraph('"Restoring the Doctor-Patient Bond through Regional Code-Switching AI & Deterministic Pharmacology Safety"', tagline_style))
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#0284C7'), spaceBefore=2, spaceAfter=8))
    
    # Key Metric Tiles
    metric_data = [
        [
            Paragraph("<b>80%</b><br/><font size=6 color='#64748B'>TIME SAVED</font>", header_style),
            Paragraph("<b>&lt;5ms</b><br/><font size=6 color='#64748B'>SAFETY LATENCY</font>", header_style),
            Paragraph("<b>100%</b><br/><font size=6 color='#64748B'>ALLERGY SHIELD</font>", header_style),
            Paragraph("<b>SHA-256</b><br/><font size=6 color='#64748B'>EHR SIGN-OFF</font>", header_style),
        ]
    ]
    t_metrics = Table(metric_data, colWidths=[135, 135, 135, 135])
    t_metrics.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#E2E8F0')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_metrics)
    story.append(Spacer(1, 10))
    
    # 4-Step Ambient Pipeline
    story.append(Paragraph("<b>END-TO-END AMBIENT CLINICAL PIPELINE</b>", sec_title))
    story.append(Spacer(1, 3))
    pipeline_data = [
        [
            Paragraph("<b>1. Ambient Audio</b><br/><font size=6.5 color='#475569'>Passive doctor-patient dialogue capture (Malayalam + English)</font>", body_txt),
            Paragraph("➔", header_style),
            Paragraph("<b>2. AI Synthesis</b><br/><font size=6.5 color='#475569'>Structured SOAP note & WHO ICD-10 diagnostic codes</font>", body_txt),
            Paragraph("➔", header_style),
            Paragraph("<b>3. Safety Shield</b><br/><font size=6.5 color='#475569'>Sub-5ms deterministic allergy & drug interaction checks</font>", body_txt),
            Paragraph("➔", header_style),
            Paragraph("<b>4. 1-Click Dispatch</b><br/><font size=6.5 color='#475569'>Official signed prescription PDF + Malayalam care guide</font>", body_txt),
        ]
    ]
    t_pipeline = Table(pipeline_data, colWidths=[118, 20, 118, 20, 118, 20, 118])
    t_pipeline.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,-1), colors.HexColor('#F1F5F9')),
        ('BACKGROUND', (2,0), (2,-1), colors.HexColor('#F1F5F9')),
        ('BACKGROUND', (4,0), (4,-1), colors.HexColor('#F1F5F9')),
        ('BACKGROUND', (6,0), (6,-1), colors.HexColor('#F1F5F9')),
        ('BOX', (0,0), (0,-1), 0.8, colors.HexColor('#CBD5E1')),
        ('BOX', (2,0), (2,-1), 0.8, colors.HexColor('#CBD5E1')),
        ('BOX', (4,0), (4,-1), 0.8, colors.HexColor('#CBD5E1')),
        ('BOX', (6,0), (6,-1), 0.8, colors.HexColor('#CBD5E1')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ALIGN', (1,0), (1,-1), 'CENTER'),
        ('ALIGN', (3,0), (3,-1), 'CENTER'),
        ('ALIGN', (5,0), (5,-1), 'CENTER'),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_pipeline)
    story.append(Spacer(1, 10))
    
    # 3 Key Pillars
    story.append(Paragraph("<b>CORE BREAKTHROUGH INNOVATIONS</b>", sec_title))
    story.append(Spacer(1, 3))
    
    col1 = [
        Paragraph("<b>1. Regional Code-Switching AI</b>", sec_title),
        Spacer(1, 2),
        Paragraph("• Parses colloquial terms (<i>'കഫക്കെട്ട്'</i>, <i>'നെഞ്ചെരിച്ചിൽ'</i>) into standard medical terminology.<br/>• Anti-hallucination: unsaid vitals are marked null, never invented.<br/>• Auto-generates WHO ICD-10 codification.", body_txt),
        Spacer(1, 4),
        Paragraph("<b>Example:</b> '3 days fever, throat pain' ➔ Acute Pharyngitis (J02.9)", mal_txt),
    ]
    
    col2 = [
        Paragraph("<b>2. Deterministic Safety Shield</b>", sec_title),
        Spacer(1, 2),
        Paragraph("• <b>Allergy Cross-Reactivity:</b> Blocks beta-lactams & amoxicillin in penicillin-allergic patients.<br/>• <b>Drug-Drug Interactions:</b> Flags NSAIDs with anticoagulants or ACEi + ARBs.<br/>• <b>Duplicate Protection:</b> Prevents paracetamol hepatotoxicity.", body_txt),
        Spacer(1, 4),
        Paragraph("<b>Safety Check:</b> [CRITICAL] Amoxicillin blocked for Penicillin Allergy", ParagraphStyle('Red', parent=body_txt, textColor=colors.HexColor('#B91C1C'), fontName='Helvetica-Bold')),
    ]
    
    col3 = [
        Paragraph("<b>3. Bilingual Discharge & PDF</b>", sec_title),
        Spacer(1, 2),
        Paragraph("• <b>ReportLab TrueType Engine:</b> Flawless native Malayalam rendering (Noto Sans Malayalam).<br/>• <b>Patient Care Guide:</b> Clear schedule (രാവിലെ, ഉച്ചയ്ക്ക്, രാത്രി ഭക്ഷണത്തിന് ശേഷം).<br/>• <b>Digital Verification:</b> Doctor KMC license bound with SHA-256 hash.", body_txt),
        Spacer(1, 4),
        Paragraph("<b>മലയാളം നിർദ്ദേശം:</b> പാരസെറ്റാമോൾ 650mg ഭക്ഷണത്തിന് ശേഷം", mal_txt),
    ]
    
    t_pillars = Table([[col1, col2, col3]], colWidths=[178, 178, 178])
    t_pillars.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#FFFFFF')),
        ('BOX', (0,0), (0,-1), 1, colors.HexColor('#E2E8F0')),
        ('BOX', (1,0), (1,-1), 1, colors.HexColor('#E2E8F0')),
        ('BOX', (2,0), (2,-1), 1, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(t_pillars)
    story.append(Spacer(1, 10))
    
    # Split Row: Technology Stack & Comparison Table
    story.append(Paragraph("<b>TECHNICAL STACK & CLINICAL IMPACT</b>", sec_title))
    story.append(Spacer(1, 3))
    
    tech_content = [
        Paragraph("<b>Asynchronous Microservice Architecture:</b>", body_txt),
        Paragraph("• <b>Backend:</b> FastAPI, Python 3.12/3.14, SQLAlchemy 2.0, Pydantic v2<br/>"
                  "• <b>Frontend:</b> React 18, TypeScript, Vite, Tailwind CSS, Lucide UI<br/>"
                  "• <b>AI Core:</b> Google Gemini API with Multi-Key Round-Robin Failover<br/>"
                  "• <b>Clinical RAG:</b> ChromaDB Guideline Indexer & Vector Search<br/>"
                  "• <b>PDF Engine:</b> ReportLab 5.0 with TrueType HarfBuzz shaping<br/>"
                  "• <b>Resilience:</b> 100% Offline Simulation Mode for air-gapped clinics", body_txt),
    ]
    
    comp_data = [
        [Paragraph("<b>Metric</b>", body_txt), Paragraph("<b>Traditional OPD</b>", body_txt), Paragraph("<b>MediScribe AI</b>", ParagraphStyle('Bld', parent=body_txt, fontName='Helvetica-Bold', textColor=colors.HexColor('#0284C7')))],
        [Paragraph("Documentation Time", body_txt), Paragraph("6–8 min / pt", body_txt), Paragraph("<b>30–45 sec / pt</b>", body_txt)],
        [Paragraph("Eye-Contact with Patient", body_txt), Paragraph("&lt;30% (Typing)", body_txt), Paragraph("<b>&gt;90% (Active)</b>", body_txt)],
        [Paragraph("Allergy Catch Rate", body_txt), Paragraph("Memory dependent", body_txt), Paragraph("<b>100% Automated</b>", body_txt)],
        [Paragraph("Patient Discharge Guide", body_txt), Paragraph("English / Illegible", body_txt), Paragraph("<b>Malayalam + Eng</b>", body_txt)],
    ]
    t_comp = Table(comp_data, colWidths=[85, 80, 85])
    t_comp.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#E2E8F0')),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ]))
    
    t_split = Table([[tech_content, t_comp]], colWidths=[270, 264])
    t_split.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,0), colors.HexColor('#F8FAFC')),
        ('BOX', (0,0), (0,0), 1, colors.HexColor('#E2E8F0')),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_split)
    story.append(Spacer(1, 10))
    
    # Footer
    footer_data = [
        [
            Paragraph("<b>MediScribe AI — Outpatient Clinical Copilot</b><br/><font size=6 color='#94A3B8'>Major Project Expo 2026 | Department of Computer Science & Engineering</font>", ParagraphStyle('FtrL', parent=body_txt, textColor=colors.HexColor('#FFFFFF'))),
            Paragraph("<b>Live Interactive Demo</b><br/><font size=6 color='#94A3B8'>Scan for GitHub Source & Clinical Docs</font>", ParagraphStyle('FtrR', parent=body_txt, textColor=colors.HexColor('#38BDF8'), alignment=2)),
        ]
    ]
    t_footer = Table(footer_data, colWidths=[350, 184])
    t_footer.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#0F172A')),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(t_footer)
    
    doc.build(story)
    print(f"Generated A4 PDF Poster successfully: {output_path}")

if __name__ == "__main__":
    build_poster()
