import fs from 'fs';
import path from 'path';
import axios from 'axios';
import FormData from 'form-data';
import * as agreementService from './agreement.service.js';

const parsePdfContent = async (filePath, filename) => {
  try {
    const nlpUrl = process.env.FASTAPI_URL || 'http://localhost:8000';
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath), {
      filename,
      contentType: 'application/pdf'
    });
    
    const nlpRes = await axios.post(`${nlpUrl}/parse/`, formData, {
      headers: formData.getHeaders(),
      timeout: 60000,
      maxContentLength: 50 * 1024 * 1024,
      maxBodyLength: 50 * 1024 * 1024
    });
    
    const text = nlpRes.data?.text || '';
    console.log(`[Agreement] Parsed PDF: ${text.length} chars`);
    return text;
  } catch (err) {
    console.error('[Agreement] PDF parsing failed:', err.message);
    return '';
  }
};

const isValidUUID = (id) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

export const uploadTemplate = async (req, res, next) => {
  try {
    // Validate file upload
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        error: 'No file uploaded',
        message: 'Please select a PDF file to upload'
      });
    }
    
    // Validate PDF file type
    if (!req.file.mimetype?.includes('pdf') && !req.file.originalname?.toLowerCase().endsWith('.pdf')) {
      // Clean up invalid upload
      if (req.file.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        error: 'Invalid file type',
        message: 'Only PDF files are supported'
      });
    }
    
    const name = req.body?.name?.trim() || req.file.originalname?.replace('.pdf', '') || 'Untitled Agreement';
    const templateUrl = req.file.path;
    
    // Create agreement first (fast response)
    const agreement = await agreementService.createAgreement(name, templateUrl, '');
    
    // Parse PDF content asynchronously in background (don't block response)
    parsePdfContent(templateUrl, req.file.originalname)
      .then(async (parsedText) => {
        if (parsedText) {
          await agreementService.updateParsedContent(agreement.agreementId, parsedText);
          console.log(`[Agreement] Background parsing complete: ${parsedText.length} chars for ${agreement.agreementId}`);
        }
      })
      .catch(err => {
        console.error('[Agreement] Background parsing failed:', err.message);
      });
    
    // Return immediately without waiting for parsing
    res.status(201).json({
      success: true,
      message: 'Agreement template uploaded successfully. Content parsing in progress...',
      agreement: {
        agreementId: agreement.agreementId,
        name: agreement.name,
        status: agreement.status,
        currentVersion: agreement.currentVersion,
        hasParsedContent: false, // Will be populated in background
        parsedContentLength: 0,
        createdAt: agreement.createdAt
      }
    });
  } catch (err) {
    // Clean up file on error
    if (req.file?.path && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch (e) { /* ignore */ }
    }
    next(err);
  }
};

export const generateText = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { prompt, context } = req.body;
    
    if (!isValidUUID(id)) {
      return res.status(400).json({ success: false, error: 'Invalid agreement ID format' });
    }
    
    const agreement = await agreementService.getAgreement(id);
    if (!agreement) {
      return res.status(404).json({ success: false, error: 'Agreement not found' });
    }
    
    const aiContext = context?.trim() || agreement.parsedContent || '';
    const aiPrompt = prompt?.trim() || 'Improve and formalize this agreement text';
    
    console.log(`[Agreement] AI Generate | Context: ${aiContext.length} chars | Prompt: "${aiPrompt.substring(0, 50)}..."`);
    
    const nlpUrl = process.env.FASTAPI_URL || 'http://localhost:8000';
    const nlpRes = await axios.post(`${nlpUrl}/agreement/generate`, { 
      prompt: aiPrompt,
      context: aiContext 
    }, { timeout: 30000 });
    
    const generatedText = nlpRes.data?.text;
    if (!generatedText) {
      return res.status(502).json({ success: false, error: 'AI service returned empty response' });
    }
    
    const updated = await agreementService.addVersion(id, generatedText, 'ai');
    
    res.json({
      success: true,
      message: 'AI-generated text added as new version',
      version: updated.currentVersion,
      textLength: generatedText.length,
      agreement: updated
    });
  } catch (err) {
    console.error('[Agreement] Generate error:', err.message);
    next(err);
  }
};

