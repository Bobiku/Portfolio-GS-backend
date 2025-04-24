// Imports
const { Client } = require("@notionhq/client")
const cache = require('../utils/cache');
const { Projet } = require('../models/projet');
const imageService = require('../services/image.service');

// Initializing a client
const notion = new Client({
  auth: process.env.NOTION_TOKEN,
})

exports.queryDatabase = async (req, res) => {
    try {
        // Test simple de connexion
        // const testResponse = await notion.users.me();
        // console.log('Notion connection test:', testResponse);

        const cacheKey = 'notionData';
        
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
        for (const result of response.results) {
            const properties = result.properties;
        
            const id = result.id;
            const titre = properties.Title?.title[0]?.plain_text || 'Sans titre';
            const description = properties.Description?.rich_text[0]?.plain_text || 'Aucune description';
            const customer = properties.Customer?.rich_text[0]?.plain_text || null;
            const date = properties.Date?.rich_text[0]?.plain_text || null;
            const roles = properties.Roles?.multi_select.map((role) => role.name) || [];
            const resultUrl = properties.ResultUrl?.url || null;
            const imageBannerUrl = result.cover?.file?.url || null;
            
            // Appeler la méthode processImage pour traiter l'image
            let processedImageUrls = {};
            if (imageBannerUrl) {
                processedImageUrls = await imageService.processImage(imageBannerUrl, id, 'bannerProjet');
            }

            const projet = new Projet(id, titre, description, customer, date, roles, resultUrl, processedImageUrls);
            projets.push(projet);
            // console.log('Image Banner URL:', imageBannerUrl);
            // console.log('Processed Image URLs:', processedImageUrls);
        }

        if (projets.length > 0) {
            await cache.set(cacheKey, projets);
        }

        res.json(projets);
    } catch (error) {
        console.error('Notion API Error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch data from Notion',
            details: error.message
        });
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
    let numImg = 0;
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

            for (const result of response.results) {
                const type = result.type;
                let block = '';
                if (type === "image") {
                    const imageUrl = result[type]?.external?.url || result[type]?.file?.url || "";
                    numImg++;
                    // Appeler la méthode processImage pour traiter l'image
                    let processedImageUrls = {};
                    processedImageUrls = await imageService.processImage(imageUrl, pageId, 'image'+numImg);
                    block = { type: type, content: processedImageUrls };
                } else {
                    const content = result[type]?.rich_text || [];
                    const textContent = content.map(item => processAnnotations(item));
                    block = { type: type, content: textContent };
                }
                blocks.push(block);
            }

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