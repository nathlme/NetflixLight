// Video
const container = document.getElementById("videoContainer");
const video = document.getElementById("videoPlayer");



// Son 
const muteBtn = document.getElementById("muteBtn");
const volumeSlider = document.getElementById("volumeSlider");


volumeSlider.addEventListener("input", () => {
    video.volume = volumeSlider.value;

    if (video.volume == 0) {
        video.muted = true;
    } else {
        video.muted = false;
    }
});

video.addEventListener("volumechange", () => {
    if (video.muted || video.volume === 0) {
        muteBtn.textContent = "🔇";
    } else {
        muteBtn.textContent = "🔊";
    }
});


muteBtn.addEventListener("click", () => {
    video.muted = !video.muted;
});



// Play / POause 
const playBtn = document.getElementById("playPauseBtn");
const progressBar = document.getElementById("progressBar");
const progressFill = document.getElementById("progressFill");


function formatTime(time) {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    } else {
        return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    }
}

function togglePlayPause() {
    if (video.paused) {
        video.play();
        playBtn.textContent = "▶";
    } else {
        video.pause();
        playBtn.textContent = "⏸";
    }
}

playBtn.addEventListener("click", togglePlayPause);
video.addEventListener("click", togglePlayPause);

document.addEventListener("keydown", (event) => {
    if (event.code === "Space") {
        event.preventDefault();
        togglePlayPause();
    }
});

 
video.addEventListener("timeupdate", () => {
    if (!video.duration) return;

    const current = formatTime(video.currentTime);
    const total = formatTime(video.duration);

    timeDisplay.textContent = `${current} / ${total}`;

    const percent = (video.currentTime / video.duration) * 100;

    progressFill.style.width = percent + "%";
});



progressBar.addEventListener("click", (event) => {
    const rect = progressBar.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const width = rect.width; 

    const percent = clickX / width; 
    video.currentTime = percent * video.duration;
});



// Full Screen
const fullBtn = document.getElementById("fullScreenBtn");
const controls = document.getElementById("controls");
 
let timeout;

function showControls() {
    controls.style.opacity = "1";

    clearTimeout(timeout);

    timeout = setTimeout(() => {
        controls.style.opacity = "0";
    }, 3000);
}

container.addEventListener("mousemove", showControls);
 


fullBtn.addEventListener("click", () => {
    if (!document.fullscreenElement) {
        container.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
});

 