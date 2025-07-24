document.addEventListener('DOMContentLoaded', function() {
    const pokemonList = document.getElementById('pokemon-list');
    const pokemonDetails = document.getElementById('pokemon-details');
    const closeDetailsBtn = document.getElementById('close-details');
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const pageInfo = document.getElementById('page-info');
    const themeToggle = document.getElementById('theme-toggle');
    
    
    let currentPage = 1;
    const itemsPerPage = 25;
    let totalPokemon = 0;
    
    // Theme management
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
    
    // Initialize the Pokedex
    fetchPokemonList();

    closeDetailsBtn.addEventListener('click', () => {
        pokemonDetails.style.display = 'none';
    });
    
    searchBtn.addEventListener('click', searchPokemon);
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            searchPokemon();
        }
    });
    
    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            fetchPokemonList();
        }
    });
    
    nextBtn.addEventListener('click', () => {
        if (currentPage * itemsPerPage < totalPokemon) {
            currentPage++;
            fetchPokemonList();
        }
    });
    
    themeToggle.addEventListener('click', toggleTheme);
    
    // Functions
    async function fetchPokemonList() {
        try {
            // Show loading skeletons
            pokemonList.innerHTML = '';
            for (let i = 0; i < itemsPerPage; i++) {
                const skeleton = document.createElement('div');
                skeleton.className = 'skeleton-card';
                pokemonList.appendChild(skeleton);
            }
            
            const offset = (currentPage - 1) * itemsPerPage;
            const response = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${itemsPerPage}&offset=${offset}`);
            const data = await response.json();
            
            totalPokemon = data.count;
            updatePagination();
            
            // Clear loading skeletons
            pokemonList.innerHTML = '';
            
            // Fetch details for each pokemon with Promise.all for better performance
            const pokemonPromises = data.results.map(pokemon => 
                fetch(pokemon.url).then(res => res.json())
            );
            
            const pokemonData = await Promise.all(pokemonPromises);
            
            // Sort pokemon by ID and display
            pokemonData.sort((a, b) => a.id - b.id).forEach(pokemon => {
                createPokemonCard(pokemon);
            });
            
        } catch (error) {
            console.error('Error fetching Pokemon list:', error);
            pokemonList.innerHTML = '<div class="error-message">Error loading Pokemon. Please try again later.</div>';
        }
    }
    
    function createPokemonCard(pokemon) {
        const card = document.createElement('div');
        card.className = 'pokemon-card';
        card.dataset.id = pokemon.id;
        
        const imageUrl = pokemon.sprites.other['official-artwork'].front_default || 
                        pokemon.sprites.front_default;
        
        card.innerHTML = `
            <img src="${imageUrl}" alt="${pokemon.name}" loading="lazy">
            <h3>${pokemon.name}</h3>
            <div class="types">
                ${pokemon.types.map(type => 
                    `<span class="type-badge type-${type.type.name}">${type.type.name}</span>`
                ).join('')}
            </div>
        `;
        
        card.addEventListener('click', () => showPokemonDetails(pokemon));
        pokemonList.appendChild(card);
    }
    
    async function showPokemonDetails(pokemon) {
        try {
            // Show loading state
            pokemonDetails.style.display = 'block';
            document.getElementById('detail-name').textContent = 'Loading...';
            document.getElementById('detail-image').src = '';
            document.getElementById('detail-types').innerHTML = '';
            
            if (!pokemon.stats) {
                const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemon.id}`);
                pokemon = await response.json();
            }
            
            // Update the details panel
            document.getElementById('detail-name').textContent = pokemon.name;
            document.getElementById('detail-id').textContent = `#${pokemon.id.toString().padStart(3, '0')}`;
            
            const imageUrl = pokemon.sprites.other['official-artwork'].front_default || 
                            pokemon.sprites.front_default;
            document.getElementById('detail-image').src = imageUrl;
            document.getElementById('detail-image').alt = pokemon.name;
            
            // Types
            const typesContainer = document.getElementById('detail-types');
            typesContainer.innerHTML = pokemon.types.map(type => 
                `<span class="type-badge type-${type.type.name}">${type.type.name}</span>`
            ).join('');
            
            // Stats
            const statsContainer = document.getElementById('detail-stats');
            statsContainer.innerHTML = pokemon.stats.map(stat => `
                <div class="stat-item">
                    <span class="stat-name">${stat.stat.name.replace('-', ' ')}</span>
                    <span class="stat-value">${stat.base_stat}</span>
                </div>
            `).join('');
            
            // Abilities
            const abilitiesContainer = document.getElementById('detail-abilities');
            abilitiesContainer.innerHTML = pokemon.abilities.map(ability => `
                <div class="ability-item">${ability.ability.name.replace('-', ' ')}</div>
            `).join('');
            
            // Moves (limit to 12 for display)
            const movesContainer = document.getElementById('detail-moves');
            const movesToShow = pokemon.moves.slice(0, 12);
            movesContainer.innerHTML = movesToShow.map(move => `
                <div class="move-item">${move.move.name.replace('-', ' ')}</div>
            `).join('');
            
            if (pokemon.moves.length > 12) {
                movesContainer.innerHTML += `<div class="move-item">+${pokemon.moves.length - 12} more</div>`;
            }
            
        } catch (error) {
            console.error('Error fetching Pokemon details:', error);
            document.getElementById('detail-name').textContent = 'Error loading details';
        }
    }
    
    async function searchPokemon() {
        const searchTerm = searchInput.value.trim().toLowerCase();
        
        if (!searchTerm) {
            fetchPokemonList();
            return;
        }
        
        try {
            pokemonList.innerHTML = '<div class="skeleton-card"></div>';
            
            // First try by ID if search term is a number
            if (!isNaN(searchTerm)) {
                const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${searchTerm}`);
                const pokemon = await response.json();
                
                // Clear the list and show only this pokemon
                pokemonList.innerHTML = '';
                createPokemonCard(pokemon);
                showPokemonDetails(pokemon);
                return;
            }
            
            // Search by name
            const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${searchTerm}`);
            const pokemon = await response.json();
            
            // Clear the list and show only this pokemon
            pokemonList.innerHTML = '';
            createPokemonCard(pokemon);
            showPokemonDetails(pokemon);
            
        } catch (error) {
            console.error('Error searching Pokemon:', error);
            pokemonList.innerHTML = '<div class="error-message">No Pokemon found with that name or ID.</div>';
        }
    }
    
    function updatePagination() {
        pageInfo.textContent = `Page ${currentPage}`;
        prevBtn.disabled = currentPage === 1;
        nextBtn.disabled = currentPage * itemsPerPage >= totalPokemon;
    }
    
    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    }
    
    function updateThemeIcon(theme) {
        const icon = themeToggle.querySelector('i');
        if (theme === 'dark') {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
        }
    }
});