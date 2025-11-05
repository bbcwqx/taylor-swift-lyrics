#!/usr/bin/env sh

set -e

rm -rf db
mkdir -p db

DB_FILE="db/taylor_swift_lyrics.db"

echo "Importing albums and song data"
sqlite3 $DB_FILE <<EOF
.read schema.sql
.import --csv --skip 1 csv/albums.csv albums
.import --csv --skip 1 csv/default-albums.csv default_albums
.import --csv --skip 1 csv/songs.csv songs
EOF

echo "Importing lyrics"
find csv/lyrics -name "*.csv" -type f | while read -r f; do
  sqlite3 "$DB_FILE" <<EOF
.mode csv
CREATE TEMP TABLE lyrics_temp (
    line_number INTEGER,
    lyric_text TEXT,
    song_id INTEGER
);
.import --skip 1 "$f" lyrics_temp
INSERT INTO lyrics (line_number, lyric_text, song_id)
SELECT line_number, lyric_text, song_id FROM lyrics_temp;
DROP TABLE lyrics_temp;
EOF
done
