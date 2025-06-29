# 📱 Apple Wallet Pass Generator

A personal card management system for Apple Wallet that allows you to create custom `.pkpass` files for your Aadhar, PAN, Driving License, and other personal cards.

## ✨ Features

- **Custom Image Support**: Upload your own card images or use built-in templates
- **Multiple Card Types**: Aadhar, PAN, Driving License, Passport, Credit/Debit Cards, etc.
- **Secure Data Handling**: Card numbers are automatically masked for privacy
- **Modern Web Interface**: Beautiful, responsive design with real-time preview
- **Easy Customization**: Add custom text, card holder names, and additional information
- **QR Code Generation**: Each pass includes a QR code for easy identification

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd Apple-wallet
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

## 📋 Usage

### Creating a Pass with Custom Image

1. **Select "Custom Image" tab**
2. **Fill in the card details**:
   - Card Type (Aadhar, PAN, etc.)
   - Card Name
   - Card Holder Name
   - Card Number (optional, will be masked)
   - Additional Information (optional)

3. **Upload your card image**:
   - Recommended size: 624x246 pixels
   - Supported formats: PNG, JPG, GIF
   - Maximum file size: 5MB

4. **Click "Generate Apple Wallet Pass"**
5. **Download the `.pkpass` file**
6. **Open on your iPhone** to add to Apple Wallet

### Creating a Pass with Default Template

1. **Select "Default Template" tab**
2. **Fill in the card details** (same as above)
3. **Click "Generate with Default Template"**
4. **Download and install the pass**

## 🔧 Configuration

### Apple Wallet Certificate Setup

**Important**: For production use, you need a valid Apple Wallet certificate:

1. **Get Apple Developer Account** ($99/year)
2. **Create Pass Type ID** in Apple Developer Console
3. **Download Certificate** (.p12 file)
4. **Update the code** in `generatePass.js`:

```javascript
// Replace the placeholder signing with real certificate
const signManifest = (manifestJson) => {
  // Load your .p12 certificate
  const cert = fs.readFileSync('path/to/your/certificate.p12');
  const passphrase = 'your-certificate-password';
  
  // Sign the manifest with your certificate
  // Implementation depends on your certificate format
  return signedData;
};
```

### Customizing Pass Templates

Edit `generatePass.js` to modify:
- Default colors and styling
- Pass structure and fields
- QR code content
- Organization details

## 📁 Project Structure

```
Apple-wallet/
├── index.js              # Main Express server
├── generatePass.js       # Pass generation logic
├── package.json          # Dependencies
├── public/
│   └── index.html        # Web interface
├── passes/               # Generated .pkpass files
├── uploads/              # Uploaded images
├── templates/            # Custom templates
└── certificates/         # Apple Wallet certificates
```

## 🎨 Customization Examples

### Aadhar Card Template
```javascript
{
  cardType: "Aadhar Card",
  cardName: "My Aadhar Card",
  cardHolder: "Krishna Chaitanya",
  cardNumber: "1234-5678-9012",
  additionalInfo: "UIDAI - Unique Identification Authority of India"
}
```

### PAN Card Template
```javascript
{
  cardType: "PAN Card",
  cardName: "My PAN Card",
  cardHolder: "Krishna Chaitanya",
  cardNumber: "ABCDE1234F",
  additionalInfo: "Permanent Account Number - Income Tax Department"
}
```

## 🔒 Security Notes

- **Development Mode**: Currently uses placeholder signatures
- **Production**: Requires valid Apple Wallet certificate
- **Data Privacy**: Card numbers are masked in the pass
- **File Cleanup**: Generated files are automatically cleaned up

## 🐛 Troubleshooting

### Common Issues

1. **"Invalid pass" error on iPhone**
   - Ensure you have a valid Apple Wallet certificate
   - Check pass.json structure is correct

2. **Image not displaying**
   - Verify image format (PNG/JPG)
   - Check image dimensions (624x246 recommended)
   - Ensure file size < 5MB

3. **Server won't start**
   - Check Node.js version (v14+)
   - Verify all dependencies installed
   - Check port 3000 is available

### Debug Mode

Run with debug logging:
```bash
DEBUG=* npm start
```

## 📱 Apple Wallet Integration

### Adding Passes to Wallet

1. **Email the .pkpass file** to your iPhone
2. **Tap the attachment** in Mail app
3. **Tap "Add to Wallet"**
4. **Confirm** the addition

### Pass Features

- **QR Code**: Tap to scan and identify
- **Notifications**: Location-based (if configured)
- **Updates**: Server can push updates to passes
- **Sharing**: Easy to share with others

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Apple Wallet documentation
- Node.js community
- Canvas library for image processing

## 📞 Support

For issues and questions:
- Create an issue on GitHub
- Check the troubleshooting section
- Review Apple Wallet documentation

---

**Note**: This is a development tool. For production use with real Apple Wallet passes, you must obtain proper Apple Developer certificates and follow Apple's guidelines. 