document.addEventListener('DOMContentLoaded', function() {
    const pokemonList = document.getElementById('pokemon-list');
    const detailsPanel = document.getElementById('pokemon-details');
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-btn');
    const prevButton = document.getElementById('prev-btn');
    const nextButton = document.getElementById('next-btn');

    let offset = 0;
    const limit = 25;

    async function fetchPokemonList() {
        try {
            const response = await fetch(`/api/pokemon?limit=${limit}&offset=${offset}`);
            const data = await response.json();

            displayPokemon(data.results);
            prevButton.disabled = offset === 0;
            nextButton.disabled = offset + limit >= data.count;
        } catch (err) {
            console.error('Fetch error:', err);
            pokemonList.innerHTML = '<p>Error loading Pokémon.</p>';
        }
    }

    function updatePageInfo() {
        const currentPage = Math.floor(offset / limit) + 1;
        const pageInfo = document.getElementById('page-info');
        pageInfo.textContent = `Page ${currentPage}`;
      }
      
    function displayPokemon(pokemonArray) {
        pokemonList.innerHTML = '';

        pokemonArray.forEach(pokemon => {
            const card = document.createElement('div');
            card.className = 'pokemon-card';
            card.innerHTML = `
                <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}">
                <h3>${pokemon.name}</h3>
            `;
            card.addEventListener('click', () => showPokemonDetails(pokemon));
            pokemonList.appendChild(card);
        });
    }

    async function showPokemonDetails(pokemon) {
        if (!pokemon.stats) {
            try {
                const response = await fetch(`/api/pokemon/${pokemon.id}`);
                pokemon = await response.json();
            } catch (err) {
                console.error('Detail fetch error:', err);
                detailsPanel.innerHTML = '<p>Error loading details.</p>';
                return;
            }
        }

        detailsPanel.innerHTML = `
            <h2>${pokemon.name}</h2>
            <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}">
            <p><strong>Height:</strong> ${pokemon.height}</p>
            <p><strong>Weight:</strong> ${pokemon.weight}</p>
            <p><strong>Types:</strong> ${pokemon.types.map(t => t.type.name).join(', ')}</p>
            <p><strong>Stats:</strong></p>
            <ul>
                ${pokemon.stats.map(stat => `<li>${stat.stat.name}: ${stat.base_stat}</li>`).join('')}
            </ul>
        `;
    }

    searchButton.addEventListener('click', searchPokemon);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchPokemon();
    });

    async function searchPokemon() {
        const searchTerm = searchInput.value.trim().toLowerCase();
        if (!searchTerm) return;

        try {
            const response = await fetch(`/api/pokemon/${searchTerm}`);
            if (!response.ok) throw new Error('Not found');
            const data = await response.json();
            displayPokemon([data]);
        } catch (err) {
            console.error('Search error:', err);
            pokemonList.innerHTML = `<p>Pokémon "${searchTerm}" not found.</p>`;
        }
    }

    prevButton.addEventListener('click', () => {
        offset = Math.max(0, offset - limit);
        fetchPokemonList();
        updatePageInfo();
    });

    nextButton.addEventListener('click', () => {
        offset += limit;
        fetchPokemonList();
        updatePageInfo();
    });

    // initial load
    fetchPokemonList();

});