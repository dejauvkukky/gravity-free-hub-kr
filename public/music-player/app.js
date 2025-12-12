import { DB } from './db.js';
import { Parser } from './parser.js';
import { AudioEngine } from './audio.js';

// --- State ---
const state = {
    currentFolderId: null,
    folders: [],
    tracks: []
};

// --- Engine ---
const audio = new AudioEngine();

// --- Init ---
async function init() {
    try {
        await DB.init();
        await loadLibrary();

        setupEventListeners();

        // Hide loading
        document.getElementById('loading-screen').classList.add('hidden');
    } catch (e) {
        console.error("Init failed", e);
        alert("초기화 실패: " + e);
    }
}

// --- Library Logic ---
async function loadLibrary() {
    state.folders = await DB.getAllFolders();
    renderFolderList();
}

function renderFolderList() {
    const list = document.getElementById('folder-list');
    list.innerHTML = '';

    if (state.folders.length === 0) {
        list.innerHTML = `<div style="text-align:center; padding:40px; color:#94a3b8;">
            폴더를 추가하여 음악을 등록하세요.<br>
            <small>(오프라인 저장, 데이터 소모 없음)</small>
        </div>`;
        return;
    }

    state.folders.forEach(folder => {
        const el = document.createElement('div');
        el.className = 'list-item';
        el.onclick = () => openFolder(folder.id);
        el.innerHTML = `
            <div class="folder-icon">📁</div>
            <div class="item-info">
                <div class="item-title truncate">${folder.name}</div>
                <div class="item-desc truncate">${folder.count}곡</div>
            </div>
            <div style="color:#cbd5e1;">›</div>
        `;
        list.appendChild(el);
    });

    document.getElementById('track-list-container').classList.add('hidden');
    document.getElementById('folder-list').classList.remove('hidden');
}

async function openFolder(folderId) {
    state.currentFolderId = folderId;
    const folder = state.folders.find(f => f.id === folderId);
    if (!folder) return;

    document.getElementById('current-folder-name').innerText = folder.name;

    // Show Loading for tracks? IndexedDB is fast enough usually.
    state.tracks = await DB.getTracksByFolder(folderId);
    renderTrackList();

    document.getElementById('folder-list').classList.add('hidden');
    document.getElementById('track-list-container').classList.remove('hidden');
}

function renderTrackList() {
    const list = document.getElementById('track-list');
    list.innerHTML = '';

    state.tracks.forEach((track, index) => {
        const el = document.createElement('div');
        el.className = 'list-item';
        el.onclick = () => playTrack(index);

        // Simple Icon or Art?
        // IndexedDB retrieval of blob url for list might be heavy if many. 
        // Just use icon.

        el.innerHTML = `
            <div class="folder-icon" style="font-size:1.2rem; min-width:30px; text-align:center; color:#64748b;">🎵</div>
            <div class="item-info">
                <div class="item-title truncate">${track.title}</div>
                <div class="item-desc truncate">${track.artist}</div>
            </div>
            <div style="color:#cbd5e1;">▶</div>
        `;
        list.appendChild(el);
    });
}

// --- Player Logic ---
function playTrack(index) {
    // Update Playlist in Engine
    // We only pass the current folder tracks logic
    // Optimization: Don't set playlist every time if same folder?
    // For simplicity, just set always.
    audio.setPlaylist(state.tracks);
    audio.loadTrack(index);

    // Show Player? Or Mini Player first?
    // User flow: Click track -> Show Full Player immediately is standard for mobile music apps.
    showPlayerView();
}

// --- File Import Logic ---
async function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    showLoading(true, "음악 파일 분석 중...");

    const folderMap = new Map(); // path -> { name, tracks: [] }

    let addedCount = 0;

    for (const file of files) {
        // Filter Audio
        if (!file.type.startsWith('audio/') && !file.name.match(/\.(mp3|m4a|wav|aac|ogg)$/i)) continue;

        // Determine Folder (webkitRelativePath)
        // path: "Music/Album/Song.mp3"
        const pathParts = file.webkitRelativePath.split('/');
        let folderName = "Uncategorized";
        if (pathParts.length > 1) {
            folderName = pathParts[pathParts.length - 2]; // Parent folder
        }

        // Group by Folder
        if (!folderMap.has(folderName)) {
            folderMap.set(folderName, []);
        }
        folderMap.get(folderName).push(file);
    }

    // Process Queues
    for (const [name, fileList] of folderMap) {
        // Create Folder ID
        const folderId = Date.now() + Math.random().toString(36).substr(2, 9);

        await DB.addFolder({
            id: folderId,
            name: name,
            count: fileList.length,
            createdAt: new Date()
        });

        // Process Tracks
        for (const file of fileList) {
            const meta = await Parser.parseFile(file);
            await DB.addTrack({
                id: Date.now() + Math.random().toString(36).substr(2, 9),
                folderId: folderId,
                file: file, // Store Blob
                title: meta.title,
                artist: meta.artist,
                album: meta.album,
                lyrics: meta.lyrics,
                cover: meta.cover
            });
        }
        addedCount += fileList.length;
    }

    showLoading(false);

    if (addedCount > 0) {
        await loadLibrary();
        alert(`${addedCount}곡이 추가되었습니다.`);
    } else {
        alert("추가할 음악 파일을 찾지 못했습니다.");
    }

    // Reset Input
    e.target.value = '';
}


