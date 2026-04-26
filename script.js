// Playlist Data
const playlist = [
    {
        id: '4PgOJwUCdIc', // The 1975 - About You (Audio)
        title: 'About You',
        artist: 'The 1975'
    },
    {
        id: 'jfKfPfyJRdk',
        title: 'lofi hip hop radio - beats to relax/study to',
        artist: 'Lofi Girl'
    },
    {
        id: '5yx6BWlEVcY',
        title: 'Chillhop Radio - jazzy & lofi hip hop beats',
        artist: 'Chillhop Music'
    }
];

let currentTrackIndex = 0;
let player;
let isPlaying = false;
let progressInterval;

// DOM Elements
const introScreen = document.getElementById('intro-screen');
const playerContainer = document.getElementById('player-container');
const backgroundContainer = document.getElementById('background-container');
const coverArt = document.getElementById('cover-art');
const trackTitle = document.getElementById('track-title');
const trackArtist = document.getElementById('track-artist');
const playPauseBtn = document.getElementById('play-pause-btn');
const playIcon = document.getElementById('play-icon');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const progressBar = document.getElementById('progress-bar');
const currentTimeEl = document.getElementById('current-time');
const durationTimeEl = document.getElementById('duration-time');
const volumeBar = document.getElementById('volume-bar');
const volumeIcon = document.getElementById('volume-icon');
const equalizer = document.getElementById('equalizer');

// ==========================================
// 1. Intro Animation Logic
// ==========================================
window.addEventListener('load', () => {
    // Start intro animations
    introScreen.classList.add('split');

    // Show player slightly before the doors fully open
    setTimeout(() => {
        playerContainer.classList.remove('hidden');
    }, 2800);

    // completely hide intro container later
    setTimeout(() => {
        introScreen.style.display = 'none';
    }, 4000);
});

// ==========================================
// 2. YouTube Iframe API Initialization
// ==========================================
// Load YouTube API script
const tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
const firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// This function creates an <iframe> (and YouTube player) after the API code downloads.
function onYouTubeIframeAPIReady() {
    player = new YT.Player('youtube-player', {
        height: '200',
        width: '200',
        videoId: playlist[currentTrackIndex].id,
        playerVars: {
            'playsinline': 1,
            'controls': 0,
            'disablekb': 1,
            'fs': 0,
            'rel': 0
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}

function onPlayerReady(event) {
    // Player is ready, load initial UI
    updateUI();
    // Set initial volume
    player.setVolume(volumeBar.value);
}

function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.PLAYING) {
        isPlaying = true;
        updatePlayPauseUI();
        startProgressInterval();
        equalizer.classList.add('active');

        // Update duration once it's available
        const duration = player.getDuration();
        progressBar.max = duration;
        durationTimeEl.textContent = formatTime(duration);
    } else if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED) {
        isPlaying = false;
        updatePlayPauseUI();
        stopProgressInterval();
        equalizer.classList.remove('active');

        // Auto next on end
        if (event.data === YT.PlayerState.ENDED) {
            nextTrack();
        }
    }
}

// ==========================================
// 3. Player Controls Logic
// ==========================================

function togglePlay() {
    if (!player || !player.getPlayerState) return;

    if (isPlaying) {
        player.pauseVideo();
    } else {
        player.playVideo();
    }
}

function loadTrack(index, autoPlay = true) {
    const track = playlist[index];
    player.loadVideoById(track.id);
    updateUI();

    if (!autoPlay) {
        player.pauseVideo();
    }
}

function prevTrack() {
    currentTrackIndex--;
    if (currentTrackIndex < 0) {
        currentTrackIndex = playlist.length - 1; // loop back
    }
    loadTrack(currentTrackIndex, true);
}

function nextTrack() {
    currentTrackIndex++;
    if (currentTrackIndex >= playlist.length) {
        currentTrackIndex = 0; // loop back
    }
    loadTrack(currentTrackIndex, true);
}

// ==========================================
// 4. UI Updates
// ==========================================

function updateUI() {
    const track = playlist[currentTrackIndex];

    // Add smooth transition for cover image
    coverArt.style.opacity = 0;

    setTimeout(() => {
        const thumbnailUrl = `https://img.youtube.com/vi/${track.id}/hqdefault.jpg`;
        coverArt.src = thumbnailUrl;
        // Background image update removed in favor of animated glowing orbs
        trackTitle.textContent = track.title;
        trackArtist.textContent = track.artist;

        coverArt.style.opacity = 1;
    }, 250); // wait halfway through transition
}

function updatePlayPauseUI() {
    if (isPlaying) {
        playIcon.classList.replace('ph-play', 'ph-pause');
    } else {
        playIcon.classList.replace('ph-pause', 'ph-play');
    }
}

// ==========================================
// 5. Progress Bar & Time
// ==========================================

function formatTime(time) {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

function startProgressInterval() {
    stopProgressInterval();
    progressInterval = setInterval(() => {
        if (player && player.getCurrentTime) {
            const currentTime = player.getCurrentTime();
            const duration = player.getDuration();

            progressBar.value = currentTime;
            currentTimeEl.textContent = formatTime(currentTime);

            // Update custom property for styling
            const percentage = (currentTime / duration) * 100;
            progressBar.style.setProperty('--progress', `${percentage}%`);
        }
    }, 500); // update every 500ms
}

function stopProgressInterval() {
    if (progressInterval) {
        clearInterval(progressInterval);
    }
}

// Seek event
progressBar.addEventListener('input', (e) => {
    const seekTime = e.target.value;
    if (player && player.seekTo) {
        player.seekTo(seekTime, true);
        currentTimeEl.textContent = formatTime(seekTime);

        const duration = player.getDuration();
        const percentage = (seekTime / duration) * 100;
        progressBar.style.setProperty('--progress', `${percentage}%`);
    }
});

// ==========================================
// 6. Volume Control
// ==========================================

volumeBar.addEventListener('input', (e) => {
    const volume = e.target.value;
    if (player && player.setVolume) {
        player.setVolume(volume);
    }

    // Update custom property for styling
    volumeBar.style.setProperty('--volume', `${volume}%`);

    // Update icon
    if (volume == 0) {
        volumeIcon.className = 'ph ph-speaker-x';
    } else if (volume < 50) {
        volumeIcon.className = 'ph ph-speaker-low';
    } else {
        volumeIcon.className = 'ph ph-speaker-high';
    }
});

// Init volume CSS var
volumeBar.style.setProperty('--volume', '100%');


// ==========================================
// 7. Event Listeners
// ==========================================
playPauseBtn.addEventListener('click', togglePlay);
prevBtn.addEventListener('click', prevTrack);
nextBtn.addEventListener('click', nextTrack);
