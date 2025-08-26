const QRCode = require('qrcode');
const fs = require('fs');

const url = 'http://7c300734a638.sn.mynetname.net:3000/hadiah.html?nomor=67890';
const outputFilePath = 'qrcode.png';

QRCode.toFile(outputFilePath, url, {
  color: {
    dark: '#000000',  // Black dots
    light: '#FFFFFF'  // White background
  }
}, function (err) {
  if (err) throw err;
  console.log('QR Code generated and saved as ' + outputFilePath);
});
