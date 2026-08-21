/** Real-world details for Grainbuds, taken from the previous website. */

export const cafeInfo = {
  name: "Grainbuds",
  address: {
    street: "Universitätsstraße 7",
    zip: "91054",
    city: "Erlangen",
    country: "Germany",
  },
  phone: "09131 6120740",
  phoneHref: "tel:+4991316120740",
  mapsUrl:
    "https://www.google.com/maps/search/?api=1&query=Grainbuds&query_place_id=ChIJ04IaBY75oUcRFYGR687_QdE",
  /** Mon–Sat 10:30–19:00, Sunday closed. */
  hours: [
    { days: [1, 2, 3, 4, 5, 6], open: "10:30", close: "19:00" },
  ],
} as const;

const galleryBase =
  "https://ams3.digitaloceanspaces.com/tmi-images/grainbuds__asian_cafe_143/gallery/";

export const galleryImages = [
  "bgze84N6cjLQLZ3Gg.png",
  "HpssZMGXBnwxmKXQ8.png",
  "HenFPMGuoMntvyq4k.png",
  "wnzMcdQP4q9noowC3.png",
  "a2FJW87TLnbM5N7SA.jpg",
  "kJYSZin6scePYJ2oo.jpg",
  "y2sfZbbkhn9zuoRe2.png",
  "NLJWhasH64oKmerpx.png",
].map((file) => galleryBase + file);
