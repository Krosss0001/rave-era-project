import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Rave'era Group",
    short_name: "Rave'era",
    description:
      "Event OS for discovery, registration, tickets, QR check-in, Telegram and Web3 access.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#020202",
    theme_color: "#00FF88",
    orientation: "portrait",
    categories: ["events", "entertainment", "utilities"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png"
      },
      {
        src: "/icons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      }
    ]
  };
}
