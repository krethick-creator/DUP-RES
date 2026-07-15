const express = require('express');
const upload = require('../middleware/upload');
const OCRService = require('../services/OCRService');

const router = express.Router();

// POST /api/ocr/test
router.post('/test', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const ocrResult = await OCRService.parse(req.file.path);

    if (ocrResult.success) {
      res.json({
        success: true,
        source: ocrResult.source,
        characters: ocrResult.text.length,
        preview: ocrResult.text.substring(0, 500)
      });
    } else {
      res.status(500).json({
        success: false,
        error: ocrResult.error || 'OCR failed'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'OCR processing exception'
    });
  }
});

module.exports = router;