export const editText = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    
    if (!isValidUUID(id)) {
      return res.status(400).json({ success: false, error: 'Invalid agreement ID' });
    }
    
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ success: false, error: 'Text content is required' });
    }
    
    const updated = await agreementService.addVersion(id, text.trim(), 'manual');
    
    res.json({
      success: true,
      message: 'Manual edit saved as new version',
      version: updated.currentVersion,
      textLength: text.length,
      agreement: updated
    });
  } catch (err) {
    next(err);
  }
};

export const setVersion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { version } = req.body;
    
    if (!isValidUUID(id)) {
      return res.status(400).json({ success: false, error: 'Invalid agreement ID' });
    }
    
    const versionNum = parseInt(version, 10);
    if (isNaN(versionNum) || versionNum < 0) {
      return res.status(400).json({ success: false, error: 'Invalid version number' });
    }
    
    const updated = await agreementService.setVersionPointer(id, versionNum);
    
    res.json({
      success: true,
      message: `Switched to version ${versionNum}`,
      currentVersion: updated.currentVersion,
      agreement: updated
    });
  } catch (err) {
    next(err);
  }
};

export const approveText = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!isValidUUID(id)) {
      return res.status(400).json({ success: false, error: 'Invalid agreement ID' });
    }
    
    const updated = await agreementService.approveAgreement(id);
    
    res.json({
      success: true,
      message: 'Agreement approved and ready for injection',
      status: updated.status,
      currentVersion: updated.currentVersion,
      agreement: updated
    });
  } catch (err) {
    next(err);
  }
};

export const injectPdf = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!isValidUUID(id)) {
      return res.status(400).json({ success: false, error: 'Invalid agreement ID' });
    }
    
    const startTime = Date.now();
    const updated = await agreementService.injectPdf(id);
    const duration = Date.now() - startTime;
    
    res.json({
      success: true,
      message: 'Agreement text injected into PDF successfully',
      status: updated.status,
      pdfUrl: updated.pdfUrl,
      processingTimeMs: duration,
      agreement: updated
    });
  } catch (err) {
    console.error('[Agreement] Injection error:', err.message);
    next(err);
  }
};

export const getAgreement = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!isValidUUID(id)) {
      return res.status(400).json({ success: false, error: 'Invalid agreement ID' });
    }
    
    const agreement = await agreementService.getAgreement(id);
    if (!agreement) {
      return res.status(404).json({ success: false, error: 'Agreement not found' });
    }
    
    // Return sanitized version without full parsed content to reduce payload
    res.json({
      success: true,
      agreement: {
        agreementId: agreement.agreementId,
        name: agreement.name,
        status: agreement.status,
        currentVersion: agreement.currentVersion,
        versions: agreement.versions,
        hasParsedContent: !!agreement.parsedContent,
        parsedContentLength: agreement.parsedContent?.length || 0,
        templateUrl: agreement.templateUrl,
        pdfUrl: agreement.pdfUrl,
        createdAt: agreement.createdAt,
        updatedAt: agreement.updatedAt
      }
    });
  } catch (err) {
    next(err);
  }
};

export const getFile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const agreement = await agreementService.getAgreement(id);
    if (!agreement) return res.status(404).json({ error: 'Not found' });
    
    const targetFile = agreement.status === 'injected' && agreement.pdfUrl ? agreement.pdfUrl : agreement.templateUrl;
    
    if (!targetFile || !fs.existsSync(targetFile)) {
      return res.status(404).json({ error: 'File not found on disk' });
    }
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${path.basename(targetFile)}"`);
    
    const fileStream = fs.createReadStream(targetFile);
    fileStream.pipe(res);
  } catch (err) {
    next(err);
  }
};

export const downloadPdf = async (req, res, next) => {
  try {
    const { id } = req.params;
    const agreement = await agreementService.getAgreement(id);
    if (!agreement || !agreement.pdfUrl || !fs.existsSync(agreement.pdfUrl)) {
      return res.status(404).json({ error: 'PDF not found' });
    }
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${path.basename(agreement.pdfUrl)}"`);
    
    const fileStream = fs.createReadStream(agreement.pdfUrl);
    fileStream.pipe(res);
  } catch (err) {
    next(err);
  }
};
