CREATE TABLE albums (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    explicit BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE default_albums (
    id INTEGER PRIMARY KEY,
    album_id INTEGER NOT NULL,
    FOREIGN KEY (album_id) REFERENCES albums(id)
);

CREATE TABLE songs (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    album_id INTEGER NOT NULL,
    song_number INTEGER NOT NULL,
    explicit BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY (album_id) REFERENCES albums(id)
);

CREATE TABLE lyrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    line_number INTEGER NOT NULL,
    lyric_text TEXT NOT NULL,
    song_id INTEGER NOT NULL,
    FOREIGN KEY (song_id) REFERENCES songs(id),
    UNIQUE(song_id, line_number)
);

CREATE INDEX idx_songs_album_id ON songs(album_id);
CREATE INDEX idx_songs_song_number ON songs(song_number);
CREATE INDEX idx_lyrics_song_id ON lyrics(song_id);
CREATE INDEX idx_lyrics_line_number ON lyrics(line_number);
CREATE INDEX idx_default_albums_album_id ON default_albums(album_id);

CREATE VIEW song_details AS
SELECT
    s.id as song_id,
    s.name as song_name,
    s.song_number,
    s.explicit as song_explicit,
    a.id as album_id,
    a.name as album_name,
    a.explicit as album_explicit
FROM songs s
JOIN albums a ON s.album_id = a.id;

CREATE VIEW lyrics_with_song_info AS
SELECT
    l.id as lyric_id,
    l.line_number,
    l.lyric_text,
    s.id as song_id,
    s.name as song_name,
    s.song_number,
    a.id as album_id,
    a.name as album_name
FROM lyrics l
JOIN songs s ON l.song_id = s.id
JOIN albums a ON s.album_id = a.id
ORDER BY a.id, s.song_number, l.line_number;
