// ================== CONFIGURACIÓN GLOBAL ==================
const API_BASE_URL = 'https://pokeapi.co/api/v2';
const POKEMON_PER_PAGE = 10;

// Variables de estado
let currentPage = 1;
let totalPokemon = 0;
let pokemonList = [];
let filteredList = null; // 🔍 almacena resultados de búsqueda/filtros
let allPokemonNames = []; // 🔍 todos los Pokémon disponibles

// Referencias a elementos del DOM
const pokemonTableBody = document.getElementById('pokemonTableBody');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const pageInfo = document.getElementById('pageInfo');
const loading = document.getElementById('loading');
const pokemonModal = document.getElementById('pokemonModal');
const modalTitle = document.getElementById('modalTitle');
const modalContent = document.getElementById('modalContent');
const closeModal = document.getElementById('closeModal');

// 🔍 nuevos elementos
const searchInput = document.getElementById('searchInput');
const typeButtons = document.querySelectorAll('[data-type]');
const generationSelect = document.getElementById('generationSelect');
const resetFiltersBtn = document.getElementById('resetFilters');
const sortSelect = document.getElementById('sortSelect'); // para ordenar

// ================== INICIALIZACIÓN ==================
document.addEventListener('DOMContentLoaded', function () {
    loadAllPokemonNames(); // cargar nombres completos
    loadPokemonList();
    setupEventListeners();
});

// ================== CARGAR TODOS LOS NOMBRES ==================
async function loadAllPokemonNames() {
    try {
        const response = await fetch(`${API_BASE_URL}/pokemon?limit=2000`);
        const data = await response.json();
        allPokemonNames = data.results; // { name, url }
    } catch (err) {
        console.error("Error cargando todos los nombres de Pokémon:", err);
    }
}

// ================== LISTA PRINCIPAL ==================
async function loadPokemonList() {
    try {
        showLoading(true);

        let listToFetch;
        if (filteredList) {
            totalPokemon = filteredList.length;
            const start = (currentPage - 1) * POKEMON_PER_PAGE;
            listToFetch = filteredList.slice(start, start + POKEMON_PER_PAGE);
        } else {
            const offset = (currentPage - 1) * POKEMON_PER_PAGE;
            const response = await fetch(`${API_BASE_URL}/pokemon?limit=${POKEMON_PER_PAGE}&offset=${offset}`);
            const data = await response.json();
            totalPokemon = data.count;
            listToFetch = data.results;
            pokemonList = [];
            // Cargar detalles de cada Pokémon para poder ordenar
            for (let p of listToFetch) {
                const details = await fetchPokemonDetails(p.url);
                if (details) pokemonList.push(details);
            }
            listToFetch = pokemonList;
        }

        pokemonTableBody.innerHTML = '';
        for (let i = 0; i < listToFetch.length; i++) {
            const row = createPokemonRow(listToFetch[i]);
            pokemonTableBody.appendChild(row);
        }

        updatePaginationControls();

    } catch (error) {
        console.error('Error al cargar la lista de Pokémon:', error);
        showError('Error al cargar los datos. Por favor, intenta de nuevo.');
    } finally {
        showLoading(false);
    }
}

// ================== DETALLES DE CADA POKÉMON ==================
async function fetchPokemonDetails(url) {
    try {
        const response = await fetch(url);
        return await response.json();
    } catch (error) {
        console.error('Error al obtener detalles del Pokémon:', error);
        return null;
    }
}

function createPokemonRow(pokemon) {
    const row = document.createElement('tr');
    row.className = 'border-b hover:bg-gradient-to-r from-pink-700 to-purple-600';

    row.innerHTML = `
        <td class="px-6 py-4 font-medium">#${pokemon.id}</td>
        <td class="px-6 py-4">
            <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}" class="w-16 h-16 object-contain">
        </td>
        <td class="px-6 py-4 font-medium capitalize">${pokemon.name}</td>
        <td class="px-6 py-4 font-bold capitalize">
            ${createTypesBadges(pokemon.types)}
        </td>
        <td class="px-6 py-4">
            <button onclick="showPokemonDetails(${pokemon.id})" 
                    class="bg-mystic text-light font-bold px-3 py-1 rounded bg-pink-600 hover:bg-purple-900 transition">
                Ver Detalle
            </button>
        </td>
    `;
    return row;
}

