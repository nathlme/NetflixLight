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
            posterEl.alt = title;
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
