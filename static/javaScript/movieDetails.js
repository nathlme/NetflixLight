
const params = new URLSearchParams(window.location.search);
const movieId = params.get("id");

console.log(movieId);
console.log("movieDetails.js chargé");

const movie = {
  title: "Inception",
  description: "Un voleur spécialisé dans l'extraction de secrets via les rêves reçoit une mission très particulière.",
  director: "Christopher Nolan",
  releaseDate: "2010-07-16",
  rating: "8.8",
  genres: "Science-fiction, Thriller",
  posterUrl: "static/images/inception.jpg"
};

document.getElementById("movieTitle").textContent = movie.title;
document.getElementById("movieDescription").textContent = movie.description;
document.getElementById("movieDirector").textContent = movie.director;
document.getElementById("movieReleaseDate").textContent = movie.releaseDate;
document.getElementById("movieRating").textContent = movie.rating;
document.getElementById("movieGenres").textContent = movie.genres;
document.getElementById("moviePoster").src = movie.posterUrl;