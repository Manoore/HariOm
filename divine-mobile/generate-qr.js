const QRCode = require('qrcode');
const fs = require('fs');

const expoUrl = 'exp://08qpdne-anonymous-8082.exp.direct';

QRCode.toDataURL(expoUrl, {
  width: 300,
  margin: 2,
  color: {
    dark: '#722F37',
    light: '#FFFFFF'
  }
}, (err, url) => {
  if (err) {
    console.error('Error:', err);
    return;
  }
  
  // Create HTML file with QR code
  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Divine App - Expo QR Code</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #FFF8E7 0%, #FFEDD5 100%);
    }
    .container {
      text-align: center;
      background: white;
      padding: 40px;
      border-radius: 24px;
      box-shadow: 0 10px 40px rgba(114, 47, 55, 0.15);
      max-width: 400px;
    }
    h1 {
      color: #722F37;
      font-size: 28px;
      margin-bottom: 8px;
    }
    .subtitle {
      color: #666;
      margin-bottom: 24px;
    }
    .qr-code {
      margin: 20px 0;
    }
    .instructions {
      background: #FFF7ED;
      padding: 16px;
      border-radius: 12px;
      margin-top: 20px;
      text-align: left;
    }
    .instructions h3 {
      color: #722F37;
      margin: 0 0 12px 0;
      font-size: 16px;
    }
    .instructions ol {
      margin: 0;
      padding-left: 20px;
      color: #666;
    }
    .instructions li {
      margin-bottom: 8px;
    }
    .url-box {
      background: #F3F4F6;
      padding: 12px;
      border-radius: 8px;
      font-family: monospace;
      font-size: 12px;
      word-break: break-all;
      margin-top: 16px;
      color: #374151;
    }
    .badge {
      display: inline-block;
      background: #FF9933;
      color: white;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      margin-bottom: 16px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="badge">📱 Mobile Preview</div>
    <h1>Divine App</h1>
    <p class="subtitle">Scan with Expo Go to preview</p>
    
    <div class="qr-code">
      <img src="${url}" alt="QR Code" width="250" height="250" />
    </div>
    
    <div class="instructions">
      <h3>📋 Instructions:</h3>
      <ol>
        <li><strong>Download Expo Go</strong> on your phone
          <br><small>iOS: App Store | Android: Play Store</small></li>
        <li><strong>Open camera</strong> and scan QR code</li>
        <li><strong>Tap notification</strong> to open in Expo Go</li>
      </ol>
    </div>
    
    <div class="url-box">
      ${expoUrl}
    </div>
  </div>
</body>
</html>
`;
  
  fs.writeFileSync('/app/frontend/public/expo-qr.html', html);
  console.log('QR code page created at /app/frontend/public/expo-qr.html');
});
