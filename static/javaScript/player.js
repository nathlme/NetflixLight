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

async function recordRecentlyWatched(type, id) {
    if (!id || (type !== 'movie' && type !== 'tv')) {
        return;
    }

    try {
        const sessionData = await fetchJson('/api/session');
        if (!sessionData.authenticated) {
            return;
        }

        const details = await fetchJson(`/api/tmdb/${type}/${id}?language=fr-FR`);
        const payload = {
            mediaType: type,
            mediaId: Number.parseInt(id, 10),
            title: details.title || details.name || 'Sans titre',
            posterPath: details.poster_path || '',
            releaseDate: details.release_date || details.first_air_date || ''
        };

        await fetchJson('/api/history', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
    } catch (error) {
        // Non bloquant: l'historique ne doit pas casser le lecteur.
        console.error('Impossible d enregistrer le recemment regarde:', error.message);
    }
}

function initPlayerPage() {
    const pathParts = window.location.pathname.split('/');
    const type = pathParts[2];
    const id = pathParts[3] || window.location.search.split('id=')[1];

    const player = document.getElementById('videoPlayer');
    if (!player) return;

    if (id) {
        if (type === 'tv') {
            player.src = `https://vidsrc.win/watch/tv/${id}`;
        } else {
            player.src = `https://vidsrc.win/watch/${id}`;
        }

        void recordRecentlyWatched(type, id);
    } else {
        console.error("Aucun ID trouve pour charger la video");
        document.body.innerHTML = "<h1 class='text-white text-center mt-20 text-2xl'>Erreur: Video introuvable.</h1><button onclick='history.back()' class='m-auto block mt-4 text-white hover:underline'>Retour</button>";
    }
}

initPlayerPage();