const express = require('express');
const router = express.Router();
const cacheController = require('../controllers/cache');

// Route pour vider le cache
router.post('/clear', cacheController.clearCache);

module.exports = router;