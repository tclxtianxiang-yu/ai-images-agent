// Test script for image upload API
const fs = require('fs');
const path = require('path');

// Create a simple 1x1 red pixel PNG
const redPixelBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';

async function testUpload() {
  console.log('Testing image upload API...\n');

  const payload = {
    imageData: redPixelBase64,
    fileName: 'test-image.png',
    mimeType: 'image/png',
    fileSize: Math.ceil((redPixelBase64.length * 3) / 4),
    language: 'en'
  };

  try {
    console.log('Sending request to http://localhost:3001/api/upload');
    console.log('Image:', payload.fileName);
    console.log('Size:', payload.fileSize, 'bytes\n');

    const response = await fetch('http://localhost:3001/api/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (data.success) {
      console.log('✅ Success!\n');
      console.log('Image URL:', data.data.url);
      console.log('Description:', data.data.description);
      console.log('Keywords:', data.data.keywords.join(', '));
      console.log('Compression:', data.data.compressionRatio.toFixed(2) + '%');
      console.log('Confidence:', (data.data.confidence * 100).toFixed(0) + '%');
      console.log('\nTrace ID:', data.traceId);
    } else {
      console.log('❌ Failed:\n');
      console.log('Error:', data.error);
      console.log('Trace ID:', data.traceId);
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

testUpload();
