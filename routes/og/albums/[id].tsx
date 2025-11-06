import { define } from "../../../utils.ts";
import satori from "satori";
import { getAlbumDetails } from "../../../lib/db-server.ts";

type SatoriNode = {
  type: string;
  props: {
    style?: Record<string, string | number>;
    children?: SatoriNode[] | string;
  };
};

function generateAlbumImage(
  albumName: string,
  songCount: number,
  songs: Array<{ name: string; song_number: number }>,
): SatoriNode {
  const maxSongs = 6;
  const displaySongs = songs.slice(0, maxSongs);
  const hasMore = songs.length > maxSongs;

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
        background: "#0a0a0a",
        fontFamily: "Inter",
        color: "white",
      },
      children: [
        {
          type: "div",
          props: {
            style: {
              fontSize: 56,
              fontWeight: 700,
              marginBottom: 24,
            },
            children: albumName,
          },
        },
        {
          type: "div",
          props: {
            style: {
              fontSize: 28,
              opacity: 0.9,
              marginBottom: 48,
            },
            children: `${songCount} ${songCount === 1 ? "song" : "songs"}`,
          },
        },
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              flexDirection: "column",
              gap: 12,
            },
            children: [
              ...displaySongs.map((song) => ({
                type: "div",
                props: {
                  style: {
                    fontSize: 24,
                    opacity: 0.85,
                    display: "flex",
                  },
                  children: `${song.song_number}. ${song.name}`,
                },
              })),
              ...(hasMore
                ? [{
                  type: "div",
                  props: {
                    style: {
                      fontSize: 24,
                      opacity: 0.6,
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
    const albumId = parseInt(ctx.params.id, 10);
    const fontData = await Deno.readFile("./static/fonts/Inter-Regular.otf");
    const fontDataBold = await Deno.readFile("./static/fonts/Inter-Bold.otf");

    let imageNode: SatoriNode;

    if (isNaN(albumId)) {
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
          children: "Album Not Found",
        },
      };
    } else {
      const { album, songs } = await getAlbumDetails(albumId);
      if (!album) {
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
            children: "Album Not Found",
          },
        };
      } else {
        imageNode = generateAlbumImage(album.name, songs.length, songs);
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
