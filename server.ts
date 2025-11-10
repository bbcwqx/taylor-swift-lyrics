import server from "./_fresh/server.js";
import { Resvg } from "@resvg/resvg-js";

const imagePattern = new URLPattern({ pathname: "/og/*" });

export default {
  fetch: async (req: Request) => {
    const url = new URL(req.url);

    // Convert svg to png on opengraph image routes
    if (imagePattern.test(url)) {
      const response = await server.fetch(req);

      if (response.headers.get("content-type") === "image/svg+xml") {
        const svg = await response.text();

        const resvg = new Resvg(svg, {
          fitTo: {
            mode: "width",
            value: 1200,
          },
          logLevel: "error",
        });

        const pngData = resvg.render();
        const pngBuffer = pngData.asPng();

        return new Response(new Uint8Array(pngBuffer), {
          headers: {
            "Content-Type": "image/png",
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
      }

      return response;
    }

    return server.fetch(req);
  },
};