// --- UI Events ---
function setupEventListeners() {
    // File Input
    document.getElementById('folder-input').addEventListener('change', handleFileSelect);

    // Navigation
    document.getElementById('back-to-folders').onclick = () => {
        document.getElementById('track-list-container').classList.add('hidden');
        document.getElementById('folder-list').classList.remove('hidden');
        state.currentFolderId = null;
    };

    // Mini Player Click
    document.getElementById('mini-player').onclick = (e) => {
        if (e.target.id === 'mini-play-btn') return; // Handled separately
        showPlayerView();
    };

    // Player View Back
    document.getElementById('player-back-btn').onclick = hidePlayerView;

    // Controls
    document.getElementById('play-btn').onclick = () => audio.togglePlay();
    document.getElementById('mini-play-btn').onclick = (e) => {
        e.stopPropagation();
        audio.togglePlay();
    };

    document.getElementById('next-btn').onclick = () => audio.next();
    document.getElementById('prev-btn').onclick = () => audio.prev();

    document.getElementById('shuffle-btn').onclick = () => {
        audio.isShuffle = !audio.isShuffle;
        updateControlUI();
    };

    document.getElementById('repeat-btn').onclick = () => {
        if (audio.repeatMode === 'none') audio.repeatMode = 'all';
        else if (audio.repeatMode === 'all') audio.repeatMode = 'one';
        else audio.repeatMode = 'none';
        updateControlUI();
    };

    // Seek
    const seekBar = document.getElementById('seek-bar');
    seekBar.addEventListener('input', (e) => {
        audio.seek(e.target.value);
    });

    // Lyrics
    document.getElementById('lyrics-btn').onclick = () => {
        document.getElementById('lyrics-modal').classList.remove('hidden');
    };
    document.getElementById('lyrics-close-btn').onclick = () => {
        document.getElementById('lyrics-modal').classList.add('hidden');
    };
    document.getElementById('lyrics-modal').onclick = (e) => {
        if (e.target === document.getElementById('lyrics-modal')) {
            document.getElementById('lyrics-modal').classList.add('hidden');
        }
    };

    // Audio Engine Bindings
    audio.onStateChange = (isPlaying) => {
        const icon = isPlaying ? '⏸' : '▶';
        document.getElementById('play-btn').innerText = icon;
        document.getElementById('mini-play-btn').innerText = icon;
    };

    audio.onTimeUpdate = (curr, total) => {
        if (!total) return;
        const pct = (curr / total) * 100;
        document.getElementById('seek-bar').value = pct;
        document.getElementById('curr-time').innerText = formatTime(curr);
        document.getElementById('total-time').innerText = formatTime(total);
    };

    audio.onTrackChange = (track) => {
        updatePlayerUI(track);
    };
}

// --- UI Helpers ---
function formatTime(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
}

function updateControlUI() {
    const shuffleBtn = document.getElementById('shuffle-btn');
    const repeatBtn = document.getElementById('repeat-btn');

    shuffleBtn.classList.toggle('active', audio.isShuffle);

    repeatBtn.classList.remove('active');
    if (audio.repeatMode === 'all') {
        repeatBtn.classList.add('active');
        repeatBtn.innerText = '🔁';
    } else if (audio.repeatMode === 'one') {
        repeatBtn.classList.add('active');
        repeatBtn.innerText = '🔂';
    } else {
        repeatBtn.innerText = '🔁'; // reset icon
    }
}

function updatePlayerUI(track) {
    // Text
    document.getElementById('player-title').innerText = track.title;
    document.getElementById('player-artist').innerText = track.artist;

    document.getElementById('mini-title').innerText = track.title;
    document.getElementById('mini-artist').innerText = track.artist;

    // Cover
    const art = document.getElementById('album-art');
    if (track.cover) {
        art.style.backgroundImage = `url(${track.cover})`;
        art.innerHTML = ''; // Remove icon
        art.classList.remove('default-art');
    } else {
        art.style.backgroundImage = '';
        art.innerHTML = '<span>🎵</span>';
        art.classList.add('default-art');
    }

    // Lyrics
    const lyricsEl = document.getElementById('lyrics-text');
    lyricsEl.innerText = track.lyrics || "가사 정보가 없습니다.";

    // Show Mini Player
    document.getElementById('mini-player').classList.remove('hidden');
}

function showPlayerView() {
    const view = document.getElementById('view-player');
    view.classList.remove('hidden');
    // Force Reflow
    view.offsetHeight;
    view.classList.add('active');
}

function hidePlayerView() {
    const view = document.getElementById('view-player');
    view.classList.remove('active');
    setTimeout(() => {
        view.classList.add('hidden');
    }, 300); // Wait for transition
}

function showLoading(show, text = "로딩중...") {
    const el = document.getElementById('loading-screen');
    const txt = document.getElementById('loading-text');
    txt.innerText = text;
    if (show) el.classList.remove('hidden');
    else el.classList.add('hidden');
}

// Run
init();
