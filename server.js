import express from 'express';
import fetch from 'node-fetch';

const app = express();
const PORT =  3000;

app.use(express.static('public'));

app.get('/api/pokemon', async (req, res) => {
    const { limit = 25, offset = 0 } = req.query;

    try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${limit}&offset=${offset}`);
        const data = await response.json();

        const detailed = await Promise.all(
            data.results.map(p => fetch(p.url).then(res => res.json()))
        );

        res.json({ count: data.count, results: detailed });
    } catch (err) {
        console.error('List fetch error:', err);
        res.status(500).json({ error: 'Failed to fetch Pokémon list' });
    }
});


app.get('/api/pokemon/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
        if (!response.ok) throw new Error('Not found');
        const data = await response.json();
        res.json(data);
    } catch (err) {
        res.status(404).json({ error: 'Pokémon not found' });
    }
});

app.listen(PORT, () => {
    console.log(` Server running at http://localhost:${PORT}`);
});
