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
      cabin: "Economy",
      multiCitySegments: [
        { from: "DAC", to: "CXB", departDate: getFutureDate(5) },
        { from: "", to: "", departDate: "" }
      ]
    },
    hotel: {
      city: "All",
      checkIn: getFutureDate(7),
      checkOut: getFutureDate(10),
      guests: 2,
      rooms: 1
    },
    packagesGroup: "TOUR",
    tour: {
      category: "ALL",
      destination: "",
      travelDate: getFutureDate(14),
      adults: 2
    },
    umrah: {
      category: "ALL_SPIRITUAL",
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
    if (!code) return "Select a city";
    const ap = window.AC.state.airports.find(a => a.code === code);
    return ap ? ap.city : code;
  }

  function getAirportSubText(code) {
    if (!code) return "Click to choose an airport";
    const ap = window.AC.state.airports.find(a => a.code === code);
    if (ap) return `${ap.code}, ${ap.name}`;
    return code;
  }

  function formatMultiCityDate(dateStr) {
    if (!dateStr) return null;
    const parts = dateStr.split("-");
    if (parts.length !== 3) return null;
    const dt = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    if (isNaN(dt.getTime())) return null;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayNum = String(dt.getDate());
    const monthYear = `${months[dt.getMonth()]}'${String(dt.getFullYear()).slice(-2)}`;
    const weekday = days[dt.getDay()];
    return { dayNum, monthYear, weekday };
  }

  function switchSearchTab(tab, subOption) {
    let bannerKey = tab;
    if (tab === "umrah" || tab === "hajj") {
      searchState.activeTab = "packages";
      searchState.packagesGroup = "HAJJ_UMRAH";
      if (tab === "hajj") searchState.umrah.category = "HAJJ";
      else if (subOption) searchState.umrah.category = subOption;
      bannerKey = "umrah";
    } else if (tab === "tour" || tab === "inbound" || tab === "outbound") {
      searchState.activeTab = "packages";
      searchState.packagesGroup = "TOUR";
      if (tab === "inbound" || subOption === "INBOUND_TOUR") {
        searchState.tour.category = "INBOUND_TOUR";
      } else if (tab === "outbound" || subOption === "OUTBOUND_TOUR") {
        searchState.tour.category = "OUTBOUND_TOUR";
      } else if (subOption === "ALL") {
        searchState.tour.category = "ALL";
      }
      bannerKey = "tour";
    } else if (tab === "packages") {
      searchState.activeTab = "packages";
      if (subOption === "HAJJ_UMRAH" || subOption === "TOUR") {
        searchState.packagesGroup = subOption;
      }
      bannerKey = searchState.packagesGroup === "HAJJ_UMRAH" ? "umrah" : "packages";
    } else {
      if (!cfg.HERO_BANNERS[tab]) tab = "flight";
      searchState.activeTab = tab;
      bannerKey = tab;
    }

    // Update Hero Banner
    const heroInfo = cfg.HERO_BANNERS[bannerKey] || cfg.HERO_BANNERS.flight;
    const heroEl = document.getElementById("hero-banner");
    const titleEl = document.getElementById("hero-title");
    const subEl = document.getElementById("hero-subtitle");
    if (heroEl && heroInfo) heroEl.style.backgroundImage = `url('${heroInfo.bg}')`;
    if (titleEl && heroInfo) titleEl.textContent = heroInfo.title;
    if (subEl && heroInfo) subEl.textContent = heroInfo.subtitle;

    // Update Active Buttons
    const activeKey = searchState.activeTab;
    document.querySelectorAll("[data-search-tab]").forEach(btn => {
      btn.classList.toggle("active", btn.getAttribute("data-search-tab") === activeKey);
    });
    document.querySelectorAll("[data-header-tab]").forEach(btn => {
      btn.classList.toggle("active", btn.getAttribute("data-header-tab") === activeKey);
    });

    renderSearchBox();
  }

  function handleHeaderNavClick(event, tab, targetId) {
    if (event && typeof event.preventDefault === "function") {
      event.preventDefault();
    }
    switchSearchTab(tab);

    // Sync target section filter pills so the scrolled section displays the selected category
    if (targetId === "hotels" || targetId === "visa") {
      const hvCode = targetId === "hotels" ? "HOTEL" : "VISA";
      document.querySelectorAll("#home-hv-tabs .filter-pill").forEach(btn => {
        btn.classList.toggle("active", btn.getAttribute("data-hv") === hvCode);
      });
      renderHotelsVisasSection(hvCode);
    } else if (targetId === "hajj-tours") {
      let catCode = "ALL";
      if (tab === "umrah" || tab === "hajj") catCode = "UMRAH_HAJJ";
      else if (tab === "inbound") catCode = "INBOUND_TOUR";
      else if (tab === "outbound") catCode = "OUTBOUND_TOUR";
      document.querySelectorAll("#home-catalog-tabs .filter-pill").forEach(btn => {
        btn.classList.toggle("active", btn.getAttribute("data-cat") === catCode);
      });
      renderHomepageCatalog(catCode);
    }

    const targetEl =
      targetId === "hotels" || targetId === "visa"
        ? document.getElementById("hotels-visas-section") || document.getElementById(targetId)
        : document.getElementById(targetId);

    if (targetEl) {
      const headerEl = document.querySelector(".ota-header");
      const headerOffset = (headerEl ? headerEl.offsetHeight : 80) + 12;
      const topPos = Math.max(0, targetEl.getBoundingClientRect().top + window.scrollY - headerOffset);
      window.scrollTo({ top: topPos, behavior: "smooth" });
      if (window.history && typeof window.history.replaceState === "function") {
        window.history.replaceState(null, "", "#" + targetId);
      }
    }
    return false;
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
      if (f.cabin !== "Economy" && f.cabin !== "Business") {
        f.cabin = "Economy";
      }
      if (!Array.isArray(f.multiCitySegments) || f.multiCitySegments.length < 2) {
        f.multiCitySegments = [
          { from: f.from || "DAC", to: f.to || "CXB", departDate: f.departDate || getFutureDate(5) },
          { from: "", to: "", departDate: "" }
        ];
      }
      const totalPax = f.adults + f.children + f.infants;
      const airportOptions = dir =>
        airports
          .map(
            a =>
              `<option value="${escapeHtml(a.code)}" ${f[dir] === a.code ? "selected" : ""}>${escapeHtml(a.city)} (${escapeHtml(a.code)}) - ${escapeHtml(a.country)}</option>`
          )
          .join("");

      const mcAirportOptions = selectedCode =>
        `<option value="" ${!selectedCode ? "selected" : ""}>Select a city (Choose an airport)</option>` +
        airports
          .map(
            a =>
              `<option value="${escapeHtml(a.code)}" ${selectedCode === a.code ? "selected" : ""}>${escapeHtml(a.city)} — ${escapeHtml(a.code)}, ${escapeHtml(a.name)} (${escapeHtml(a.country)})</option>`
          )
          .join("");

      const travellersPopoverHtml = `
        <div class="travellers-popover" id="travellers-popover" hidden>
          <div class="pax-counter-row">
            <div class="pax-counter-info">
              <strong>Adult</strong>
              <span>12 years and above</span>
            </div>
            <div class="pax-stepper">
              <button type="button" class="pax-step-btn" data-pax-type="adults" data-pax-dir="-1" ${f.adults <= 1 ? "disabled" : ""}>−</button>
              <span class="pax-step-val" id="pax-val-adults">${f.adults}</span>
              <button type="button" class="pax-step-btn" data-pax-type="adults" data-pax-dir="1" ${f.adults >= 9 ? "disabled" : ""}>+</button>
            </div>
          </div>

          <div class="pax-counter-row">
            <div class="pax-counter-info">
              <strong>Children</strong>
              <span>2–11 years</span>
            </div>
            <div class="pax-stepper">
              <button type="button" class="pax-step-btn" data-pax-type="children" data-pax-dir="-1" ${f.children <= 0 ? "disabled" : ""}>−</button>
              <span class="pax-step-val" id="pax-val-children">${f.children}</span>
              <button type="button" class="pax-step-btn" data-pax-type="children" data-pax-dir="1" ${f.children >= 9 ? "disabled" : ""}>+</button>
            </div>
          </div>

          <div class="pax-counter-row">
            <div class="pax-counter-info">
              <strong>Infant</strong>
              <span>Below 2 years</span>
            </div>
            <div class="pax-stepper">
              <button type="button" class="pax-step-btn" data-pax-type="infants" data-pax-dir="-1" ${f.infants <= 0 ? "disabled" : ""}>−</button>
              <span class="pax-step-val" id="pax-val-infants">${f.infants}</span>
              <button type="button" class="pax-step-btn" data-pax-type="infants" data-pax-dir="1" ${f.infants >= 9 ? "disabled" : ""}>+</button>
            </div>
          </div>

          <div class="pax-class-section">
            <span class="pax-class-title">Class</span>
            <div class="pax-class-options">
              <label class="pax-class-radio">
                <input type="radio" name="flCabinRadio" value="Economy" ${f.cabin === "Economy" ? "checked" : ""}>
                Economy
              </label>
              <label class="pax-class-radio">
                <input type="radio" name="flCabinRadio" value="Business" ${f.cabin === "Business" ? "checked" : ""}>
                Business
              </label>
            </div>
          </div>

          <div class="pax-popover-footer">
            <button type="button" class="btn btn-primary pax-done-btn" id="travellers-done-btn">Done</button>
          </div>
        </div>
      `;

      const isMultiCity = f.tripType === "Multi-City";

      const multiCityRowsHtml = isMultiCity
        ? `
          <div class="mc-segments-list">
            ${f.multiCitySegments
              .map((seg, idx) => {
                const dInfo = formatMultiCityDate(seg.departDate);
                return `
                  <div class="mc-segment-row" data-mc-row="${idx}">
                    <!-- FROM -->
                    <div class="mc-field-box">
                      <span class="mc-field-label">FROM</span>
                      <div class="mc-field-main ${!seg.from ? "is-placeholder" : ""}" id="mc-from-city-${idx}">
                        ${escapeHtml(seg.from ? getAirportCity(seg.from) : "Select a city")}
                      </div>
                      <div class="mc-field-sub" id="mc-from-sub-${idx}">
                        ${escapeHtml(getAirportSubText(seg.from))}
                      </div>
                      <select class="mc-overlay-select" data-mc-from="${idx}" aria-label="From City Row ${idx + 1}">
                        ${mcAirportOptions(seg.from)}
                      </select>
                    </div>

                    <!-- TO -->
                    <div class="mc-field-box">
                      <span class="mc-field-label">TO</span>
                      <div class="mc-field-main ${!seg.to ? "is-placeholder" : ""}" id="mc-to-city-${idx}">
                        ${escapeHtml(seg.to ? getAirportCity(seg.to) : "Select a city")}
                      </div>
                      <div class="mc-field-sub" id="mc-to-sub-${idx}">
                        ${escapeHtml(getAirportSubText(seg.to))}
                      </div>
                      <select class="mc-overlay-select" data-mc-to="${idx}" aria-label="To City Row ${idx + 1}">
                        ${mcAirportOptions(seg.to)}
                      </select>
                    </div>

                    <!-- DEPARTURE DATE -->
                    <div class="mc-field-box" data-mc-date-box="${idx}">
                      <span class="mc-field-label">DEPARTURE DATE</span>
                      ${
                        dInfo
                          ? `<div class="mc-field-main" id="mc-date-main-${idx}">${escapeHtml(dInfo.dayNum)}<span class="mc-date-month">${escapeHtml(dInfo.monthYear)}</span></div>
                             <div class="mc-field-sub" id="mc-date-sub-${idx}">${escapeHtml(dInfo.weekday)}</div>`
                          : `<div class="mc-field-main is-date-placeholder" id="mc-date-main-${idx}">Pick a date</div>
                             <div class="mc-field-sub" id="mc-date-sub-${idx}">&nbsp;</div>`
                      }
                      <input type="date" class="mc-overlay-date" data-mc-date="${idx}" value="${escapeHtml(seg.departDate || "")}" aria-label="Departure Date Row ${idx + 1}">
                    </div>

                    <!-- 4TH COLUMN: TRAVELER, CLASS (Row 0) OR ADD ANOTHER CITY + REMOVE (Row 1+) -->
                    ${
                      idx === 0
                        ? `
                        <div class="mc-field-box has-popover" id="travellers-field-box">
                          <div class="travellers-trigger" id="travellers-trigger-btn" role="button" tabindex="0" aria-expanded="false">
                            <span class="mc-field-label" style="cursor:pointer">TRAVELER, CLASS</span>
                            <div class="mc-field-main" id="travellers-summary-text">${totalPax} Traveler${totalPax > 1 ? "s" : ""}</div>
                            <div class="mc-field-sub" id="travellers-sub-text">${escapeHtml(f.cabin)}</div>
                          </div>
                          ${travellersPopoverHtml}
                        </div>`
                        : `
                        <div class="mc-action-box">
                          <button type="button" class="mc-add-city-btn" data-mc-add="${idx}" ${f.multiCitySegments.length >= 5 ? "disabled" : ""}>
                            Add Another City
                          </button>
                          <div class="mc-remove-cell">
                            <button type="button" class="mc-remove-btn" data-mc-remove="${idx}" title="Remove city segment">✕</button>
                          </div>
                        </div>`
                    }
                  </div>
                `;
              })
              .join("")}
          </div>
        `
        : `
          <div class="search-grid-flight">
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
              <small>Departure Date</small>
            </div>

            <div class="field-box" style="${f.tripType === "One Way" ? "opacity:0.55" : ""}">
              <label>Return Date</label>
              <input type="date" id="fl-return" value="${f.returnDate}" ${f.tripType === "One Way" ? "disabled" : ""}>
              <small>${f.tripType === "One Way" ? "Select Round Trip to add" : "Return Journey"}</small>
            </div>

            <div class="field-box has-popover" id="travellers-field-box">
              <div class="travellers-trigger" id="travellers-trigger-btn" role="button" tabindex="0" aria-expanded="false">
                <label style="cursor:pointer">Travellers &amp; Class</label>
                <strong id="travellers-summary-text">${totalPax} Traveller${totalPax > 1 ? "s" : ""}</strong>
                <small id="travellers-sub-text">${escapeHtml(f.cabin)}</small>
              </div>
              ${travellersPopoverHtml}
            </div>
          </div>
        `;

      container.innerHTML = `
        <div class="search-top-controls">
          <div class="trip-type-group">
            ${[
              { val: "One Way", label: "One Way" },
              { val: "Round Trip", label: "Round Way" },
              { val: "Multi-City", label: "Multi City" }
            ]
              .map(
                t => `
              <label class="pill-radio ${f.tripType === t.val ? "active" : ""}">
                <input type="radio" name="tripType" value="${t.val}" ${f.tripType === t.val ? "checked" : ""}>
                ${t.label}
              </label>`
              )
              .join("")}
          </div>
        </div>

        <form id="ota-flight-form">
          ${multiCityRowsHtml}

          <div class="search-submit-wrap">
            <button type="submit" class="btn btn-primary search-submit-btn">
              Search
            </button>
          </div>
        </form>
      `;

      const updateTravellersUI = () => {
        const tot = searchState.flight.adults + searchState.flight.children + searchState.flight.infants;
        const sumEl = document.getElementById("travellers-summary-text");
        const subEl = document.getElementById("travellers-sub-text");
        const word = isMultiCity ? "Traveler" : "Traveller";
        if (sumEl) sumEl.textContent = `${tot} ${word}${tot > 1 ? "s" : ""}`;
        if (subEl) subEl.textContent = searchState.flight.cabin;

        const adVal = document.getElementById("pax-val-adults");
        const chVal = document.getElementById("pax-val-children");
        const inVal = document.getElementById("pax-val-infants");
        if (adVal) adVal.textContent = searchState.flight.adults;
        if (chVal) chVal.textContent = searchState.flight.children;
        if (inVal) inVal.textContent = searchState.flight.infants;

        container.querySelectorAll(".pax-step-btn").forEach(btn => {
          const type = btn.getAttribute("data-pax-type");
          const dir = Number(btn.getAttribute("data-pax-dir"));
          const min = type === "adults" ? 1 : 0;
          const max = 9;
          const cur = searchState.flight[type];
          btn.disabled = (dir < 0 && cur <= min) || (dir > 0 && cur >= max);
        });
      };

      const popover = document.getElementById("travellers-popover");
      const triggerBtn = document.getElementById("travellers-trigger-btn");

      triggerBtn?.addEventListener("click", e => {
        e.stopPropagation();
        if (popover) {
          popover.hidden = !popover.hidden;
          triggerBtn.setAttribute("aria-expanded", String(!popover.hidden));
        }
      });

      popover?.addEventListener("click", e => {
        e.stopPropagation();
      });

      container.querySelectorAll(".pax-step-btn").forEach(btn => {
        btn.addEventListener("click", e => {
          e.stopPropagation();
          const type = btn.getAttribute("data-pax-type");
          const dir = Number(btn.getAttribute("data-pax-dir"));
          const min = type === "adults" ? 1 : 0;
          const max = 9;
          const next = Math.min(max, Math.max(min, searchState.flight[type] + dir));
          searchState.flight[type] = next;
          updateTravellersUI();
        });
      });

      container.querySelectorAll('input[name="flCabinRadio"]').forEach(r => {
        r.addEventListener("change", e => {
          searchState.flight.cabin = e.target.value;
          updateTravellersUI();
        });
      });

      document.getElementById("travellers-done-btn")?.addEventListener("click", e => {
        e.stopPropagation();
        if (popover) {
          popover.hidden = true;
          triggerBtn?.setAttribute("aria-expanded", "false");
        }
      });

      if (!window.__acTravellersOutsideBound) {
        window.__acTravellersOutsideBound = true;
        document.addEventListener("click", e => {
          const pop = document.getElementById("travellers-popover");
          const box = document.getElementById("travellers-field-box");
          if (pop && !pop.hidden && box && !box.contains(e.target)) {
            pop.hidden = true;
            document.getElementById("travellers-trigger-btn")?.setAttribute("aria-expanded", "false");
          }
        });
      }

      // Bind Multi-City interactive events
      if (isMultiCity) {
        container.querySelectorAll("[data-mc-from]").forEach(sel => {
          sel.addEventListener("change", e => {
            const idx = Number(sel.getAttribute("data-mc-from"));
            f.multiCitySegments[idx].from = e.target.value;
            renderSearchBox();
          });
        });

        container.querySelectorAll("[data-mc-to]").forEach(sel => {
          sel.addEventListener("change", e => {
            const idx = Number(sel.getAttribute("data-mc-to"));
            const val = e.target.value;
            f.multiCitySegments[idx].to = val;
            if (idx + 1 < f.multiCitySegments.length && !f.multiCitySegments[idx + 1].from && val) {
              f.multiCitySegments[idx + 1].from = val;
            }
            renderSearchBox();
          });
        });

        container.querySelectorAll("[data-mc-date-box]").forEach(box => {
          const idx = Number(box.getAttribute("data-mc-date-box"));
          const dateInput = box.querySelector(`[data-mc-date="${idx}"]`);
          box.addEventListener("click", e => {
            if (e.target !== dateInput && dateInput) {
              if (typeof dateInput.showPicker === "function") {
                try {
                  dateInput.showPicker();
                } catch (_) {
                  dateInput.focus();
                }
              } else {
                dateInput.focus();
              }
            }
          });
        });

        container.querySelectorAll("[data-mc-date]").forEach(inp => {
          inp.addEventListener("click", e => {
            if (typeof inp.showPicker === "function") {
              try {
                inp.showPicker();
              } catch (_) {}
            }
          });
          inp.addEventListener("change", e => {
            const idx = Number(inp.getAttribute("data-mc-date"));
            f.multiCitySegments[idx].departDate = e.target.value;
            renderSearchBox();
          });
        });

        container.querySelectorAll("[data-mc-add]").forEach(btn => {
          btn.addEventListener("click", () => {
            if (f.multiCitySegments.length >= 5) {
              window.AC.showToast("Maximum 5 flight segments allowed in Multi-City search.", "info");
              return;
            }
            const lastSeg = f.multiCitySegments[f.multiCitySegments.length - 1];
            f.multiCitySegments.push({
              from: lastSeg?.to || "",
              to: "",
              departDate: ""
            });
            renderSearchBox();
          });
        });

        container.querySelectorAll("[data-mc-remove]").forEach(btn => {
          btn.addEventListener("click", () => {
            const idx = Number(btn.getAttribute("data-mc-remove"));
            if (f.multiCitySegments.length > 2) {
              f.multiCitySegments.splice(idx, 1);
              renderSearchBox();
            } else {
              const seg = f.multiCitySegments[idx];
              if (seg && (seg.from || seg.to || seg.departDate)) {
                f.multiCitySegments[idx] = { from: "", to: "", departDate: "" };
                renderSearchBox();
              } else {
                f.tripType = "One Way";
                renderSearchBox();
              }
            }
          });
        });
      }

      container.querySelectorAll('input[name="tripType"]').forEach(r => {
        r.addEventListener("change", e => {
          searchState.flight.tripType = e.target.value;
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
        if (popover) popover.hidden = true;
        if (searchState.flight.tripType === "Multi-City") {
          for (let i = 0; i < f.multiCitySegments.length; i++) {
            const s = f.multiCitySegments[i];
            if (!s.from || !s.to) {
              window.AC.showToast(`Please select both FROM and TO cities for Flight Row ${i + 1}.`, "error");
              return;
            }
            if (s.from === s.to) {
              window.AC.showToast(`FROM and TO cities cannot be the same in Flight Row ${i + 1}.`, "error");
              return;
            }
            if (!s.departDate) {
              window.AC.showToast(`Please pick a Departure Date for Flight Row ${i + 1}.`, "error");
              return;
            }
          }
          searchState.flight.from = f.multiCitySegments[0].from;
          searchState.flight.to = f.multiCitySegments[f.multiCitySegments.length - 1].to;
          searchState.flight.departDate = f.multiCitySegments[0].departDate;
          executeFlightSearch();
          return;
        }
        searchState.flight.from = document.getElementById("fl-from").value;
        searchState.flight.to = document.getElementById("fl-to").value;
        searchState.flight.departDate = document.getElementById("fl-depart").value;
        searchState.flight.returnDate = document.getElementById("fl-return").value;
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
        <form id="ota-hotel-form">
          <div class="search-grid-generic">
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
          </div>
          <div class="search-submit-wrap">
            <button type="submit" class="btn btn-primary search-submit-btn">Search Hotels</button>
          </div>
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

    if (tab === "packages" || tab === "tour" || tab === "umrah") {
      const grp = searchState.packagesGroup || "TOUR";
      const t = searchState.tour;
      const u = searchState.umrah;

      container.innerHTML = `
        <div class="search-top-controls" style="flex-direction:column;gap:12px;margin-bottom:18px">
          <div class="trip-type-group">
            <span class="fare-tag-label">Select Section:</span>
            <label class="pill-radio ${grp === "HAJJ_UMRAH" ? "active" : ""}">
              <input type="radio" name="pkgGroup" value="HAJJ_UMRAH" ${grp === "HAJJ_UMRAH" ? "checked" : ""}>
              Hajj &amp; Umrah Section
            </label>
            <label class="pill-radio ${grp === "TOUR" ? "active" : ""}">
              <input type="radio" name="pkgGroup" value="TOUR" ${grp === "TOUR" ? "checked" : ""}>
              Tour Packages Section
            </label>
          </div>

          ${
            grp === "TOUR"
              ? `
            <div class="fare-type-group">
              <span class="fare-tag-label">Tour Offering:</span>
              <label class="pill-radio ${t.category === "ALL" ? "active" : ""}">
                <input type="radio" name="tourSubCat" value="ALL" ${t.category === "ALL" ? "checked" : ""}>
                All Tour Packages
              </label>
              <label class="pill-radio ${t.category === "INBOUND_TOUR" ? "active" : ""}">
                <input type="radio" name="tourSubCat" value="INBOUND_TOUR" ${t.category === "INBOUND_TOUR" ? "checked" : ""}>
                Inbound Tours (Bangladesh)
              </label>
              <label class="pill-radio ${t.category === "OUTBOUND_TOUR" ? "active" : ""}">
                <input type="radio" name="tourSubCat" value="OUTBOUND_TOUR" ${t.category === "OUTBOUND_TOUR" ? "checked" : ""}>
                Outbound Tours (International)
              </label>
            </div>`
              : `
            <div class="fare-type-group">
              <span class="fare-tag-label">Pilgrimage Type:</span>
              <label class="pill-radio ${u.category === "ALL_SPIRITUAL" ? "active" : ""}">
                <input type="radio" name="umrahSubCat" value="ALL_SPIRITUAL" ${u.category === "ALL_SPIRITUAL" ? "checked" : ""}>
                All Hajj &amp; Umrah
              </label>
              <label class="pill-radio ${u.category === "UMRAH" ? "active" : ""}">
                <input type="radio" name="umrahSubCat" value="UMRAH" ${u.category === "UMRAH" ? "checked" : ""}>
                Umrah Packages
              </label>
              <label class="pill-radio ${u.category === "HAJJ" ? "active" : ""}">
                <input type="radio" name="umrahSubCat" value="HAJJ" ${u.category === "HAJJ" ? "checked" : ""}>
                Hajj Packages
              </label>
            </div>`
          }
        </div>

        ${
          grp === "TOUR"
            ? `
        <form id="ota-tour-form">
          <div class="search-grid-generic">
            <div class="field-box">
              <label>Tour Category (Inbound / Outbound)</label>
              <select id="tr-cat">
                <option value="ALL" ${t.category === "ALL" ? "selected" : ""}>All Tour Packages (Inbound &amp; Outbound)</option>
                <option value="INBOUND_TOUR" ${t.category === "INBOUND_TOUR" ? "selected" : ""}>Inbound Tours (Explore Bangladesh)</option>
                <option value="OUTBOUND_TOUR" ${t.category === "OUTBOUND_TOUR" ? "selected" : ""}>Outbound Tours (World Holidays)</option>
              </select>
              <small>Domestic Bangladesh &amp; International Holidays</small>
            </div>
            <div class="field-box">
              <label>Destination Search</label>
              <input type="text" id="tr-dest" placeholder="e.g. Cox's Bazar, Sundarbans, Malaysia, Maldives" value="${escapeHtml(t.destination)}">
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
          </div>
          <div class="search-submit-wrap">
            <button type="submit" class="btn btn-primary search-submit-btn">
              ${t.category === "INBOUND_TOUR" ? "Find Inbound Tours" : t.category === "OUTBOUND_TOUR" ? "Find Outbound Tours" : "Find Tour Packages"}
            </button>
          </div>
        </form>`
            : `
        <form id="ota-umrah-form">
          <div class="search-grid-generic">
            <div class="field-box">
              <label>Pilgrimage Type</label>
              <select id="um-cat">
                <option value="ALL_SPIRITUAL" ${u.category === "ALL_SPIRITUAL" ? "selected" : ""}>All Hajj &amp; Umrah Packages</option>
                <option value="UMRAH" ${u.category === "UMRAH" ? "selected" : ""}>Umrah Packages (10 - 14 Days)</option>
                <option value="HAJJ" ${u.category === "HAJJ" ? "selected" : ""}>Hajj Packages (Shifting &amp; Non-Shifting)</option>
              </select>
              <small>Includes Visa, Flights, Haram Hotels &amp; Muallim</small>
            </div>
            <div class="field-box">
              <label>Package Tier</label>
              <select id="um-level">
                <option value="All" ${u.level === "All" ? "selected" : ""}>All Tiers (Economy to 5★ VIP)</option>
                <option value="Economy" ${u.level === "Economy" ? "selected" : ""}>Economy Shuttle / Walking</option>
                <option value="Standard" ${u.level === "Standard" ? "selected" : ""}>Standard 3★ / 4★</option>
                <option value="Premium" ${u.level === "Premium" ? "selected" : ""}>Premium 5★</option>
                <option value="VIP" ${u.level === "VIP" ? "selected" : ""}>VIP 5★ Clock Tower Haram View</option>
              </select>
              <small>Makkah &amp; Madinah Verified Hotels</small>
            </div>
            <div class="field-box">
              <label>Departure Month</label>
              <input type="month" id="um-month" value="${u.month}">
              <small>Weekly direct Biman &amp; Saudia groups</small>
            </div>
            <div class="field-box">
              <label>Number of Pilgrims</label>
              <select id="um-adults">
                ${[1, 2, 3, 4, 5, 6, 8].map(n => `<option value="${n}" ${u.adults === n ? "selected" : ""}>${n} Pilgrim${n > 1 ? "s" : ""}</option>`).join("")}
              </select>
              <small>Twin / Quad sharing options</small>
            </div>
          </div>
          <div class="search-submit-wrap">
            <button type="submit" class="btn btn-primary search-submit-btn">Search Hajj &amp; Umrah</button>
          </div>
        </form>`
        }
      `;

      container.querySelectorAll('input[name="pkgGroup"]').forEach(r => {
        r.addEventListener("change", e => {
          switchSearchTab("packages", e.target.value);
        });
      });

      container.querySelectorAll('input[name="tourSubCat"]').forEach(r => {
        r.addEventListener("change", e => {
          searchState.tour.category = e.target.value;
          renderSearchBox();
        });
      });

      container.querySelectorAll('input[name="umrahSubCat"]').forEach(r => {
        r.addEventListener("change", e => {
          searchState.umrah.category = e.target.value;
          renderSearchBox();
        });
      });

      document.getElementById("tr-cat")?.addEventListener("change", e => {
        searchState.tour.category = e.target.value;
        renderSearchBox();
      });

      document.getElementById("um-cat")?.addEventListener("change", e => {
        searchState.umrah.category = e.target.value;
        renderSearchBox();
      });

      document.getElementById("ota-tour-form")?.addEventListener("submit", e => {
        e.preventDefault();
        searchState.tour.category = document.getElementById("tr-cat").value;
        searchState.tour.destination = document.getElementById("tr-dest").value.trim();
        searchState.tour.travelDate = document.getElementById("tr-date").value;
        searchState.tour.adults = Number(document.getElementById("tr-adults").value || 2);
        executePackageSearch("TOUR");
      });

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
        <form id="ota-visa-form">
          <div class="search-grid-generic">
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
          </div>
          <div class="search-submit-wrap">
            <button type="submit" class="btn btn-primary search-submit-btn">Check Visa &amp; Apply</button>
          </div>
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
    if (f.tripType === "Multi-City" && Array.isArray(f.multiCitySegments) && f.multiCitySegments.length >= 2) {
      const legOptions = f.multiCitySegments.map(seg =>
        generateFlightsForRoute(seg.from, seg.to, "One Way", f.cabin, f.fareType)
      );
      const count = Math.min(5, legOptions[0]?.length || 4);
      const combinedResults = [];
      for (let i = 0; i < count; i++) {
        const legs = legOptions.map((opts, legIdx) => {
          const chosen = opts[i % opts.length];
          return {
            ...chosen,
            departDate: f.multiCitySegments[legIdx].departDate
          };
        });
        const first = legs[0];
        const last = legs[legs.length - 1];
        const totalBase = legs.reduce((acc, l) => acc + l.computed_base, 0);
        const totalTax = legs.reduce((acc, l) => acc + l.computed_tax, 0);
        combinedResults.push({
          ...first,
          id: `mc-${i}`,
          flight_number: legs.map(l => l.flight_number).join(" / "),
          from_code: first.from_code,
          from_city: first.from_city,
          to_code: last.to_code,
          to_city: last.to_city,
          trip_type: "Multi-City",
          computed_base: totalBase,
          computed_tax: totalTax,
          multi_legs: legs
        });
      }
      searchState.currentResults = combinedResults;
    } else {
      const allResults = generateFlightsForRoute(f.from, f.to, f.tripType, f.cabin, f.fareType);
      searchState.currentResults = allResults;
    }
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

    const routeHeadingHtml =
      f.tripType === "Multi-City" && Array.isArray(f.multiCitySegments)
        ? f.multiCitySegments.map(s => `${escapeHtml(getAirportCity(s.from))} (${escapeHtml(s.from)}) → ${escapeHtml(getAirportCity(s.to))} (${escapeHtml(s.to)})`).join(" • ")
        : `${escapeHtml(getAirportCity(f.from))} (${escapeHtml(f.from)}) → ${escapeHtml(getAirportCity(f.to))} (${escapeHtml(f.to)})`;

    sec.innerHTML = `
      <div class="container">
        <div class="section-head" style="margin-top:16px">
          <div>
            <h2>Flights: ${routeHeadingHtml}</h2>
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

                          ${
                            item.multi_legs && item.multi_legs.length
                              ? `<div style="display:flex;flex-direction:column;gap:10px">
                                  ${item.multi_legs
                                    .map(
                                      (leg, lIdx) => `
                                    <div class="flight-timeline" style="padding:6px 10px;background:#f8fafc;border-radius:10px;border:1px solid var(--line)">
                                      <div class="flight-time-col">
                                        <small style="font-size:10px;font-weight:700;color:var(--brand-primary)">LEG ${lIdx + 1} (${escapeHtml(leg.departDate)})</small>
                                        <strong>${escapeHtml(leg.departure_time)}</strong>
                                        <span>${escapeHtml(leg.from_code)} (${escapeHtml(leg.from_city)})</span>
                                      </div>
                                      <div class="flight-duration-col">
                                        <span>${escapeHtml(leg.duration)}</span>
                                        <div class="flight-duration-bar"></div>
                                        <strong style="color:${leg.stops === "Non-Stop" ? "var(--brand-green)" : "var(--brand-gold)"};font-size:11px">${escapeHtml(leg.stops)}</strong>
                                      </div>
                                      <div class="flight-time-col">
                                        <small style="font-size:10px;color:var(--muted)">${escapeHtml(leg.flight_number)}</small>
                                        <strong>${escapeHtml(leg.arrival_time)}</strong>
                                        <span>${escapeHtml(leg.to_code)} (${escapeHtml(leg.to_city)})</span>
                                      </div>
                                    </div>`
                                    )
                                    .join("")}
                                </div>`
                              : `<div class="flight-timeline">
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
                                </div>`
                          }

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
                            <span><strong>Baggage:</strong> ${escapeHtml(item.baggage)}</span>
                            <span><strong>Date:</strong> ${escapeHtml(f.departDate)}${f.tripType === "Round Trip" ? " ⇄ " + escapeHtml(f.returnDate) : ""}</span>
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
            <h2>Hotels in ${escapeHtml(h.city === "All" ? "All Destinations" : h.city)}</h2>
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
                  <div class="catalog-meta">${escapeHtml(hotel.city)}, ${escapeHtml(hotel.country)}</div>
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
    const { escapeHtml } = window.AC;

    let list = window.AC.state.packages;
    let heading = "Tour Packages (Inbound & Outbound)";

    if (mode === "UMRAH") {
      const u = searchState.umrah;
      heading = "Hajj & Umrah Spiritual Packages";
      list = list.filter(p => {
        if (u.category === "ALL_SPIRITUAL") return p.category === "UMRAH" || p.category === "HAJJ";
        return p.category === u.category;
      });
      if (u.level !== "All") {
        list = list.filter(p => p.package_level === u.level);
      }

      sec.innerHTML = `
        <div class="container">
          <div class="section-head" style="margin-top:16px">
            <div>
              <h2>${heading} (${list.length} Available)</h2>
              <p>Select any Hajj or Umrah package to inspect the itinerary or complete your booking online.</p>
            </div>
            <button class="btn btn-outline btn-sm" onclick="document.getElementById('results-section').hidden=true">✕ Close Results</button>
          </div>
          <div class="catalog-grid" style="margin-bottom:36px">
            ${list.map(pkg => renderPackageCardHtml(pkg)).join("")}
          </div>
        </div>
      `;
      sec.scrollIntoView({ behavior: "smooth" });
      return;
    }

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

    if (t.category === "ALL") {
      sec.innerHTML = `
        <div class="container">
          <div class="section-head" style="margin-top:16px">
            <div>
              <h2>Tour Packages (${list.length} Available)</h2>
              <p>Browse domestic Bangladesh Inbound Tours and International Outbound Holidays below.</p>
            </div>
            <button class="btn btn-outline btn-sm" onclick="document.getElementById('results-section').hidden=true">✕ Close Results</button>
          </div>
          <div class="package-group-panel tour-panel" style="margin-bottom:36px">
            ${buildAutoCarouselHtml(list.map(pkg => renderPackageCardHtml(pkg)), "No matching Tour Packages found.")}
          </div>
        </div>
      `;
    } else {
      heading = t.category === "INBOUND_TOUR" ? "Inbound Tours (Explore Bangladesh)" : "Outbound Tours (International Holidays)";
      sec.innerHTML = `
        <div class="container">
          <div class="section-head" style="margin-top:16px">
            <div>
              <h2>${heading} (${list.length} Available)</h2>
              <p>Select any package to inspect the day-by-day itinerary or complete your booking online.</p>
            </div>
            <button class="btn btn-outline btn-sm" onclick="document.getElementById('results-section').hidden=true">✕ Close Results</button>
          </div>
          <div class="package-group-panel tour-panel" style="margin-bottom:36px">
            ${buildAutoCarouselHtml(list.map(pkg => renderPackageCardHtml(pkg)), "No matching Tour Packages found.")}
          </div>
        </div>
      `;
    }
    bindCarouselPauseOnHover(sec);
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
            <h2>Global Visa Processing Services</h2>
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
                <span class="catalog-tag">${escapeHtml(visa.visa_type)}</span>
                <span class="catalog-rating">${escapeHtml(visa.processing_time)}</span>
              </div>
              <div class="catalog-body">
                <div class="catalog-meta">Validity: ${escapeHtml(visa.validity)} • Max Stay: ${escapeHtml(visa.max_stay)}</div>
                <h3>${escapeHtml(visa.country)}${/\bvisa\b/i.test(visa.country || "") ? "" : " Visa"}</h3>
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
      UMRAH: "Umrah",
      HAJJ: "Hajj",
      INBOUND_TOUR: "Bangladesh Tour",
      OUTBOUND_TOUR: "World Holiday"
    };
    return `
      <div class="catalog-card">
        <div class="catalog-thumb">
          <img src="${escapeHtml(pkg.image_url)}" alt="${escapeHtml(pkg.title)}">
          <span class="catalog-tag">${badgeMap[pkg.category] || pkg.category} • ${escapeHtml(pkg.package_level || "Standard")}</span>
          <span class="catalog-rating">★ ${escapeHtml(pkg.rating || 4.9)} (${escapeHtml(pkg.review_count || 85)})</span>
        </div>
        <div class="catalog-body">
          <div class="catalog-meta">${escapeHtml(pkg.destination)}, ${escapeHtml(pkg.country)} • ${escapeHtml(pkg.duration)}</div>
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

  function buildAutoCarouselHtml(cardHtmlList, emptyMessage = "No items available in this category.") {
    if (!cardHtmlList || !cardHtmlList.length) {
      return `<p style="color:var(--muted)">${emptyMessage}</p>`;
    }
    const repeatFactor = Math.max(1, Math.ceil(5 / cardHtmlList.length));
    const singleHalfCards = [];
    for (let i = 0; i < repeatFactor; i++) {
      singleHalfCards.push(...cardHtmlList);
    }
    const halfHtml = singleHalfCards.join("");
    const durationSec = Math.max(20, Math.round(singleHalfCards.length * 5.5));
    return `
      <div class="hv-carousel-viewport">
        <div class="hv-carousel-track" style="--hv-slide-duration: ${durationSec}s">
          ${halfHtml}
          ${halfHtml}
        </div>
      </div>
    `;
  }

  function bindCarouselPauseOnHover(rootEl) {
    if (!rootEl) return;
    rootEl.querySelectorAll(".hv-carousel-track").forEach(track => {
      track.querySelectorAll(".catalog-card, .offer-banner-card, .partner-chip").forEach(card => {
        card.addEventListener("mouseenter", () => {
          track.classList.add("is-paused");
        });
        card.addEventListener("mouseleave", () => {
          track.classList.remove("is-paused");
        });
      });
    });
  }

  // Homepage Sections Renderer
  function renderHomepageCatalog(activeFilter = "ALL") {
    const { escapeHtml, state } = window.AC;

    // 1. Special Offers Banners (Single-Line Auto-Sliding Carousel with Pause-on-Hover)
    const offersGrid = document.getElementById("home-offers-grid");
    if (offersGrid) {
      const offerCards = state.promoBanners.map(
        b => `
        <div class="offer-banner-card" style="background-image:url('${escapeHtml(b.image_url)}')" onclick="window.ACSearch.switchSearchTab('${escapeHtml(b.service_tab || "flight")}')">
          <div class="offer-banner-content">
            <span class="offer-badge">${escapeHtml(b.badge_text)}</span>
            <h3>${escapeHtml(b.title)}</h3>
            <p>${escapeHtml(b.subtitle)}</p>
          </div>
        </div>`
      );
      offersGrid.innerHTML = buildAutoCarouselHtml(offerCards, "No special offers available right now.");
      bindCarouselPauseOnHover(offersGrid);
    }

    // 3. Grouped Hajj & Umrah + Tour Packages
    const catalogGrid = document.getElementById("home-catalog-grid");
    if (catalogGrid) {
      const hajjUmrahList = state.packages.filter(p => p.category === "UMRAH" || p.category === "HAJJ");
      const inboundList = state.packages.filter(p => p.category === "INBOUND_TOUR");
      const outboundList = state.packages.filter(p => p.category === "OUTBOUND_TOUR");
      const allTourList = [...inboundList, ...outboundList];

      const hajjPanelHtml = `
        <div class="package-group-panel hajj-panel">
          <div class="package-group-header">
            <div>
              <h3>Hajj &amp; Umrah Section</h3>
              <p>Spiritually guided Hajj &amp; Umrah packages with direct flights, e-Visa, Haram-view hotels &amp; experienced Muallim guides.</p>
            </div>
            <button type="button" class="btn btn-outline btn-sm" onclick="window.ACSearch.switchSearchTab('umrah');window.scrollTo({top:0,behavior:'smooth'})">
              Search Hajj &amp; Umrah →
            </button>
          </div>
          <div class="catalog-grid">
            ${hajjUmrahList.map(p => renderPackageCardHtml(p)).join("")}
          </div>
        </div>
      `;

      const inboundSubPanelHtml = `
        <div class="package-group-header">
          <div>
            <h3>Inbound Tours (Explore Bangladesh)</h3>
            <p>Domestic Bangladesh tour packages — Cox's Bazar, Sundarbans, Sylhet &amp; Hill Tracts</p>
          </div>
          <button type="button" class="btn btn-outline btn-sm" onclick="window.ACSearch.switchSearchTab('inbound');window.scrollTo({top:0,behavior:'smooth'})">
            Search Inbound Tours →
          </button>
        </div>
        ${buildAutoCarouselHtml(inboundList.map(p => renderPackageCardHtml(p)), "No Inbound Tour packages available.")}
      `;

      const outboundSubPanelHtml = `
        <div class="package-group-header">
          <div>
            <h3>Outbound Tours (International Holidays)</h3>
            <p>All-inclusive overseas holiday packages — Malaysia, Maldives, Dubai, Thailand &amp; Singapore</p>
          </div>
          <button type="button" class="btn btn-outline btn-sm" onclick="window.ACSearch.switchSearchTab('outbound');window.scrollTo({top:0,behavior:'smooth'})">
            Search Outbound Tours →
          </button>
        </div>
        ${buildAutoCarouselHtml(outboundList.map(p => renderPackageCardHtml(p)), "No Outbound Tour packages available.")}
      `;

      const tourPanelHtml = `
        <div class="package-group-panel tour-panel">
          <div class="package-group-header">
            <div>
              <h3>Tour Packages Section</h3>
              <p>Curated holiday packages across <strong>Inbound Tours (Bangladesh)</strong> and <strong>Outbound Tours (International)</strong>.</p>
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              <button type="button" class="btn btn-outline btn-sm" onclick="document.querySelector('[data-cat=\\'INBOUND_TOUR\\']')?.click()">
                Inbound Tours (${inboundList.length})
              </button>
              <button type="button" class="btn btn-outline btn-sm" onclick="document.querySelector('[data-cat=\\'OUTBOUND_TOUR\\']')?.click()">
                Outbound Tours (${outboundList.length})
              </button>
            </div>
          </div>
          ${buildAutoCarouselHtml(allTourList.map(p => renderPackageCardHtml(p)), "No Tour packages available.")}
        </div>
      `;

      if (activeFilter === "ALL") {
        catalogGrid.className = "grouped-packages-wrapper";
        catalogGrid.innerHTML = `${hajjPanelHtml}${tourPanelHtml}`;
      } else if (activeFilter === "UMRAH_HAJJ") {
        catalogGrid.className = "grouped-packages-wrapper";
        catalogGrid.innerHTML = hajjPanelHtml;
      } else if (activeFilter === "TOUR_ALL") {
        catalogGrid.className = "grouped-packages-wrapper";
        catalogGrid.innerHTML = tourPanelHtml;
      } else if (activeFilter === "INBOUND_TOUR") {
        catalogGrid.className = "grouped-packages-wrapper";
        catalogGrid.innerHTML = `
          <div class="package-group-panel tour-panel">
            ${inboundSubPanelHtml}
          </div>
        `;
      } else if (activeFilter === "OUTBOUND_TOUR") {
        catalogGrid.className = "grouped-packages-wrapper";
        catalogGrid.innerHTML = `
          <div class="package-group-panel tour-panel">
            ${outboundSubPanelHtml}
          </div>
        `;
      }

      bindCarouselPauseOnHover(catalogGrid);
    }

    // 4. Hotels & Visa Services Grid (if present on homepage)
    const hvGrid = document.getElementById("home-hotels-visas-grid");
    if (hvGrid) {
      const hvFilter = document.querySelector("#home-hv-tabs .filter-pill.active")?.getAttribute("data-hv") || "ALL_HV";
      renderHotelsVisasSection(hvFilter);
    }

    // 5. Airline Partners Carousel (if present on homepage)
    const partnersBox = document.querySelector(".partners-box");
    if (partnersBox) {
      bindCarouselPauseOnHover(partnersBox);
    }
  }

  function renderHotelsVisasSection(hvFilter = "ALL_HV") {
    const hvGrid = document.getElementById("home-hotels-visas-grid");
    if (!hvGrid) return;
    const { formatMoney, escapeHtml, state } = window.AC;

    const hotelCards = state.hotels.map(h => {
      const price = Number(h.discount_price || h.price_per_night);
      return `
        <div class="catalog-card">
          <div class="catalog-thumb">
            <img src="${escapeHtml(h.image_url)}" alt="${escapeHtml(h.name)}">
            <span class="catalog-tag">${"★".repeat(h.star_rating || 5)} Hotel</span>
            <span class="catalog-rating">★ ${escapeHtml(h.rating_score || 4.8)}</span>
          </div>
          <div class="catalog-body">
            <div class="catalog-meta">${escapeHtml(h.city)}, ${escapeHtml(h.country)}</div>
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
    });

    const visaCards = state.visaServices.map(
      v => `
      <div class="catalog-card">
        <div class="catalog-thumb">
          <img src="${escapeHtml(v.image_url)}" alt="${escapeHtml(v.country)}">
          <span class="catalog-tag">${escapeHtml(v.visa_type)}</span>
          <span class="catalog-rating">${escapeHtml(v.processing_time)}</span>
        </div>
        <div class="catalog-body">
          <div class="catalog-meta">Validity: ${escapeHtml(v.validity)} • Max Stay: ${escapeHtml(v.max_stay)}</div>
          <h3>${escapeHtml(v.country)}${/\bvisa\b/i.test(v.country || "") ? "" : " Visa"}</h3>
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
    );

    let activeCards = [];
    if (hvFilter === "HOTEL") {
      activeCards = hotelCards;
    } else if (hvFilter === "VISA") {
      activeCards = visaCards;
    } else {
      activeCards = [...hotelCards, ...visaCards];
    }

    hvGrid.className = "hv-carousel-viewport";

    if (!activeCards.length) {
      hvGrid.innerHTML = `<p style="color:var(--muted)">No items available in this category.</p>`;
      return;
    }

    // Ensure each half of the infinite carousel has at least 5 cards so it spans wider than the viewport
    const repeatFactor = Math.max(1, Math.ceil(5 / activeCards.length));
    const singleHalfCards = [];
    for (let i = 0; i < repeatFactor; i++) {
      singleHalfCards.push(...activeCards);
    }
    const halfHtml = singleHalfCards.join("");
    const durationSec = Math.max(20, Math.round(singleHalfCards.length * 5.5));

    hvGrid.innerHTML = `
      <div class="hv-carousel-track" style="--hv-slide-duration: ${durationSec}s">
        ${halfHtml}
        ${halfHtml}
      </div>
    `;

    const track = hvGrid.querySelector(".hv-carousel-track");
    if (track) {
      hvGrid.querySelectorAll(".catalog-card").forEach(card => {
        card.addEventListener("mouseenter", () => {
          track.classList.add("is-paused");
        });
        card.addEventListener("mouseleave", () => {
          track.classList.remove("is-paused");
        });
      });
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
      <p style="color:var(--muted);margin:6px 0 16px">${escapeHtml(pkg.destination)}, ${escapeHtml(pkg.country)} • ${escapeHtml(pkg.duration)} • ★ ${escapeHtml(pkg.rating)}</p>
      <img src="${escapeHtml(pkg.image_url)}" alt="${escapeHtml(pkg.title)}" style="width:100%;height:230px;object-fit:cover;border-radius:14px;margin-bottom:16px">
      <p>${escapeHtml(pkg.overview)}</p>

      <h3 style="margin:18px 0 10px;font-size:17px">Day-by-Day Itinerary</h3>
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
      <p style="color:var(--muted);margin:6px 0 16px">${escapeHtml(hotel.address)} (${escapeHtml(hotel.city)}, ${escapeHtml(hotel.country)})</p>
      <img src="${escapeHtml(hotel.image_url)}" alt="${escapeHtml(hotel.name)}" style="width:100%;height:230px;object-fit:cover;border-radius:14px;margin-bottom:16px">
      <p>${escapeHtml(hotel.description)}</p>

      <h3 style="margin:16px 0 10px;font-size:16px">Key Amenities</h3>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
        ${(hotel.amenities || []).map(a => `<span class="pill-radio">${escapeHtml(a)}</span>`).join("")}
      </div>

      <h3 style="margin:16px 0 10px;font-size:16px">Available Room Categories</h3>
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
      <span class="status-badge status-PROCESSING">${escapeHtml(visa.visa_type)}</span>
      <h2 style="margin-top:8px;font-size:24px">${escapeHtml(visa.country)}${/\bvisa\b/i.test(visa.country || "") ? " Requirements" : " Visa Requirements"}</h2>
      <p style="color:var(--muted);margin:6px 0 16px">Processing: ${escapeHtml(visa.processing_time)} • Validity: ${escapeHtml(visa.validity)} • Max Stay: ${escapeHtml(visa.max_stay)}</p>
      <p>${escapeHtml(visa.description)}</p>

      <h3 style="margin:16px 0 10px;font-size:16px">Required Documents Checklist</h3>
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
    handleHeaderNavClick,
    renderSearchBox,
    renderHomepageCatalog,
    renderHotelsVisasSection,
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
