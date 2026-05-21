import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface ExportData {
  documentName: string;
  summary: string;
  riskScore: number;
  riskFlags: Array<{
    title: string;
    description: string;
    severity: 'high' | 'medium' | 'low';
  }>;
  clauses: Array<{
    title: string;
    description: string;
  }>;
  chatHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

export async function exportToPDF(data: ExportData) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  let yPosition = 0;

  // --- Header Banner ---
  doc.setFillColor(30, 30, 30); // Dark VSCode-like header
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('LEGAL AI ANALYSIS REPORT', margin, 25);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 200, 200);
  doc.text(`DOCUMENT: ${data.documentName.toUpperCase()}`, margin, 32);
  
  yPosition = 55;

  // --- Risk Score Visual Meter ---
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('EXECUTIVE RISK ASSESSMENT', margin, yPosition);
  yPosition += 10;

  // Draw meter background
  const meterWidth = 100;
  const meterHeight = 8;
  doc.setFillColor(240, 240, 240);
  doc.roundedRect(margin, yPosition, meterWidth, meterHeight, 2, 2, 'F');
  
  // Draw meter fill
  const scoreColor = data.riskScore >= 70 ? [220, 38, 38] : data.riskScore >= 40 ? [234, 140, 0] : [22, 163, 74];
  doc.setFillColor(scoreColor[0], scoreColor[1], scoreColor[2]);
  doc.roundedRect(margin, yPosition, (data.riskScore / 100) * meterWidth, meterHeight, 2, 2, 'F');
  
  // Score text
  doc.setFontSize(18);
  doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
  doc.text(`${data.riskScore}%`, margin + meterWidth + 10, yPosition + 7);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'normal');
  doc.text('Overall Risk Intensity', margin, yPosition + 15);
  
  yPosition += 25;

  // --- Risk Flags (Styled Cards) ---
  if (data.riskFlags.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30);
    doc.text('CRITICAL RISK FINDINGS', margin, yPosition);
    yPosition += 8;

    data.riskFlags.forEach((flag) => {
      if (yPosition > 240) {
        doc.addPage();
        yPosition = 30;
      }

      const severityColor = flag.severity === 'high' ? [220, 38, 38] : 
                             flag.severity === 'medium' ? [234, 140, 0] : [22, 163, 74];
      
      // Card Background
      doc.setFillColor(252, 252, 252);
      doc.setDrawColor(230, 230, 230);
      
      const splitDesc = doc.splitTextToSize(flag.description, contentWidth - 15);
      const cardHeight = 15 + (splitDesc.length * 5);
      
      doc.roundedRect(margin, yPosition, contentWidth, cardHeight, 1, 1, 'FD');
      
      // Severity Left Border
      doc.setFillColor(severityColor[0], severityColor[1], severityColor[2]);
      doc.rect(margin, yPosition, 2, cardHeight, 'F');
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 30, 30);
      doc.text(flag.title.toUpperCase(), margin + 6, yPosition + 6);
      
      doc.setFontSize(8);
      doc.setTextColor(severityColor[0], severityColor[1], severityColor[2]);
      doc.text(flag.severity.toUpperCase(), margin + contentWidth - 20, yPosition + 6, { align: 'right' });
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      doc.text(splitDesc, margin + 6, yPosition + 12);
      
      yPosition += cardHeight + 5;
    });
  }

  // --- Document Summary ---
  if (yPosition > 220) {
    doc.addPage();
    yPosition = 30;
  } else {
    yPosition += 10;
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 30);
  doc.text('EXECUTIVE SUMMARY', margin, yPosition);
  yPosition += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  const splitSummary = doc.splitTextToSize(data.summary, contentWidth);
  doc.text(splitSummary, margin, yPosition, { lineHeightFactor: 1.5 });
  yPosition += (splitSummary.length * 6) + 15;

  // --- Key Clauses Section ---
  if (data.clauses.length > 0) {
    if (yPosition > 240) {
      doc.addPage();
      yPosition = 30;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('EXTRACTED KEY CLAUSES', margin, yPosition);
    yPosition += 10;

    data.clauses.forEach((clause, index) => {
      const splitDesc = doc.splitTextToSize(clause.description, contentWidth - 10);
      const clauseHeight = 10 + (splitDesc.length * 5);

      if (yPosition + clauseHeight > 270) {
        doc.addPage();
        yPosition = 30;
      }

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 30, 30);
      doc.text(`${index + 1}. ${clause.title}`, margin, yPosition);
      yPosition += 5;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      doc.text(splitDesc, margin + 5, yPosition, { lineHeightFactor: 1.2 });
      yPosition += (splitDesc.length * 5) + 8;
    });
  }

  // --- Final Footer ---
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    
    // Bottom border line
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
    
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`CONFIDENTIAL - FOR PROFESSIONAL USE ONLY`, margin, pageHeight - 10);
    doc.text(
      `PAGE ${i} OF ${totalPages}`,
      pageWidth - margin,
      pageHeight - 10,
      { align: 'right' }
    );
  }

  // Save
  doc.save(`LegalAI_Report_${data.documentName.replace(/\.[^/.]+$/, '')}.pdf`);
}

export async function exportElementToPDF(elementId: string, filename: string) {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error('Element not found:', elementId);
    return;
  }

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');
    const doc = new jsPDF('p', 'mm', 'a4');
    
    const imgWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    let heightLeft = imgHeight;
    let position = 0;

    doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      doc.addPage();
      doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    doc.save(filename);
  } catch (error) {
    console.error('Error exporting PDF:', error);
    throw error;
  }
}
