// Imports
const { Client } = require("@notionhq/client")
const dotenv = require('dotenv');
const { Projet } = require('../models/projet');

// Charger les variables d'environnement
dotenv.config();

// Initializing a client
const notion = new Client({
  auth: process.env.NOTION_TOKEN,
})

// exports.getToken = (req, res) => {
//     // Envoyer un token ou toute autre donnée sécurisée
//     res.json({
//         token: process.env.NOTION_TOKEN, // Récupéré depuis les variables d'environnement
//         databaseId: process.env.NOTION_DATABASE_ID
//     });
// };

exports.queryDatabase = async (req, res) => {
    const databaseId = process.env.NOTION_DATABASE_ID;
    const projets = [];
    try {
        // Requête API Notion
        const response = await notion.databases.query({
            database_id: databaseId,
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
            ]
        });
        // Si pas de block trouvée
        if (!response.results || response.results.length === 0) {
            return res.status(404).json({ error: 'Aucune page trouvée pour cette database.' });
        }
        // Traitement des résultats de la requête
        response.results.forEach((result) => {
            const properties = result.properties;
        
            const id = result.id;
            const titre = properties.Title?.title[0]?.plain_text || 'Sans titre';
            const description = properties.Description?.rich_text[0]?.plain_text || 'Aucune description';
            const customer = properties.Customer?.rich_text[0]?.plain_text || 'Client inconnu';
            const date = properties.Date?.rich_text[0]?.plain_text || 'Date inconnue';
            const roles = properties.Roles?.multi_select.map((role) => role.name) || [];
            const resultUrl = properties.ResultUrl?.url || 'Pas de lien';
            const imageBannerUrl = result.cover?.file?.url || 'Pas de bannière';
            // Créer une instance de Projet
            const projet = new Projet(id, titre, description, customer, date, roles, resultUrl, imageBannerUrl);
            // Ajouter à la liste des projets
            projets.push(projet);
        });
        // Envoie de la réponse
        res.status(200).json(projets);
    } catch (error) {
        console.error('Erreur dans queryDatabase:', error);
        res.status(500).json({ error: 'Impossible de récupérer les pages de la base de données.' });
    }
};

exports.retrieveBlockChildren = async (req, res) => {
    const pageId = req.params.id; // Récupère l'ID de la page depuis les paramètres d'URL
    const blocks = [];
    try {
        // Requête API Notion
        const response = await notion.blocks.children.list({
            block_id: pageId,
            page_size: 100,
        });
        // Si pas de block trouvée
        if (!response.results || response.results.length === 0) {
            return res.status(404).json({ error: 'Aucun bloc trouvé pour cette page.' });
        }
        // Traitement des résultats de la requête
        response.results.forEach((result) => {
            const type = result.type;
            let block = '';
            if (type === "image") {
                const imageUrl = result[type]?.external?.url || result[type]?.file?.url || "";
                block = { type: type, content: imageUrl };
            }
             else {
                const content = result[type]?.rich_text || [];
                const textContent = content.map(item => item.text.content).join("");
                block = { type: type, content: textContent }
            }
            blocks.push(block);
        });
        // Envoie de la réponse
        res.status(200).json(blocks);
    } catch (error) {
        console.error('Erreur lors de la récupération des blocs:', error);
        res.status(500).json({ error: 'Impossible de récupérer les blocs de la page.' });
    }
};