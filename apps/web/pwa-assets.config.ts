import { defineConfig, minimal2023Preset } from "@vite-pwa/assets-generator/config";

// Maskable and Apple touch icons default to a white background — overridden
// to the app's dark background so installed icons match the in-app theme
// instead of flashing white on the safe-zone/corner padding.
export default defineConfig({
  headLinkOptions: {
    preset: "2023",
  },
  preset: {
    ...minimal2023Preset,
    maskable: {
      ...minimal2023Preset.maskable,
      resizeOptions: { fit: "contain", background: "#0a0a0a" },
    },
    apple: {
      ...minimal2023Preset.apple,
      resizeOptions: { fit: "contain", background: "#0a0a0a" },
    },
  },
  images: ["public/favicon.svg"],
});
