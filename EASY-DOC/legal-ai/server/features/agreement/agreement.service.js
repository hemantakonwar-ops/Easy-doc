import fs from 'fs';
import path from 'path';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { v4 as uuidv4 } from 'uuid';
import Agreement from './agreement.model.js';

export const createAgreement = async (name, templateUrl, parsedContent = '') => {
  const agreementId = uuidv4();
  const agreement = new Agreement({
    agreementId,
    name,
    templateUrl,
    parsedContent, // Store parsed text for AI context
    versions: [{ version: 0, text: parsedContent || '', source: 'manual' }],
    currentVersion: 0
  });
  await agreement.save();
  return agreement;
};

export const getAgreement = async (agreementId) => {
  return Agreement.findOne({ agreementId });
};

export const updateParsedContent = async (agreementId, parsedContent) => {
  const agreement = await Agreement.findOne({ agreementId });
  if (!agreement) throw new Error('Agreement not found');
  
  agreement.parsedContent = parsedContent;
  
  // Also update the first version if it has empty text
  if (agreement.versions.length > 0 && !agreement.versions[0].text) {
    agreement.versions[0].text = parsedContent;
  }
  
  await agreement.save();
  return agreement;
};

export const addVersion = async (agreementId, text, source) => {
  const agreement = await Agreement.findOne({ agreementId });
  if (!agreement) throw new Error('Agreement not found');

  const nextVersion = agreement.currentVersion + 1;
  // Truncate future versions if we diverged
  agreement.versions = agreement.versions.slice(0, nextVersion);
  agreement.versions.push({
    version: nextVersion,
    text,
    source
  });
  agreement.currentVersion = nextVersion;
  agreement.status = 'draft';
  await agreement.save();
  return agreement;
};

export const setVersionPointer = async (agreementId, versionIndex) => {
  const agreement = await Agreement.findOne({ agreementId });
  if (!agreement) throw new Error('Agreement not found');
  if (versionIndex < 0 || versionIndex >= agreement.versions.length) {
    throw new Error('Invalid version pointer');
  }
  agreement.currentVersion = versionIndex;
  agreement.status = 'draft'; // undoing or redoing resets approval
  await agreement.save();
  return agreement;
};

export const approveAgreement = async (agreementId) => {
  const agreement = await Agreement.findOne({ agreementId });
  if (!agreement) throw new Error('Agreement not found');
  agreement.status = 'approved';
  await agreement.save();
  return agreement;
};

// Helper: Add text content across multiple pages with proper formatting
const addTextPagesToPdf = async (pdfDoc, text) => {
  const existingPages = pdfDoc.getPages();
  let width = 595;
  let height = 842;
  
  if (existingPages.length > 0) {
    width = existingPages[0].getWidth();
    height = existingPages[0].getHeight();
  }
  
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontSize = 10;
  const margin = 60;
  const maxWidth = width - (margin * 2);
  const lineHeight = fontSize * 1.4;
  const minY = margin + fontSize;
  
  // Word wrap text into lines
  const wrapText = (text, maxWidth) => {
    const words = text.split(/\s+/);
    const lines = [];
    let currentLine = '';
    
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = font.widthOfTextAtSize(testLine, fontSize);
      
      if (testWidth > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
  };
  
  // Parse text into paragraphs
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim());
  let allLines = [];
  
  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;
    
    const isHeading = (trimmed.length < 100 && 
      (trimmed === trimmed.toUpperCase() || trimmed.endsWith(':')));
    
    if (isHeading) {
      allLines.push({ type: 'heading', text: trimmed });
    } else {
      const wrapped = wrapText(trimmed, maxWidth);
      wrapped.forEach(line => allLines.push({ type: 'text', text: line }));
    }
    allLines.push({ type: 'spacer' });
  }
  
  let pageIndex = pdfDoc.getPageCount();
  let currentPage = null;
  let y = 0;
  
  const createNewPage = () => {
    currentPage = pdfDoc.insertPage(pageIndex, [width, height]);
    pageIndex++;
    
    // Add header
    const headerText = pageIndex === 1 ? 'AGREEMENT' : 'AGREEMENT (CONT.)';
    const headerFont = boldFont;
    const headerSize = pageIndex === 1 ? 14 : 10;
    const headerWidth = headerFont.widthOfTextAtSize(headerText, headerSize);
    
    currentPage.drawText(headerText, {
      x: (width - headerWidth) / 2,
      y: height - 40,
      size: headerSize,
      font: headerFont,
      color: rgb(0, 0, 0),
    });
    
    // Add page number
    const pageNumText = `Page ${pageIndex}`;
    const pageNumWidth = font.widthOfTextAtSize(pageNumText, 8);
    currentPage.drawText(pageNumText, {
      x: width - margin - pageNumWidth,
      y: 30,
      size: 8,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });
    
    y = height - 70;
  };
  
  createNewPage();
  
  for (const line of allLines) {
    if (line.type === 'spacer') {
      y -= lineHeight;
      continue;
    }
    
    const isHeading = line.type === 'heading';
    const lineFont = isHeading ? boldFont : font;
    const lineSize = isHeading ? 11 : fontSize;
    const lineSpacing = isHeading ? lineHeight * 1.5 : lineHeight;
    
    // Check if we need a new page BEFORE drawing
    if (y < minY + lineSpacing) {
      createNewPage();
    }
    
    currentPage.drawText(line.text, {
      x: margin,
      y: y,
      size: lineSize,
      font: lineFont,
      color: rgb(0, 0, 0),
    });
    
    y -= lineSpacing;
  }
};

