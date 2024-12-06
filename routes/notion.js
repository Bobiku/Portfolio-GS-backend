// Imports
const express = require('express');
const router = express.Router();

const notionCtrl = require('../controllers/notion');

// Endpoint pour obtenir un token sécurisé
// router.get('/token', notionCtrl.getToken);
// Endpoint pour obtenir la liste de tous les block de la page
router.get('/page/:id', notionCtrl.retrieveBlockChildren);
// Endpoint pour obtenir les pages de la database
router.get('/page/', notionCtrl.queryDatabase);

module.exports = router;