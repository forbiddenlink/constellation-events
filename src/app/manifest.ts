import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Constellation",
    short_name: "Constellation",
    description:
      "Your nightly mission control for the sky above. Track celestial events, find dark skies, and plan your stargazing adventures.",
    start_url: "/",
    display: "standalone",
    background_color: "#05060F",
    theme_color: "#22d3ee",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/icon",
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
