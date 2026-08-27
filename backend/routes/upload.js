const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authenticateJWT, requireAdmin } = require('../middleware/auth');

// Multer memory storage (keeps file in memory rather than saving to disk)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // limit to 5MB
  },
});

router.post('/', authenticateJWT, requireAdmin, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const pinataJwt = process.env.PINATA_JWT;
    if (!pinataJwt) {
      console.error('PINATA_JWT is not configured in backend/.env');
      return res.status(500).json({ success: false, message: 'Server configuration error' });
    }

    // Construct FormData exactly as Pinata expects it
    const formData = new FormData();
    const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
    formData.append('file', blob, req.file.originalname);

    const pinataRes = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${pinataJwt}`,
      },
      body: formData,
    });

    if (!pinataRes.ok) {
      const errorText = await pinataRes.text();
      console.error('Pinata API Error:', errorText);
      throw new Error(`Pinata upload failed with status ${pinataRes.status}`);
    }

    const data = await pinataRes.json();
    const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`;

    res.status(200).json({
      success: true,
      data: {
        url: ipfsUrl,
      },
    });
  } catch (error) {
    console.error('Error uploading file to Pinata:', error);
    res.status(500).json({ success: false, message: 'Failed to upload image' });
  }
});

module.exports = router;
