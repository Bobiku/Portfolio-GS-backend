const cache = require('../utils/cache');
const fs = require('fs');
const path = require('path'); // Ajout de l'import manquant
const cron = require('node-cron');
const { queryDatabase } = require('./notion');

function deleteFolderRecursive(directoryPath) {
    if (fs.existsSync(directoryPath)) {
        fs.readdirSync(directoryPath).forEach((file) => {
            const curPath = path.join(directoryPath, file);
            if (fs.lstatSync(curPath).isDirectory()) {
                // Récursion pour les sous-dossiers
                deleteFolderRecursive(curPath);
            } else {
                // Supprimer les fichiers
                fs.unlinkSync(curPath);
            }
        });
        
        // Supprimer les sous-dossiers vides (mais conserver le dossier temp principal)
        if (path.basename(directoryPath) !== 'temp') {
            fs.rmdirSync(directoryPath);
        }
    }
}

exports.clearCache = async (req, res) => {
    try {
        // Récupérer les clés du cache avant nettoyage
        const keys = await cache.keys();
        
        // Vider le cache Redis
        await cache.flushAll();
        
        // Récupérer les clés après nettoyage
        const keysAfter = await cache.keys();
        
        // Nettoyer le dossier temp
        const tempDir = path.join(__dirname, '..', 'temp');
        deleteFolderRecursive(tempDir);
        
        // Recréer le dossier temp vide
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir);
        }
        
        res.status(200).json({ 
            message: 'Redis cache and temp directory cleared successfully',
            beforeKeys: keys,
            afterKeys: keysAfter
        });
    } catch (error) {
        console.error('Error clearing cache and temp directory:', error);
        res.status(500).json({ error: 'Failed to clear cache and temp directory' });
    }
};

// Planifie une tâche tous les jours à 2h du matin
cron.schedule('0 2 * * *', async () => {
    try {
        // Appel à votre fonction de nettoyage
        clearCache();
        queryDatabase();
        retrieveBlockChildren();
        console.log('Cache and temp directory cleared successfully at', new Date());
    } catch (error) {
        console.error('Error during scheduled cache cleaning:', error);
    }
});