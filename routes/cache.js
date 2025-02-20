const express = require('express');
const router = express.Router();
const { clearCache } = require('../controllers/cache');

router.post('/clear', clearCache);

module.exports = router;