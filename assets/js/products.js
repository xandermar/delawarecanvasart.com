/**
 * Product catalog + Stripe Payment Link configuration.
 *
 * To enable live checkout:
 * 1. Create a Product + Price in Stripe Dashboard for each print.
 * 2. Create a Payment Link for that price (or use Stripe Payment Links API).
 * 3. Paste the Payment Link URL into `stripePaymentLink` below.
 * 4. Optionally set `stripeBuyButtonId` + publishable key in config.js for Buy Buttons.
 *
 * Until configured, the Buy button opens a helpful setup notice.
 */
window.DCA_PRODUCTS = [
  {
    id: "dune-fence",
    title: "Dune Fence at Golden Hour",
    slug: "dune-fence.html",
    image: "dune-fence.jpg",
    price: 89,
    size: '16" × 24"',
    medium: "Gallery-wrapped canvas",
    category: "Beaches",
    location: "Sussex County shoreline",
    description:
      "Weathered wood and wind-sculpted dunes catch the last warm light of a Sussex County sunset. A quiet coastal rhythm rendered for walls that need salt air and sky.",
    stripePaymentLink: "" // e.g. "https://buy.stripe.com/test_xxxxx"
  },
  {
    id: "cape-henlopen-light",
    title: "Cape Henlopen Light",
    slug: "cape-henlopen-light.html",
    image: "cape-henlopen-light.jpg",
    price: 99,
    size: '18" × 24"',
    medium: "Gallery-wrapped canvas",
    category: "Lighthouses",
    location: "Cape Henlopen",
    description:
      "A white beacon against a firelit sky—Cape Henlopen’s lighthouse standing watch as evening settles over the Atlantic. Bold color for a room that loves the coast.",
    stripePaymentLink: ""
  },
  {
    id: "great-blue-heron",
    title: "Great Blue Heron",
    slug: "great-blue-heron.html",
    image: "great-blue-heron.jpg",
    price: 95,
    size: '16" × 24"',
    medium: "Gallery-wrapped canvas",
    category: "Wildlife",
    location: "Sussex County marsh",
    description:
      "Stillness in the golden marsh. A great blue heron waits among tall grass as warm light threads through the wetland—Delaware wildlife at its most graceful.",
    stripePaymentLink: ""
  },
  {
    id: "sandpiper-sunset",
    title: "Sandpiper Sunset",
    slug: "sandpiper-sunset.html",
    image: "sandpiper-sunset.jpg",
    price: 79,
    size: '12" × 18"',
    medium: "Gallery-wrapped canvas",
    category: "Wildlife",
    location: "Delaware beach",
    description:
      "A sandpiper traces the wet sand as sunset paints the shoreline in peach and gold. An intimate coastal moment for smaller spaces and quiet corners.",
    stripePaymentLink: ""
  },
  {
    id: "lone-pine",
    title: "Lone Pine at Dusk",
    slug: "lone-pine.html",
    image: "lone-pine.jpg",
    price: 92,
    size: '16" × 24"',
    medium: "Gallery-wrapped canvas",
    category: "Landscapes",
    location: "Delaware wetlands",
    description:
      "One pine mirrored in still water as dusk softens the sky. A contemplative landscape that brings Delaware’s quieter wild places indoors.",
    stripePaymentLink: ""
  },
  {
    id: "coastal-town",
    title: "Coastal Town Evening",
    slug: "coastal-town.html",
    image: "coastal-town.jpg",
    price: 105,
    size: '20" × 30"',
    medium: "Gallery-wrapped canvas",
    category: "Places",
    location: "Sussex County town",
    description:
      "Floral planters, a vintage street clock, and boardwalk-style charm under golden evening light—the feeling of a Delaware beach town you want to keep.",
    stripePaymentLink: ""
  }
];
