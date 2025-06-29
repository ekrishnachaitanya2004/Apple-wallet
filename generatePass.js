const fs = require('fs-extra');
const path = require('path');
const archiver = require('archiver');
const { createCanvas, loadImage, registerFont } = require('canvas');
const crypto = require('crypto');

// Ensure directories exist
const ensureDirectories = () => {
  const dirs = ['passes', 'templates', 'certificates', 'uploads'];
  dirs.forEach(dir => fs.ensureDirSync(dir));
};

// Generate a unique pass identifier
const generatePassId = () => {
  return crypto.randomBytes(16).toString('hex');
};

// Create default card image if no custom image provided
const createDefaultCardImage = async (passData) => {
  const canvas = createCanvas(624, 246);
  const ctx = canvas.getContext('2d');

  // Create gradient background
  const gradient = ctx.createLinearGradient(0, 0, 624, 246);
  gradient.addColorStop(0, '#4A90E2');
  gradient.addColorStop(1, '#357ABD');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 624, 246);

  // Add card type text
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.font = 'bold 24px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(passData.cardType, 30, 50);

  // Add card name
  ctx.fillStyle = 'white';
  ctx.font = 'bold 36px Arial';
  ctx.fillText(passData.cardName, 30, 100);

  // Add card holder name
  ctx.font = '20px Arial';
  ctx.fillText(`Holder: ${passData.cardHolder}`, 30, 140);

  // Add card number (masked)
  if (passData.cardNumber) {
    const maskedNumber = passData.cardNumber.replace(/\d(?=\d{4})/g, '*');
    ctx.font = '18px Arial';
    ctx.fillText(`Card: ${maskedNumber}`, 30, 170);
  }

  // Add decorative elements
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(30, 200);
  ctx.lineTo(594, 200);
  ctx.stroke();

  // Add icon placeholder
  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.beginPath();
  ctx.arc(550, 80, 30, 0, 2 * Math.PI);
  ctx.fill();

  return canvas.toBuffer('image/png');
};

// Process and resize image for Apple Wallet
const processImage = async (imagePath, targetWidth = 624, targetHeight = 246) => {
  try {
    const image = await loadImage(imagePath);
    const canvas = createCanvas(targetWidth, targetHeight);
    const ctx = canvas.getContext('2d');

    // Calculate aspect ratio
    const aspectRatio = image.width / image.height;
    const targetAspectRatio = targetWidth / targetHeight;

    let drawWidth, drawHeight, offsetX = 0, offsetY = 0;

    if (aspectRatio > targetAspectRatio) {
      // Image is wider than target
      drawHeight = targetHeight;
      drawWidth = targetHeight * aspectRatio;
      offsetX = (targetWidth - drawWidth) / 2;
    } else {
      // Image is taller than target
      drawWidth = targetWidth;
      drawHeight = targetWidth / aspectRatio;
      offsetY = (targetHeight - drawHeight) / 2;
    }

    // Draw image with proper scaling
    ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);

    return canvas.toBuffer('image/png');
  } catch (error) {
    console.error('Error processing image:', error);
    throw new Error('Failed to process image');
  }
};

// Create pass.json structure
const createPassJson = (passData) => {
  const passId = generatePassId();
  
  return {
    formatVersion: 1,
    passTypeIdentifier: "pass.com.krishnachaitanya.personalcard",
    teamIdentifier: "TEAM123456",
    organizationName: "Krishna's Personal Cards",
    serialNumber: passId,
    description: `${passData.cardType} - ${passData.cardName}`,
    generic: {
      primaryFields: [
        {
          key: "cardName",
          label: "CARD",
          value: passData.cardName
        }
      ],
      secondaryFields: [
        {
          key: "cardType",
          label: "TYPE",
          value: passData.cardType
        },
        {
          key: "cardHolder",
          label: "HOLDER",
          value: passData.cardHolder
        }
      ],
      auxiliaryFields: passData.cardNumber ? [
        {
          key: "cardNumber",
          label: "NUMBER",
          value: passData.cardNumber.replace(/\d(?=\d{4})/g, '*'),
          textAlignment: "PKTextAlignmentLeft"
        }
      ] : [],
      backFields: passData.additionalInfo ? [
        {
          key: "additionalInfo",
          label: "ADDITIONAL INFO",
          value: passData.additionalInfo
        }
      ] : []
    },
    barcodes: [
      {
        format: "PKBarcodeFormatQR",
        message: `Personal Card: ${passData.cardName}`,
        messageEncoding: "iso-8859-1"
      }
    ],
    locations: [],
    storeCard: {
      headerFields: [],
      primaryFields: [],
      secondaryFields: [],
      auxiliaryFields: []
    }
  };
};

