window.ACI_CONFIG = {
  companyName: "Absolute Custom Installations",
  shortName: "ACI",
  tagline: "REPAIR • REMODEL • RENOVATE",
  phoneDisplay: "409-919-0038",
  phoneHref: "tel:4099190038",
  location: "Galveston County, Texas",
  serviceArea: "Galveston County and surrounding Houston–Galveston communities",
  notificationEmail: "acibuildstx@gmail.com",
  mediaBaseUrl: "", // Leave empty when photos/ is hosted in Pages, or set to your R2 custom domain (e.g. "https://media.yourdomain.com")

  hero: {
    eyebrow: "GALVESTON COUNTY RESIDENTIAL & COMMERCIAL CONSTRUCTION",
    headline: "Built with skill. Finished with pride.",
    subheadline: "Dependable repairs, thoughtful remodels, and substantial renovations across Galveston County—delivered by one accountable, multi-trade team.",
    heroImage: "photos/kitchens/cover.webp", // Actual ACI finished kitchen project photograph
    heroCaption: "ACI Completed Kitchen Remodel • Galveston County, TX",
    primaryCta: "REQUEST SERVICE",
    secondaryCta: "CALL NOW: 409-919-0038"
  },

  principalServices: [
    {
      id: "repair",
      code: "01",
      title: "REPAIR",
      subtitle: "Everyday Property Problems & Practical Solutions",
      description: "Residential and commercial repairs, preventative maintenance, carpentry, drywall, fixture installations, and smaller service calls handled promptly and cleanly.",
      highlights: [
        "Doors, windows, trim, siding & drywall repair",
        "Interior & exterior punch-list items",
        "Plumbing & electrical fixture replacements",
        "Reliable residential & commercial upkeep"
      ]
    },
    {
      id: "remodel",
      code: "02",
      title: "REMODEL",
      subtitle: "Targeted Upgrades & Interior/Exterior Craftsmanship",
      description: "Complete kitchen and bathroom remodels, custom cabinetry, flooring, tile work, decks, patios, and fencing tailored to coastal Texas living.",
      highlights: [
        "Full kitchen & bathroom transformations",
        "Custom cabinetry, countertops & tile installations",
        "Hardwood, LVP & coastal-grade flooring",
        "Custom decks, covered patios & perimeter fencing"
      ]
    },
    {
      id: "renovate",
      code: "03",
      title: "RENOVATE",
      subtitle: "Substantial Improvements & Structural Reconstruction",
      description: "Comprehensive home renovations, structural reconstruction, storm recovery, and commercial space improvements managed from framing to final finish.",
      highlights: [
        "Whole-home & multi-room renovations",
        "Structural framing, subfloor & layout reconfiguration",
        "Residential & commercial build-outs",
        "Coordinated multi-trade project execution"
      ]
    }
  ],

  propertyManagement: {
    title: "PROPERTY MANAGEMENT & RENTAL SERVICES",
    body: "From the initial punch list through final completion, we work with property managers, investors, and rental owners to handle make-readies, repairs, renovations, and ongoing property maintenance.",
    tagline: "Practical solutions. Quality workmanship. One dependable contractor.",
    ctaLabel: "REQUEST PROPERTY SERVICES"
  },

  about: {
    eyebrow: "ABOUT ACI",
    headline: "25 Years of Hands-On Experience in the Construction Industry.",
    body: "Absolute Custom Installations was built on a straightforward promise: show up when we say we will, communicate clearly, and deliver honest workmanship on every job—whether you need a single door repaired or an entire home renovated. Serving homeowners, businesses, and property managers across Galveston County.",
    pillars: [
      { label: "Multi-Trade Capability", detail: "One dependable team for carpentry, tile, cabinetry, painting, exteriors, and structural work." },
      { label: "Coastal Craftsmanship", detail: "Materials and installation methods suited for Galveston County humidity and weather." },
      { label: "Clear Communication", detail: "Straightforward scopes, documented progress, and direct owner accountability." }
    ]
  },

  // Gallery categories include a separate, owner-reviewed before/after collection.
  starterCategories: [
    {
      slug: "kitchens",
      name: "Kitchen Remodels",
      visible: true,
      sort_order: 1,
      photos: [
        { id: "ki1", url: "photos/kitchens/cover.webp", caption: "Black Cabinet Kitchen with Full-Height Tile", is_cover: true },
        { id: "ki2", url: "photos/kitchens/3.webp", caption: "White Cabinetry and Backsplash", is_cover: false },
        { id: "ki3", url: "photos/kitchens/4.webp", caption: "Wood Cabinets and Dark Countertops", is_cover: false },
        { id: "ki4", url: "photos/kitchens/5.webp", caption: "Kitchen Sink and Countertop Installation", is_cover: false },
        { id: "ki5", url: "photos/kitchens/2.webp", caption: "Black Cabinet Kitchen Detail", is_cover: false }
      ]
    },
    {
      slug: "bathrooms",
      name: "Bathroom Remodels",
      visible: true,
      sort_order: 2,
      photos: [
        { id: "ba1", url: "photos/bathrooms/6.webp", caption: "Finished Walk-In Shower", is_cover: true },
        { id: "ba2", url: "photos/bathrooms/5.webp", caption: "Tiled Shower with Built-In Benches", is_cover: false },
        { id: "ba3", url: "photos/bathrooms/7.webp", caption: "Bathroom Vanity and Granite Countertop", is_cover: false },
        { id: "ba4", url: "photos/bathrooms/8.webp", caption: "Finished Bathroom with Bathtub", is_cover: false },
        { id: "ba5", url: "photos/bathrooms/9.webp", caption: "Custom Bathroom Vanity and Mirror", is_cover: false }
      ]
    },
    {
      slug: "flooring-tile",
      name: "Tile Work",
      visible: true,
      sort_order: 3,
      photos: [
        { id: "fl1", url: "photos/flooring-tile/6.webp", caption: "Tiled Shower with Niches and Bench", is_cover: true },
        { id: "fl2", url: "photos/flooring-tile/7.webp", caption: "Glass-Enclosed Shower with Tile", is_cover: false },
        { id: "fl3", url: "photos/flooring-tile/8.webp", caption: "Wood-Look Tile Floor", is_cover: false },
        { id: "fl4", url: "photos/flooring-tile/9.webp", caption: "Wood-Look Tile Floor, Wide View", is_cover: false },
        { id: "fl5", url: "photos/flooring-tile/10.webp", caption: "Tile Feature Around Fireplace", is_cover: false }
      ]
    },
    {
      slug: "cabinetry",
      name: "Cabinets",
      visible: true,
      sort_order: 4,
      photos: [
        { id: "ca1", url: "photos/cabinetry/4.webp", caption: "Shelving Unit with Countertop", is_cover: true },
        { id: "ca2", url: "photos/cabinetry/2.webp", caption: "Cabinet Construction in Progress", is_cover: false },
        { id: "ca3", url: "photos/cabinetry/1.webp", caption: "Cabinets and Shelving in Workshop", is_cover: false }
      ]
    },
    {
      slug: "decks",
      name: "Decks",
      visible: true,
      sort_order: 5,
      photos: [
        { id: "d1", url: "photos/decks/cover.webp", caption: "Coastal Treated Wood Deck & Railing", is_cover: true },
        { id: "d2", url: "photos/decks/1.webp", caption: "Elevated Deck Framing & Stairs", is_cover: false },
        { id: "d3", url: "photos/decks/2.webp", caption: "Custom Outdoor Deck Construction", is_cover: false }
      ]
    },
    {
      slug: "patios",
      name: "Patios",
      visible: true,
      sort_order: 6,
      photos: [
        { id: "p1", url: "photos/patios/cover.webp", caption: "Covered Outdoor Patio & Living Space", is_cover: true },
        { id: "p2", url: "photos/patios/1.webp", caption: "Patio Enclosure & Exterior Finish", is_cover: false },
        { id: "p3", url: "photos/patios/2.webp", caption: "Backyard Patio Upgrade", is_cover: false }
      ]
    },
    {
      slug: "windows-doors",
      name: "Windows & Doors",
      visible: true,
      sort_order: 7,
      photos: [
        { id: "wd1", url: "photos/windows-doors/cover.webp", caption: "Exterior Entry Door & Trim Installation", is_cover: true },
        { id: "wd2", url: "photos/windows-doors/1.webp", caption: "Energy-Efficient Window Replacement", is_cover: false },
        { id: "wd3", url: "photos/windows-doors/2.webp", caption: "Interior Door & Casing Carpentry", is_cover: false }
      ]
    },
    {
      slug: "property-maintenance",
      name: "Property Maintenance",
      visible: true,
      sort_order: 8,
      photos: [
        { id: "pm1", url: "photos/property-maintenance/cover.webp", caption: "Rental Turnover & Make-Ready Repairs", is_cover: true },
        { id: "pm2", url: "photos/property-maintenance/1.webp", caption: "Commercial & Residential Upkeep", is_cover: false },
        { id: "pm3", url: "photos/property-maintenance/2.webp", caption: "Punch-List Completion & Hardware Repair", is_cover: false }
      ]
    },
    {
      slug: "carpentry",
      name: "Carpentry",
      visible: true,
      sort_order: 9,
      photos: [
        { id: "cp1", url: "photos/carpentry/cover.webp", caption: "Custom Finish Carpentry & Trim", is_cover: true },
        { id: "cp2", url: "photos/carpentry/1.webp", caption: "Structural Woodwork & Framing", is_cover: false },
        { id: "cp3", url: "photos/carpentry/2.webp", caption: "Architectural Molding & Stair Detail", is_cover: false }
      ]
    },
    {
      slug: "renovations",
      name: "Renovations",
      visible: true,
      sort_order: 10,
      photos: [
        { id: "rn1", url: "photos/renovations/cover.webp", caption: "Full Interior Structural Renovation", is_cover: true },
        { id: "rn2", url: "photos/renovations/1.webp", caption: "Whole-Room Reconstruction", is_cover: false },
        { id: "rn3", url: "photos/renovations/2.webp", caption: "Residential Modernization Project", is_cover: false }
      ]
    },
    {
      slug: "painting",
      name: "Painting",
      visible: true,
      sort_order: 11,
      photos: [
        { id: "pt1", url: "photos/painting/cover.webp", caption: "Interior & Exterior Precision Painting", is_cover: true },
        { id: "pt2", url: "photos/painting/1.webp", caption: "Cabinet & Trim Refinishing", is_cover: false },
        { id: "pt3", url: "photos/painting/2.webp", caption: "Clean Surface Prep & Coastal Coatings", is_cover: false }
      ]
    },
    {
      slug: "fences",
      name: "Fences",
      visible: true,
      sort_order: 12,
      photos: [
        { id: "fn1", url: "photos/fences/cover.webp", caption: "Cedar Privacy Fence & Gate Construction", is_cover: true },
        { id: "fn2", url: "photos/fences/1.webp", caption: "Reinforced Wind-Resistant Post Installation", is_cover: false },
        { id: "fn3", url: "photos/fences/2.webp", caption: "Custom Residential Fencing", is_cover: false }
      ]
    },
    {
      slug: "roofing",
      name: "Roofing",
      visible: false, // Toggle visible in /admin once Roofing photos are uploaded
      sort_order: 13,
      photos: []
    },
    {
      slug: "custom-installations",
      name: "Custom Installations",
      visible: false, // Editable category slot #14 in /admin
      sort_order: 14,
      photos: []
    },
    {
      slug: "before-after",
      name: "Before & After",
      visible: true,
      sort_order: 16,
      photos: [
        {
                "id": "ba1",
                "url": "photos/before-after/01-stairs-after.webp",
                "before_url": "photos/before-after/01-stairs-before.webp",
                "caption": "Exterior Stair Rebuild",
                "is_cover": true
        },
        {
                "id": "ba2",
                "url": "photos/before-after/02-kitchen-after.webp",
                "before_url": "photos/before-after/02-kitchen-before.webp",
                "caption": "Kitchen Cabinet and Countertop Upgrade",
                "is_cover": false
        },
        {
                "id": "ba3",
                "url": "photos/before-after/03-flooring-after.webp",
                "before_url": "photos/before-after/03-flooring-before.webp",
                "caption": "Floor Reconstruction and Tile Installation",
                "is_cover": false
        },
        {
                "id": "ba4",
                "url": "photos/before-after/04-siding-after.webp",
                "before_url": "photos/before-after/04-siding-before.webp",
                "caption": "Exterior Siding Replacement in Progress",
                "is_cover": false
        }
]
    },
    {
      slug: "exterior-siding",
      name: "Exterior & Siding",
      visible: false, // Editable category slot #15 in /admin
      sort_order: 15,
      photos: []
    }
  ]
};
