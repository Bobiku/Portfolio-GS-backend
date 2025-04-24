const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cache = require('../utils/cache'); // Assurez-vous que votre cache est configuré

async function processImage(imageUrl, id, nomImage) {
    const cacheKey = `${id}_${nomImage}`;
    const cachedData = await cache.get(cacheKey);
    const tempBaseDir = path.join(__dirname, '..', 'temp');
    const tempDirName = path.join('temp', id);
    const tempDir = path.join(__dirname, '..', tempDirName);

    if (cachedData) {
        return cachedData; // Retourner les URLs déjà traitées
    }

    // Télécharger l'image
    // console.log('Starting to process image:', imageUrl);
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    console.log('Image downloaded successfully');
    const originalImageBuffer = Buffer.from(response.data);

    // Chemin de stockage temporaire
    // Vérifier et créer le dossier temp principal s'il n'existe pas
    if (!fs.existsSync(tempBaseDir)) {
        fs.mkdirSync(tempBaseDir);
    }

    // Puis créer le sous-dossier spécifique à l'ID
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir);
}

    const originalPath = path.join(tempDir, nomImage+'_original.jpg');
    fs.writeFileSync(originalPath, originalImageBuffer);

    const sizes = [1280, 768, 480];
    const webpUrls = {};

    try {
        // Créer les versions redimensionnées et les convertir en WebP
        for (const size of sizes) {
            const outputPath = path.join(tempDir, `${nomImage}_${size}.webp`);
            // console.log('Creating image for size:', size);
            await sharp(originalPath)
                .resize({ width: size, withoutEnlargement: true })
                .toFormat('webp', { quality: 80 })
                .toFile(outputPath);
            // console.log('Image created at:', outputPath);

            // Ici, vous devez stocker l'image sur votre serveur ou dans un service de stockage
            // Pour cet exemple, nous allons juste simuler l'URL
            webpUrls[size] = `http://localhost:3000/temp/${id}/${nomImage}_${size}.webp`;
        }

        // Ajouter l'original non modifié
        const outputPath = path.join(tempDir, `${nomImage}_original.webp`);
        // console.log('Creating image for size:', size);
        await sharp(originalPath)
            .toFormat('webp', { quality: 80 })
            .toFile(outputPath);
        // console.log('Image created at:', outputPath);
        webpUrls['original'] = `http://localhost:3000/temp/${id}/${nomImage}_original.webp`;

        // Mettre en cache les URLs
        await cache.set(cacheKey, webpUrls);

        // Supprimer les fichiers temporaires après un délai
        console.log('Attempting to delete:', originalPath);
        fs.unlinkSync(originalPath);
        console.log('Deleted:', originalPath);

        // console.log('Processed Image URLs:', webpUrls);
        return webpUrls;
    } catch (error) {
        console.error('Error processing image:', error);
        throw new Error('Image processing failed');
    }
}

module.exports = { processImage }; 