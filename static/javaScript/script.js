let Connected = false;
let currentUser = null;
const watchlistKeys = new Set();

const compte = document.getElementById("compte");
const compteMobile = document.getElementById("compteMobile");

const categories = [
    { id: 'trending', title: 'Tendances du moment', endpoint: 'trending/all/day', type: 'mixed' },
    { id: 'popular_movies', title: 'Films populaires', endpoint: 'movie/popular', type: 'movie' },
    { id: 'popular_tv', title: 'Series populaires', endpoint: 'tv/popular', type: 'tv' },
    { id: 'top_rated', title: 'Les mieux notes', endpoint: 'movie/top_rated', type: 'movie' },
    { id: 'action', title: 'Action', endpoint: 'discover/movie', query: 'with_genres=28', type: 'movie' },
    { id: 'comedy', title: 'Comedie', endpoint: 'discover/movie', query: 'with_genres=35', type: 'movie' }
];

function getPathname(path) {
    return (path || '/').split('?')[0];
}

function normalizeMediaType(type) {
    return type === 'tv' ? 'tv' : 'movie';
}

function getWatchlistKey(mediaType, mediaId) {
    return `${normalizeMediaType(mediaType)}:${Number(mediaId)}`;
}

function isInWatchlist(mediaType, mediaId) {
    return watchlistKeys.has(getWatchlistKey(mediaType, mediaId));
}

function escapeHtml(value = '') {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function debounce(fn, delay = 350) {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    };
}

async function fetchJson(url, options = {}) {
    const response = await fetch(url, {
        credentials: 'same-origin',
        ...options
    });

    let data = null;
    try {
        data = await response.json();
    } catch (error) {
        data = null;
    }

    if (!response.ok) {
        const message = data && data.message ? data.message : `Erreur HTTP ${response.status}`;
        throw new Error(message);
    }

    return data;
}

function setWatchlistButtonState(button, inList) {
    if (!button) return;

    const activeClasses = ['bg-green-600', 'hover:bg-green-700', 'border-green-300', 'focus:ring-green-300'];
    const idleClasses = ['bg-zinc-900/85', 'hover:bg-zinc-800', 'border-zinc-200/70', 'focus:ring-zinc-200'];

    button.dataset.inList = inList ? 'true' : 'false';
    button.innerHTML = `<span aria-hidden="true" class="pointer-events-none text-2xl font-bold leading-none">${inList ? '&minus;' : '+'}</span>`;
    button.setAttribute('aria-label', inList ? 'Retirer de ma liste' : 'Ajouter a ma liste');

    if (inList) {
        button.classList.remove(...idleClasses);
        button.classList.add(...activeClasses);
    } else {
        button.classList.remove(...activeClasses);
        button.classList.add(...idleClasses);
    }
}

function updateWatchlistButtonsState() {
    const buttons = document.querySelectorAll('[data-watchlist-toggle="true"]');
    buttons.forEach(button => {
        const mediaType = button.dataset.mediaType;
        const mediaId = Number.parseInt(button.dataset.mediaId, 10);
        if (!mediaType || Number.isNaN(mediaId)) {
            return;
        }

        setWatchlistButtonState(button, isInWatchlist(mediaType, mediaId));
    });
}

