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

    } catch (error) {
        console.error('Erreur de chargement des d챕tails du film :', error);
    }
});