// ================== BADGES DE TIPOS ==================
function createTypesBadges(types) {
    return types.map(typeInfo => {
        const typeName = typeInfo.type.name;
        const colorClass = getTypeColor(typeName);
        const textColorClass = isDarkBackground(colorClass) ? 'text-white' : 'text-black';

        return `<span class="inline-block px-2 py-1 text-xs rounded-full ${textColorClass} mr-1 ${colorClass}">
                    ${typeName}
                </span>`;
    }).join('');
}

// función para decidir si el bg es oscuro
function isDarkBackground(bgClass) {
    const darkBgClasses = [
        'bg-red-700', 'bg-purple-700', 'bg-indigo-700',
        'bg-gray-800', 'bg-yellow-800', 'bg-purple-500'
    ];
    return darkBgClasses.includes(bgClass);
}

function getTypeColor(type) {
    const colors = {
        normal: 'bg-gray-400',
        fire: 'bg-red-500',
        water: 'bg-blue-500',
        electric: 'bg-yellow-500',
        grass: 'bg-green-500',
        ice: 'bg-blue-300',
        fighting: 'bg-red-700',
        poison: 'bg-purple-500',
        ground: 'bg-yellow-600',
        flying: 'bg-indigo-400',
        psychic: 'bg-pink-500',
        bug: 'bg-green-400',
        rock: 'bg-yellow-800',
        ghost: 'bg-purple-700',
        dragon: 'bg-indigo-700',
        dark: 'bg-gray-800',
        steel: 'bg-gray-500',
        fairy: 'bg-pink-300'
    };
    return colors[type] || 'bg-gray-400';
}

// ================== MODAL ==================
async function showPokemonDetails(pokemonId) {
    try {
        showLoading(true);
        const response = await fetch(`${API_BASE_URL}/pokemon/${pokemonId}`);
        const pokemon = await response.json();

        modalTitle.textContent = `#${pokemon.id} ${pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}`;
        modalContent.innerHTML = `
            <div class="text-center mb-4">
                <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}" class="w-32 h-32 mx-auto">
            </div>
            <div class="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <h3 class="font-semibold text-light">Altura:</h3>
                    <p>${pokemon.height / 10} m</p>
                </div>
                <div>
                    <h3 class="font-semibold text-light">Peso:</h3>
                    <p>${pokemon.weight / 10} kg</p>
                </div>
            </div>
            <div class="mb-4">
                <h3 class="font-semibold text-light mb-2">Tipos:</h3>
                ${createTypesBadges(pokemon.types)}
            </div>
            <div class="mb-4">
                <h3 class="font-semibold text-light mb-2">Habilidades:</h3>
                <ul class="list-disc list-inside">
                    ${pokemon.abilities.map(a => `<li class="capitalize">${a.ability.name.replace('-', ' ')}</li>`).join('')}
                </ul>
            </div>
            <div>
                <h3 class="font-semibold text-light mb-2">Estadísticas Base:</h3>
                ${createStatsDisplay(pokemon.stats)}
            </div>
        `;

        pokemonModal.classList.remove('hidden');
        pokemonModal.classList.add('flex');

    } catch (error) {
        console.error('Error al cargar detalles del Pokémon:', error);
        showError('Error al cargar los detalles del Pokémon.');
    } finally {
        showLoading(false);
    }
}

function createStatsDisplay(stats) {
    return stats.map(stat => {
        const statName = stat.stat.name.replace('-', ' ');
        const statValue = stat.base_stat;
        const percentage = Math.min((statValue / 200) * 100, 100);

        return `
            <div class="mb-2">
                <div class="flex justify-between text-sm">
                    <span class="capitalize">${statName}</span>
                    <span>${statValue}</span>
                </div>
                <div class="w-full bg-pink-200 rounded-full h-2">
                    <div class="bg-purple-600 h-2 rounded-full" style="width: ${percentage}%"></div>
                </div>
            </div>
        `;
    }).join('');
}

