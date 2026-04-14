var Connected = false

const compte = document.getElementById("compte")
const compteMobile = document.getElementById("compteMobile")

if (Connected) {
    compte.innerHTML = `
    <div class="hidden md:flex items-center gap-4 relative">
        <button id="profileMenuBtn" class="flex items-center gap-2 text-gray-300 hover:text-white transition focus:outline-none" onclick="toggleProfileMenu()">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.846.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
            </svg>
        </button>
        
        <div id="profileDropdown" class="hidden absolute right-0 top-10 mt-2 w-48 bg-gray-800 rounded-md shadow-lg py-1 z-50 border border-gray-700">
            <a href="#" class="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition">Mon compte</a>
            <hr class="border-gray-700 my-1">
            <button class="w-full text-left block px-4 py-2 text-sm text-red-500 hover:bg-gray-700 hover:text-red-400 transition">Déconnexion</button>
        </div>
    </div>

    <button class="md:hidden text-white" onclick="toggleMenu()">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
        </svg>
    </button>
    `;

    compteMobile.innerHTML = `
    <a href="#" class="block hover:text-gray-300 transition">Mon compte</a>
    <button class="w-full bg-red-600 hover:bg-red-700 py-2 rounded transition">Déconnexion</button>
    `
} else {
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
    `

    compteMobile.innerHTML = `
    <a href="/login" class="text-white hover:text-gray-300 font-medium transition cursor-pointer">Connexion</a>
    <a href="/register" class="bg-red-600 hover:bg-red-700 text-white font-medium py-1.5 px-4 rounded transition cursor-pointer">Inscription</a>
    `
}


function toggleMenu() {
            const menu = document.getElementById('mobileMenu');
            menu.classList.toggle('hidden');
        }

        function toggleProfileMenu() {
            const dropdown = document.getElementById('profileDropdown');
            dropdown.classList.toggle('hidden');
        }

        // Fermer le menu déroulant si on clique à l'extérieur
        window.onclick = function(event) {
            if (!event.target.closest('#profileMenuBtn') && !event.target.closest('#profileDropdown')) {
                const dropdown = document.getElementById('profileDropdown');
                if (dropdown && !dropdown.classList.contains('hidden')) {
                    dropdown.classList.add('hidden');
                }
            }
        }

        // Fetch des données TMDB
        const categories = [
            { id: 'trending', title: 'Tendances du moment', endpoint: 'trending/all/day', type: 'mixed' },
            { id: 'popular_movies', title: 'Films populaires', endpoint: 'movie/popular', type: 'movie' },
            { id: 'popular_tv', title: 'Séries populaires', endpoint: 'tv/popular', type: 'tv' },
            { id: 'top_rated', title: 'Les mieux notés', endpoint: 'movie/top_rated', type: 'movie' },
            { id: 'action', title: 'Action', endpoint: 'discover/movie', query: 'with_genres=28', type: 'movie' },
            { id: 'comedy', title: 'Comédie', endpoint: 'discover/movie', query: 'with_genres=35', type: 'movie' }
        ];

        async function fetchTMDB(endpoint, query = '') {
            try {
                const response = await fetch(`/api/tmdb/${endpoint}?language=fr-FR&${query}`);
                return await response.json();
            } catch (error) {
                console.error("Erreur fetch TMDB:", error);
                return null;
            }
        }

        async function initHome() {
            const container = document.getElementById('carousels-container');
            if (!container) return; // Uniquement sur page d'accueil

            // Fetch trending pour le hero banner
            const trendingData = await fetchTMDB('trending/all/day');
            if (trendingData && trendingData.results && trendingData.results.length > 0) {
                const heroItem = trendingData.results[Math.floor(Math.random() * Math.min(10, trendingData.results.length))];
                setupHeroBanner(heroItem);
            }

            container.innerHTML = '';
            for (const cat of categories) {
                const data = await fetchTMDB(cat.endpoint, cat.query);
                if (data && data.results) {
                    renderCarousel(container, cat, data.results);
                }
            }
        }

        function setupHeroBanner(item) {
            const backdrop = item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : 'https://via.placeholder.com/2000x1000';
            const title = item.title || item.name || item.original_title;
            const overview = item.overview || 'Aucune description disponible pour ce contenu.';
            const type = item.media_type || 'movie';

            document.getElementById('hero-image').src = backdrop;
            document.getElementById('hero-title').innerText = title;
            document.getElementById('hero-overview').innerText = overview;

            const playBtn = document.getElementById('hero-play-btn');
            playBtn.onclick = () => window.location.href = `/content/${type}/${item.id}`;
            const infoBtn = document.getElementById('hero-info-btn');
            infoBtn.onclick = () => window.location.href = `/content/${type}/${item.id}`;
        }

        function renderCarousel(container, cat, items) {
            const carouselHTML = `
            <section>
                <h2 class="text-lg md:text-2xl font-bold text-gray-100 mb-3 md:mb-5 px-1 tracking-wide">${cat.title}</h2>
                <div class="relative group/carousel">
                    <!-- Flèche Gauche -->
                    <button onclick="document.getElementById('carousel-${cat.id}').scrollBy({left: -window.innerWidth / 1.5, behavior: 'smooth'})" class="absolute left-0 top-2 bottom-4 z-40 bg-black/50 hover:bg-black/80 text-white w-10 flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity hidden md:flex rounded-l-md cursor-pointer backdrop-blur-sm">
                        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
                    </button>

                    <div id="carousel-${cat.id}" class="flex gap-3 md:gap-4 overflow-x-auto pb-4 pt-2 scroll-smooth snap-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        ${items.map(item => {
                            const poster = item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : 'https://via.placeholder.com/400x600';
                            const title = (item.title || item.name || '').replace(/'/g, "&apos;").replace(/"/g, "&quot;");
                            const releaseDate = item.release_date || item.first_air_date || '';
                            const year = releaseDate ? releaseDate.split('-')[0] : '';
                            const rating = item.vote_average ? item.vote_average.toFixed(1) : '?';
                            const itemType = item.media_type || cat.type;

                            return `
                            <div onclick="window.location.href='/content/${itemType}/${item.id}'" class="flex-none w-32 md:w-48 aspect-[2/3] bg-gray-800 rounded-md overflow-hidden relative group cursor-pointer snap-start transition duration-300 hover:scale-105 hover:z-20 hover:ring-2 hover:ring-gray-400">
                                <img src="${poster}" alt="${title}" class="w-full h-full object-cover">
                                <div class="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-2 text-center">
                                    <h3 class="text-white font-bold text-sm mb-2 line-clamp-2">${title}</h3>
                                    <p class="text-gray-300 text-xs mb-1">${year}</p>
                                    <p class="text-green-400 text-sm font-bold flex items-center gap-1">
                                        <svg class="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                                        ${rating}
                                    </p>
                                </div>
                            </div>
                            `;
                        }).join('')}
                    </div>

                    <!-- Flèche Droite -->
                    <button onclick="document.getElementById('carousel-${cat.id}').scrollBy({left: window.innerWidth / 1.5, behavior: 'smooth'})" class="absolute right-0 top-2 bottom-4 z-40 bg-black/50 hover:bg-black/80 text-white w-10 flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity hidden md:flex rounded-r-md cursor-pointer backdrop-blur-sm">
                        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                    </button>
                </div>
            </section>
            `;
            container.insertAdjacentHTML('beforeend', carouselHTML);
        }

        document.addEventListener('DOMContentLoaded', initHome);

// ----------- ROUTEUR CLIENT (SPA) -----------

// Gère la navigation via des liens internes
document.body.addEventListener("click", e => {
    const link = e.target.closest("a"); 
    
    if (!link || link.target === "_blank" || link.origin !== window.location.origin) {
        return;
    }
    
    // Empêcher le chargement classique de la page entière
    e.preventDefault();

    // Change l'URL dans la barre de recherche du navigateur sans rafraîchir
    if (window.location.pathname !== link.pathname) {
        window.history.pushState(null, "", link.pathname);
        navigate(link.pathname);
    }
});

// Gère "Précédent / Suivant"
window.addEventListener("popstate", () => {
    navigate(window.location.pathname);
});

// Charge le fragment HTML dynamiquement
async function navigate(path) {
    const appContent = document.getElementById("app-content");
    
    try {
        // Envoi avec le header personnalisé 'x-spa-request'
        const response = await fetch(path, {
            headers: {
                "x-spa-request": "true"
            }
        });
        
        if (!response.ok) throw new Error("Erreur de navigation");

        const html = await response.text();
        appContent.innerHTML = html; // Injection du nouveau contenu HTML

        // Ré-executer les balises '<script>' reçues
        const newScripts = appContent.querySelectorAll("script");
        newScripts.forEach(oldScript => {
            const newScript = document.createElement("script");
            Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
            newScript.appendChild(document.createTextNode(oldScript.innerHTML));
            oldScript.parentNode.replaceChild(newScript, oldScript);
        });
        
    } catch (error) {
        console.error("Erreur de routing:", error);
    } finally {
        appContent.style.opacity = "1";
        const menu = document.getElementById("mobileMenu");
        if(menu && !menu.classList.contains("hidden")) menu.classList.add("hidden");
    }
}
