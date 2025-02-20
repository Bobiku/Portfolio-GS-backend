// Imports
const { Client } = require("@notionhq/client")
const dotenv = require('dotenv');
const cache = require('../utils/cache');
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
    const cacheKey = 'notionData';
    
    try {
        const cachedData = await cache.get(cacheKey);
        if (cachedData) {
            return res.json(cachedData);
        }

        const databaseId = process.env.NOTION_DATABASE_ID;
        const projets = [];

        // Construire le filtre en fonction de l'environnement
        const filter = {
            or: [
                {
                    property: 'State',
                    multi_select: {
                        contains: 'Published'
                    }
                }
            ]
        };

        // Ajouter InProgress uniquement en développement
        if (process.env.SHOW_IN_PROGRESS === 'true') {
            filter.or.push({
                property: 'State',
                multi_select: {
                    contains: 'InProgress'
                }
            });
        }

        const response = await notion.databases.query({
            database_id: databaseId,
            filter: filter,
            sorts: [
                {
                    property: 'Date',
                    direction: 'descending',
                },
            ]
        });
        if (!response.results || response.results.length === 0) {
            return res.status(404).json({ error: 'Aucune page trouvée pour cette database.' });
        }
        response.results.forEach((result) => {
            const properties = result.properties;
        
            const id = result.id;
            const titre = properties.Title?.title[0]?.plain_text || 'Sans titre';
            const description = properties.Description?.rich_text[0]?.plain_text || 'Aucune description';
            const customer = properties.Customer?.rich_text[0]?.plain_text || null;
            const date = properties.Date?.rich_text[0]?.plain_text || null;
            const roles = properties.Roles?.multi_select.map((role) => role.name) || [];
            const resultUrl = properties.ResultUrl?.url || null;
            const imageBannerUrl = result.cover?.file?.url || null;
            const projet = new Projet(id, titre, description, customer, date, roles, resultUrl, imageBannerUrl);
            projets.push(projet);
        });

        if (projets.length > 0) {
            await cache.set(cacheKey, projets);
        }

        res.json(projets);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Fonction pour traiter les annotations
function processAnnotations(text) {
    return {
        plain_text: text.plain_text,
        annotations: text.annotations,
        href: text.href
    };
}

exports.retrieveBlockChildren = async (req, res) => {
    const pageId = req.params.id;
    const cacheKey = `blocks_${pageId}`;
    
    try {
        const cachedData = await cache.get(cacheKey);
        if (cachedData) {
            return res.json(cachedData);
        }

        const blocks = [];
        let hasMore = true;
        let cursor = undefined;

        while (hasMore) {
            const response = await notion.blocks.children.list({
                block_id: pageId,
                page_size: 100,
                start_cursor: cursor,
            });
            
            if (!response.results || response.results.length === 0) {
                return res.status(404).json({ error: 'Aucun bloc trouvé pour cette page.' });
            }

            response.results.forEach((result) => {
                const type = result.type;
                let block = '';
                if (type === "image") {
                    const imageUrl = result[type]?.external?.url || result[type]?.file?.url || "";
                    block = { type: type, content: imageUrl };
                } else {
                    const content = result[type]?.rich_text || [];
                    const textContent = content.map(item => processAnnotations(item));
                    block = { type: type, content: textContent }
                }
                blocks.push(block);
            });

            hasMore = response.has_more;
            cursor = response.next_cursor;
        }

        if (blocks.length > 0) {
            await cache.set(cacheKey, blocks);
        }

        res.json(blocks);
    } catch (error) {
        console.error('Error:', error);
        res.status(404).json({ error: 'Failed to retrieve blocks' });
    }
};