export class AudioEngine {
    constructor() {
        this.audio = new Audio();
        this.playlist = [];
        this.currentIndex = -1;
        this.isShuffle = false;
        this.repeatMode = 'none'; // none, one, all
        this.shuffledPlaylist = [];

        // Events
        this.onStateChange = null; // (isPlaying) => {}
        this.onTimeUpdate = null; // (curr, total) => {}
        this.onTrackChange = null; // (track) => {}
        this.onEnded = null;

        this._bindEvents();
    }

    _bindEvents() {
        this.audio.addEventListener('timeupdate', () => {
            if (this.onTimeUpdate) {
                this.onTimeUpdate(this.audio.currentTime, this.audio.duration || 0);
            }
        });

        this.audio.addEventListener('ended', () => {
            if (this.repeatMode === 'one') {
                this.audio.currentTime = 0;
                this.audio.play();
            } else {
                this.next();
            }
        });

        this.audio.addEventListener('play', () => {
            if (this.onStateChange) this.onStateChange(true);
            this._updateMediaSessionState('playing');
        });

        this.audio.addEventListener('pause', () => {
            if (this.onStateChange) this.onStateChange(false);
            this._updateMediaSessionState('paused');
        });

        // Media Session API
        if ('mediaSession' in navigator) {
            navigator.mediaSession.setActionHandler('play', () => this.play());
            navigator.mediaSession.setActionHandler('pause', () => this.pause());
            navigator.mediaSession.setActionHandler('previoustrack', () => this.prev());
            navigator.mediaSession.setActionHandler('nexttrack', () => this.next());
        }
    }

    _updateMediaSessionState(state) {
        if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = state;
        }
    }

    _updateMediaSessionMetadata(track) {
        if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: track.title,
                artist: track.artist,
                album: track.album || 'Unknown Album',
                artwork: [
                    { src: track.cover || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', sizes: '512x512', type: 'image/png' }
                ]
            });
        }
    }

    setPlaylist(tracks) {
        this.playlist = tracks;
        if (this.isShuffle) {
            this._infoShuffle();
        }
    }

    async loadTrack(index, autoPlay = true) {
        if (index < 0 || index >= this.playlist.length) return;

        let realIndex = index;
        if (this.isShuffle) {
            // If shuffle is on, index refers to the shuffled array
            // BUT, usually UI passes the visible index.
            // If UI shows original list, we just pick from original.
            // If UI shows shuffled list... usually UI shows original.
            // Let's assume input index is always based on the ORIGINAL list unless using next/prev logic.
        }

        // Logic split: Direct click vs Next/Prev
        // For direct click, we set current index and play
        this.currentIndex = index;
        const track = this.playlist[this.currentIndex];

        // Revoke old URL if it was a blob to save memory? 
        // IndexedDB stores file handle or blob. We create obj URL.
        // Handled in App level or here? Let's assume passed track has 'file' property (Blob/File).

        if (this.currentUrl) {
            URL.revokeObjectURL(this.currentUrl);
        }

        const url = URL.createObjectURL(track.file);
        this.currentUrl = url;
        this.audio.src = url;

        if (autoPlay) {
            try {
                await this.audio.play();
            } catch (e) {
                console.error("Play failed", e);
            }
        }

        if (this.onTrackChange) this.onTrackChange(track);
        this._updateMediaSessionMetadata(track);
    }

    play() {
        this.audio.play();
    }

    pause() {
        this.audio.pause();
    }

    togglePlay() {
        if (this.audio.paused) this.play();
        else this.pause();
    }

    next() {
        if (this.playlist.length === 0) return;

        let nextIndex;
        if (this.isShuffle) {
            // Simple shuffle logic: random next
            nextIndex = Math.floor(Math.random() * this.playlist.length);
        } else {
            nextIndex = this.currentIndex + 1;
            if (nextIndex >= this.playlist.length) {
                if (this.repeatMode === 'all') nextIndex = 0;
                else return; // Stop at end
            }
        }
        this.loadTrack(nextIndex);
    }

    prev() {
        if (this.playlist.length === 0) return;

        // If played more than 3 sec, restart
        if (this.audio.currentTime > 3) {
            this.audio.currentTime = 0;
            return;
        }

        let prevIndex;
        if (this.isShuffle) {
            prevIndex = Math.floor(Math.random() * this.playlist.length);
        } else {
            prevIndex = this.currentIndex - 1;
            if (prevIndex < 0) {
                if (this.repeatMode === 'all') prevIndex = this.playlist.length - 1;
                else return;
            }
        }
        this.loadTrack(prevIndex);
    }

    seek(percent) {
        if (this.audio.duration) {
            this.audio.currentTime = (percent / 100) * this.audio.duration;
        }
    }
}
