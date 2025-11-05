export type LyricResult = {
  lyric_id: number;
  line_number: number;
  lyric_text: string;
  song_id: number;
  song_name: string;
  song_number: number;
  album_id: number;
  album_name: string;
};

export type SearchOptions = {
  caseSensitive?: boolean;
  exactWord?: boolean;
};

export type SongDetails = {
  song_id: number;
  song_name: string;
  song_number: number;
  song_explicit: boolean;
  album_id: number;
  album_name: string;
  album_explicit: boolean;
};

export type Lyric = {
  lyric_id: number;
  line_number: number;
  lyric_text: string;
  song_id: number;
};

export type Album = {
  id: number;
  name: string;
  explicit: boolean;
};

export type Song = {
  id: number;
  name: string;
  album_id: number;
  song_number: number;
  explicit: boolean;
};
