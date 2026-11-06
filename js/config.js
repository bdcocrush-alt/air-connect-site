// Air Connect Ltd — Configuration & Constants
window.AIRCONNECT_CONFIG = {
  SUPABASE_URL: "https://jemwovidbymdztofwgsd.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImplbXdvdmlkYnltZHp0b2Z3Z3NkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM5ODA1MjgsImV4cCI6MjEwOTU1NjUyOH0.y7E6i5pB1fe0bCzGihIeDnZLaxEv3_3ELdJj0-LQCkg",
  DEFAULT_CURRENCY: "BDT",
  CURRENCIES: {
    BDT: { code: "BDT", symbol: "৳", rate: 1, label: "BDT (৳)" },
    USD: { code: "USD", symbol: "$", rate: 0.0083, label: "USD ($)" },
    MYR: { code: "MYR", symbol: "RM", rate: 0.037, label: "MYR (RM)" },
    SAR: { code: "SAR", symbol: "SAR ", rate: 0.031, label: "SAR (﷼)" }
  },
  AIRLINES: {
    BG: { name: "Biman Bangladesh Airlines", code: "BG", color: "#006a4e", hub: "DAC" },
    BS: { name: "US-Bangla Airlines", code: "BS", color: "#004b87", hub: "DAC" },
    VQ: { name: "Novoair", code: "VQ", color: "#0284c7", hub: "DAC" },
    2A: { name: "Air Astra", code: "2A", color: "#d97706", hub: "DAC" },
    MH: { name: "Malaysia Airlines", code: "MH", color: "#00205b", hub: "KUL" },
    SQ: { name: "Singapore Airlines", code: "SQ", color: "#1d2d5c", hub: "SIN" },
    EK: { name: "Emirates", code: "EK", color: "#d71921", hub: "DXB" },
    SV: { name: "Saudia", code: "SV", color: "#006341", hub: "JED" },
    QR: { name: "Qatar Airways", code: "QR", color: "#5c0632", hub: "DOH" },
    AK: { name: "AirAsia", code: "AK", color: "#e11d48", hub: "KUL" },
    OD: { name: "Batik Air", code: "OD", color: "#9333ea", hub: "KUL" },
    TK: { name: "Turkish Airlines", code: "TK", color: "#c8102e", hub: "IST" },
    TG: { name: "Thai Airways", code: "TG", color: "#4c1d95", hub: "BKK" },
    GF: { name: "Gulf Air", code: "GF", color: "#92400e", hub: "BAH" },
    KU: { name: "Kuwait Airways", code: "KU", color: "#1e3a8a", hub: "KWI" },
    WY: { name: "Oman Air", code: "WY", color: "#0f766e", hub: "MCT" }
  },
  HERO_BANNERS: {
    flight: {
      title: "From Plans to Paradise — Instantly",
      subtitle: "Search real-time fares, Student & Umrah tickets, and book with instant hold or easy payment.",
      bg: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1800&q=80"
    },
    hotel: {
      title: "Find Your Perfect Stay Worldwide",
      subtitle: "Handpicked 3-star to 5-star hotels in Makkah, Madinah, Cox's Bazar, Kuala Lumpur & Dubai.",
      bg: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1800&q=80"
    },
    tour: {
      title: "Unforgettable Holidays in Bangladesh & Abroad",
      subtitle: "All-inclusive Inbound & Outbound tour packages with flights, hotels, transfers & guided sightseeing.",
      bg: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1800&q=80"
    },
    umrah: {
      title: "Begin Your Blessed Hajj & Umrah Journey",
      subtitle: "Complete spiritual packages with direct flights, e-Visa, Haram-view hotels, and experienced Muallim guides.",
      bg: "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&w=1800&q=80"
    },
    visa: {
      title: "Fast & Reliable Global Visa Processing",
      subtitle: "Express e-Visa and sticker visa support for Malaysia, UAE, Saudi Arabia, Thailand, Singapore & Schengen.",
      bg: "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=1800&q=80"
    }
  }
};
