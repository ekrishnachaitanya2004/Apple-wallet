const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const { generatePass } = require('./generatePass');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads';
    fs.ensureDirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Generate pass with custom image
app.post('/generate-pass', upload.single('image'), async (req, res) => {
  try {
    const { cardType, cardName, cardNumber, cardHolder, additionalInfo } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload an image' });
    }

    const passData = {
      cardType: cardType || 'Personal Card',
      cardName: cardName || 'My Card',
      cardNumber: cardNumber || '',
      cardHolder: cardHolder || 'Card Holder',
      additionalInfo: additionalInfo || '',
      imagePath: req.file.path
    };

    const pkpassPath = await generatePass(passData);
    
    res.download(pkpassPath, `${cardName || 'card'}.pkpass`, (err) => {
      if (err) {
        console.error('Download error:', err);
      }
      // Clean up the generated file after download
      setTimeout(() => {
        fs.remove(pkpassPath).catch(console.error);
      }, 5000);
    });

  } catch (error) {
    console.error('Error generating pass:', error);
    res.status(500).json({ error: 'Failed to generate pass' });
  }
});

// Generate pass with default template
app.post('/generate-default-pass', async (req, res) => {
  try {
    const { cardType, cardName, cardNumber, cardHolder, additionalInfo } = req.body;
    
    const passData = {
      cardType: cardType || 'Personal Card',
      cardName: cardName || 'My Card',
      cardNumber: cardNumber || '',
      cardHolder: cardHolder || 'Card Holder',
      additionalInfo: additionalInfo || '',
      imagePath: null // Will use default template
    };

    const pkpassPath = await generatePass(passData);
    
    res.download(pkpassPath, `${cardName || 'card'}.pkpass`, (err) => {
      if (err) {
        console.error('Download error:', err);
      }
      // Clean up the generated file after download
      setTimeout(() => {
        fs.remove(pkpassPath).catch(console.error);
      }, 5000);
    });

  } catch (error) {
    console.error('Error generating pass:', error);
    res.status(500).json({ error: 'Failed to generate pass' });
  }
});

// Generate custom pass
app.post('/generate-custom-pass', upload.single('image'), async (req, res) => {
  try {
    const { json } = req.body;
    if (!json) {
      return res.status(400).json({ error: 'Missing pass.json data' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload an image' });
    }
    let passJson;
    try {
      passJson = JSON.parse(json);
    } catch (err) {
      return res.status(400).json({ error: 'Invalid JSON: ' + err.message });
    }
    // Use the provided passJson and image
    const passData = {
      customPassJson: passJson,
      imagePath: req.file.path
    };
    const pkpassPath = await generatePass(passData, true); // true = use custom JSON
    res.download(pkpassPath, `custom-pass.pkpass`, (err) => {
      if (err) {
        console.error('Download error:', err);
      }
      setTimeout(() => {
        fs.remove(pkpassPath).catch(console.error);
      }, 5000);
    });
  } catch (error) {
    console.error('Error generating custom pass:', error);
    res.status(500).json({ error: 'Failed to generate pass' });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
    }
  }
  console.error('Server error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 Apple Wallet Pass Generator running on http://localhost:${PORT}`);
  console.log(`📱 Create your personal cards for Apple Wallet!`);
}); 