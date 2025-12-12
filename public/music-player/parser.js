export const Parser = {
    parseFile(file) {
        return new Promise((resolve) => {
            window.jsmediatags.read(file, {
                onSuccess: (tag) => {
                    const data = tag.tags;

                    // Picture processing
                    let coverUrl = null;
                    if (data.picture) {
                        const { data: bin, format } = data.picture;
                        let base64String = "";
                        for (let i = 0; i < bin.length; i++) {
                            base64String += String.fromCharCode(bin[i]);
                        }
                        coverUrl = `data:${format};base64,${window.btoa(base64String)}`;
                    }

                    resolve({
                        title: data.title || file.name,
                        artist: data.artist || 'Unknown Artist',
                        album: data.album || 'Unknown Album',
                        lyrics: data.lyrics ? data.lyrics.lyrics : null, // USLT
                        cover: coverUrl
                    });
                },
                onError: (error) => {
                    console.warn(`Tag parse error for ${file.name}:`, error);
                    // Return basic info if parsing fails
                    resolve({
                        title: file.name,
                        artist: 'Unknown Artist',
                        album: 'Unknown Album',
                        lyrics: null,
                        cover: null
                    });
                }
            });
        });
    }
};