function renderAccountState() {
    if (!compte || !compteMobile) return;

    if (Connected) {
        const pseudo = escapeHtml(currentUser && currentUser.pseudo ? currentUser.pseudo : 'Profil');

        compte.innerHTML = `
        <div class="hidden md:flex items-center gap-4 relative">
            <button id="profileMenuBtn" class="flex items-center gap-2 text-gray-300 hover:text-white transition focus:outline-none" onclick="toggleProfileMenu()">
                <span class="font-medium text-sm">${pseudo}</span>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
            </button>

            <div id="profileDropdown" class="hidden absolute right-0 top-10 mt-2 w-52 bg-gray-800 rounded-md shadow-lg py-1 z-50 border border-gray-700">
                <a href="/profil" class="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition">Mon compte</a>
                <a href="/list" class="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition">Ma liste</a>
                <hr class="border-gray-700 my-1">
                <button id="logoutBtnDesktop" class="w-full text-left block px-4 py-2 text-sm text-red-500 hover:bg-gray-700 hover:text-red-400 transition">Deconnexion</button>
            </div>
        </div>

        <button class="md:hidden text-white" onclick="toggleMenu()">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
            </svg>
        </button>
        `;

        compteMobile.innerHTML = `
        <a href="/profil" class="block hover:text-gray-300 transition">Mon compte</a>
        <a href="/list" class="block hover:text-gray-300 transition">Ma liste</a>
        <button id="logoutBtnMobile" class="w-full bg-red-600 hover:bg-red-700 py-2 rounded transition">Deconnexion</button>
        `;

        const logoutDesktop = document.getElementById('logoutBtnDesktop');
        if (logoutDesktop) {
            logoutDesktop.addEventListener('click', handleLogout);
        }

        const logoutMobile = document.getElementById('logoutBtnMobile');
        if (logoutMobile) {
            logoutMobile.addEventListener('click', handleLogout);
        }

        return;
    }

    compte.innerHTML = `
    <div class="hidden md:flex items-center gap-4">
        <a href="/login" class="text-white hover:text-gray-300 font-medium transition cursor-pointer">Connexion</a>
        <a href="/register" class="bg-red-600 hover:bg-red-700 text-white font-medium py-1.5 px-4 rounded transition cursor-pointer">Inscription</a>
    </div>

    <button class="md:hidden text-white ml-4" onclick="toggleMenu()">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
        </svg>
    </button>
    `;

    compteMobile.innerHTML = `
    <a href="/login" class="text-white hover:text-gray-300 font-medium transition cursor-pointer">Connexion</a>
    <a href="/register" class="bg-red-600 hover:bg-red-700 text-white font-medium py-1.5 px-4 rounded transition cursor-pointer">Inscription</a>
    `;
}

async function refreshSessionState() {
    try {
        const sessionData = await fetchJson('/api/session');
        Connected = Boolean(sessionData && sessionData.authenticated);
        currentUser = Connected ? sessionData.user : null;
    } catch (error) {
        Connected = false;
        currentUser = null;
    }

    if (Connected) {
        await loadWatchlist();
    } else {
        watchlistKeys.clear();
    }

    renderAccountState();
    updateWatchlistButtonsState();
}

