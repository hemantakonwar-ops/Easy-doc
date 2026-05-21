import express from 'express';
import { search } from './search.controller.js';
import { authenticateToken } from '../../middleware/auth.js';

const router = express.Router();

router.post('/', authenticateToken, search);

export default router;
