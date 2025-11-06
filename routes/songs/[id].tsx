import { Head } from "fresh/runtime";
import { define } from "../../utils.ts";
import { getSongDetails } from "../../lib/db-server.ts";
import BackLink from "../../components/BackLink.tsx";

export default define.page<typeof handler>(function SongPage(props) {
  const { song, lyrics, highlightId, searchQuery, origin } = props.data;

  if (!song) {
    return (
      <div class="px-4 py-8 mx-auto min-h-screen">
        <Head>
          <title>Song Not Found</title>
        </Head>
        <div class="w-full max-w-6xl mx-auto px-6">
          <h1 class="text-3xl font-bold mb-4">Song Not Found</h1>
        </div>
      </div>
    );
  }

  const highlightText = (text: string) => {
    if (!searchQuery) {
      // deno-lint-ignore react-no-danger
      return <span dangerouslySetInnerHTML={{ __html: text }} />;
    }

    const regex = new RegExp(`(${searchQuery})`, "gi");
    const parts = text.split(regex);

    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === searchQuery.toLowerCase()
            ? <mark key={i} class="bg-yellow-200">{part}</mark>
            // deno-lint-ignore react-no-danger
            : <span key={i} dangerouslySetInnerHTML={{ __html: part }} />
        )}
      </>
    );
  };

  const ogImageUrl = highlightId && searchQuery
    ? `${origin}/og/songs/${song.song_id}?highlight=${highlightId}&q=${encodeURIComponent(searchQuery)}`
    : `${origin}/og/songs/${song.song_id}`;

  const ogDescription = `Lyrics for "${song.song_name}" from ${song.album_name}`;

  return (
    <div class="px-4 py-8 mx-auto min-h-screen">
      <Head>
        <title>{song.song_name} - {song.album_name}</title>
        <meta
          property="og:title"
          content={`${song.song_name} - ${song.album_name}`}
        />
        <meta property="og:description" content={ogDescription} />
        <meta property="og:type" content="music.song" />
        <meta property="og:image" content={ogImageUrl} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content={`${song.song_name} - ${song.album_name}`}
        />
        <meta name="twitter:description" content={ogDescription} />
        <meta name="twitter:image" content={ogImageUrl} />
        {highlightId && (
          <script
            // deno-lint-ignore react-no-danger
            dangerouslySetInnerHTML={{
              __html: `
              document.addEventListener('DOMContentLoaded', function() {
                const element = document.getElementById('lyric-${highlightId}');
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              });
            `,
            }}
          />
        )}
      </Head>
      <div class="w-full max-w-6xl mx-auto pt-6 px-6">
        <BackLink
          href={searchQuery ? `/?q=${encodeURIComponent(searchQuery)}` : "/"}
        >
          Back to search
        </BackLink>

        <h1 class="text-3xl font-bold mb-2">{song.song_name}</h1>
        <h2 class="text-xl text-muted-foreground mb-6">
          <a href={`/albums/${song.album_id}`} class="hover:underline">
            {song.album_name}
          </a>
        </h2>

        <hr class="border-t w-full mb-6" />

        <table class="text-lg leading-relaxed">
          <tbody>
            {lyrics.map((lyric) => (
              <tr
                key={lyric.lyric_id}
                id={highlightId === lyric.lyric_id
                  ? `lyric-${lyric.lyric_id}`
                  : undefined}
                class={highlightId === lyric.lyric_id
                  ? "text-3xl font-bold"
                  : ""}
              >
                <td class="font-mono text-right text-sm text-muted-foreground pr-4 align-middle py-0.5">
                  {lyric.line_number}
                </td>
                <td class={highlightId === lyric.lyric_id ? "py-4" : "py-0.5"}>
                  {highlightText(lyric.lyric_text)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

export const handler = define.handlers({
  async GET(ctx) {
    const id = ctx.params.id;
    const highlightParam = ctx.url.searchParams.get("highlight");
    const searchQuery = ctx.url.searchParams.get("q");
    const origin = ctx.url.origin;

    try {
      const songId = parseInt(id, 10);
      if (isNaN(songId)) {
        return {
          data: {
            song: null,
            lyrics: [],
            highlightId: null,
            searchQuery: null,
            origin,
          },
        };
      }

      const highlightId = highlightParam ? parseInt(highlightParam, 10) : null;
      const { song, lyrics } = await getSongDetails(songId);
      return { data: { song, lyrics, highlightId, searchQuery, origin } };
    } catch (err) {
      console.error("Error fetching song details:", err);
      return {
        data: { song: null, lyrics: [], highlightId: null, searchQuery: null, origin },
      };
    }
  },
});