// ================== EVENTOS ==================
function setupEventListeners() {
    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            loadPokemonList();
        }
    });

    nextBtn.addEventListener('click', () => {
        const totalPages = Math.ceil(totalPokemon / POKEMON_PER_PAGE);
        if (currentPage < totalPages) {
            currentPage++;
            loadPokemonList();
        }
    });

    closeModal.addEventListener('click', () => {
        pokemonModal.classList.add('hidden');
        pokemonModal.classList.remove('flex');
    });

    pokemonModal.addEventListener('click', (e) => {
        if (e.target === pokemonModal) {
            pokemonModal.classList.add('hidden');
            pokemonModal.classList.remove('flex');
        }
    });

    // 🔍 buscador global
    searchInput.addEventListener('input', async () => {
        const query = searchInput.value.toLowerCase().trim();
        currentPage = 1; // reiniciar página al buscar

        if (!query) {
            filteredList = null;
            loadPokemonList();
            return;
        }

        const matched = allPokemonNames.filter(p => p.name.includes(query));

        // obtener detalles de cada Pokémon para permitir ordenamiento
        filteredList = [];
        for (let p of matched) {
            const details = await fetchPokemonDetails(p.url);
            if (details) filteredList.push(details);
        }

        await loadPokemonList();
    });

    // 🎛️ filtros por tipo
    typeButtons.forEach(btn => {
        btn.addEventListener('click', async () => {
            const type = btn.getAttribute('data-type');
            showLoading(true);
            try {
                const response = await fetch(`${API_BASE_URL}/type/${type}`);
                const data = await response.json();

                filteredList = [];
                for (let p of data.pokemon) {
                    const details = await fetchPokemonDetails(p.pokemon.url);
                    if (details) filteredList.push(details);
                }
                currentPage = 1;
                await loadPokemonList();
            } catch (err) {
                console.error("Error filtrando por tipo:", err);
            } finally {
                showLoading(false);
            }
        });
    });

    // 📂 filtros por generación
    generationSelect.addEventListener('change', async () => {
        const gen = generationSelect.value;
        if (!gen) return;
        showLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/generation/${gen}`);
            const data = await response.json();

            filteredList = [];
            for (let p of data.pokemon_species) {
                const details = await fetchPokemonDetails(`${API_BASE_URL}/pokemon/${p.name}`);
                if (details) filteredList.push(details);
            }
            currentPage = 1;
            await loadPokemonList();
        } catch (err) {
            console.error("Error filtrando por generación:", err);
        } finally {
            showLoading(false);
        }
    });

    // 🔄 reset filtros
    resetFiltersBtn.addEventListener('click', () => {
        searchInput.value = '';
        generationSelect.value = '';
        sortSelect.value = 'hp';
        filteredList = null;
        currentPage = 1;
        loadPokemonList();
    });

    // 🔢 ordenar
    sortSelect.addEventListener('change', () => {
        const criteria = sortSelect.value; // "hp", "attack" o "defense"
        const listToSort = filteredList || pokemonList;

        listToSort.sort((a, b) => {
            const aValue = getStat(a, criteria);
            const bValue = getStat(b, criteria);
            return bValue - aValue; // descendente
        });

        loadPokemonList();
    });
}

// función auxiliar para obtener stat de cada Pokémon
function getStat(pokemon, statName) {
    if (!pokemon.stats) return 0;
    switch (statName) {
        case 'hp': return pokemon.stats.find(s => s.stat.name === 'hp')?.base_stat || 0;
        case 'attack': return pokemon.stats.find(s => s.stat.name === 'attack')?.base_stat || 0;
        case 'defense': return pokemon.stats.find(s => s.stat.name === 'defense')?.base_stat || 0;
        default: return 0;
    }
}

// ================== PAGINACIÓN ==================
function updatePaginationControls() {
    const totalPages = Math.ceil(totalPokemon / POKEMON_PER_PAGE);
    pageInfo.textContent = `Página ${currentPage} de ${totalPages}`;

    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages;

    prevBtn.classList.toggle('opacity-50', prevBtn.disabled);
    nextBtn.classList.toggle('opacity-50', nextBtn.disabled);
    prevBtn.classList.toggle('cursor-not-allowed', prevBtn.disabled);
    nextBtn.classList.toggle('cursor-not-allowed', nextBtn.disabled);
}

// ================== UTILIDADES ==================
function showLoading(show) {
    loading.classList.toggle('hidden', !show);
}

function showError(message) {
    alert(message);
}
