import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Next PWA Notifications",
    short_name: "PWA Notify",
    description:
      "Progressive Web App demo showing how to register a service worker and trigger multiple notification styles.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0b122f",
    theme_color: "#405cff",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    orientation: "portrait",
    lang: "th",
    dir: "auto",
  };
}
