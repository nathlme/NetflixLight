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
        async function fetchTrendingMovies() {
            const carousel = document.getElementById('carousel-1');
            if (!carousel) return; // Uniquement si sur la page d'accueil

            try {
                const response = await fetch('/api/trending');
                const data = await response.json();

                if (data.results) {
                    carousel.innerHTML = '';
                    data.results.forEach(movie => {
                        const posterPath = movie.poster_path 
                            ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` 
                            : 'https://via.placeholder.com/400x600?text=Indisponible';

                        const movieCard = `
                            <div class="flex-none w-32 md:w-48 aspect-[2/3] bg-gray-800 rounded-md overflow-hidden relative group cursor-pointer snap-start transition duration-300 hover:scale-105 hover:z-20 hover:ring-2 hover:ring-gray-400">
                                <img src="${posterPath}" alt="${movie.title || movie.name}" class="w-full h-full object-cover">
                                <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                    <svg class="w-12 h-12 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                                </div>
                            </div>
                        `;
                        carousel.insertAdjacentHTML('beforeend', movieCard);
                    });
                }
            } catch (error) {
                console.error("Erreur lors de la récupération des films:", error);
            }
        }

        document.addEventListener('DOMContentLoaded', fetchTrendingMovies);