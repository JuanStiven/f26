const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const ImageModule = require('docxtemplater-image-module-free');
const fs = require('fs');

// Sample 1x1 PNG transparent image in base64
const samplePngBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

// Test with docxtemplater
console.log('Testing ImageModule configuration...');

const imageOptions = {
  centered: false,
  fileType: 'docx',
  getImage: function (tagValue, tagName) {
    if (!tagValue || typeof tagValue !== 'string') return null;
    if (tagValue.startsWith('data:image/')) {
      const base64Data = tagValue.replace(/^data:image\/\w+;base64,/, '');
      return Buffer.from(base64Data, 'base64');
    }
    if (fs.existsSync(tagValue)) {
      return fs.readFileSync(tagValue);
    }
    return null;
  },
  getSize: function (img, tagValue, tagName) {
    return [150, 60];
  }
};

const imageModule = new ImageModule(imageOptions);
console.log('ImageModule initialized cleanly!');
