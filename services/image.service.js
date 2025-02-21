const sharp = require('sharp');

async function resizeImage(imagePath, width) {
    return sharp(imagePath)
        .resize(width)
        .webp({ quality: 80 })
        .toBuffer();
} 