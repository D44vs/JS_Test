// ================== CONFIGURACIÓN GLOBAL ==================
const API_BASE_URL = 'https://pokeapi.co/api/v2';
const POKEMON_PER_PAGE = 10;

// ================== VARIABLES DE ESTADO ==================
let currentPage = 1;
let totalPokemon = 0;
let allPokemonData = []; // 🔍 contiene información mínima de todos los Pokémon
let filteredList = null; // 🔍 almacena resultados de búsqueda/filtros
let allPokemonNames = []; // 🔍 todos los nombres para búsqueda

// ================== REFERENCIAS A ELEMENTOS DEL DOM ==================
const pokemonTableBody = document.getElementById('pokemonTableBody');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const pageInfo = document.getElementById('pageInfo');
const loading = document.getElementById('loading');
const pokemonModal = document.getElementById('pokemonModal');
const modalTitle = document.getElementById('modalTitle');
const modalContent = document.getElementById('modalContent');
const closeModal = document.getElementById('closeModal');

// 🔍 Elementos de búsqueda y filtros
const searchInput = document.getElementById('searchInput');
const typeButtons = document.querySelectorAll('[data-type]');
const generationSelect = document.getElementById('generationSelect');
const resetFiltersBtn = document.getElementById('resetFilters');
const sortSelect = document.querySelector('select[aria-label="Ordenar por"]') || document.querySelectorAll('select')[2]; // selector del dropdown de ordenar

// ================== INICIALIZACIÓN ==================
document.addEventListener('DOMContentLoaded', async () => {
    await loadAllPokemonNames(); // cargar nombres completos
    await loadAllPokemonData();  // cargar información mínima de todos los Pokémon
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

// ================== CARGAR DATOS MÍNIMOS DE TODOS LOS POKÉMON ==================
async function loadAllPokemonData() {
    try {
        showLoading(true);
        const response = await fetch(`${API_BASE_URL}/pokemon?limit=151`); // puedes cambiar 151 por 898 si quieres todos
        const data = await response.json();

        const promises = data.results.map(async p => {
            const res = await fetch(p.url);
            const poke = await res.json();
            return {
                id: poke.id,
                name: poke.name,
                types: poke.types,
                hp: poke.stats.find(s => s.stat.name === 'hp').base_stat,
                attack: poke.stats.find(s => s.stat.name === 'attack').base_stat,
                defense: poke.stats.find(s => s.stat.name === 'defense').base_stat,
                sprite: poke.sprites.front_default,
                url: p.url
            };
        });

        allPokemonData = await Promise.all(promises);
        totalPokemon = allPokemonData.length;

    } catch (err) {
        console.error("Error cargando datos de Pokémon:", err);
    } finally {
        showLoading(false);
    }
}

// ================== LISTA PRINCIPAL ==================
function loadPokemonList() {
    showLoading(true);

    let listToDisplay = filteredList || allPokemonData;
    totalPokemon = listToDisplay.length;

    // ================== ORDENAMIENTO ==================
    const sortValue = sortSelect?.value || '';
    if (sortValue === 'HP') listToDisplay.sort((a, b) => b.hp - a.hp);
    if (sortValue === 'Ataque') listToDisplay.sort((a, b) => b.attack - a.attack);
    if (sortValue === 'Defensa') listToDisplay.sort((a, b) => b.defense - a.defense);

    // ================== PAGINACIÓN ==================
    const start = (currentPage - 1) * POKEMON_PER_PAGE;
    const paginated = listToDisplay.slice(start, start + POKEMON_PER_PAGE);

    pokemonTableBody.innerHTML = '';
    paginated.forEach(p => {
        const row = createPokemonRow(p);
        pokemonTableBody.appendChild(row);
    });

    updatePaginationControls();
    showLoading(false);
}

// ================== CREAR FILA ==================
function createPokemonRow(p) {
    const row = document.createElement('tr');
    row.className = 'border-b hover:bg-gradient-to-r from-pink-700 to-purple-600';
    row.innerHTML = `
        <td class="px-6 py-4 font-medium">#${p.id}</td>
        <td class="px-6 py-4">
            <img src="${p.sprite}" alt="${p.name}" class="w-16 h-16 object-contain">
        </td>
        <td class="px-6 py-4 font-medium capitalize">${p.name}</td>
        <td class="px-6 py-4 font-bold capitalize">
            ${createTypesBadges(p.types)}
        </td>
        <td class="px-6 py-4">
            <button onclick="showPokemonDetails(${p.id})" 
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
        return `<span class="inline-block px-2 py-1 text-xs rounded-full ${textColorClass} mr-1 ${colorClass}">${typeName}</span>`;
    }).join('');
}

function isDarkBackground(bgClass) {
    const darkBgClasses = ['bg-red-700','bg-purple-700','bg-indigo-700','bg-gray-800','bg-yellow-800','bg-purple-500'];
    return darkBgClasses.includes(bgClass);
}

function getTypeColor(type) {
    const colors = {
        normal: 'bg-gray-400', fire: 'bg-red-500', water: 'bg-blue-500', electric: 'bg-yellow-500',
        grass: 'bg-green-500', ice: 'bg-blue-300', fighting: 'bg-red-700', poison: 'bg-purple-500',
        ground: 'bg-yellow-600', flying: 'bg-indigo-400', psychic: 'bg-pink-500', bug: 'bg-green-400',
        rock: 'bg-yellow-800', ghost: 'bg-purple-700', dragon: 'bg-indigo-700', dark: 'bg-gray-800',
        steel: 'bg-gray-500', fairy: 'bg-pink-300'
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
    // Paginación
    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            loadPokemonList();
        }
    });
    nextBtn.addEventListener('click', () => {
        const totalPages = Math.ceil((filteredList || allPokemonData).length / POKEMON_PER_PAGE);
        if (currentPage < totalPages) {
            currentPage++;
            loadPokemonList();
        }
    });

    // Modal
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

    // Búsqueda
    searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase().trim();
        currentPage = 1;
        if (!query) {
            filteredList = null;
        } else {
            filteredList = allPokemonData.filter(p => p.name.includes(query));
        }
        loadPokemonList();
    });

    // Filtros por tipo
    typeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.getAttribute('data-type');
            filteredList = allPokemonData.filter(p => p.types.some(t => t.type.name === type));
            currentPage = 1;
            loadPokemonList();
        });
    });

    // Filtro por generación
    generationSelect.addEventListener('change', async () => {
        const gen = generationSelect.value;
        if (!gen) return;
        showLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/generation/${gen}`);
            const data = await response.json();
            const genNames = data.pokemon_species.map(p => p.name);
            filteredList = allPokemonData.filter(p => genNames.includes(p.name));
            currentPage = 1;
            loadPokemonList();
        } catch (err) {
            console.error("Error filtrando por generación:", err);
        } finally {
            showLoading(false);
        }
    });

    // Reset filtros
    resetFiltersBtn.addEventListener('click', () => {
        searchInput.value = '';
        generationSelect.value = '';
        filteredList = null;
        currentPage = 1;
        loadPokemonList();
    });

    // Ordenamiento
    sortSelect.addEventListener('change', () => {
        currentPage = 1;
        loadPokemonList();
    });
}

// ================== PAGINACIÓN ==================
function updatePaginationControls() {
    const totalPages = Math.ceil((filteredList || allPokemonData).length / POKEMON_PER_PAGE);
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