async function handleLogout(event) {
    if (event) {
        event.preventDefault();
    }

    try {
        await fetchJson('/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        console.error('Erreur de deconnexion:', error.message);
    }

    await refreshSessionState();

    if (window.location.pathname === '/list' || window.location.pathname === '/profil') {
        window.history.pushState(null, '', '/');
        await navigate('/');
    }
}

function toggleMenu() {
    const menu = document.getElementById('mobileMenu');
    if (menu) {
        menu.classList.toggle('hidden');
    }
}

function toggleProfileMenu() {
    const dropdown = document.getElementById('profileDropdown');
    if (dropdown) {
        dropdown.classList.toggle('hidden');
    }
}

window.onclick = function (event) {
    if (!event.target.closest('#profileMenuBtn') && !event.target.closest('#profileDropdown')) {
        const dropdown = document.getElementById('profileDropdown');
        if (dropdown && !dropdown.classList.contains('hidden')) {
            dropdown.classList.add('hidden');
        }
    }
};

function getSearchInputs() {
    return [
        document.getElementById('searchInputDesktop'),
        document.getElementById('searchInputMobile')
    ].filter(Boolean);
}

function syncSearchInputs(value) {
    getSearchInputs().forEach(input => {
        if (input.value !== value) {
            input.value = value;
        }
    });
}

function updateSearchQueryInUrl(query) {
    const url = new URL(window.location.href);
    if (query) {
        url.searchParams.set('q', query);
    } else {
        url.searchParams.delete('q');
    }

    window.history.replaceState(null, '', `${url.pathname}${url.search}`);
}

async function fetchTMDB(endpoint, query = '') {
    try {
        const queryPart = query ? `&${query}` : '';
        const response = await fetch(`/api/tmdb/${endpoint}?language=fr-FR${queryPart}`);
        return await response.json();
    } catch (error) {
        console.error('Erreur fetch TMDB:', error);
        return null;
    }
}

async function loadWatchlist() {
    watchlistKeys.clear();

    if (!Connected) {
        return [];
    }

    try {
        const listData = await fetchJson('/api/list');
        const items = Array.isArray(listData.items) ? listData.items : [];

        items.forEach(item => {
            watchlistKeys.add(getWatchlistKey(item.media_type, item.media_id));
        });

        return items;
    } catch (error) {
        console.error('Erreur chargement liste:', error.message);
        return [];
    }
}

async function loadRecentlyWatched(limit = 24) {
    if (!Connected) {
        return [];
    }

    try {
        const data = await fetchJson(`/api/history?limit=${encodeURIComponent(limit)}`);
        return Array.isArray(data.items) ? data.items : [];
    } catch (error) {
        console.error('Erreur chargement recemment regardes:', error.message);
        return [];
    }
}

function buildWatchlistButton(mediaType, mediaId, title, posterPath, releaseDate) {
    const normalizedType = mediaType === 'tv' ? 'tv' : (mediaType === 'movie' ? 'movie' : null);
    if (!normalizedType || Number.isNaN(Number(mediaId))) {
        return '';
    }

    const inList = isInWatchlist(normalizedType, mediaId);
    const baseClass = 'absolute top-2 right-2 z-40 h-9 w-9 rounded-full text-white flex items-center justify-center border shadow-md backdrop-blur-sm transition pointer-events-auto focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black';
    const stateClass = inList
        ? 'bg-green-600 hover:bg-green-700 border-green-300 focus:ring-green-300'
        : 'bg-zinc-900/85 hover:bg-zinc-800 border-zinc-200/70 focus:ring-zinc-200';

    return `
        <button
            type="button"
            data-watchlist-toggle="true"
            data-media-type="${escapeHtml(normalizedType)}"
            data-media-id="${escapeHtml(mediaId)}"
            data-title="${escapeHtml(title || 'Sans titre')}"
            data-poster-path="${escapeHtml(posterPath || '')}"
            data-release-date="${escapeHtml(releaseDate || '')}"
            class="${baseClass} ${stateClass}"
            aria-label="${inList ? 'Retirer de ma liste' : 'Ajouter a ma liste'}"
        ><span aria-hidden="true" class="pointer-events-none text-2xl font-bold leading-none">${inList ? '&minus;' : '+'}</span></button>
    `;
}

function buildUserCollectionCards(items = []) {
    return items.map(item => {
        const itemType = normalizeMediaType(item.media_type);
        const mediaId = item.media_id;
        const title = escapeHtml(item.title || 'Sans titre');
        const poster = item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : 'https://via.placeholder.com/400x600';
        const yearRaw = item.release_date || '';
        const year = yearRaw ? yearRaw.split('-')[0] : 'N/A';
        const typeLabel = itemType === 'movie' ? 'Film' : 'Serie';
        const watchlistButton = buildWatchlistButton(itemType, mediaId, item.title || 'Sans titre', item.poster_path || '', yearRaw);

        return `
            <a href="/content/${itemType}/${mediaId}" class="group bg-gray-900 rounded-md overflow-hidden hover:ring-2 hover:ring-red-600 transition block relative">
                ${watchlistButton}
                <div class="aspect-2/3 w-full overflow-hidden">
                    <img src="${poster}" alt="${title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
                </div>
                <div class="p-3">
                    <h3 class="text-white font-semibold line-clamp-2">${title}</h3>
                    <p class="text-xs text-gray-400 mt-1">${typeLabel} • ${year}</p>
                </div>
            </a>
        `;
    }).join('');
}

function renderUserCollectionSection(container, title, items, emptyMessage) {
    const cards = buildUserCollectionCards(items);
    const content = cards || `<p class="text-gray-400">${escapeHtml(emptyMessage)}</p>`;

    container.insertAdjacentHTML('beforeend', `
        <section>
            <h2 class="text-lg md:text-2xl font-bold text-gray-100 mb-3 md:mb-5 px-1 tracking-wide">${escapeHtml(title)}</h2>
            ${cards
                ? `<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">${content}</div>`
                : content
            }
        </section>
    `);
}

async function toggleWatchlistFromButton(button) {
    if (!Connected) {
        window.history.pushState(null, '', '/login');
        await navigate('/login');
        return;
    }

    const mediaType = button.dataset.mediaType;
    const mediaId = Number.parseInt(button.dataset.mediaId, 10);

    if (!mediaType || Number.isNaN(mediaId)) {
        return;
    }

    const inList = isInWatchlist(mediaType, mediaId);
    const payload = {
        mediaType,
        mediaId,
        title: button.dataset.title || 'Sans titre',
        posterPath: button.dataset.posterPath || null,
        releaseDate: button.dataset.releaseDate || null
    };

    button.disabled = true;

    try {
        if (inList) {
            await fetchJson(`/api/list/${encodeURIComponent(mediaType)}/${encodeURIComponent(mediaId)}`, {
                method: 'DELETE'
            });
            watchlistKeys.delete(getWatchlistKey(mediaType, mediaId));
        } else {
            await fetchJson('/api/list', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            watchlistKeys.add(getWatchlistKey(mediaType, mediaId));
        }

        updateWatchlistButtonsState();

        if (window.location.pathname === '/list') {
            await initListPage();
        } else if (window.location.pathname === '/profil') {
            await initProfilePage();
        } else if (window.location.pathname === '/' && !new URLSearchParams(window.location.search).get('q')) {
            await initHome();
        }
    } catch (error) {
        if (error.message.toLowerCase().includes('session')) {
            await refreshSessionState();
        }
        console.error('Erreur liste:', error.message);
    } finally {
        button.disabled = false;
    }
}

function setHomeSearchMode(isSearchActive) {
    const heroBanner = document.getElementById('hero-banner');
    const container = document.getElementById('carousels-container');

    if (!container) return;

    if (isSearchActive) {
        if (heroBanner) {
            heroBanner.style.display = 'none';
            heroBanner.classList.add('hidden');
        }
        container.classList.remove('-mt-12', 'md:-mt-24', 'pt-6');
        container.classList.add('mt-0', 'md:mt-0', 'pt-0');
        window.scrollTo({ top: 0, behavior: 'auto' });
        return;
    }

    if (heroBanner) {
        heroBanner.style.display = '';
        heroBanner.classList.remove('hidden');
    }
    container.classList.remove('mt-0', 'md:mt-0', 'pt-0', 'pt-6');
    container.classList.add('-mt-12', 'md:-mt-24');
}

async function initHome() {
    const container = document.getElementById('carousels-container');
    if (!container) return;
    setHomeSearchMode(false);

    const trendingData = await fetchTMDB('trending/all/day');
    if (trendingData && trendingData.results && trendingData.results.length > 0) {
        const heroItem = trendingData.results[Math.floor(Math.random() * Math.min(10, trendingData.results.length))];
        setupHeroBanner(heroItem);
    }

    container.innerHTML = '';

    if (Connected) {
        const [recentlyWatched, watchlistItems] = await Promise.all([
            loadRecentlyWatched(12),
            loadWatchlist()
        ]);

        renderUserCollectionSection(
            container,
            'Recemment regardes',
            recentlyWatched,
            'Aucun contenu regarde recemment.'
        );

        renderUserCollectionSection(
            container,
            'Ma liste',
            watchlistItems,
            'Votre liste est vide pour le moment.'
        );
    }

    for (const cat of categories) {
        const data = await fetchTMDB(cat.endpoint, cat.query);
        if (data && data.results) {
            renderCarousel(container, cat, data.results);
        }
    }

    updateWatchlistButtonsState();
}

function setupHeroBanner(item) {
    const heroImage = document.getElementById('hero-image');
    const heroTitle = document.getElementById('hero-title');
    const heroOverview = document.getElementById('hero-overview');
    const playBtn = document.getElementById('hero-play-btn');
    const infoBtn = document.getElementById('hero-info-btn');

    if (!heroImage || !heroTitle || !heroOverview || !playBtn || !infoBtn) {
        return;
    }

    const backdrop = item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : 'https://via.placeholder.com/2000x1000';
    const title = item.title || item.name || item.original_title;
    const overview = item.overview || 'Aucune description disponible pour ce contenu.';
    const type = item.media_type || 'movie';

    heroImage.src = backdrop;
    heroTitle.innerText = title;
    heroOverview.innerText = overview;

    playBtn.onclick = () => {
        window.location.href = `/content/${type}/${item.id}`;
    };
    infoBtn.onclick = () => {
        window.location.href = `/content/${type}/${item.id}`;
    };
}

function renderCarousel(container, cat, items) {
    const carouselHTML = `
        <section>
            <h2 class="text-lg md:text-2xl font-bold text-gray-100 mb-3 md:mb-5 px-1 tracking-wide">${cat.title}</h2>
            <div class="relative group/carousel">
                <button onclick="document.getElementById('carousel-${cat.id}').scrollBy({left: -window.innerWidth / 1.5, behavior: 'smooth'})" class="absolute left-0 top-2 bottom-4 z-40 bg-black/50 hover:bg-black/80 text-white w-10 items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity hidden md:flex rounded-l-md cursor-pointer backdrop-blur-sm">
                    <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
                </button>

                <div id="carousel-${cat.id}" class="flex gap-3 md:gap-4 overflow-x-auto pb-4 pt-2 scroll-smooth snap-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    ${items.map(item => {
                        const itemType = item.media_type || cat.type;
                        if (itemType !== 'movie' && itemType !== 'tv') {
                            return '';
                        }

                        const poster = item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : 'https://via.placeholder.com/400x600';
                        const title = escapeHtml(item.title || item.name || 'Sans titre');
                        const releaseDate = item.release_date || item.first_air_date || '';
                        const year = releaseDate ? releaseDate.split('-')[0] : '';
                        const rating = item.vote_average ? item.vote_average.toFixed(1) : '?';
                        const watchlistButton = buildWatchlistButton(itemType, item.id, item.title || item.name || 'Sans titre', item.poster_path || '', releaseDate);

                        return `
                        <a href="/content/${itemType}/${item.id}" class="flex-none w-32 md:w-48 aspect-2/3 bg-gray-800 rounded-md overflow-hidden relative group cursor-pointer snap-start transition duration-300 hover:scale-105 hover:z-20 hover:ring-2 hover:ring-gray-400 block">
                            ${watchlistButton}
                            <img src="${poster}" alt="${title}" class="w-full h-full object-cover">
                            <div class="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-2 text-center pointer-events-none">
                                <h3 class="text-white font-bold text-sm mb-2 line-clamp-2">${title}</h3>
                                <p class="text-gray-300 text-xs mb-1">${year}</p>
                                <p class="text-green-400 text-sm font-bold flex items-center gap-1">
                                    <svg class="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                                    ${rating}
                                </p>
                            </div>
                        </a>
                        `;
                    }).join('')}
                </div>

                <button onclick="document.getElementById('carousel-${cat.id}').scrollBy({left: window.innerWidth / 1.5, behavior: 'smooth'})" class="absolute right-0 top-2 bottom-4 z-40 bg-black/50 hover:bg-black/80 text-white w-10 items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity hidden md:flex rounded-r-md cursor-pointer backdrop-blur-sm">
                    <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                </button>
            </div>
        </section>
    `;

    container.insertAdjacentHTML('beforeend', carouselHTML);
}

function renderSearchResults(container, query, results) {
    const contentResults = results.filter(item => item && (item.media_type === 'movie' || item.media_type === 'tv'));

    if (!contentResults.length) {
        container.innerHTML = `
            <section class="pt-0">
                <h2 class="text-xl md:text-3xl font-bold text-gray-100 mb-4">Recherche: ${escapeHtml(query)}</h2>
                <p class="text-gray-400">Aucun film ou serie trouve.</p>
            </section>
        `;
        return;
    }

    const cards = contentResults.slice(0, 40).map(item => {
        const poster = item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : 'https://via.placeholder.com/400x600';
        const title = escapeHtml(item.title || item.name || 'Sans titre');
        const yearRaw = item.release_date || item.first_air_date || '';
        const year = yearRaw ? yearRaw.split('-')[0] : 'N/A';
        const typeLabel = item.media_type === 'movie' ? 'Film' : 'Serie';
        const watchlistButton = buildWatchlistButton(item.media_type, item.id, item.title || item.name || 'Sans titre', item.poster_path || '', yearRaw);

        return `
            <a href="/content/${item.media_type}/${item.id}" class="group bg-gray-900 rounded-md overflow-hidden hover:ring-2 hover:ring-red-600 transition block relative">
                ${watchlistButton}
                <div class="aspect-2/3 w-full overflow-hidden">
                    <img src="${poster}" alt="${title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
                </div>
                <div class="p-3">
                    <h3 class="text-white font-semibold line-clamp-2">${title}</h3>
                    <p class="text-xs text-gray-400 mt-1">${typeLabel} • ${year}</p>
                </div>
            </a>
        `;
    }).join('');

    container.innerHTML = `
        <section class="pt-0">
            <h2 class="text-xl md:text-3xl font-bold text-gray-100 mb-5">Recherche: ${escapeHtml(query)}</h2>
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                ${cards}
            </div>
        </section>
    `;

    updateWatchlistButtonsState();
}

async function initListPage() {
    const grid = document.getElementById('watchlistGrid');
    const message = document.getElementById('watchlistMessage');

    if (!grid || !message) {
        return;
    }

    if (!Connected) {
        grid.innerHTML = '';
        message.innerHTML = `Connectez-vous pour voir votre liste. <a href="/login" class="text-red-500 hover:text-red-400">Connexion</a>`;
        return;
    }

    message.textContent = 'Chargement de votre liste...';

    const items = await loadWatchlist();
    if (!items.length) {
        grid.innerHTML = '';
        message.textContent = 'Votre liste est vide. Utilisez le bouton + sur un film pour l ajouter.';
        return;
    }

    message.textContent = '';
    const cards = items.map(item => {
        return item;
    });

    grid.innerHTML = buildUserCollectionCards(cards);
    message.textContent = '';
    updateWatchlistButtonsState();
}

async function initProfilePage() {
    const profileMessage = document.getElementById('profileMessage');
    const recentGrid = document.getElementById('profileRecentGrid');
    const listGrid = document.getElementById('profileListGrid');

    if (!profileMessage || !recentGrid || !listGrid) {
        return;
    }

    if (!Connected) {
        profileMessage.innerHTML = `Connectez-vous pour acceder a votre profil. <a href="/login" class="text-red-500 hover:text-red-400">Connexion</a>`;
        recentGrid.innerHTML = '';
        listGrid.innerHTML = '';
        return;
    }

    profileMessage.textContent = `Bienvenue ${currentUser && currentUser.pseudo ? currentUser.pseudo : ''}`.trim();

    const [recentlyWatched, watchlistItems] = await Promise.all([
        loadRecentlyWatched(18),
        loadWatchlist()
    ]);

    recentGrid.innerHTML = buildUserCollectionCards(recentlyWatched);
    listGrid.innerHTML = buildUserCollectionCards(watchlistItems);

    if (!recentlyWatched.length) {
        recentGrid.innerHTML = '<p class="text-gray-400 col-span-full">Aucun contenu regarde recemment.</p>';
    }

    if (!watchlistItems.length) {
        listGrid.innerHTML = '<p class="text-gray-400 col-span-full">Votre liste est vide.</p>';
    }

    updateWatchlistButtonsState();
}

async function performSearch(rawQuery, options = {}) {
    const { syncUrl = true } = options;
    const query = String(rawQuery || '').trim();
    syncSearchInputs(query);

    if (!query) {
        if (syncUrl) {
            updateSearchQueryInUrl('');
        }

        if (window.location.pathname !== '/') {
            window.history.pushState(null, '', '/');
            await navigate('/');
            return;
        }

        await initHome();
        return;
    }

    if (window.location.pathname !== '/') {
        window.history.pushState(null, '', '/');
        await navigate('/', { skipRouteInit: true });
    }

    if (syncUrl) {
        updateSearchQueryInUrl(query);
    }

    const container = document.getElementById('carousels-container');
    if (!container) return;

    setHomeSearchMode(true);

    container.innerHTML = '<p class="text-gray-300">Recherche en cours...</p>';
    const data = await fetchTMDB('search/multi', `query=${encodeURIComponent(query)}&include_adult=false`);
    const results = data && Array.isArray(data.results) ? data.results : [];
    renderSearchResults(container, query, results);
}

const debouncedSearch = debounce(value => {
    performSearch(value);
}, 400);

function bindSearchInputs() {
    getSearchInputs().forEach(input => {
        if (input.dataset.searchBound === 'true') {
            return;
        }

        input.dataset.searchBound = 'true';

        input.addEventListener('input', event => {
            const value = event.target.value;
            syncSearchInputs(value);
            debouncedSearch(value);
        });

        input.addEventListener('keydown', event => {
            if (event.key === 'Enter') {
                event.preventDefault();
                performSearch(event.target.value);
            }
        });
    });
}

async function initRoute(path = `${window.location.pathname}${window.location.search}`) {
    bindSearchInputs();

    const pathname = getPathname(path);
    if (pathname === '/') {
        const queryInUrl = new URLSearchParams(window.location.search).get('q');
        if (queryInUrl && queryInUrl.trim()) {
            await performSearch(queryInUrl, { syncUrl: false });
            return;
        }

        await initHome();
        return;
    }

    if (pathname === '/list') {
        await initListPage();
        return;
    }

    if (pathname === '/profil') {
        await initProfilePage();
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    await refreshSessionState();
    await initRoute(`${window.location.pathname}${window.location.search}`);
});

// Gere le clic sur le bouton + / - de la liste
document.body.addEventListener('click', async event => {
    const watchlistButton = event.target.closest('[data-watchlist-toggle="true"]');
    if (!watchlistButton) {
        return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();
    await toggleWatchlistFromButton(watchlistButton);
});

// Gere la navigation via des liens internes
document.body.addEventListener('click', async event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
    }

    const link = event.target.closest('a');
    if (!link || link.target === '_blank' || link.origin !== window.location.origin) {
        return;
    }

    const href = link.getAttribute('href') || '';
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) {
        return;
    }

    event.preventDefault();

    const nextPath = `${link.pathname}${link.search}`;
    const currentPath = `${window.location.pathname}${window.location.search}`;

    if (currentPath === nextPath) {
        return;
    }

    window.history.pushState(null, '', nextPath);
    await navigate(nextPath);
});

window.addEventListener('popstate', () => {
    navigate(`${window.location.pathname}${window.location.search}`);
});

async function navigate(path, options = {}) {
    const appContent = document.getElementById('app-content');
    if (!appContent) return;

    try {
        const response = await fetch(path, {
            headers: {
                'x-spa-request': 'true'
            }
        });

        if (!response.ok) {
            throw new Error('Erreur de navigation');
        }

        const html = await response.text();
        appContent.innerHTML = html;

        const newScripts = appContent.querySelectorAll('script');
        newScripts.forEach(oldScript => {
            const newScript = document.createElement('script');
            Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
            newScript.appendChild(document.createTextNode(oldScript.innerHTML));
            oldScript.parentNode.replaceChild(newScript, oldScript);
        });

        document.dispatchEvent(new CustomEvent('spa:navigated', { detail: { path } }));

        if (!options.skipRouteInit) {
            await initRoute(path);
        }
    } catch (error) {
        console.error('Erreur de routing:', error);
    } finally {
        appContent.style.opacity = '1';
        const menu = document.getElementById('mobileMenu');
        if (menu && !menu.classList.contains('hidden')) {
            menu.classList.add('hidden');
        }
    }
}