// Helper: Map text content to PDF form fields intelligently
const mapTextToFields = (text, fields) => {
  const mapping = {};
  const lines = text.split('\n');
  
  // Try to find patterns like "Name: John Doe" or "Date: 2023-01-01"
  fields.forEach(field => {
    const name = field.getName().toLowerCase();
    
    for (const line of lines) {
      const parts = line.split(':');
      if (parts.length >= 2) {
        const key = parts[0].trim().toLowerCase();
        const value = parts.slice(1).join(':').trim();
        
        if (name.includes(key) || key.includes(name)) {
          mapping[field.getName()] = value;
          break;
        }
      }
    }
  });
  
  return mapping;
};

export const injectPdf = async (agreementId) => {
  const agreement = await Agreement.findOne({ agreementId });
  if (!agreement) throw new Error('Agreement not found');
  if (agreement.status !== 'approved' && agreement.status !== 'draft') {
    // Allow injection from draft for faster iteration if approved is not strictly required
    console.log('[Agreement] Injecting from current state:', agreement.status);
  }
  
  if (!agreement.templateUrl || !fs.existsSync(agreement.templateUrl)) {
    throw new Error('Template PDF not found');
  }

  const currentVersionData = agreement.versions[agreement.currentVersion];
  const text = currentVersionData ? currentVersionData.text : '';

  const pdfBytes = fs.readFileSync(agreement.templateUrl);
  const pdfDoc = await PDFDocument.load(pdfBytes);
  
  // 1. Try Smart Form Filling
  const form = pdfDoc.getForm();
  const fields = form.getFields();
  let filledCount = 0;
  
  if (fields.length > 0) {
    const fieldMapping = mapTextToFields(text, fields);
    
    for (const field of fields) {
      const fieldName = field.getName();
      if (field.constructor.name === 'PDFTextField') {
        if (fieldMapping[fieldName]) {
          field.setText(fieldMapping[fieldName]);
          filledCount++;
        } else if (fields.length === 1) {
          // If only one field (like a big 'content' box), fill it with everything
          field.setText(text);
          filledCount++;
        }
      }
    }
    
    if (filledCount > 0) {
      form.flatten(); // Make text permanent
    }
  }
  
  // 2. If it's a standard PDF or form filling was insufficient, 
  // we do a "Smart Overwrite" by overlaying new pages or clearing old ones
  // For most legal use cases, appending/replacing pages is safer than "white-boxing"
  if (filledCount === 0 || text.length > 1000) {
    // If the drafted text is long, it's likely a full document replacement
    // We keep the template's first page if it has branding, but add the new content
    await addTextPagesToPdf(pdfDoc, text);
  }

  const outputBytes = await pdfDoc.save();
  
  const outputFileName = `injected_${agreementId}.pdf`;
  const outputPath = path.join('uploads', outputFileName);
  
  if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads', { recursive: true });
  }

  fs.writeFileSync(outputPath, outputBytes);
  
  agreement.pdfUrl = outputPath;
  agreement.status = 'injected';
  await agreement.save();
  
  return agreement;
};
