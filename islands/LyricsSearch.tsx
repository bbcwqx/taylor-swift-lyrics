import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import { ChevronDown } from "lucide-preact";
import type { LyricResult } from "../lib/types.ts";
import { initDatabase, searchLyrics } from "../lib/db-client.ts";

type LyricsSearchProps = {
  initialResults?: LyricResult[] | null;
  initialQuery?: string | null;
};

export default function LyricsSearch(
  { initialResults, initialQuery }: LyricsSearchProps = {},
) {
  const searchQuery = useSignal(initialQuery || "");
  const results = useSignal<LyricResult[] | null>(initialResults || null);
  const error = useSignal<string | null>(null);
  const loading = useSignal(!initialResults);
  const searching = useSignal(false);
  const caseSensitive = useSignal(false);
  const exactWord = useSignal(false);
  // deno-lint-ignore no-explicit-any
  const db = useSignal<any>(null);

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const database = await initDatabase();

        if (mounted) {
          db.value = database;
          loading.value = false;

          if (!initialResults) {
            const urlParams = new URLSearchParams(globalThis.location.search);
            const q = urlParams.get("q");
            if (q) {
              searchQuery.value = q;
              performSearchInternal(q);
            }
          }
        }
      } catch (err) {
        if (mounted) {
          error.value = err instanceof Error ? err.message : String(err);
          loading.value = false;
        }
      }
    }

    init();

    return () => {
      mounted = false;
      if (db.value) {
        try {
          db.value.close();
        } catch (e) {
          console.error("Error closing database:", e);
        }
      }
    };
  }, []);

  const performSearchInternal = (query: string) => {
    if (!db.value) {
      error.value = "Database not initialized";
      return;
    }

    if (!query) {
      results.value = null;
      return;
    }

    try {
      searching.value = true;
      error.value = null;

      const result = searchLyrics(db.value, query, {
        caseSensitive: caseSensitive.value,
        exactWord: exactWord.value,
      });

      results.value = result;
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err);
      results.value = null;
    } finally {
      searching.value = false;
    }
  };

  const performSearch = () => {
    const query = searchQuery.value;

    const url = new URL(globalThis.location.href);
    if (query) {
      url.searchParams.set("q", query);
    } else {
      url.searchParams.delete("q");
    }
    globalThis.history.pushState({}, "", url);

    performSearchInternal(query);
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      performSearch();
    }
  };

  return (
    <>
      <div class="w-full max-w-6xl mx-auto pt-6 px-6 pb-2">
        <h1 class="text-3xl font-bold mb-2">
          Taylor Swift Lyrics Search
        </h1>

        <div class="flex gap-2">
          <input
            type="text"
            class="input input-bordered flex-1"
            placeholder="Search for lyrics..."
            value={searchQuery.value}
            onInput={(e) =>
              searchQuery.value = (e.target as HTMLInputElement).value}
            onKeyDown={handleKeyPress}
          />
          <button
            type="button"
            onClick={performSearch}
            class="btn btn-primary"
            disabled={loading.value || searching.value}
          >
            {loading.value
              ? "Loading..."
              : searching.value
              ? "Searching..."
              : "Search"}
          </button>
        </div>
      </div>

      <div class="w-full max-w-6xl mx-auto px-4">
        <div id="search-settings" class="popover">
          <button
            id="search-settings-trigger"
            type="button"
            aria-expanded="false"
            aria-controls="search-settings-popover"
            class="btn-link flex items-center gap-1 text-muted-foreground hover:text-primary hover:no-underline"
          >
            Settings
            <ChevronDown class="w-4 h-4" />
          </button>
          <div
            id="search-settings-popover"
            data-popover
            aria-hidden="true"
            class="w-80"
          >
            <div class="grid gap-4">
              <header class="grid gap-1.5">
                <h4 class="leading-none font-medium">Search Settings</h4>
                <p class="text-muted-foreground text-sm">
                  Configure your search preferences.
                </p>
              </header>
              <form class="form grid gap-2">
                <div class="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="case-sensitive"
                    class="h-4 w-4"
                    checked={caseSensitive.value}
                    onChange={(e) => {
                      caseSensitive.value =
                        (e.target as HTMLInputElement).checked;
                      if (searchQuery.value) performSearch();
                    }}
                  />
                  <label for="case-sensitive">Case-sensitive</label>
                </div>
                <div class="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="exact-word"
                    class="h-4 w-4"
                    checked={exactWord.value}
                    onChange={(e) => {
                      exactWord.value = (e.target as HTMLInputElement).checked;
                      if (searchQuery.value) performSearch();
                    }}
                  />
                  <label for="exact-word">Exact word match</label>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <hr class="border-t w-full mb-6" />

      <div class="w-full max-w-6xl mx-auto px-6">
        {error.value && (
          <div class="alert alert-error mb-4">
            <strong>Error:</strong> {error.value}
          </div>
        )}

        {results.value && results.value.length > 0 && (
          <>
            <div class="mb-4 text-sm text-base-content/70">
              Found {results.value.length}{" "}
              result{results.value.length !== 1 ? "s" : ""}
            </div>
            <div class="overflow-x-auto">
              <table class="table">
                <thead>
                  <tr class="border-b">
                    <th class="text-left p-3 font-bold">Lyric</th>
                    <th class="text-left p-3 font-bold">Song</th>
                    <th class="text-left p-3 font-bold">Album</th>
                    <th class="text-left p-3 font-bold">Track</th>
                    <th class="text-left p-3 font-bold">Line</th>
                  </tr>
                </thead>
                <tbody>
                  {results.value.map((lyric, idx) => (
                    <tr
                      key={lyric.lyric_id}
                      class={idx % 2 === 0 ? "" : "bg-muted/50"}
                    >
                      <td class="p-3">
                        <a
                          href={`/songs/${lyric.song_id}?highlight=${lyric.lyric_id}&q=${
                            encodeURIComponent(searchQuery.value)
                          }`}
                          class="hover:underline"
                        >
                          {lyric.lyric_text}
                        </a>
                      </td>
                      <td class="p-3">
                        <a
                          href={`/songs/${lyric.song_id}`}
                          class="hover:underline"
                        >
                          {lyric.song_name}
                        </a>
                      </td>
                      <td class="p-3">
                        <a
                          href={`/albums/${lyric.album_id}`}
                          class="hover:underline"
                        >
                          {lyric.album_name}
                        </a>
                      </td>
                      <td class="p-3">{lyric.song_number}</td>
                      <td class="p-3">{lyric.line_number}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {results.value && results.value.length === 0 && !error.value && (
          <div class="alert">
            No lyrics found matching "{searchQuery.value}"
          </div>
        )}
      </div>
    </>
  );
}
