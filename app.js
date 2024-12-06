const express = require('express');

const cors = require('cors');

const notionRoutes = require('./routes/notion');

const app = express();

// Middleware
app.use(express.json()); // Pour parser le JSON envoyé dans les requêtes
app.use(cors()); // Permettre les requêtes CORS

// Routes
app.use('/api/notion', notionRoutes);

module.exports = app;