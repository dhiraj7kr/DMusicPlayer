document.addEventListener('DOMContentLoaded', () => {
    const songItems = document.querySelectorAll('.song-item');
    const filterLinks = document.querySelectorAll('.filter-link');
    let currentAudio = null;
    let isShuffling = false;
    let loopState = 0; // 0: no loop, 1: loop current song, 2: loop all songs
    let currentIndex = -1;
    let timer = null; // Timer variable
    let timerDuration = 0; // Timer duration in milliseconds
    let countdownInterval = null; // Interval for countdown
    const timerMenu = document.getElementById('timer-menu');
    const optionsButton = document.getElementById('options');
    const dropdown = document.querySelector('.dropdown');
    const countdownDisplay = document.createElement('div');
    countdownDisplay.className = 'countdown-timer';
    document.body.appendChild(countdownDisplay);

    const currentTimeDisplay = document.createElement('div');
    currentTimeDisplay.id = 'current-time';
    document.querySelector('.player-controls').prepend(currentTimeDisplay);

    filterLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const filter = e.target.getAttribute('data-filter');
            filterSongs(filter);
        });
    });

    function filterSongs(filter) {
        songItems.forEach(song => {
            const language = song.getAttribute('data-language');
            song.style.display = (filter === 'all' || filter === language) ? 'flex' : 'none';
        });
    }

    function playRandomSong() {
        const randomIndex = Math.floor(Math.random() * songItems.length);
        playSongAtIndex(randomIndex);
    }

    function playNextSong() {
        if (isShuffling) {
            playRandomSong();
        } else {
            currentIndex = (currentIndex + 1) % songItems.length;
            playSongAtIndex(currentIndex);
        }
    }

    function playSongAtIndex(index) {
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
        }
        currentAudio = songItems[index].querySelector('.audio-player');
        currentAudio.play();
        currentIndex = index;
        updatePlayPauseIcon(true);
        updateSongDetails(songItems[index].querySelector('.song-title').textContent, songItems[index].querySelector('.album-name').textContent);
        songItems.forEach(song => song.classList.remove('playing'));
        songItems[index].classList.add('playing');
        updateProgressBar();
        updateCurrentTimeDisplay();

        currentAudio.onended = () => {
            if (loopState === 1) {
                currentAudio.play();
            } else {
                playNextSong();
            }
        };
    }

    function updatePlayPauseIcon(isPlaying) {
        const playPauseButton = document.getElementById('play-pause');
        if (isPlaying) {
            playPauseButton.classList.remove('fa-play');
            playPauseButton.classList.add('fa-pause');
        } else {
            playPauseButton.classList.remove('fa-pause');
            playPauseButton.classList.add('fa-play');
        }
    }

    function updateSongDetails(title, details) {
        document.getElementById('song-title').textContent = title;
        document.getElementById('song-details').textContent = details;
    }

    function updateProgressBar() {
        const progressBar = document.getElementById('progress');
        if (currentAudio) {
            progressBar.max = currentAudio.duration;
            progressBar.value = currentAudio.currentTime;
            currentAudio.addEventListener('timeupdate', () => {
                progressBar.value = currentAudio.currentTime;
                updateCurrentTimeDisplay();
            });
            progressBar.addEventListener('input', () => {
                currentAudio.currentTime = progressBar.value;
                updateCurrentTimeDisplay();
            });
        }
    }

    function updateCurrentTimeDisplay() {
        if (currentAudio) {
            const minutes = Math.floor(currentAudio.currentTime / 60);
            const seconds = Math.floor(currentAudio.currentTime % 60);
            currentTimeDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }
    }

    function startTimer(duration) {
        if (timer) {
            clearTimeout(timer);
        }
        if (countdownInterval) {
            clearInterval(countdownInterval);
        }
        const endTime = Date.now() + duration;
        countdownDisplay.style.display = 'block';

        countdownInterval = setInterval(() => {
            const timeLeft = Math.max(endTime - Date.now(), 0);
            const minutes = Math.floor(timeLeft / 60000);
            const seconds = Math.floor((timeLeft % 60000) / 1000);
            countdownDisplay.textContent = `${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;

            if (timeLeft <= 0) {
                clearInterval(countdownInterval);
                countdownDisplay.style.display = 'none';
                if (currentAudio) {
                    currentAudio.pause();
                    updatePlayPauseIcon(false);
                }
            }
        }, 1000);
    }

    document.getElementById('play-pause').addEventListener('click', () => {
        if (!currentAudio) {
            playRandomSong();
        } else if (currentAudio.paused) {
            currentAudio.play();
            updatePlayPauseIcon(true);
        } else {
            currentAudio.pause();
            updatePlayPauseIcon(false);
        }
    });

    document.getElementById('next').addEventListener('click', playNextSong);

    document.getElementById('prev').addEventListener('click', () => {
        if (currentIndex > 0) {
            currentIndex--;
        } else {
            currentIndex = songItems.length - 1;
        }
        playSongAtIndex(currentIndex);
    });

    document.getElementById('shuffle').addEventListener('click', () => {
        isShuffling = !isShuffling;
        document.getElementById('shuffle').classList.toggle('active', isShuffling);
    });

    document.getElementById('loop').addEventListener('click', () => {
        loopState = (loopState + 1) % 3;
        const loopButton = document.getElementById('loop');
        loopButton.classList.remove('current', 'all');
        if (loopState === 1) {
            loopButton.classList.add('current');
        } else if (loopState === 2) {
            loopButton.classList.add('all');
        }
        if (currentAudio) {
            currentAudio.loop = (loopState === 1);
        }
    });

    document.querySelector('.song-list').addEventListener('click', (e) => {
        if (e.target.closest('.song-item')) {
            const audio = e.target.closest('.song-item').querySelector('.audio-player');
            if (currentAudio && currentAudio !== audio) {
                currentAudio.pause();
                currentAudio.currentTime = 0;
            }
            currentAudio = audio;
            currentIndex = Array.from(songItems).indexOf(e.target.closest('.song-item'));
            currentAudio.play();
            updatePlayPauseIcon(true);
            updateSongDetails(e.target.closest('.song-item').querySelector('.song-title').textContent, e.target.closest('.song-item').querySelector('.album-name').textContent);
            songItems.forEach(song => song.classList.remove('playing'));
            e.target.closest('.song-item').classList.add('playing');
            updateProgressBar();
        }
    });

    document.querySelectorAll('.audio-player').forEach(audio => {
        audio.addEventListener('ended', handleSongEnd);
    });

    function handleSongEnd() {
        if (loopState === 1) {
            currentAudio.play();
        } else {
            playNextSong();
        }
    }

    document.querySelectorAll('.dropdown-content a').forEach(timerOption => {
        timerOption.addEventListener('click', (e) => {
            e.preventDefault();
            const minutes = parseInt(timerOption.getAttribute('data-timer')) / 60000;
            const duration = minutes * 60000; // Convert minutes to milliseconds
            startTimer(duration);
            dropdown.classList.remove('show'); // Hide dropdown after selection
        });
    });

    optionsButton.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('show');
    });

    document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target)) {
            dropdown.classList.remove('show');
        }
    });
});
