import { DatabaseSync } from "node:sqlite";
import type { Album, Lyric, LyricResult, Song, SongDetails } from "./types.ts";

const dbPath = Deno.cwd() + "/db/taylor_swift_lyrics.db";

export function searchLyrics(
  query: string,
): LyricResult[] {
  const database = new DatabaseSync(dbPath, {
    readOnly: true,
  });

  const sql = `
    SELECT * FROM lyrics_with_song_info
    WHERE lyric_text LIKE '%' || ? || '%'
    ORDER BY album_id, song_number, line_number
  `;

  const stmt = database.prepare(sql);
  const results = stmt.all(query) as LyricResult[];

  database.close();

  return results;
}

export function getSongDetails(
  songId: number,
): { song: SongDetails | null; lyrics: Lyric[] } {
  const database = new DatabaseSync(dbPath, {
    readOnly: true,
  });

  const songSql = `
    SELECT * FROM song_details
    WHERE song_id = ?
  `;

  const lyricsSql = `
    SELECT id as lyric_id, line_number, lyric_text, song_id
    FROM lyrics
    WHERE song_id = ?
    ORDER BY line_number
  `;

  const songStmt = database.prepare(songSql);
  const song = songStmt.get(songId) as SongDetails | undefined;

  const lyricsStmt = database.prepare(lyricsSql);
  const lyrics = song ? lyricsStmt.all(songId) as Lyric[] : [];

  database.close();

  return { song: song || null, lyrics };
}

export function getAlbumDetails(
  albumId: number,
): { album: Album | null; songs: Song[] } {
  const database = new DatabaseSync(dbPath, {
    readOnly: true,
  });

  const albumSql = `
    SELECT id, name, explicit
    FROM albums
    WHERE id = ?
  `;

  const songsSql = `
    SELECT id, name, album_id, song_number, explicit
    FROM songs
    WHERE album_id = ?
    ORDER BY song_number
  `;

  const albumStmt = database.prepare(albumSql);
  const album = albumStmt.get(albumId) as Album | undefined;

  const songsStmt = database.prepare(songsSql);
  const songs = album ? songsStmt.all(albumId) as unknown as Song[] : [];

  database.close();

  return { album: album || null, songs };
}
