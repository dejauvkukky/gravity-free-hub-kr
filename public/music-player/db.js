const DB_NAME = 'SecretPlayerDB';
const DB_VERSION = 1;

export const DB = {
    db: null,

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = (event) => {
                console.error("IndexedDB error:", event.target.error);
                reject("DB Open Failed");
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                // Store folders structure
                if (!db.objectStoreNames.contains('folders')) {
                    db.createObjectStore('folders', { keyPath: 'id' });
                }
                // Store tracks
                if (!db.objectStoreNames.contains('tracks')) {
                    const trackStore = db.createObjectStore('tracks', { keyPath: 'id' });
                    trackStore.createIndex('folderId', 'folderId', { unique: false });
                    trackStore.createIndex('title', 'title', { unique: false });
                    trackStore.createIndex('artist', 'artist', { unique: false });
                }
            };
        });
    },

    async addFolder(folder) {
        return this.performTransaction('folders', 'readwrite', (store) => {
            store.put(folder);
        });
    },

    async addTrack(track) {
        return this.performTransaction('tracks', 'readwrite', (store) => {
            store.put(track);
        });
    },

    async getAllFolders() {
        return this.performTransaction('folders', 'readonly', (store) => {
            return store.getAll();
        });
    },

    async getTracksByFolder(folderId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['tracks'], 'readonly');
            const store = transaction.objectStore('tracks');
            const index = store.index('folderId');
            const request = index.getAll(folderId);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    async getAllTracks() {
        return this.performTransaction('tracks', 'readonly', (store) => {
            return store.getAll();
        });
    },

    async getTrack(id) {
        return this.performTransaction('tracks', 'readonly', (store) => {
            return store.get(id);
        });
    },

    async clearAll() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['folders', 'tracks'], 'readwrite');
            transaction.oncomplete = () => resolve();
            transaction.onerror = (e) => reject(e);

            transaction.objectStore('folders').clear();
            transaction.objectStore('tracks').clear();
        });
    },

    // Helper for simple transactions
    performTransaction(storeName, mode, callback) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject("DB not initialized");
                return;
            }
            const transaction = this.db.transaction([storeName], mode);
            const store = transaction.objectStore(storeName);
            const request = callback(store);

            if (request) {
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            } else {
                // For void operations like clear() if not handled manually
                transaction.oncomplete = () => resolve();
            }
        });
    }
};
