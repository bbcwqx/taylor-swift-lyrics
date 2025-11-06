import { Head } from "fresh/runtime";
import { define } from "../../utils.ts";
import { getAlbumDetails } from "../../lib/db-server.ts";
import BackLink from "../../components/BackLink.tsx";

export default define.page<typeof handler>(function AlbumPage(props) {
  const { album, songs, origin } = props.data;

  if (!album) {
    return (
      <div class="px-4 py-8 mx-auto min-h-screen">
        <Head>
          <title>Album Not Found</title>
        </Head>
        <div class="w-full max-w-6xl mx-auto px-6">
          <h1 class="text-3xl font-bold mb-4">Album Not Found</h1>
        </div>
      </div>
    );
  }

  const ogImageUrl = origin + `/og/albums/${album.id}`;
  const ogDescription = `Browse all ${songs.length} ${songs.length === 1 ? "song" : "songs"} from ${album.name}`;

  return (
    <div class="px-4 py-8 mx-auto min-h-screen">
      <Head>
        <title>{album.name} - Taylor Swift</title>
        <meta property="og:title" content={`${album.name} - Taylor Swift`} />
        <meta property="og:description" content={ogDescription} />
        <meta property="og:type" content="music.album" />
        <meta property="og:image" content={ogImageUrl} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${album.name} - Taylor Swift`} />
        <meta name="twitter:description" content={ogDescription} />
        <meta name="twitter:image" content={ogImageUrl} />
      </Head>
      <div class="w-full max-w-6xl mx-auto pt-6 px-6">
        <BackLink href="/">Back to search</BackLink>

        <h1 class="text-3xl font-bold mb-2">{album.name}</h1>
        <p class="text-muted-foreground mb-6">
          {songs.length} {songs.length === 1 ? "song" : "songs"}
        </p>

        <hr class="border-t w-full mb-6" />

        <div class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr class="border-b">
                <th class="text-left p-3 font-bold">Track</th>
                <th class="text-left p-3 font-bold">Song</th>
              </tr>
            </thead>
            <tbody>
              {songs.map((song, idx) => (
                <tr
                  key={song.id}
                  class={idx % 2 === 0 ? "" : "bg-muted/50"}
                >
                  <td class="p-3">{song.song_number}</td>
                  <td class="p-3">
                    <a
                      href={`/songs/${song.id}`}
                      class="hover:underline"
                    >
                      {song.name}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
});

export const handler = define.handlers({
  async GET(ctx) {
    const id = ctx.params.id;
    const origin = ctx.url.origin;

    try {
      const albumId = parseInt(id, 10);
      if (isNaN(albumId)) {
        return { data: { album: null, songs: [], origin } };
      }

      const { album, songs } = await getAlbumDetails(albumId);
      return { data: { album, songs, origin } };
    } catch (err) {
      console.error("Error fetching album details:", err);
      return { data: { album: null, songs: [], origin } };
    }
  },
});
