import express from 'express';
import { uploadMiddleware } from '../../core/middleware/uploadMiddleware.js';
import * as agreementController from './agreement.controller.js';

const router = express.Router();

router.post('/upload-template', uploadMiddleware.single('file'), agreementController.uploadTemplate);
router.post('/:id/generate', agreementController.generateText);
router.post('/:id/edit', agreementController.editText);
router.post('/:id/version', agreementController.setVersion);
router.post('/:id/approve', agreementController.approveText);
router.post('/:id/inject', agreementController.injectPdf);
router.get('/:id', agreementController.getAgreement);
router.get('/:id/file', agreementController.getFile);
router.get('/:id/download', agreementController.downloadPdf);

export default router;
