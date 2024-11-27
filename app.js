const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const bodyParser = require('body-parser');

// Charger les variables d'environnement
dotenv.config();

const app = express();

// Middleware
app.use(cors()); // Permettre les requêtes CORS
app.use(bodyParser.json()); // Parser le JSON

// Endpoint pour obtenir un token sécurisé
app.get('/api/token', (req, res) => {
    // Envoyer un token ou toute autre donnée sécurisée
    res.json({
      token: process.env.API_TOKEN, // Récupéré depuis les variables d'environnement
    });
  });

app.use((req, res) => {
    res.json({ message: 'Votre requête a bien été reçue !' }); 
 });

module.exports = app;