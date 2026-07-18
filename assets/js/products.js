/**
 * Product catalog — four canvas sizes per print.
 *
 * Checkout: store STRIPE_SECRET_KEY in GitHub Secrets, then run Action
 * "Sync Stripe payment links". That writes Payment Links (with name, size,
 * price) into stripe-links.generated.js — no Cloudflare or other host.
 *
 * Optional manual fallback: paste a link into stripe.SIZE.stripePaymentLink.
 */
window.DCA_CANVAS_SIZES = [
  {
    id: "8x10",
    label: '8" × 10"',
    price: 159.99,
    description:
      "Our 8×10 canvas is the perfect choice for adding a touch of Delaware’s coastal beauty to smaller spaces such as bookshelves, desks, entryways, bathrooms, or gallery walls. Its compact size makes it an affordable gift while still showcasing every vibrant detail of the artwork."
  },
  {
    id: "11x14",
    label: '11" × 14"',
    price: 199.99,
    description:
      "The 11×14 canvas offers a versatile display size that works beautifully in bedrooms, home offices, kitchens, and hallways. It provides greater visual impact while fitting comfortably into most spaces, making it one of the most popular choices for everyday décor."
  },
  {
    id: "12x12",
    label: '12" × 12"',
    price: 199.99,
    description:
      "The 12×12 canvas features a contemporary square format that complements modern interiors and is ideal for balanced landscape and wildlife compositions. Its unique proportions make it an excellent accent piece for living rooms, offices, beach homes, or as part of a coordinated gallery wall."
  },
  {
    id: "16x20",
    label: '16" × 20"',
    price: 359.99,
    description:
      "The 16×20 canvas creates a bold statement and allows the rich colors and intricate details of the artwork to truly shine. Perfect for living rooms, dining rooms, offices, beach houses, and entryways, this larger size becomes an eye-catching centerpiece that brings the beauty of Delaware’s landscapes into any room."
  }
];

function dcaEmptySizeLinks() {
  return {
    "8x10": { stripePaymentLink: "", stripePriceId: "" },
    "11x14": { stripePaymentLink: "", stripePriceId: "" },
    "12x12": { stripePaymentLink: "", stripePriceId: "" },
    "16x20": { stripePaymentLink: "", stripePriceId: "" }
  };
}

window.DCA_PRODUCTS = [
  {
    id: "dune-fence",
    title: "Dune Fence at Golden Hour",
    slug: "dune-fence.html",
    image: "dune-fence.jpg",
    medium: "Gallery-wrapped canvas",
    category: "Beaches",
    location: "Sussex County shoreline",
    description:
      "Weathered wood and wind-sculpted dunes catch the last warm light of a Sussex County sunset. A quiet coastal rhythm rendered for walls that need salt air and sky.",
    stripe: dcaEmptySizeLinks()
  },
  {
    id: "cape-henlopen-light",
    title: "Cape Henlopen Light",
    slug: "cape-henlopen-light.html",
    image: "cape-henlopen-light.jpg",
    medium: "Gallery-wrapped canvas",
    category: "Lighthouses",
    location: "Cape Henlopen",
    description:
      "A white beacon against a firelit sky—Cape Henlopen’s lighthouse standing watch as evening settles over the Atlantic. Bold color for a room that loves the coast.",
    stripe: dcaEmptySizeLinks()
  },
  {
    id: "great-blue-heron",
    title: "Great Blue Heron",
    slug: "great-blue-heron.html",
    image: "great-blue-heron.jpg",
    medium: "Gallery-wrapped canvas",
    category: "Wildlife",
    location: "Sussex County marsh",
    description:
      "Stillness in the golden marsh. A great blue heron waits among tall grass as warm light threads through the wetland—Delaware wildlife at its most graceful.",
    stripe: dcaEmptySizeLinks()
  },
  {
    id: "sandpiper-sunset",
    title: "Sandpiper Sunset",
    slug: "sandpiper-sunset.html",
    image: "sandpiper-sunset.jpg",
    medium: "Gallery-wrapped canvas",
    category: "Wildlife",
    location: "Delaware beach",
    description:
      "A sandpiper traces the wet sand as sunset paints the shoreline in peach and gold. An intimate coastal moment for smaller spaces and quiet corners.",
    stripe: dcaEmptySizeLinks()
  },
  {
    id: "lone-pine",
    title: "Lone Pine at Dusk",
    slug: "lone-pine.html",
    image: "lone-pine.jpg",
    medium: "Gallery-wrapped canvas",
    category: "Landscapes",
    location: "Delaware wetlands",
    description:
      "One pine mirrored in still water as dusk softens the sky. A contemplative landscape that brings Delaware’s quieter wild places indoors.",
    stripe: dcaEmptySizeLinks()
  },
  {
    id: "coastal-town",
    title: "Coastal Town Evening",
    slug: "coastal-town.html",
    image: "coastal-town.jpg",
    medium: "Gallery-wrapped canvas",
    category: "Places",
    location: "Sussex County town",
    description:
      "Floral planters, a vintage street clock, and boardwalk-style charm under golden evening light—the feeling of a Delaware beach town you want to keep.",
    stripe: dcaEmptySizeLinks()
  },
  {
    id: "glory-of-250-years",
    title: "The Glory of 250 Years",
    slug: "glory-of-250-years.html",
    image: "glory-of-250-years.jpg",
    medium: "Gallery-wrapped canvas",
    category: "Places",
    location: "Delaware Bay",
    description:
      "July 4th, 2026—from the deck of a boat on Delaware Bay, a weathered Stars and Stripes catches the night wind as fireworks bloom gold across the water. Two hundred fifty years of independence reflected in bay light and celebration, painted for walls that honor the First State’s lasting pride.",
    stripe: dcaEmptySizeLinks()
  }
];
