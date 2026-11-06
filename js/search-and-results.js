// Air Connect Ltd — Search Engine, Dynamic Route Generator, Filters & Detail Modals
(function () {
  const cfg = window.AIRCONNECT_CONFIG;

  const searchState = {
    activeTab: "flight",
    flight: {
      tripType: "One Way",
      fareType: "Regular",
      from: "DAC",
      to: "JED",
      departDate: getFutureDate(7),
      returnDate: getFutureDate(21),
      adults: 1,
      children: 0,
      infants: 0,
      cabin: "Economy"
    },
    hotel: {
      city: "All",
      checkIn: getFutureDate(7),
      checkOut: getFutureDate(10),
      guests: 2,
      rooms: 1
    },
    tour: {
      category: "ALL",
      destination: "",
      travelDate: getFutureDate(14),
      adults: 2
    },
    umrah: {
      category: "UMRAH",
      level: "All",
      month: "2026-12",
      adults: 2
    },
    visa: {
      country: "All",
      applicants: 1
    },
    filters: {
      maxPrice: 250000,
      nonStopOnly: false,
      refundableOnly: false,
      airline: "ALL",
      sortBy: "cheapest"
    },
    currentResults: []
  };

  function getFutureDate(days) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split("T")[0];
  }

  function getAirportDisplay(code) {
    const ap = window.AC.state.airports.find(a => a.code === code);
    if (ap) return `${ap.city} (${ap.code}) — ${ap.name}`;
    return code;
  }

  function getAirportCity(code) {
    const ap = window.AC.state.airports.find(a => a.code === code);
    return ap ? ap.city : code;
  }

  function switchSearchTab(tab) {
    if (!cfg.HERO_BANNERS[tab]) tab = "flight";
    searchState.activeTab = tab;

    // Update Hero Banner
    const heroInfo = cfg.HERO_BANNERS[tab];
    const heroEl = document.getElementById("hero-banner");
    const titleEl = document.getElementById("hero-title");
    const subEl = document.getElementById("hero-subtitle");
    if (heroEl && heroInfo) heroEl.style.backgroundImage = `url('${heroInfo.bg}')`;
    if (titleEl && heroInfo) titleEl.textContent = heroInfo.title;
    if (subEl && heroInfo) subEl.textContent = heroInfo.subtitle;

    // Update Active Buttons
    document.querySelectorAll("[data-search-tab]").forEach(btn => {
      btn.classList.toggle("active", btn.getAttribute("data-search-tab") === tab);
    });
    document.querySelectorAll("[data-header-tab]").forEach(btn => {
      btn.classList.toggle("active", btn.getAttribute("data-header-tab") === tab);
    });

    renderSearchBox();
  }

  function renderSearchBox() {
    const container = document.getElementById("search-box-body");
    if (!container) return;
    const { escapeHtml } = window.AC;
    const airports = window.AC.state.airports.length
      ? window.AC.state.airports
      : [
          { code: "DAC", city: "Dhaka", name: "Hazrat Shahjalal Int. Airport", country: "Bangladesh" },
          { code: "CXB", city: "Cox's Bazar", name: "Cox's Bazar Airport", country: "Bangladesh" },
          { code: "CGP", city: "Chattogram", name: "Shah Amanat Int. Airport", country: "Bangladesh" },
          { code: "ZYL", city: "Sylhet", name: "Osmani Int. Airport", country: "Bangladesh" },
          { code: "JED", city: "Jeddah", name: "King Abdulaziz Int. Airport", country: "Saudi Arabia" },
          { code: "MED", city: "Madinah", name: "Prince Mohammad Int. Airport", country: "Saudi Arabia" },
          { code: "KUL", city: "Kuala Lumpur", name: "KLIA", country: "Malaysia" },
          { code: "DXB", city: "Dubai", name: "Dubai Int. Airport", country: "UAE" },
          { code: "SIN", city: "Singapore", name: "Changi Airport", country: "Singapore" },
          { code: "BKK", city: "Bangkok", name: "Suvarnabhumi Airport", country: "Thailand" },
          { code: "DOH", city: "Doha", name: "Hamad Int. Airport", country: "Qatar" },
          { code: "LHR", city: "London", name: "Heathrow Airport", country: "UK" }
        ];

    const tab = searchState.activeTab;

    if (tab === "flight") {
      const f = searchState.flight;
      const airportOptions = dir =>
        airports
          .map(
            a =>
              `<option value="${escapeHtml(a.code)}" ${f[dir] === a.code ? "selected" : ""}>${escapeHtml(a.city)} (${escapeHtml(a.code)}) - ${escapeHtml(a.country)}</option>`
          )
          .join("");

      container.innerHTML = `
        <div class="search-top-controls">
          <div class="trip-type-group">
            ${["One Way", "Round Trip", "Multi-City"]
              .map(
                t => `
              <label class="pill-radio ${f.tripType === t ? "active" : ""}">
                <input type="radio" name="tripType" value="${t}" ${f.tripType === t ? "checked" : ""}>
                ${t}
              </label>`
              )
              .join("")}
          </div>
          <div class="fare-type-group">
            <span class="fare-tag-label">Fare Type:</span>
            ${["Regular", "Student", "Labour", "Umrah"]
              .map(
                ft => `
              <label class="pill-radio ${f.fareType === ft ? "active" : ""}">
                <input type="radio" name="fareType" value="${ft}" ${f.fareType === ft ? "checked" : ""}>
                ${ft}
              </label>`
              )
              .join("")}
          </div>
        </div>

        <form id="ota-flight-form" class="search-grid-flight">
          <div class="field-box">
            <label>From (Origin)</label>
            <select id="fl-from">${airportOptions("from")}</select>
            <small id="fl-from-sub">${escapeHtml(getAirportDisplay(f.from))}</small>
          </div>

          <button type="button" class="swap-btn" id="fl-swap-btn" title="Swap Airports">⇄</button>

          <div class="field-box">
            <label>To (Destination)</label>
            <select id="fl-to">${airportOptions("to")}</select>
            <small id="fl-to-sub">${escapeHtml(getAirportDisplay(f.to))}</small>
          </div>

          <div class="field-box">
            <label>Journey Date</label>
            <input type="date" id="fl-depart" value="${f.departDate}" required>
            <small>${f.fareType} Fare</small>
          </div>

          <div class="field-box" style="${f.tripType === "One Way" ? "opacity:0.55" : ""}">
            <label>Return Date</label>
            <input type="date" id="fl-return" value="${f.returnDate}" ${f.tripType === "One Way" ? "disabled" : ""}>
            <small>${f.tripType === "One Way" ? "Select Round Trip to add" : "Return Journey"}</small>
          </div>

          <div class="field-box">
            <label>Travellers & Class</label>
            <div style="display:flex;gap:6px;align-items:center">
              <select id="fl-adults" title="Adults" style="width:48%">
                ${[1, 2, 3, 4, 5, 6].map(n => `<option value="${n}" ${f.adults === n ? "selected" : ""}>${n} Adult${n > 1 ? "s" : ""}</option>`).join("")}
              </select>
              <select id="fl-cabin" title="Cabin Class" style="width:52%">
                ${["Economy", "Premium Economy", "Business", "First"].map(c => `<option value="${c}" ${f.cabin === c ? "selected" : ""}>${c}</option>`).join("")}
              </select>
            </div>
            <small>Children: <input type="number" id="fl-children" min="0" max="5" value="${f.children}" style="width:36px;display:inline;font-size:11px;padding:0"> | Infants: <input type="number" id="fl-infants" min="0" max="3" value="${f.infants}" style="width:36px;display:inline;font-size:11px;padding:0"></small>
          </div>

          <button type="submit" class="btn btn-primary search-submit-btn">
            🔍 Search
          </button>
        </form>
      `;

      container.querySelectorAll('input[name="tripType"]').forEach(r => {
        r.addEventListener("change", e => {
          searchState.flight.tripType = e.target.value;
          renderSearchBox();
        });
      });
      container.querySelectorAll('input[name="fareType"]').forEach(r => {
        r.addEventListener("change", e => {
          searchState.flight.fareType = e.target.value;
          renderSearchBox();
        });
      });
      document.getElementById("fl-from")?.addEventListener("change", e => {
        searchState.flight.from = e.target.value;
        document.getElementById("fl-from-sub").textContent = getAirportDisplay(e.target.value);
      });
      document.getElementById("fl-to")?.addEventListener("change", e => {
        searchState.flight.to = e.target.value;
        document.getElementById("fl-to-sub").textContent = getAirportDisplay(e.target.value);
      });
      document.getElementById("fl-swap-btn")?.addEventListener("click", () => {
        const tmp = searchState.flight.from;
        searchState.flight.from = searchState.flight.to;
        searchState.flight.to = tmp;
        renderSearchBox();
      });
      document.getElementById("ota-flight-form")?.addEventListener("submit", e => {
        e.preventDefault();
        searchState.flight.from = document.getElementById("fl-from").value;
        searchState.flight.to = document.getElementById("fl-to").value;
        searchState.flight.departDate = document.getElementById("fl-depart").value;
        searchState.flight.returnDate = document.getElementById("fl-return").value;
        searchState.flight.adults = Number(document.getElementById("fl-adults").value || 1);
        searchState.flight.children = Number(document.getElementById("fl-children").value || 0);
        searchState.flight.infants = Number(document.getElementById("fl-infants").value || 0);
        searchState.flight.cabin = document.getElementById("fl-cabin").value;
        if (searchState.flight.from === searchState.flight.to) {
          window.AC.showToast("Origin and destination airports cannot be the same.", "error");
          return;
        }
        executeFlightSearch();
      });
      return;
    }

    if (tab === "hotel") {
      const h = searchState.hotel;
      const cities = ["All", ...new Set(window.AC.state.hotels.map(x => x.city))];
      container.innerHTML = `
        <form id="ota-hotel-form" class="search-grid-generic">
          <div class="field-box">
            <label>Destination City / Hotel</label>
            <select id="ht-city">
              ${cities.map(c => `<option value="${escapeHtml(c)}" ${h.city === c ? "selected" : ""}>${c === "All" ? "All Destinations (Makkah, Cox's Bazar, KL, Dubai...)" : escapeHtml(c)}</option>`).join("")}
            </select>
            <small>Verified 3★ to 5★ Partner Properties</small>
          </div>
          <div class="field-box">
            <label>Check-In Date</label>
            <input type="date" id="ht-in" value="${h.checkIn}" required>
            <small>2:00 PM Check-In</small>
          </div>
          <div class="field-box">
            <label>Check-Out Date</label>
            <input type="date" id="ht-out" value="${h.checkOut}" required>
            <small>12:00 PM Check-Out</small>
          </div>
          <div class="field-box">
            <label>Rooms & Guests</label>
            <div style="display:flex;gap:8px">
              <select id="ht-rooms">
                ${[1, 2, 3, 4].map(n => `<option value="${n}" ${h.rooms === n ? "selected" : ""}>${n} Room${n > 1 ? "s" : ""}</option>`).join("")}
              </select>
              <select id="ht-guests">
                ${[1, 2, 3, 4, 5, 6].map(n => `<option value="${n}" ${h.guests === n ? "selected" : ""}>${n} Guest${n > 1 ? "s" : ""}</option>`).join("")}
              </select>
            </div>
            <small>Instant Room Confirmation</small>
          </div>
          <button type="submit" class="btn btn-primary search-submit-btn">🔍 Search Hotels</button>
        </form>
      `;
      document.getElementById("ota-hotel-form")?.addEventListener("submit", e => {
        e.preventDefault();
        searchState.hotel.city = document.getElementById("ht-city").value;
        searchState.hotel.checkIn = document.getElementById("ht-in").value;
        searchState.hotel.checkOut = document.getElementById("ht-out").value;
        searchState.hotel.rooms = Number(document.getElementById("ht-rooms").value || 1);
        searchState.hotel.guests = Number(document.getElementById("ht-guests").value || 2);
        executeHotelSearch();
      });
      return;
    }

    if (tab === "tour") {
      const t = searchState.tour;
      container.innerHTML = `
        <form id="ota-tour-form" class="search-grid-generic">
          <div class="field-box">
            <label>Holiday Type</label>
            <select id="tr-cat">
              <option value="ALL" ${t.category === "ALL" ? "selected" : ""}>All Holidays (Inbound & Outbound)</option>
              <option value="INBOUND_TOUR" ${t.category === "INBOUND_TOUR" ? "selected" : ""}>Explore Bangladesh (Inbound Tours)</option>
              <option value="OUTBOUND_TOUR" ${t.category === "OUTBOUND_TOUR" ? "selected" : ""}>World Holidays (Outbound Tours)</option>
            </select>
            <small>Guided Group & Custom Family Packages</small>
          </div>
          <div class="field-box">
            <label>Destination Search</label>
            <input type="text" id="tr-dest" placeholder="e.g. Cox's Bazar, Malaysia, Dubai, Sundarbans" value="${escapeHtml(t.destination)}">
            <small>Search by city or country</small>
          </div>
          <div class="field-box">
            <label>Preferred Travel Date</label>
            <input type="date" id="tr-date" value="${t.travelDate}">
            <small>Flexible departures available</small>
          </div>
          <div class="field-box">
            <label>Travellers</label>
            <select id="tr-adults">
              ${[1, 2, 3, 4, 5, 6, 8, 10].map(n => `<option value="${n}" ${t.adults === n ? "selected" : ""}>${n} Traveller${n > 1 ? "s" : ""}</option>`).join("")}
            </select>
            <small>Group discounts for 4+ travellers</small>
          </div>
          <button type="submit" class="btn btn-primary search-submit-btn">🔍 Find Holidays</button>
        </form>
      `;
      document.getElementById("ota-tour-form")?.addEventListener("submit", e => {
        e.preventDefault();
        searchState.tour.category = document.getElementById("tr-cat").value;
        searchState.tour.destination = document.getElementById("tr-dest").value.trim();
        searchState.tour.travelDate = document.getElementById("tr-date").value;
        searchState.tour.adults = Number(document.getElementById("tr-adults").value || 2);
        executePackageSearch("TOUR");
      });
      return;
    }

    if (tab === "umrah") {
      const u = searchState.umrah;
      container.innerHTML = `
        <form id="ota-umrah-form" class="search-grid-generic">
          <div class="field-box">
            <label>Pilgrimage Type</label>
            <select id="um-cat">
              <option value="ALL_SPIRITUAL">All Hajj & Umrah Packages</option>
              <option value="UMRAH" ${u.category === "UMRAH" ? "selected" : ""}>Umrah Packages (10 - 14 Days)</option>
              <option value="HAJJ" ${u.category === "HAJJ" ? "selected" : ""}>Hajj Packages (Shifting & Non-Shifting)</option>
            </select>
            <small>Includes Visa, Flights, Haram Hotels & Muallim</small>
          </div>
          <div class="field-box">
            <label>Package Tier</label>
            <select id="um-level">
              <option value="All">All Tiers (Economy to 5★ VIP)</option>
              <option value="Economy">Economy Shuttle / Walking</option>
              <option value="Standard">Standard 3★ / 4★</option>
              <option value="Premium">Premium 5★</option>
              <option value="VIP">VIP 5★ Clock Tower Haram View</option>
            </select>
            <small>Makkah & Madinah Verified Hotels</small>
          </div>
          <div class="field-box">
            <label>Departure Month</label>
            <input type="month" id="um-month" value="${u.month}">
            <small>Weekly direct Biman & Saudia groups</small>
          </div>
          <div class="field-box">
            <label>Number of Pilgrims</label>
            <select id="um-adults">
              ${[1, 2, 3, 4, 5, 6, 8].map(n => `<option value="${n}" ${u.adults === n ? "selected" : ""}>${n} Pilgrim${n > 1 ? "s" : ""}</option>`).join("")}
            </select>
            <small>Twin / Quad sharing options</small>
          </div>
          <button type="submit" class="btn btn-primary search-submit-btn">🕋 Search Packages</button>
        </form>
      `;
      document.getElementById("ota-umrah-form")?.addEventListener("submit", e => {
        e.preventDefault();
        searchState.umrah.category = document.getElementById("um-cat").value;
        searchState.umrah.level = document.getElementById("um-level").value;
        searchState.umrah.month = document.getElementById("um-month").value;
        searchState.umrah.adults = Number(document.getElementById("um-adults").value || 2);
        executePackageSearch("UMRAH");
      });
      return;
    }

    if (tab === "visa") {
      const v = searchState.visa;
      const countries = ["All", ...new Set(window.AC.state.visaServices.map(x => x.country))];
      container.innerHTML = `
        <form id="ota-visa-form" class="search-grid-generic">
          <div class="field-box">
            <label>Destination Country</label>
            <select id="vs-country">
              ${countries.map(c => `<option value="${escapeHtml(c)}" ${v.country === c ? "selected" : ""}>${c === "All" ? "All Countries (Malaysia, UAE, Saudi, Thailand, Schengen...)" : escapeHtml(c)}</option>`).join("")}
            </select>
            <small>e-Visa & Sticker Visa Processing</small>
          </div>
          <div class="field-box">
            <label>Passport Nationality</label>
            <input type="text" value="Bangladeshi (Regular Passport)" readonly>
            <small>High approval rate document check</small>
          </div>
          <div class="field-box">
            <label>Applicants</label>
            <select id="vs-applicants">
              ${[1, 2, 3, 4, 5].map(n => `<option value="${n}" ${v.applicants === n ? "selected" : ""}>${n} Applicant${n > 1 ? "s" : ""}</option>`).join("")}
            </select>
            <small>Includes Checklist & Cover Letter Support</small>
          </div>
          <button type="submit" class="btn btn-primary search-submit-btn">🛂 Check Visa & Apply</button>
        </form>
      `;
      document.getElementById("ota-visa-form")?.addEventListener("submit", e => {
        e.preventDefault();
        searchState.visa.country = document.getElementById("vs-country").value;
        searchState.visa.applicants = Number(document.getElementById("vs-applicants").value || 1);
        executeVisaSearch();
      });
    }
  }

  // Generate matching + dynamic flights so any airport search works like a live OTA
  function generateFlightsForRoute(fromCode, toCode, tripType, cabin, fareType) {
    const fromCity = getAirportCity(fromCode);
    const toCity = getAirportCity(toCode);
    const roundMult = tripType === "Round Trip" ? 1.82 : 1;
    const cabinMult =
      cabin === "Business" ? 2.35 : cabin === "First" ? 3.4 : cabin === "Premium Economy" ? 1.45 : 1;

    // 1. Exact matches in database
    const dbMatches = window.AC.state.flightDeals
      .filter(
        d =>
          d.from_code.toUpperCase() === fromCode.toUpperCase() &&
          d.to_code.toUpperCase() === toCode.toUpperCase()
      )
      .map(d => ({
        ...d,
        trip_type: tripType,
        cabin_class: cabin,
        fare_type: fareType,
        computed_base: Math.round(Number(d.base_fare) * roundMult * cabinMult),
        computed_tax: Math.round(Number(d.taxes || 4500) * roundMult)
      }));

    // 2. Smart generated schedule options so user always sees 4-6 realistic flights
    const isDomestic = ["DAC", "CXB", "CGP", "ZYL", "SPD", "JSR", "RJH", "BZL"].includes(fromCode) &&
                       ["DAC", "CXB", "CGP", "ZYL", "SPD", "JSR", "RJH", "BZL"].includes(toCode);
    const baseSeed = isDomestic ? 4600 : ["JED", "MED", "RUH", "LHR", "JFK", "IST"].includes(toCode) ? 54000 : 28500;
    const taxSeed = isDomestic ? 750 : 5800;

    const templates = isDomestic
      ? [
          { code: "BG", airline: "Biman Bangladesh Airlines", fn: "BG-433", dep: "07:45", arr: "08:50", dur: "1h 05m", stops: "Non-Stop", factor: 1.0, ref: true },
          { code: "BS", airline: "US-Bangla Airlines", fn: "BS-143", dep: "11:15", arr: "12:20", dur: "1h 05m", stops: "Non-Stop", factor: 1.06, ref: true },
          { code: "VQ", airline: "Novoair", fn: "VQ-931", dep: "15:30", arr: "16:35", dur: "1h 05m", stops: "Non-Stop", factor: 1.04, ref: true },
          { code: "2A", airline: "Air Astra", fn: "2A-411", dep: "18:10", arr: "19:15", dur: "1h 05m", stops: "Non-Stop", factor: 0.96, ref: false }
        ]
      : [
          { code: "BG", airline: "Biman Bangladesh Airlines", fn: `BG-${100 + (toCode.charCodeAt(0) % 89)}`, dep: "09:15", arr: "14:30", dur: "5h 15m", stops: "Non-Stop", factor: 1.0, ref: true },
          { code: "BS", airline: "US-Bangla Airlines", fn: `BS-${300 + (toCode.charCodeAt(1) % 79)}`, dep: "18:40", arr: "23:10", dur: "4h 30m", stops: "Non-Stop", factor: 0.94, ref: true },
          { code: "SV", airline: "Saudia", fn: `SV-${802 + (toCode.charCodeAt(0) % 15)}`, dep: "03:20", arr: "08:10", dur: "6h 50m", stops: "Non-Stop", factor: 1.12, ref: true },
          { code: "EK", airline: "Emirates", fn: `EK-${583 + (toCode.charCodeAt(0) % 9)}`, dep: "01:40", arr: "07:55", dur: "6h 15m", stops: toCode === "DXB" ? "Non-Stop" : "1 Stop (DXB)", factor: 1.24, ref: true },
          { code: "QR", airline: "Qatar Airways", fn: `QR-${639 + (toCode.charCodeAt(0) % 7)}`, dep: "10:25", arr: "17:40", dur: "7h 15m", stops: toCode === "DOH" ? "Non-Stop" : "1 Stop (DOH)", factor: 1.18, ref: true },
          { code: "MH", airline: "Malaysia Airlines", fn: `MH-${197}`, dep: "23:55", arr: "05:50", dur: "3h 55m", stops: toCode === "KUL" ? "Non-Stop" : "1 Stop (KUL)", factor: 0.98, ref: false }
        ];

    const baggageByFare =
      fareType === "Student"
        ? "40 KG Student Baggage + 7 KG Cabin"
        : fareType === "Umrah"
        ? "40 KG Check-in + 7 KG Cabin + 5L Zamzam"
        : fareType === "Labour"
        ? "35 KG Labour Allowance + 7 KG Cabin"
        : isDomestic
        ? "20 KG Check-in + 7 KG Cabin"
        : "30 KG Check-in + 7 KG Cabin";

    const existingFlightNums = new Set(dbMatches.map(x => x.flight_number));
    const generated = templates
      .filter(t => !existingFlightNums.has(t.fn))
      .map((t, idx) => ({
        id: `gen-${fromCode}-${toCode}-${idx}`,
        airline: t.airline,
        airline_code: t.code,
        flight_number: t.fn,
        from_city: fromCity,
        from_code: fromCode,
        to_city: toCity,
        to_code: toCode,
        departure_time: t.dep,
        arrival_time: t.arr,
        duration: t.dur,
        stops: t.stops,
        trip_type: tripType,
        cabin_class: cabin,
        fare_type: fareType,
        baggage: baggageByFare,
        refundable: t.ref,
        discount_pct: idx % 2 === 0 ? 10 : 0,
        computed_base: Math.round(baseSeed * t.factor * roundMult * cabinMult),
        computed_tax: Math.round(taxSeed * roundMult)
      }));

    return [...dbMatches, ...generated];
  }

  function executeFlightSearch() {
    const f = searchState.flight;
    const allResults = generateFlightsForRoute(f.from, f.to, f.tripType, f.cabin, f.fareType);
    searchState.currentResults = allResults;
    renderFlightResultsSection();
    document.getElementById("results-section")?.scrollIntoView({ behavior: "smooth" });
  }

  function renderFlightResultsSection() {
    const sec = document.getElementById("results-section");
    if (!sec) return;
    sec.hidden = false;
    const f = searchState.flight;
    const flt = searchState.filters;
    const { formatMoney, escapeHtml } = window.AC;
    const paxTotal = f.adults + f.children + f.infants;

    const filtered = searchState.currentResults
      .filter(item => {
        const totalOnePax = item.computed_base + item.computed_tax;
        if (totalOnePax > flt.maxPrice) return false;
        if (flt.nonStopOnly && item.stops !== "Non-Stop") return false;
        if (flt.refundableOnly && !item.refundable) return false;
        if (flt.airline !== "ALL" && item.airline_code !== flt.airline) return false;
        return true;
      })
      .sort((a, b) => {
        if (flt.sortBy === "cheapest") return a.computed_base + a.computed_tax - (b.computed_base + b.computed_tax);
        return a.departure_time.localeCompare(b.departure_time);
      });

    const airlinesInResults = [
      ...new Map(searchState.currentResults.map(r => [r.airline_code, r.airline])).entries()
    ];

    sec.innerHTML = `
      <div class="container">
        <div class="section-head" style="margin-top:16px">
          <div>
            <h2>✈ Flights: ${escapeHtml(getAirportCity(f.from))} (${escapeHtml(f.from)}) → ${escapeHtml(getAirportCity(f.to))} (${escapeHtml(f.to)})</h2>
            <p>${escapeHtml(f.tripType)} • ${escapeHtml(f.departDate)}${f.tripType === "Round Trip" ? " to " + escapeHtml(f.returnDate) : ""} • ${paxTotal} Traveller(s) • ${escapeHtml(f.cabin)} • <strong>${escapeHtml(f.fareType)} Fare</strong></p>
          </div>
          <button class="btn btn-outline btn-sm" onclick="document.getElementById('results-section').hidden=true">✕ Close Results</button>
        </div>

        <div class="results-layout">
          <aside class="filter-sidebar">
            <div class="filter-group">
              <h4>Sort By</h4>
              <select id="flt-sort" class="currency-select" style="width:100%;border-radius:10px">
                <option value="cheapest" ${flt.sortBy === "cheapest" ? "selected" : ""}>Cheapest Fare First</option>
                <option value="earliest" ${flt.sortBy === "earliest" ? "selected" : ""}>Earliest Departure First</option>
              </select>
            </div>

            <div class="filter-group">
              <h4>Max Price (${formatMoney(flt.maxPrice)})</h4>
              <input type="range" id="flt-price" min="5000" max="350000" step="2500" value="${flt.maxPrice}" style="width:100%;accent-color:var(--brand-primary)">
            </div>

            <div class="filter-group">
              <h4>Stops & Flexibility</h4>
              <div class="filter-check">
                <label><input type="checkbox" id="flt-nonstop" ${flt.nonStopOnly ? "checked" : ""}> Non-Stop Only</label>
              </div>
              <div class="filter-check">
                <label><input type="checkbox" id="flt-refund" ${flt.refundableOnly ? "checked" : ""}> Refundable Fares Only</label>
              </div>
            </div>

            <div class="filter-group">
              <h4>Preferred Airline</h4>
              <div class="filter-check">
                <label><input type="radio" name="flt-airline" value="ALL" ${flt.airline === "ALL" ? "checked" : ""}> All Airlines (${searchState.currentResults.length})</label>
              </div>
              ${airlinesInResults
                .map(
                  ([code, name]) => `
                <div class="filter-check">
                  <label><input type="radio" name="flt-airline" value="${escapeHtml(code)}" ${flt.airline === code ? "checked" : ""}> ${escapeHtml(name)}</label>
                </div>`
                )
                .join("")}
            </div>
          </aside>

          <div>
            ${
              filtered.length === 0
                ? `<div class="checkout-box" style="text-align:center;padding:40px">
                    <h3>No flights match your current filters</h3>
                    <p style="color:var(--muted)">Try increasing the maximum price slider or clearing the Non-Stop filter.</p>
                  </div>`
                : filtered
                    .map((item, idx) => {
                      const singleTotal = item.computed_base + item.computed_tax;
                      const grandTotal =
                        singleTotal * f.adults +
                        Math.round(singleTotal * 0.75) * f.children +
                        Math.round(singleTotal * 0.15) * f.infants;
                      const color = cfg.AIRLINES[item.airline_code]?.color || "#c00000";
                      return `
                      <div class="flight-result-card">
                        <div class="flight-result-main">
                          <div>
                            <div style="display:flex;align-items:center;gap:12px">
                              <div class="airline-avatar" style="background:${color}">${escapeHtml(item.airline_code)}</div>
                              <div>
                                <strong style="display:block;font-size:15px;color:var(--ink)">${escapeHtml(item.airline)}</strong>
                                <span style="font-size:12px;color:var(--muted)">${escapeHtml(item.flight_number)} • ${escapeHtml(item.cabin_class)}</span>
                              </div>
                            </div>
                            <div style="margin-top:10px;display:flex;gap:6px;flex-wrap:wrap">
                              <span class="status-badge ${item.refundable ? "status-CONFIRMED" : "status-ON_HOLD"}">${item.refundable ? "Refundable" : "Partially Refundable"}</span>
                              <span class="status-badge status-PROCESSING">${escapeHtml(item.fare_type)}</span>
                            </div>
                          </div>

                          <div class="flight-timeline">
                            <div class="flight-time-col">
                              <strong>${escapeHtml(item.departure_time)}</strong>
                              <span>${escapeHtml(item.from_code)} (${escapeHtml(item.from_city)})</span>
                            </div>
                            <div class="flight-duration-col">
                              <span>${escapeHtml(item.duration)}</span>
                              <div class="flight-duration-bar"></div>
                              <strong style="color:${item.stops === "Non-Stop" ? "var(--brand-green)" : "var(--brand-gold)"};font-size:12px">${escapeHtml(item.stops)}</strong>
                            </div>
                            <div class="flight-time-col">
                              <strong>${escapeHtml(item.arrival_time)}</strong>
                              <span>${escapeHtml(item.to_code)} (${escapeHtml(item.to_city)})</span>
                            </div>
                          </div>

                          <div class="flight-price-col">
                            <div>
                              <small style="font-size:11px;color:var(--muted)">Total for ${paxTotal} Pax</small>
                              <strong>${formatMoney(grandTotal)}</strong>
                              <span style="display:block;font-size:11px;color:var(--muted)">(${formatMoney(singleTotal)} / adult)</span>
                            </div>
                            <button class="btn btn-primary btn-sm" style="margin-top:8px;width:100%" data-book-flight-idx="${idx}">
                              Book Now →
                            </button>
                          </div>
                        </div>

                        <div class="flight-card-drawer">
                          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px">
                            <span>🧳 <strong>Baggage:</strong> ${escapeHtml(item.baggage)}</span>
                            <span>📅 <strong>Date:</strong> ${escapeHtml(f.departDate)}${f.tripType === "Round Trip" ? " ⇄ " + escapeHtml(f.returnDate) : ""}</span>
                            <button type="button" class="btn btn-outline btn-sm" onclick="this.parentElement.nextElementSibling.hidden = !this.parentElement.nextElementSibling.hidden">
                              Flight Details & Fare Rules ▾
                            </button>
                          </div>
                          <div hidden style="margin-top:12px;padding:12px;background:#f8fafc;border-radius:10px;border:1px solid var(--line)">
                            <div class="form-grid-2">
                              <div>
                                <strong style="color:var(--ink)">Flight Segment Breakdown</strong>
                                <p style="margin:4px 0">Flight <strong>${escapeHtml(item.flight_number)}</strong> operated by ${escapeHtml(item.airline)} (${escapeHtml(item.cabin_class)} Class)</p>
                                <p style="margin:4px 0">Baggage Allowance: ${escapeHtml(item.baggage)}</p>
                              </div>
                              <div>
                                <strong style="color:var(--ink)">Fare & Cancellation Policy</strong>
                                <p style="margin:4px 0">Base Fare: ${formatMoney(item.computed_base)} + Taxes/AIT: ${formatMoney(item.computed_tax)} per Adult</p>
                                <p style="margin:4px 0">${item.refundable ? "Date change & refund permitted subject to airline penalty + service fee." : "Special promotional fare; date change permitted with fare difference."}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>`;
                    })
                    .join("")
            }
          </div>
        </div>
      </div>
    `;

    // Bind filter controls
    document.getElementById("flt-sort")?.addEventListener("change", e => {
      searchState.filters.sortBy = e.target.value;
      renderFlightResultsSection();
    });
    document.getElementById("flt-price")?.addEventListener("input", e => {
      searchState.filters.maxPrice = Number(e.target.value);
      renderFlightResultsSection();
    });
    document.getElementById("flt-nonstop")?.addEventListener("change", e => {
      searchState.filters.nonStopOnly = e.target.checked;
      renderFlightResultsSection();
    });
    document.getElementById("flt-refund")?.addEventListener("change", e => {
      searchState.filters.refundableOnly = e.target.checked;
      renderFlightResultsSection();
    });
    sec.querySelectorAll('input[name="flt-airline"]').forEach(r => {
      r.addEventListener("change", e => {
        searchState.filters.airline = e.target.value;
        renderFlightResultsSection();
      });
    });

    // Bind Book Now buttons
    sec.querySelectorAll("[data-book-flight-idx]").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = Number(btn.getAttribute("data-book-flight-idx"));
        const chosen = filtered[idx];
        if (!chosen) return;
        const singleBase = chosen.computed_base;
        const singleTax = chosen.computed_tax;
        const baseTotal =
          singleBase * f.adults +
          Math.round(singleBase * 0.75) * f.children +
          Math.round(singleBase * 0.15) * f.infants;
        const taxTotal =
          singleTax * f.adults +
          Math.round(singleTax * 0.75) * f.children +
          Math.round(singleTax * 0.15) * f.infants;

        window.ACBooking.openCheckout({
          serviceType: "FLIGHT",
          title: `${chosen.airline} (${chosen.flight_number}) — ${chosen.from_city} (${chosen.from_code}) to ${chosen.to_city} (${chosen.to_code})`,
          subtitle: `${f.tripType} • ${chosen.cabin_class} • ${chosen.fare_type} Fare • ${chosen.stops}`,
          travelDate: f.departDate,
          returnDate: f.tripType === "Round Trip" ? f.returnDate : null,
          adults: f.adults,
          children: f.children,
          infants: f.infants,
          baseAmount: baseTotal,
          taxAmount: taxTotal,
          details: {
            airline: chosen.airline,
            airline_code: chosen.airline_code,
            flight_number: chosen.flight_number,
            from_code: chosen.from_code,
            from_city: chosen.from_city,
            to_code: chosen.to_code,
            to_city: chosen.to_city,
            departure_time: chosen.departure_time,
            arrival_time: chosen.arrival_time,
            duration: chosen.duration,
            stops: chosen.stops,
            cabin_class: chosen.cabin_class,
            fare_type: chosen.fare_type,
            baggage: chosen.baggage
          }
        });
      });
    });
  }

  function executeHotelSearch() {
    const h = searchState.hotel;
    const sec = document.getElementById("results-section");
    if (!sec) return;
    sec.hidden = false;
    const { formatMoney, escapeHtml } = window.AC;

    const nights = Math.max(
      1,
      Math.round((new Date(h.checkOut) - new Date(h.checkIn)) / (1000 * 60 * 60 * 24)) || 3
    );
    const list = window.AC.state.hotels.filter(
      item => h.city === "All" || item.city.toLowerCase() === h.city.toLowerCase()
    );

    sec.innerHTML = `
      <div class="container">
        <div class="section-head" style="margin-top:16px">
          <div>
            <h2>🏨 Hotels in ${escapeHtml(h.city === "All" ? "All Destinations" : h.city)}</h2>
            <p>Check-In: ${escapeHtml(h.checkIn)} • Check-Out: ${escapeHtml(h.checkOut)} (${nights} Night${nights > 1 ? "s" : ""}) • ${h.rooms} Room(s), ${h.guests} Guest(s)</p>
          </div>
          <button class="btn btn-outline btn-sm" onclick="document.getElementById('results-section').hidden=true">✕ Close Results</button>
        </div>
        <div class="catalog-grid" style="margin-bottom:36px">
          ${list
            .map(hotel => {
              const rate = Number(hotel.discount_price || hotel.price_per_night);
              const totalStay = rate * nights * h.rooms;
              return `
              <div class="catalog-card">
                <div class="catalog-thumb">
                  <img src="${escapeHtml(hotel.image_url)}" alt="${escapeHtml(hotel.name)}">
                  <span class="catalog-tag">${"★".repeat(hotel.star_rating || 5)} Hotel</span>
                  <span class="catalog-rating">★ ${escapeHtml(hotel.rating_score || 4.8)} (${escapeHtml(hotel.review_count || 120)})</span>
                </div>
                <div class="catalog-body">
                  <div class="catalog-meta">📍 ${escapeHtml(hotel.city)}, ${escapeHtml(hotel.country)}</div>
                  <h3>${escapeHtml(hotel.name)}</h3>
                  <p class="catalog-desc">${escapeHtml(hotel.description)}</p>
                  <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px">
                    ${(hotel.amenities || []).slice(0, 4).map(a => `<span class="pill-radio" style="font-size:11px;padding:3px 8px">${escapeHtml(a)}</span>`).join("")}
                  </div>
                  <div class="catalog-footer">
                    <div class="price-block">
                      <small>${nights} Night(s) × ${h.rooms} Room(s)</small>
                      <strong>${formatMoney(totalStay)}</strong>
                    </div>
                    <div style="display:flex;gap:6px">
                      <button class="btn btn-outline btn-sm" onclick="window.ACSearch.openHotelModal('${escapeHtml(hotel.slug)}')">Details</button>
                      <button class="btn btn-primary btn-sm" onclick="window.ACSearch.bookHotelNow('${escapeHtml(hotel.slug)}', ${nights}, ${h.rooms}, ${h.guests}, '${escapeHtml(h.checkIn)}', '${escapeHtml(h.checkOut)}')">Book Now</button>
                    </div>
                  </div>
                </div>
              </div>`;
            })
            .join("")}
        </div>
      </div>
    `;
    sec.scrollIntoView({ behavior: "smooth" });
  }

  function executePackageSearch(mode) {
    const sec = document.getElementById("results-section");
    if (!sec) return;
    sec.hidden = false;
    const { formatMoney, escapeHtml } = window.AC;

    let list = window.AC.state.packages;
    let heading = "🌍 Holiday & Tour Packages";

    if (mode === "UMRAH") {
      const u = searchState.umrah;
      heading = "🕋 Hajj & Umrah Spiritual Packages";
      list = list.filter(p => {
        if (u.category === "ALL_SPIRITUAL") return p.category === "UMRAH" || p.category === "HAJJ";
        return p.category === u.category;
      });
      if (u.level !== "All") {
        list = list.filter(p => p.package_level === u.level);
      }
    } else {
      const t = searchState.tour;
      list = list.filter(p => {
        if (t.category === "ALL") return p.category === "INBOUND_TOUR" || p.category === "OUTBOUND_TOUR";
        return p.category === t.category;
      });
      if (t.destination) {
        const q = t.destination.toLowerCase();
        list = list.filter(
          p =>
            p.title.toLowerCase().includes(q) ||
            p.destination.toLowerCase().includes(q) ||
            p.country.toLowerCase().includes(q)
        );
      }
    }

    sec.innerHTML = `
      <div class="container">
        <div class="section-head" style="margin-top:16px">
          <div>
            <h2>${heading} (${list.length} Available)</h2>
            <p>Select any package to inspect the day-by-day itinerary or complete your booking online.</p>
          </div>
          <button class="btn btn-outline btn-sm" onclick="document.getElementById('results-section').hidden=true">✕ Close Results</button>
        </div>
        <div class="catalog-grid" style="margin-bottom:36px">
          ${list.map(pkg => renderPackageCardHtml(pkg)).join("")}
        </div>
      </div>
    `;
    sec.scrollIntoView({ behavior: "smooth" });
  }

  function executeVisaSearch() {
    const v = searchState.visa;
    const sec = document.getElementById("results-section");
    if (!sec) return;
    sec.hidden = false;
    const { formatMoney, escapeHtml } = window.AC;
    const list = window.AC.state.visaServices.filter(
      item => v.country === "All" || item.country === v.country
    );

    sec.innerHTML = `
      <div class="container">
        <div class="section-head" style="margin-top:16px">
          <div>
            <h2>🛂 Global Visa Processing Services</h2>
            <p>View required document checklists and submit your visa application online.</p>
          </div>
          <button class="btn btn-outline btn-sm" onclick="document.getElementById('results-section').hidden=true">✕ Close Results</button>
        </div>
        <div class="catalog-grid" style="margin-bottom:36px">
          ${list
            .map(
              visa => `
            <div class="catalog-card">
              <div class="catalog-thumb">
                <img src="${escapeHtml(visa.image_url)}" alt="${escapeHtml(visa.country)}">
                <span class="catalog-tag">${escapeHtml(visa.flag_emoji)} ${escapeHtml(visa.visa_type)}</span>
                <span class="catalog-rating">⏱ ${escapeHtml(visa.processing_time)}</span>
              </div>
              <div class="catalog-body">
                <div class="catalog-meta">Validity: ${escapeHtml(visa.validity)} • Max Stay: ${escapeHtml(visa.max_stay)}</div>
                <h3>${escapeHtml(visa.country)} Visa</h3>
                <p class="catalog-desc">${escapeHtml(visa.description)}</p>
                <div class="catalog-footer">
                  <div class="price-block">
                    <small>Per Applicant Fee</small>
                    <strong>${formatMoney(visa.fee)}</strong>
                  </div>
                  <div style="display:flex;gap:6px">
                    <button class="btn btn-outline btn-sm" onclick="window.ACSearch.openVisaModal('${escapeHtml(visa.slug)}')">Checklist</button>
                    <button class="btn btn-primary btn-sm" onclick="window.ACSearch.bookVisaNow('${escapeHtml(visa.slug)}', ${v.applicants})">Apply Now</button>
                  </div>
                </div>
              </div>
            </div>`
            )
            .join("")}
        </div>
      </div>
    `;
    sec.scrollIntoView({ behavior: "smooth" });
  }

  function renderPackageCardHtml(pkg) {
    const { formatMoney, escapeHtml } = window.AC;
    const effPrice = Number(pkg.discount_price || pkg.price);
    const hasDiscount = pkg.discount_price && Number(pkg.discount_price) < Number(pkg.price);
    const badgeMap = {
      UMRAH: "🕋 Umrah",
      HAJJ: "🕋 Hajj",
      INBOUND_TOUR: "🇧🇩 Bangladesh Tour",
      OUTBOUND_TOUR: "✈ World Holiday"
    };
    return `
      <div class="catalog-card">
        <div class="catalog-thumb">
          <img src="${escapeHtml(pkg.image_url)}" alt="${escapeHtml(pkg.title)}">
          <span class="catalog-tag">${badgeMap[pkg.category] || pkg.category} • ${escapeHtml(pkg.package_level || "Standard")}</span>
          <span class="catalog-rating">★ ${escapeHtml(pkg.rating || 4.9)} (${escapeHtml(pkg.review_count || 85)})</span>
        </div>
        <div class="catalog-body">
          <div class="catalog-meta">📍 ${escapeHtml(pkg.destination)}, ${escapeHtml(pkg.country)} • ⏱ ${escapeHtml(pkg.duration)}</div>
          <h3>${escapeHtml(pkg.title)}</h3>
          <p class="catalog-desc">${escapeHtml(pkg.overview)}</p>
          <div class="catalog-footer">
            <div class="price-block">
              <small>Starting per person</small>
              ${hasDiscount ? `<span class="old-price">${formatMoney(pkg.price)}</span>` : ""}
              <strong>${formatMoney(effPrice)}</strong>
            </div>
            <div style="display:flex;gap:6px">
              <button class="btn btn-outline btn-sm" onclick="window.ACSearch.openPackageModal('${escapeHtml(pkg.slug)}')">Itinerary</button>
              <button class="btn btn-primary btn-sm" onclick="window.ACSearch.bookPackageNow('${escapeHtml(pkg.slug)}')">Book Now</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Homepage Sections Renderer
  function renderHomepageCatalog(activeFilter = "ALL") {
    const { formatMoney, escapeHtml, state } = window.AC;

    // 1. Flight Promo Cards (mynztrip style)
    const flightGrid = document.getElementById("home-flight-deals");
    if (flightGrid) {
      flightGrid.innerHTML = state.flightDeals
        .slice(0, 8)
        .map(f => {
          const color = cfg.AIRLINES[f.airline_code]?.color || "#c00000";
          const total = Number(f.base_fare) + Number(f.taxes || 4500);
          return `
            <div class="flight-promo-card" onclick="window.ACSearch.quickSelectFlightDeal('${escapeHtml(f.from_code)}','${escapeHtml(f.to_code)}','${escapeHtml(f.trip_type)}','${escapeHtml(f.fare_type)}')">
              ${f.discount_pct ? `<span class="badge-discount">${f.discount_pct}% OFF</span>` : ""}
              <div class="airline-row">
                <div class="airline-avatar" style="background:${color}">${escapeHtml(f.airline_code)}</div>
                <div>
                  <strong style="display:block;font-size:14px;color:var(--ink)">${escapeHtml(f.airline)}</strong>
                  <span style="font-size:12px;color:var(--muted)">${escapeHtml(f.cabin_class)} • ${escapeHtml(f.fare_type)}</span>
                </div>
              </div>
              <div class="route-visual">
                <div class="route-endpoint">
                  <span>FROM</span>
                  <strong>${escapeHtml(f.from_code)}</strong>
                  <span>${escapeHtml(f.from_city)}</span>
                </div>
                <div class="route-line">
                  <span>✈</span>
                </div>
                <div class="route-endpoint" style="text-align:right">
                  <span>TO</span>
                  <strong>${escapeHtml(f.to_code)}</strong>
                  <span>${escapeHtml(f.to_city)}</span>
                </div>
              </div>
              <div class="flight-promo-footer">
                <div>
                  <small style="display:block;font-size:11px;color:var(--muted)">${escapeHtml(f.trip_type)} • ${escapeHtml(f.stops)}</small>
                  <span style="font-size:12px;font-weight:600;color:var(--text)">🧳 ${escapeHtml(f.baggage.split("+")[0])}</span>
                </div>
                <div class="flight-promo-price" style="text-align:right">
                  <small>Starting From</small>
                  <strong>${formatMoney(total)}</strong>
                </div>
              </div>
            </div>
          `;
        })
        .join("");
    }

    // 2. Special Offers Banners
    const offersGrid = document.getElementById("home-offers-grid");
    if (offersGrid) {
      offersGrid.innerHTML = state.promoBanners
        .map(
          b => `
        <div class="offer-banner-card" style="background-image:url('${escapeHtml(b.image_url)}')" onclick="window.ACSearch.switchSearchTab('${escapeHtml(b.service_tab || "flight")}')">
          <div class="offer-banner-content">
            <span class="offer-badge">${escapeHtml(b.badge_text)}</span>
            <h3>${escapeHtml(b.title)}</h3>
            <p>${escapeHtml(b.subtitle)}</p>
          </div>
        </div>`
        )
        .join("");
    }

    // 3. Filterable Popular Packages / Hotels / Visas Grid
    const catalogGrid = document.getElementById("home-catalog-grid");
    if (catalogGrid) {
      if (activeFilter === "HOTEL") {
        catalogGrid.innerHTML = state.hotels
          .map(h => {
            const price = Number(h.discount_price || h.price_per_night);
            return `
            <div class="catalog-card">
              <div class="catalog-thumb">
                <img src="${escapeHtml(h.image_url)}" alt="${escapeHtml(h.name)}">
                <span class="catalog-tag">${"★".repeat(h.star_rating || 5)} Hotel</span>
                <span class="catalog-rating">★ ${escapeHtml(h.rating_score || 4.8)}</span>
              </div>
              <div class="catalog-body">
                <div class="catalog-meta">📍 ${escapeHtml(h.city)}, ${escapeHtml(h.country)}</div>
                <h3>${escapeHtml(h.name)}</h3>
                <p class="catalog-desc">${escapeHtml(h.description)}</p>
                <div class="catalog-footer">
                  <div class="price-block">
                    <small>Per Night</small>
                    <strong>${formatMoney(price)}</strong>
                  </div>
                  <div style="display:flex;gap:6px">
                    <button class="btn btn-outline btn-sm" onclick="window.ACSearch.openHotelModal('${escapeHtml(h.slug)}')">Details</button>
                    <button class="btn btn-primary btn-sm" onclick="window.ACSearch.bookHotelNow('${escapeHtml(h.slug)}', 2, 1, 2)">Book Now</button>
                  </div>
                </div>
              </div>
            </div>`;
          })
          .join("");
      } else if (activeFilter === "VISA") {
        catalogGrid.innerHTML = state.visaServices
          .map(
            v => `
          <div class="catalog-card">
            <div class="catalog-thumb">
              <img src="${escapeHtml(v.image_url)}" alt="${escapeHtml(v.country)}">
              <span class="catalog-tag">${escapeHtml(v.flag_emoji)} ${escapeHtml(v.visa_type)}</span>
              <span class="catalog-rating">⏱ ${escapeHtml(v.processing_time)}</span>
            </div>
            <div class="catalog-body">
              <div class="catalog-meta">Validity: ${escapeHtml(v.validity)} • Max Stay: ${escapeHtml(v.max_stay)}</div>
              <h3>${escapeHtml(v.country)} Visa</h3>
              <p class="catalog-desc">${escapeHtml(v.description)}</p>
              <div class="catalog-footer">
                <div class="price-block">
                  <small>Processing Fee</small>
                  <strong>${formatMoney(v.fee)}</strong>
                </div>
                <div style="display:flex;gap:6px">
                  <button class="btn btn-outline btn-sm" onclick="window.ACSearch.openVisaModal('${escapeHtml(v.slug)}')">Checklist</button>
                  <button class="btn btn-primary btn-sm" onclick="window.ACSearch.bookVisaNow('${escapeHtml(v.slug)}', 1)">Apply Now</button>
                </div>
              </div>
            </div>
          </div>`
          )
          .join("");
      } else {
        const pkgs = state.packages.filter(p => {
          if (activeFilter === "ALL") return true;
          if (activeFilter === "UMRAH_HAJJ") return p.category === "UMRAH" || p.category === "HAJJ";
          return p.category === activeFilter;
        });
        catalogGrid.innerHTML = pkgs.map(p => renderPackageCardHtml(p)).join("");
      }
    }
  }

  // Detail Modals & Direct Booking Triggers
  function openPackageModal(slug) {
    const pkg = window.AC.state.packages.find(p => p.slug === slug);
    if (!pkg) return;
    const { formatMoney, escapeHtml } = window.AC;
    const price = Number(pkg.discount_price || pkg.price);

    showModal(`
      <span class="status-badge status-CONFIRMED">${escapeHtml(pkg.category)} • ${escapeHtml(pkg.package_level)}</span>
      <h2 style="margin-top:8px;font-size:24px">${escapeHtml(pkg.title)}</h2>
      <p style="color:var(--muted);margin:6px 0 16px">📍 ${escapeHtml(pkg.destination)}, ${escapeHtml(pkg.country)} • ⏱ ${escapeHtml(pkg.duration)} • ★ ${escapeHtml(pkg.rating)}</p>
      <img src="${escapeHtml(pkg.image_url)}" alt="${escapeHtml(pkg.title)}" style="width:100%;height:230px;object-fit:cover;border-radius:14px;margin-bottom:16px">
      <p>${escapeHtml(pkg.overview)}</p>

      <h3 style="margin:18px 0 10px;font-size:17px">📅 Day-by-Day Itinerary</h3>
      <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:18px">
        ${(pkg.itinerary || [])
          .map(
            step => `
          <div style="padding:12px;background:#f8fafc;border-radius:10px;border:1px solid var(--line)">
            <strong style="color:var(--brand-primary)">${escapeHtml(step.day)}: ${escapeHtml(step.title)}</strong>
            <p style="margin:4px 0 0;font-size:13px;color:var(--text)">${escapeHtml(step.desc)}</p>
          </div>`
          )
          .join("")}
      </div>

      <div class="form-grid-2" style="margin-bottom:20px">
        <div style="padding:12px;background:#f0fdf4;border-radius:10px">
          <strong style="color:#15803d">✓ Package Inclusions</strong>
          <ul style="margin:8px 0 0;padding-left:18px;font-size:13px">
            ${(pkg.inclusions || []).map(i => `<li>${escapeHtml(i)}</li>`).join("")}
          </ul>
        </div>
        <div style="padding:12px;background:#fef2f2;border-radius:10px">
          <strong style="color:#b91c1c">✕ Package Exclusions</strong>
          <ul style="margin:8px 0 0;padding-left:18px;font-size:13px">
            ${(pkg.exclusions || []).map(e => `<li>${escapeHtml(e)}</li>`).join("")}
          </ul>
        </div>
      </div>

      <div style="display:flex;align-items:center;justify-content:space-between;padding-top:16px;border-top:1px solid var(--line)">
        <div>
          <small style="color:var(--muted);display:block">Package Rate Per Person</small>
          <strong style="font-size:24px;color:var(--brand-primary)">${formatMoney(price)}</strong>
        </div>
        <button class="btn btn-primary" onclick="window.ACSearch.closeModal();window.ACSearch.bookPackageNow('${escapeHtml(pkg.slug)}')">
          Proceed to Book Now →
        </button>
      </div>
    `);
  }

  function openHotelModal(slug) {
    const hotel = window.AC.state.hotels.find(h => h.slug === slug);
    if (!hotel) return;
    const { formatMoney, escapeHtml } = window.AC;
    const price = Number(hotel.discount_price || hotel.price_per_night);

    showModal(`
      <span class="status-badge status-CONFIRMED">${"★".repeat(hotel.star_rating || 5)} Verified Partner Hotel</span>
      <h2 style="margin-top:8px;font-size:24px">${escapeHtml(hotel.name)}</h2>
      <p style="color:var(--muted);margin:6px 0 16px">📍 ${escapeHtml(hotel.address)} (${escapeHtml(hotel.city)}, ${escapeHtml(hotel.country)})</p>
      <img src="${escapeHtml(hotel.image_url)}" alt="${escapeHtml(hotel.name)}" style="width:100%;height:230px;object-fit:cover;border-radius:14px;margin-bottom:16px">
      <p>${escapeHtml(hotel.description)}</p>

      <h3 style="margin:16px 0 10px;font-size:16px">✨ Key Amenities</h3>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
        ${(hotel.amenities || []).map(a => `<span class="pill-radio">${escapeHtml(a)}</span>`).join("")}
      </div>

      <h3 style="margin:16px 0 10px;font-size:16px">🛏 Available Room Categories</h3>
      <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:18px">
        ${(hotel.room_types || [])
          .map(
            r => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:12px;background:#f8fafc;border-radius:10px;border:1px solid var(--line)">
            <div>
              <strong>${escapeHtml(r.name)}</strong>
              <small style="display:block;color:var(--muted)">Capacity: ${escapeHtml(r.capacity)} • ${escapeHtml(hotel.cancellation_policy)}</small>
            </div>
            <strong style="color:var(--brand-primary)">${formatMoney(r.price)} / night</strong>
          </div>`
          )
          .join("")}
      </div>

      <div style="display:flex;align-items:center;justify-content:space-between;padding-top:16px;border-top:1px solid var(--line)">
        <div>
          <small style="color:var(--muted);display:block">Starting Nightly Rate</small>
          <strong style="font-size:24px;color:var(--brand-primary)">${formatMoney(price)}</strong>
        </div>
        <button class="btn btn-primary" onclick="window.ACSearch.closeModal();window.ACSearch.bookHotelNow('${escapeHtml(hotel.slug)}', 2, 1, 2)">
          Book This Hotel →
        </button>
      </div>
    `);
  }

  function openVisaModal(slug) {
    const visa = window.AC.state.visaServices.find(v => v.slug === slug);
    if (!visa) return;
    const { formatMoney, escapeHtml } = window.AC;

    showModal(`
      <span class="status-badge status-PROCESSING">${escapeHtml(visa.flag_emoji)} ${escapeHtml(visa.visa_type)}</span>
      <h2 style="margin-top:8px;font-size:24px">${escapeHtml(visa.country)} Visa Requirements</h2>
      <p style="color:var(--muted);margin:6px 0 16px">⏱ Processing: ${escapeHtml(visa.processing_time)} • Validity: ${escapeHtml(visa.validity)} • Max Stay: ${escapeHtml(visa.max_stay)}</p>
      <p>${escapeHtml(visa.description)}</p>

      <h3 style="margin:16px 0 10px;font-size:16px">📋 Required Documents Checklist</h3>
      <ul style="padding-left:20px;line-height:1.8;margin-bottom:20px">
        ${(visa.documents || []).map(d => `<li><strong>${escapeHtml(d)}</strong></li>`).join("")}
      </ul>

      <div style="display:flex;align-items:center;justify-content:space-between;padding-top:16px;border-top:1px solid var(--line)">
        <div>
          <small style="color:var(--muted);display:block">Total Visa Fee (incl. Service Charge)</small>
          <strong style="font-size:24px;color:var(--brand-primary)">${formatMoney(visa.fee)}</strong>
        </div>
        <button class="btn btn-primary" onclick="window.ACSearch.closeModal();window.ACSearch.bookVisaNow('${escapeHtml(visa.slug)}', 1)">
          Start Visa Application →
        </button>
      </div>
    `);
  }

  function bookPackageNow(slug) {
    const pkg = window.AC.state.packages.find(p => p.slug === slug);
    if (!pkg) return;
    const unitPrice = Number(pkg.discount_price || pkg.price);
    const isUmrah = pkg.category === "UMRAH" || pkg.category === "HAJJ";
    const adults = isUmrah ? searchState.umrah.adults : searchState.tour.adults;

    window.ACBooking.openCheckout({
      serviceType: isUmrah ? "UMRAH" : "TOUR",
      title: pkg.title,
      subtitle: `${pkg.destination}, ${pkg.country} • ${pkg.duration} (${pkg.package_level})`,
      travelDate: searchState.tour.travelDate || getFutureDate(14),
      returnDate: null,
      adults: adults || 2,
      children: 0,
      infants: 0,
      baseAmount: unitPrice * (adults || 2),
      taxAmount: 0,
      details: {
        package_slug: pkg.slug,
        category: pkg.category,
        package_level: pkg.package_level,
        duration: pkg.duration,
        destination: pkg.destination
      }
    });
  }

  function bookHotelNow(slug, nights = 2, rooms = 1, guests = 2, checkIn, checkOut) {
    const hotel = window.AC.state.hotels.find(h => h.slug === slug);
    if (!hotel) return;
    const rate = Number(hotel.discount_price || hotel.price_per_night);
    const baseTotal = rate * nights * rooms;
    const taxTotal = Math.round(baseTotal * 0.12);

    window.ACBooking.openCheckout({
      serviceType: "HOTEL",
      title: `${hotel.name} (${hotel.city})`,
      subtitle: `${nights} Night(s) • ${rooms} Room(s) • ${guests} Guest(s)`,
      travelDate: checkIn || searchState.hotel.checkIn,
      returnDate: checkOut || searchState.hotel.checkOut,
      adults: guests,
      children: 0,
      infants: 0,
      baseAmount: baseTotal,
      taxAmount: taxTotal,
      details: {
        hotel_slug: hotel.slug,
        city: hotel.city,
        country: hotel.country,
        nights,
        rooms,
        star_rating: hotel.star_rating
      }
    });
  }

  function bookVisaNow(slug, applicants = 1) {
    const visa = window.AC.state.visaServices.find(v => v.slug === slug);
    if (!visa) return;
    const baseTotal = Number(visa.fee) * applicants;

    window.ACBooking.openCheckout({
      serviceType: "VISA",
      title: `${visa.country} — ${visa.visa_type}`,
      subtitle: `Processing: ${visa.processing_time} • Validity: ${visa.validity}`,
      travelDate: getFutureDate(14),
      returnDate: null,
      adults: applicants,
      children: 0,
      infants: 0,
      baseAmount: baseTotal,
      taxAmount: 0,
      details: {
        visa_slug: visa.slug,
        country: visa.country,
        visa_type: visa.visa_type,
        processing_time: visa.processing_time
      }
    });
  }

  function quickSelectFlightDeal(fromCode, toCode, tripType, fareType) {
    switchSearchTab("flight");
    searchState.flight.from = fromCode;
    searchState.flight.to = toCode;
    searchState.flight.tripType = tripType || "One Way";
    searchState.flight.fareType = fareType || "Regular";
    renderSearchBox();
    executeFlightSearch();
  }

  function showModal(innerHtml, isSmall = false) {
    closeModal();
    const wrap = document.createElement("div");
    wrap.id = "ac-active-modal";
    wrap.className = "ac-modal-backdrop";
    wrap.innerHTML = `
      <div class="ac-modal ${isSmall ? "ac-modal-sm" : ""}">
        <button type="button" class="ac-modal-close" onclick="window.ACSearch.closeModal()">✕</button>
        ${innerHtml}
      </div>
    `;
    wrap.addEventListener("click", e => {
      if (e.target === wrap) closeModal();
    });
    document.body.appendChild(wrap);
  }

  function closeModal() {
    document.getElementById("ac-active-modal")?.remove();
  }

  window.ACSearch = {
    searchState,
    switchSearchTab,
    renderSearchBox,
    renderHomepageCatalog,
    executeFlightSearch,
    executeHotelSearch,
    executePackageSearch,
    executeVisaSearch,
    openPackageModal,
    openHotelModal,
    openVisaModal,
    bookPackageNow,
    bookHotelNow,
    bookVisaNow,
    quickSelectFlightDeal,
    showModal,
    closeModal
  };
})();
