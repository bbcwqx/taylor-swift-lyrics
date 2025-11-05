import type { LyricResult, SearchOptions } from "./types.ts";
import dbUrl from "../db/taylor_swift_lyrics.db";

export async function initDatabase() {
  const sqlite3InitModule = (await import("@sqlite.org/sqlite-wasm")).default;
  const sqlite3 = await sqlite3InitModule({
    print: console.log,
    printErr: console.error,
  });

  const response = await fetch(dbUrl);
  const buffer = await response.arrayBuffer();
  const uint8Array = new Uint8Array(buffer);

  const p = sqlite3.wasm.allocFromTypedArray(uint8Array);
  const database = new sqlite3.oo1.DB();
  const dbPointer = database.pointer;

  if (!dbPointer) {
    throw new Error("Failed to get database pointer");
  }

  const rc = sqlite3.capi.sqlite3_deserialize(
    dbPointer,
    "main",
    p,
    uint8Array.byteLength,
    uint8Array.byteLength,
    sqlite3.capi.SQLITE_DESERIALIZE_FREEONCLOSE |
      sqlite3.capi.SQLITE_DESERIALIZE_RESIZEABLE,
  );

  if (rc !== 0) {
    throw new Error(`Failed to deserialize database: ${rc}`);
  }

  return database;
}

export function searchLyrics(
  // deno-lint-ignore no-explicit-any
  db: any,
  query: string,
  options: SearchOptions = {},
): LyricResult[] {
  const { caseSensitive = false, exactWord = false } = options;

  let searchPattern = query;
  let sql: string;

  if (exactWord) {
    searchPattern = `% ${query} %`;
    sql = `
      SELECT * FROM lyrics_with_song_info
      WHERE lyric_text LIKE ?
         OR lyric_text LIKE ? || '%'
         OR lyric_text LIKE '%' || ?
      ORDER BY album_id, song_number, line_number
    `;
  } else if (caseSensitive) {
    sql = `
      SELECT * FROM lyrics_with_song_info
      WHERE lyric_text GLOB ?
      ORDER BY album_id, song_number, line_number
    `;
    searchPattern = `*${query}*`;
  } else {
    sql = `
      SELECT * FROM lyrics_with_song_info
      WHERE lyric_text LIKE ?
      ORDER BY album_id, song_number, line_number
    `;
    searchPattern = `%${query}%`;
  }

  const results: LyricResult[] = [];

  if (exactWord) {
    const startPattern = `${query} `;
    const endPattern = ` ${query}`;

    db.exec({
      sql: sql,
      bind: [searchPattern, startPattern, endPattern],
      rowMode: "object",
      callback: (row: LyricResult) => {
        const text = caseSensitive
          ? row.lyric_text
          : row.lyric_text.toLowerCase();
        const searchQuery = caseSensitive ? query : query.toLowerCase();
        const regex = new RegExp(
          `\\b${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
        );
        if (regex.test(text)) {
          results.push(row);
        }
      },
    });
  } else {
    db.exec({
      sql: sql,
      bind: [searchPattern],
      rowMode: "object",
      callback: (row: LyricResult) => {
        results.push(row);
      },
    });
  }

  return results;
}
