async function fetchJson(url, options = {}) {
    const response = await fetch(url, {
        credentials: 'same-origin',
        ...options
    });

    const data = await response.json();
    if (!response.ok) {
        const message = data && data.message ? data.message : `Erreur HTTP ${response.status}`;
        throw new Error(message);
    }

    return data;
}

function setWatchlistButtonState(button, inList) {
    if (!button) {
        return;
    }

    button.dataset.inList = inList ? 'true' : 'false';
    button.textContent = inList ? '- Retirer de ma liste' : '+ Ajouter a ma liste';

    if (inList) {
        button.classList.remove('bg-zinc-800', 'hover:bg-zinc-700');
        button.classList.add('bg-green-600', 'hover:bg-green-700', 'border-green-500');
        button.classList.remove('border-zinc-600');
    } else {
        button.classList.remove('bg-green-600', 'hover:bg-green-700', 'border-green-500');
        button.classList.add('bg-zinc-800', 'hover:bg-zinc-700', 'border-zinc-600');
    }
}

async function setupWatchlistButton(button, type, id, payload) {
    if (!button) {
        return;
    }

    try {
        const sessionData = await fetchJson('/api/session');
        if (!sessionData.authenticated) {
            button.onclick = () => {
                window.location.href = '/login';
            };
            return;
        }
    } catch (error) {
        button.onclick = () => {
            window.location.href = '/login';
        };
        return;
    }

    let inList = false;
    try {
        const statusData = await fetchJson(`/api/list/status/${encodeURIComponent(type)}/${encodeURIComponent(id)}`);
        inList = Boolean(statusData.inList);
    } catch (error) {
        inList = false;
    }

    setWatchlistButtonState(button, inList);

    button.onclick = async () => {
        button.disabled = true;

        try {
            if (inList) {
                await fetchJson(`/api/list/${encodeURIComponent(type)}/${encodeURIComponent(id)}`, {
                    method: 'DELETE'
                });
                inList = false;
            } else {
                await fetchJson('/api/list', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });
                inList = true;
            }

            setWatchlistButtonState(button, inList);
        } catch (error) {
            console.error('Erreur liste details:', error.message);
        } finally {
            button.disabled = false;
        }
    };
}

async function initMovieDetailsPage() {
    const pathParts = window.location.pathname.split('/');
    const type = pathParts[2];
    const id = pathParts[3];

    if (!id || !type) {
        return;
    }

    try {
        const data = await fetchJson(`/api/tmdb/${type}/${id}?language=fr-FR&append_to_response=credits,videos`);

        const title = data.title || data.name || 'Sans titre';
        const releaseDate = data.release_date || data.first_air_date || '';

        const titleEl = document.getElementById('movieTitle');
        if (titleEl) {
            titleEl.innerText = title;
        }

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

        const releaseEl = document.getElementById('movieReleaseDate');
        if (releaseEl) {
            releaseEl.innerText = releaseDate ? new Date(releaseDate).toLocaleDateString('fr-FR') : 'Non disponible';
        }

        const directorEl = document.getElementById('movieDirector');
        if (directorEl && data.credits) {
            const crew = Array.isArray(data.credits.crew) ? data.credits.crew : [];
            const director = crew.find(member => member.job === 'Director');

            if (director) {
                directorEl.innerText = director.name;
            } else if (Array.isArray(data.created_by) && data.created_by.length > 0) {
                directorEl.innerText = data.created_by.map(creator => creator.name).join(', ');
            } else {
                directorEl.innerText = 'Non specifie';
            }
        }

        const ratingEl = document.getElementById('movieRating');
        if (ratingEl) {
            ratingEl.innerText = data.vote_average ? data.vote_average.toFixed(1) + '/10' : 'N/A';
        }

        const genresEl = document.getElementById('movieGenres');
        if (genresEl) {
            genresEl.innerText = Array.isArray(data.genres) && data.genres.length > 0
                ? data.genres.map(genre => genre.name).join(', ')
                : 'Non specifie';
        }

        const descEl = document.getElementById('movieDescription');
        if (descEl) {
            descEl.innerText = data.overview || 'Aucun synopsis disponible.';
        }

        const watchButton = document.getElementById('watchButton');
        if (watchButton) {
            watchButton.onclick = () => {
                window.location.href = `/play/${type}/${id}`;
            };
        }

        const watchlistButton = document.getElementById('watchlistButton');
        await setupWatchlistButton(watchlistButton, type, id, {
            mediaType: type,
            mediaId: Number.parseInt(id, 10),
            title,
            posterPath: data.poster_path || '',
            releaseDate
        });
    } catch (error) {
        console.error('Erreur de chargement des details du film :', error);
    }
}

initMovieDetailsPage();
