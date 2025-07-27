import express from 'express';
import axios from 'axios';

const app = express();
const PORT = 3000;

app.use(express.static('public'));

app.get('/api/pokemon', async (req, res) => {
    const { limit = 25, offset = 0 } = req.query;

    try {
        const response = await axios.get(`https://pokeapi.co/api/v2/pokemon`, {
            params: { limit, offset }
        });
        const data = response.data;

        const detailedPromises = data.results.map(p => axios.get(p.url));
        const detailedResponses = await Promise.all(detailedPromises);
        const detailedResults = detailedResponses.map(r => r.data);

        res.json({ count: data.count, results: detailedResults });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch Pokémon list' });
    }
});

app.get('/api/pokemon/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const response = await axios.get(`https://pokeapi.co/api/v2/pokemon/${id}`);
        res.json(response.data);
    } catch {
        res.status(404).json({ error: 'Pokémon not found' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
