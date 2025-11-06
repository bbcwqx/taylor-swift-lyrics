import { define } from "../../../utils.ts";
import satori from "satori";
import { getSongDetails } from "../../../lib/db-server.ts";
import type { Lyric } from "../../../lib/types.ts";

type SatoriNode = {
  type: string;
  props: {
    style?: Record<string, string | number>;
    children?: SatoriNode[] | string;
  };
};

function highlightTextInNode(text: string, query: string | null): SatoriNode[] {
  if (!query) {
    return [{ type: "span", props: { children: text } }];
  }

  // Split text into words and spaces
  const words = text.split(/(\s+)/);

  return words.map((word): SatoriNode => {
    // Preserve spaces
    if (/^\s+$/.test(word)) {
      return {
        type: "span",
        props: {
          style: { whiteSpace: "pre" } as Record<string, string | number>,
          children: word,
        },
      };
    }

    // Check if word matches query (case insensitive, whole word)
    if (word.toLowerCase() === query.toLowerCase()) {
      return {
        type: "span",
        props: {
          style: { background: "#fef08a", color: "#0a0a0a" } as Record<
            string,
            string | number
          >,
          children: word,
        },
      };
    }

    return {
      type: "span",
      props: {
        children: word,
      },
    };
  });
}

function generateSongImage(
  songName: string,
  albumName: string,
  lyrics: Lyric[],
  highlightId: number | null,
  searchQuery: string | null,
): SatoriNode {
  let displayLyrics: Array<{ text: string; isHighlight: boolean }> = [];
  let showEllipsisBefore = false;
  let showEllipsisAfter = false;

  if (highlightId !== null) {
    const highlightIndex = lyrics.findIndex((l) => l.lyric_id === highlightId);
    if (highlightIndex !== -1) {
      const contextBefore = 1;
      const contextAfter = 1;
      const start = Math.max(0, highlightIndex - contextBefore);
      const end = Math.min(lyrics.length, highlightIndex + contextAfter + 1);

      showEllipsisBefore = start > 0;
      showEllipsisAfter = end < lyrics.length;

      displayLyrics = lyrics.slice(start, end).map((lyric) => ({
        text: lyric.lyric_text,
        isHighlight: lyric.lyric_id === highlightId,
      }));
    }
  } else {
    displayLyrics = lyrics.slice(0, 3).map((lyric) => ({
      text: lyric.lyric_text,
      isHighlight: false,
    }));
    showEllipsisAfter = lyrics.length > 3;
  }

  return {
    type: "div",
    props: {
      style: {
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "80px",
        // background: "#252525",
        background: "#0a0a0a",
        fontFamily: "Inter",
        color: "white",
      },
      children: [
        {
          type: "div",
          props: {
            style: {
              fontSize: 32,
              opacity: 0.9,
              marginBottom: 12,
            },
            children: albumName,
          },
        },
        {
          type: "div",
          props: {
            style: {
              fontSize: 56,
              fontWeight: 700,
              marginBottom: 48,
            },
            children: songName,
          },
        },
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              flexDirection: "column",
              gap: 16,
            },
            children: [
              ...(showEllipsisBefore
                ? [{
                  type: "div",
                  props: {
                    style: {
                      fontSize: 24,
                      opacity: 0.6,
                      lineHeight: 1.4,
                      display: "flex",
                    },
                    children: "...",
                  },
                }]
                : []),
              ...displayLyrics.map((lyric) => ({
                type: "div",
                props: {
                  style: {
                    fontSize: lyric.isHighlight ? 40 : 24,
                    fontWeight: lyric.isHighlight ? 700 : 400,
                    opacity: lyric.isHighlight ? 1 : 0.8,
                    lineHeight: 1.4,
                    display: "flex",
                    flexWrap: "wrap",
                    maxWidth: "100%",
                  },
                  children: highlightTextInNode(lyric.text, searchQuery),
                },
              })),
              ...(showEllipsisAfter
                ? [{
                  type: "div",
                  props: {
                    style: {
                      fontSize: 24,
                      opacity: 0.6,
                      lineHeight: 1.4,
                      display: "flex",
                    },
                    children: "...",
                  },
                }]
                : []),
            ],
          },
        },
      ],
    },
  };
}

export const handler = define.handlers({
  "GET": async (ctx) => {
    const songId = parseInt(ctx.params.id, 10);
    const highlightParam = ctx.url.searchParams.get("highlight");
    const searchQuery = ctx.url.searchParams.get("q");
    const highlightId = highlightParam ? parseInt(highlightParam, 10) : null;

    const fontData = await Deno.readFile("./static/fonts/Inter-Regular.otf");
    const fontDataBold = await Deno.readFile("./static/fonts/Inter-Bold.otf");

    let imageNode: SatoriNode;

    if (isNaN(songId)) {
      imageNode = {
        type: "div",
        props: {
          style: {
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 48,
            background: "#f3f4f6",
            fontFamily: "Inter",
          },
          children: "Song Not Found",
        },
      };
    } else {
      const { song, lyrics } = await getSongDetails(songId);
      if (!song) {
        imageNode = {
          type: "div",
          props: {
            style: {
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 48,
              background: "#f3f4f6",
              fontFamily: "Inter",
            },
            children: "Song Not Found",
          },
        };
      } else {
        imageNode = generateSongImage(
          song.song_name,
          song.album_name,
          lyrics,
          highlightId,
          searchQuery,
        );
      }
    }

    const svg = await satori(imageNode, {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: "Inter",
          data: fontData.buffer,
          weight: 400,
          style: "normal",
        },
        {
          name: "Inter",
          data: fontDataBold.buffer,
          weight: 700,
          style: "normal",
        },
      ],
    });

    return new Response(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
      },
    });
  },
});
