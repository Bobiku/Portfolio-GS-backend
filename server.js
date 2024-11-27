// const http = require('http');
// const app = require('./app');

// app.set('port', process.env.PORT || 3000);
// const server = http.createServer(app);

// server.listen(process.env.PORT || 3000);

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');

const apiUrl = 'https://api.notion.com/v1';
const notionVersion = '2022-06-28';

// Charger les variables d'environnement
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Permettre les requêtes CORS
app.use(bodyParser.json()); // Parser le JSON
app.use(express.json());
// app.use((req, res) => {
//     res.json({ message: 'Votre requête a bien été reçue !' }); 
//  });
  

// Endpoint pour obtenir un token sécurisé
app.get('/api/token', (req, res) => {
  // Envoyer un token ou toute autre donnée sécurisée
  res.json({
    token: process.env.API_TOKEN, // Récupéré depuis les variables d'environnement
    databaseId: process.env.DATABASE_ID
  });
});

// Endpoint pour obtenir les pages de la database
app.get('/api/query-database', async (req, res) => {
    const { query } = req.body;
    const data = {
        filter: {
          property: 'State',
          multi_select: {
            contains: 'Published',
          },
        },
        sorts: [
          {
            property: 'Date',
            direction: 'descending',
          },
        ],
    };
    try {
      const response = await axios.post(
        `https://api.notion.com/v1/databases/${process.env.DATABASE_ID}/query`,
        data,
        {
          headers: {
            Authorization: `Bearer ${process.env.API_TOKEN}`,
            'Notion-Version': '2022-06-28',
            'Content-Type': 'application/json'
          },
        }
      );
      res.json(response.data);
    } catch (error) {
      console.error(error.response.data);
      res.status(error.response.status).send(error.response.data);
    }
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
