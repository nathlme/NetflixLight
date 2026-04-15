document.addEventListener('DOMContentLoaded', () => {
    const pathParts = window.location.pathname.split('/');
    // Extract type and id, assuming /play/:type/:id
    const type = pathParts[2];
    const id = pathParts[3] || window.location.search.split('id=')[1];

    const player = document.getElementById('videoPlayer');

    if (id) {
        if (type === 'tv') {
            // Optionnel : prendre en compte les saisons/épisodes s'ils sont gérés un jour
            player.src = `https://vidsrc.win/watch/tv/${id}`;
        } else {
            // Film par défaut
            player.src = `https://vidsrc.win/watch/${id}`;
        }
    } else {
        console.error("Aucun ID trouvé pour charger la vidéo");
        document.body.innerHTML = "<h1 class='text-white text-center mt-20 text-2xl'>Erreur: Vidéo introuvable.</h1><button onclick='history.back()' class='m-auto block mt-4 text-white hover:underline'>Retour</button>";
    }
}); 