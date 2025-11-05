import { Head } from "fresh/runtime";
import { define } from "../utils.ts";
import LyricsSearch from "../islands/LyricsSearch.tsx";
import { searchLyrics } from "../lib/db-server.ts";

export default define.page<typeof handler>(function Home(props) {
  return (
    <div class="px-4 py-8 mx-auto min-h-screen">
      <Head>
        <title>Taylor Swift Lyrics Search</title>
      </Head>
      <LyricsSearch
        initialResults={props.data?.results}
        initialQuery={props.data?.query}
      />
    </div>
  );
});

export const handler = define.handlers({
  async GET(ctx) {
    const url = new URL(ctx.req.url);
    const query = url.searchParams.get("q");

    if (!query) {
      return { data: { results: null, query: null } };
    }

    try {
      const results = await searchLyrics(query);
      return { data: { results, query } };
    } catch (err) {
      console.error("SSR database error:", err);
      return { data: { results: null, query } };
    }
  },
});