// Create manifest.json
const createManifest = (files) => {
  const manifest = {};
  
  for (const file of files) {
    const content = fs.readFileSync(file.path);
    manifest[file.name] = crypto.createHash('sha1').update(content).digest('hex');
  }
  
  return manifest;
};

// Sign the manifest
const signManifest = (manifestJson) => {
  // For development, we'll create a placeholder signature
  // In production, you'd use your actual Apple Wallet certificate
  const signature = crypto.createHash('sha256').update(manifestJson).digest('hex');
  return Buffer.from(signature, 'hex');
};

// Generate the .pkpass file
const generatePass = async (passData, useCustomJson = false) => {
  try {
    ensureDirectories();
    
    const passId = generatePassId();
    const passDir = path.join('passes', passId);
    await fs.ensureDir(passDir);

    // Use custom pass.json if provided
    let passJson;
    if (useCustomJson && passData.customPassJson) {
      passJson = passData.customPassJson;
      // Optionally inject a new serialNumber or unique fields if missing
      if (!passJson.serialNumber) passJson.serialNumber = passId;
    } else {
      passJson = createPassJson(passData);
    }
    const passJsonPath = path.join(passDir, 'pass.json');
    await fs.writeJson(passJsonPath, passJson, { spaces: 2 });

    // Process image
    let imageBuffer;
    if (passData.imagePath && await fs.pathExists(passData.imagePath)) {
      imageBuffer = await processImage(passData.imagePath);
    } else {
      imageBuffer = await createDefaultCardImage(passData);
    }

    // Save strip image
    const stripImagePath = path.join(passDir, 'strip.png');
    await fs.writeFile(stripImagePath, imageBuffer);

    // Create icon (simplified version of strip)
    const iconCanvas = createCanvas(29, 29);
    const iconCtx = iconCanvas.getContext('2d');
    const iconImage = await loadImage(imageBuffer);
    iconCtx.drawImage(iconImage, 0, 0, 29, 29);
    const iconBuffer = iconCanvas.toBuffer('image/png');
    const iconPath = path.join(passDir, 'icon.png');
    await fs.writeFile(iconPath, iconBuffer);

    // Create manifest.json
    const files = [
      { name: 'pass.json', path: passJsonPath },
      { name: 'strip.png', path: stripImagePath },
      { name: 'icon.png', path: iconPath }
    ];

    const manifest = createManifest(files);
    const manifestPath = path.join(passDir, 'manifest.json');
    await fs.writeJson(manifestPath, manifest, { spaces: 2 });

    // Create signature
    const manifestContent = await fs.readFile(manifestPath, 'utf8');
    const signature = signManifest(manifestContent);
    const signaturePath = path.join(passDir, 'signature');
    await fs.writeFile(signaturePath, signature);

    // Create .pkpass file
    const pkpassPath = path.join('passes', `${(passJson.serialNumber || 'custom')}_${passId}.pkpass`);
    const output = fs.createWriteStream(pkpassPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.pipe(output);
    archive.file(passJsonPath, { name: 'pass.json' });
    archive.file(stripImagePath, { name: 'strip.png' });
    archive.file(iconPath, { name: 'icon.png' });
    archive.file(manifestPath, { name: 'manifest.json' });
    archive.file(signaturePath, { name: 'signature' });

    await archive.finalize();

    // Clean up temporary files
    await fs.remove(passDir);

    return pkpassPath;
  } catch (error) {
    console.error('Error generating pass:', error);
    throw error;
  }
};

module.exports = { generatePass }; 