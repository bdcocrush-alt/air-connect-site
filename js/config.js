// Air Connect Ltd — Configuration, Constants & Instant Seed Data
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
    "BG": { name: "Biman Bangladesh Airlines", code: "BG", color: "#006a4e", hub: "DAC" },
    "BS": { name: "US-Bangla Airlines", code: "BS", color: "#004b87", hub: "DAC" },
    "VQ": { name: "Novoair", code: "VQ", color: "#0284c7", hub: "DAC" },
    "2A": { name: "Air Astra", code: "2A", color: "#d97706", hub: "DAC" },
    "MH": { name: "Malaysia Airlines", code: "MH", color: "#00205b", hub: "KUL" },
    "SQ": { name: "Singapore Airlines", code: "SQ", color: "#1d2d5c", hub: "SIN" },
    "EK": { name: "Emirates", code: "EK", color: "#d71921", hub: "DXB" },
    "SV": { name: "Saudia", code: "SV", color: "#006341", hub: "JED" },
    "QR": { name: "Qatar Airways", code: "QR", color: "#5c0632", hub: "DOH" },
    "AK": { name: "AirAsia", code: "AK", color: "#e11d48", hub: "KUL" },
    "OD": { name: "Batik Air", code: "OD", color: "#9333ea", hub: "KUL" },
    "TK": { name: "Turkish Airlines", code: "TK", color: "#c8102e", hub: "IST" },
    "TG": { name: "Thai Airways", code: "TG", color: "#4c1d95", hub: "BKK" },
    "GF": { name: "Gulf Air", code: "GF", color: "#92400e", hub: "BAH" },
    "KU": { name: "Kuwait Airways", code: "KU", color: "#1e3a8a", hub: "KWI" },
    "WY": { name: "Oman Air", code: "WY", color: "#0f766e", hub: "MCT" }
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
  },
  DEFAULT_AIRPORTS: [
    { code: "DAC", name: "Hazrat Shahjalal International Airport", city: "Dhaka", country: "Bangladesh", is_popular: true },
    { code: "CGP", name: "Shah Amanat International Airport", city: "Chattogram", country: "Bangladesh", is_popular: true },
    { code: "ZYL", name: "Osmani International Airport", city: "Sylhet", country: "Bangladesh", is_popular: true },
    { code: "CXB", name: "Cox's Bazar Airport", city: "Cox's Bazar", country: "Bangladesh", is_popular: true },
    { code: "SPD", name: "Saidpur Airport", city: "Saidpur", country: "Bangladesh", is_popular: false },
    { code: "JSR", name: "Jashore Airport", city: "Jashore", country: "Bangladesh", is_popular: false },
    { code: "RJH", name: "Shah Makhdum Airport", city: "Rajshahi", country: "Bangladesh", is_popular: false },
    { code: "BZL", name: "Barishal Airport", city: "Barishal", country: "Bangladesh", is_popular: false },
    { code: "KUL", name: "Kuala Lumpur International Airport", city: "Kuala Lumpur", country: "Malaysia", is_popular: true },
    { code: "DXB", name: "Dubai International Airport", city: "Dubai", country: "United Arab Emirates", is_popular: true },
    { code: "JED", name: "King Abdulaziz International Airport", city: "Jeddah", country: "Saudi Arabia", is_popular: true },
    { code: "MED", name: "Prince Mohammad Bin Abdulaziz Airport", city: "Madinah", country: "Saudi Arabia", is_popular: true },
    { code: "RUH", name: "King Khalid International Airport", city: "Riyadh", country: "Saudi Arabia", is_popular: true },
    { code: "SIN", name: "Changi Airport", city: "Singapore", country: "Singapore", is_popular: true },
    { code: "BKK", name: "Suvarnabhumi Airport", city: "Bangkok", country: "Thailand", is_popular: true },
    { code: "DOH", name: "Hamad International Airport", city: "Doha", country: "Qatar", is_popular: true },
    { code: "IST", name: "Istanbul Airport", city: "Istanbul", country: "Turkey", is_popular: true },
    { code: "MLE", name: "Velana International Airport", city: "Male", country: "Maldives", is_popular: true },
    { code: "LHR", name: "Heathrow Airport", city: "London", country: "United Kingdom", is_popular: true },
    { code: "JFK", name: "John F. Kennedy International Airport", city: "New York", country: "United States", is_popular: true }
  ],
  DEFAULT_FLIGHTS: [
    { airline: "Biman Bangladesh Airlines", airline_code: "BG", flight_number: "BG-038", from_city: "Dhaka", from_code: "DAC", to_city: "Jeddah", to_code: "JED", departure_time: "18:30", arrival_time: "23:15", trip_type: "Round Trip", cabin_class: "Economy", fare_type: "Umrah", base_fare: 64500, taxes: 8500, discount_pct: 12, baggage: "40 KG Check-in + 7 KG Cabin + 5L Zamzam", duration: "7h 45m", stops: "Non-Stop", refundable: true },
    { airline: "Saudia", airline_code: "SV", flight_number: "SV-805", from_city: "Dhaka", from_code: "DAC", to_city: "Madinah", to_code: "MED", departure_time: "03:15", arrival_time: "07:45", trip_type: "Round Trip", cabin_class: "Economy", fare_type: "Umrah", base_fare: 71000, taxes: 9000, discount_pct: 10, baggage: "2x23 KG Check-in + 7 KG Cabin + 5L Zamzam", duration: "7h 30m", stops: "Non-Stop", refundable: true },
    { airline: "Malaysia Airlines", airline_code: "MH", flight_number: "MH-197", from_city: "Dhaka", from_code: "DAC", to_city: "Kuala Lumpur", to_code: "KUL", departure_time: "23:55", arrival_time: "05:50", trip_type: "One Way", cabin_class: "Economy", fare_type: "Regular", base_fare: 26800, taxes: 4200, discount_pct: 15, baggage: "30 KG Check-in + 7 KG Cabin", duration: "3h 55m", stops: "Non-Stop", refundable: true },
    { airline: "US-Bangla Airlines", airline_code: "BS", flight_number: "BS-341", from_city: "Dhaka", from_code: "DAC", to_city: "Dubai", to_code: "DXB", departure_time: "19:00", arrival_time: "22:30", trip_type: "One Way", cabin_class: "Economy", fare_type: "Labour", base_fare: 36500, taxes: 5200, discount_pct: 8, baggage: "30 KG Check-in + 7 KG Cabin", duration: "5h 30m", stops: "Non-Stop", refundable: true },
    { airline: "Singapore Airlines", airline_code: "SQ", flight_number: "SQ-447", from_city: "Dhaka", from_code: "DAC", to_city: "Singapore", to_code: "SIN", departure_time: "23:55", arrival_time: "06:05", trip_type: "Round Trip", cabin_class: "Economy", fare_type: "Regular", base_fare: 38900, taxes: 5600, discount_pct: 15, baggage: "30 KG Check-in + 7 KG Cabin", duration: "4h 10m", stops: "Non-Stop", refundable: true },
    { airline: "Emirates", airline_code: "EK", flight_number: "EK-585", from_city: "Dhaka", from_code: "DAC", to_city: "Dubai", to_code: "DXB", departure_time: "01:40", arrival_time: "04:45", trip_type: "Round Trip", cabin_class: "Economy", fare_type: "Regular", base_fare: 52000, taxes: 6800, discount_pct: 10, baggage: "30 KG Check-in + 7 KG Cabin", duration: "5h 05m", stops: "Non-Stop", refundable: true },
    { airline: "Qatar Airways", airline_code: "QR", flight_number: "QR-639", from_city: "Dhaka", from_code: "DAC", to_city: "London", to_code: "LHR", departure_time: "03:20", arrival_time: "11:45", trip_type: "One Way", cabin_class: "Economy", fare_type: "Student", base_fare: 78500, taxes: 11500, discount_pct: 14, baggage: "40 KG Student Baggage + 7 KG Cabin", duration: "13h 25m", stops: "1 Stop (DOH)", refundable: true },
    { airline: "US-Bangla Airlines", airline_code: "BS", flight_number: "BS-141", from_city: "Dhaka", from_code: "DAC", to_city: "Cox's Bazar", to_code: "CXB", departure_time: "08:15", arrival_time: "09:20", trip_type: "One Way", cabin_class: "Economy", fare_type: "Regular", base_fare: 4299, taxes: 700, discount_pct: 10, baggage: "20 KG Check-in + 7 KG Cabin", duration: "1h 05m", stops: "Non-Stop", refundable: true }
  ],
  DEFAULT_BANNERS: [
    { title: "15% OFF Singapore Airlines Flights", subtitle: "Fly from Dhaka to Singapore, Australia & USA with special Air Connect fares.", badge_text: "FLIGHT DEAL", service_tab: "flight", image_url: "assets/promo-singapore-airlines.png" },
    { title: "14 Days All-Inclusive Umrah Package", subtitle: "Direct Biman/Saudia flights, Visa, Hotels near Haram & Guided Ziyarah from BDT 1,18,500.", badge_text: "UMRAH SPECIAL", service_tab: "umrah", image_url: "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&w=1200&q=80" },
    { title: "Explore Cox's Bazar & Himchori in 5-Star Luxury", subtitle: "3 Days Beach Resort + Return Air Ticket from BDT 14,900 per person.", badge_text: "BANGLADESH TOUR", service_tab: "tour", image_url: "assets/himchori-coxs-bazar.webp" },
    { title: "Malaysia & Dubai Holiday Mega Sale", subtitle: "Complete 5-Day Tour Packages with Hotel, Transfers & Sightseeing.", badge_text: "HOLIDAY OFFER", service_tab: "tour", image_url: "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&w=1200&q=80" }
  ]
};
