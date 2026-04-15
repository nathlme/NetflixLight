document.addEventListener('DOMContentLoaded', async () => {
    const pathParts = window.location.pathname.split('/');
    const type = pathParts[2];
    const id = pathParts[3];

    if (!id || !type) return;

    try {
        const response = await fetch('/api/tmdb/' + type + '/' + id + '?language=fr-FR&append_to_response=credits,videos');
        const data = await response.json();

        // Titre
        const titleEl = document.getElementById('movieTitle');
        if (titleEl) titleEl.innerText = data.title || data.name;

        // Poster
        const posterEl = document.getElementById('moviePoster');
        if (posterEl) {
            posterEl.src = data.poster_path 
                ? 'https://image.tmdb.org/t/p/w500' + data.poster_path 
                : 'https://via.placeholder.com/400x600';
            posterEl.alt = data.title || data.name;
        }

        // Backdrop 
        const backdropEl = document.getElementById("backdropBg");

        if (backdropEl) {
            const backdropUrl = data.backdrop_path
                ? `https://image.tmdb.org/t/p/original${data.backdrop_path}`
                : "https://via.placeholder.com/1920x1080";

            backdropEl.style.backgroundImage = `url('${backdropUrl}')`;
        }

        // Durée du fim
        const durationEl = document.getElementById('movieDuration');

        if (durationEl) {
            
            if (data.runtime) {
                const hours = Math.floor(data.runtime / 60);
                const minutes = data.runtime % 60;

                durationEl.innerHTML = `<strong>Durée :</strong> ${hours}h ${minutes}min`;
            }

            else if (data.number_of_seasons) {
                if (data.number_of_seasons == 1) {
                    durationEl.innerHTML = `<strong>${data.number_of_seasons} Saison</strong>`;
                }else {
                    durationEl.innerHTML = `<strong>${data.number_of_seasons} Saisons</strong>`;
                }   
            }
            else {
                durationEl.innerText = "Non disponible";
            }
        }

        // Similar movies
        const similarEl = document.getElementById("similarContent");

        if (similarEl) {
            const similarResponse = await fetch(`/api/tmdb/${type}/${id}/similar?language=fr-FR`);
            const similarData = await similarResponse.json();

            if (similarData.results && similarData.results.length > 0) {
                similarEl.innerHTML = similarData.results.slice(0, 10).map(item => {
                    const poster = item.poster_path
                        ? `https://image.tmdb.org/t/p/w300${item.poster_path}`
                        : "https://via.placeholder.com/200x300";

                    const title = item.title || item.name || "Titre inconnu";
                    const itemType = item.media_type || type;

                    return `
                        <div onclick="window.location.href='/content/${itemType}/${item.id}'"
                            class="min-w-[140px] cursor-pointer">
                            <img src="${poster}" alt="${title}" class="w-full rounded-lg mb-2">
                            <p class="text-sm text-white">${title}</p>
                        </div>
                    `;
                }).join("");
            } else {
                similarEl.innerHTML = `<p class="text-zinc-400">Aucun contenu similaire.</p>`;
            }
        }

        // Casting 
        const castEl = document.getElementById("movieCast");

        if (castEl && data.credits && data.credits.cast) {
            const cast = data.credits.cast.slice(0, 10); 

            castEl.innerHTML = cast.map(actor => {
                const img = actor.profile_path
                    ? `https://image.tmdb.org/t/p/w185${actor.profile_path}`
                    : "https://via.placeholder.com/150x225";

                return `
                    <div class="flex flex-col items-center text-center min-w-[120px]">
                        <img src="${img}" class="w-24 h-32 object-cover rounded-md mb-2">
                        <p class="text-sm text-white">${actor.name}</p>
                        <p class="text-xs text-zinc-400">${actor.character || ""}</p>
                    </div>
                `;
            }).join("");
        }

        // Date de sortie
        const releaseEl = document.getElementById('movieReleaseDate');
        if (releaseEl) {
            const date = data.release_date || data.first_air_date;
            releaseEl.innerText = date ? new Date(date).toLocaleDateString('fr-FR') : 'Non disponible';
        }

        // Réalisateur / Créateur
        const directorEl = document.getElementById('movieDirector');
        if (directorEl && data.credits) {
            const crew = data.credits.crew;
            const director = crew.find(member => member.job === 'Director');
            if (director) {
                directorEl.innerText = director.name;
            } else if (data.created_by && data.created_by.length > 0) {
                directorEl.innerText = data.created_by.map(c => c.name).join(', ');
            } else {
                directorEl.innerText = 'Non sp챕cifi챕';
            }
        }

        // Note
        const ratingEl = document.getElementById('movieRating');
        if (ratingEl) ratingEl.innerText = data.vote_average ? data.vote_average.toFixed(1) + '/10' : 'N/A';

        // Genres
        const genresEl = document.getElementById('movieGenres');
        if (genresEl) {
            genresEl.innerText = data.genres ? data.genres.map(g => g.name).join(', ') : 'Non sp챕cifi챕';
        }

        // Synopsis
        const descEl = document.getElementById('movieDescription');
        if (descEl) descEl.innerText = data.overview || 'Aucun synopsis disponible.';

        // Lancement du lecteur vidéo
        const watchButton = document.getElementById('watchButton');
        if (watchButton) {
            watchButton.addEventListener('click', () => {
                // Redirige vers la page de lecture video
                window.location.href = `/play/${type}/${id}`;
            });
        }

    } catch (error) {
        console.error('Erreur de chargement des d챕tails du film :', error);
    }
});
