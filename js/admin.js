// Air Connect Ltd — Full Admin Dashboard Controller
(function () {
  const admState = {
    tab: "bookings",
    statusFilter: "ALL",
    bookings: [],
    requests: [],
    flights: [],
    packages: [],
    hotels: [],
    visas: [],
    banners: []
  };

  async function initAdmin() {
    const { data: { session } } = await window.AC.supabase.auth.getSession();
    await window.AC.syncAuthUser(session);
    checkAdminAccess();

    window.addEventListener("ac:auth-changed", checkAdminAccess);

    document.getElementById("admin-login-form")?.addEventListener("submit", async e => {
      e.preventDefault();
      const email = document.getElementById("adm-email").value.trim();
      const password = document.getElementById("adm-pass").value;
      const btn = document.getElementById("adm-login-btn");
      btn.disabled = true;
      btn.textContent = "Verifying...";

      const { error } = await window.AC.supabase.auth.signInWithPassword({ email, password });
      if (error) {
        window.AC.showToast(error.message, "error");
        btn.disabled = false;
        btn.textContent = "Sign In to Dashboard";
        return;
      }
      window.AC.showToast("Welcome to Air Connect Admin Panel!", "success");
    });
  }

  async function checkAdminAccess() {
    const gate = document.getElementById("admin-login-gate");
    const shell = document.getElementById("admin-app-shell");
    const logoutBtn = document.getElementById("admin-logout-btn");

    if (window.AC.state.user && window.AC.state.isAdmin) {
      gate.hidden = true;
      shell.hidden = false;
      logoutBtn.hidden = false;
      await refreshAllData();
      renderActiveTab();
    } else {
      gate.hidden = false;
      shell.hidden = true;
      logoutBtn.hidden = true;
    }
  }

  async function logoutAdmin() {
    await window.AC.supabase.auth.signOut();
    window.location.reload();
  }

  async function refreshAllData() {
    const { supabase } = window.AC;
    const [bRes, rRes, fRes, pRes, hRes, vRes, bnRes, sRes] = await Promise.all([
      supabase.from("bookings").select("*").order("created_at", { ascending: false }),
      supabase.from("booking_requests").select("*").order("created_at", { ascending: false }),
      supabase.from("flight_deals").select("*").order("created_at", { ascending: false }),
      supabase.from("packages").select("*").order("created_at", { ascending: false }),
      supabase.from("hotels").select("*").order("created_at", { ascending: false }),
      supabase.from("visa_services").select("*").order("created_at", { ascending: false }),
      supabase.from("promo_banners").select("*").order("sort_order", { ascending: true }),
      supabase.from("site_settings").select("*").limit(1).maybeSingle()
    ]);

    admState.bookings = bRes.data || [];
    admState.requests = rRes.data || [];
    admState.flights = fRes.data || [];
    admState.packages = pRes.data || [];
    admState.hotels = hRes.data || [];
    admState.visas = vRes.data || [];
    admState.banners = bnRes.data || [];
    if (sRes.data) window.AC.state.settings = sRes.data;
  }

  function switchTab(tab) {
    admState.tab = tab;
    document.querySelectorAll("[data-adm-tab]").forEach(btn => {
      btn.classList.toggle("active", btn.getAttribute("data-adm-tab") === tab);
    });
    renderActiveTab();
  }

  async function uploadImageToMediaBucket(fileInputEl) {
    const file = fileInputEl?.files?.[0];
    if (!file) return null;
    const ext = file.name.split(".").pop() || "jpg";
    const filePath = `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
    const { error } = await window.AC.supabase.storage.from("media").upload(filePath, file);
    if (error) {
      window.AC.showToast("Image upload failed: " + error.message, "error");
      return null;
    }
    const { data } = window.AC.supabase.storage.from("media").getPublicUrl(filePath);
    return data?.publicUrl || null;
  }

  function renderActiveTab() {
    const main = document.getElementById("admin-main-content");
    if (!main) return;
    const { formatMoney, escapeHtml } = window.AC;

    if (admState.tab === "bookings") {
      const totalRev = admState.bookings
        .filter(b => ["CONFIRMED", "TICKETED", "COMPLETED"].includes(b.status))
        .reduce((acc, b) => acc + Number(b.total_amount || 0), 0);
      const pendingCount = admState.bookings.filter(b => ["ON_HOLD", "PENDING"].includes(b.status)).length;
      const ticketedCount = admState.bookings.filter(b => ["CONFIRMED", "TICKETED"].includes(b.status)).length;

      const list = admState.bookings.filter(
        b => admState.statusFilter === "ALL" || b.status === admState.statusFilter
      );

      main.innerHTML = `
        <div class="kpi-grid">
          <div class="kpi-card"><small>Total Bookings</small><strong>${admState.bookings.length}</strong></div>
          <div class="kpi-card"><small>On Hold / Pending Verification</small><strong style="color:#d97706">${pendingCount}</strong></div>
          <div class="kpi-card"><small>Confirmed / Ticketed</small><strong style="color:#15803d">${ticketedCount}</strong></div>
          <div class="kpi-card"><small>Confirmed Revenue</small><strong style="color:var(--brand-primary)">${formatMoney(totalRev)}</strong></div>
        </div>

        <div class="admin-table-wrap">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:12px">
            <h3 style="font-size:19px">Bookings &amp; Ticketing Desk</h3>
            <div class="filter-pills">
              ${["ALL", "ON_HOLD", "PENDING", "CONFIRMED", "TICKETED", "CANCELLED"]
                .map(
                  st => `
                <button type="button" class="filter-pill ${admState.statusFilter === st ? "active" : ""}" onclick="window.ACAdmin.setBookingFilter('${st}')">${st}</button>`
                )
                .join("")}
            </div>
          </div>

          <table class="admin-table">
            <thead>
              <tr>
                <th>Booking Ref / PNR</th>
                <th>Service</th>
                <th>Customer &amp; Phone</th>
                <th>Travel Date</th>
                <th>Payment / TrxID</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${
                list.length === 0
                  ? `<tr><td colspan="8" style="text-align:center;padding:24px;color:var(--muted)">No bookings in this view yet.</td></tr>`
                  : list
                      .map(
                        b => `
                    <tr>
                      <td>
                        <strong style="color:var(--brand-primary)">${escapeHtml(b.booking_ref)}</strong>
                        <div style="font-size:11px;color:var(--muted)">PNR: ${escapeHtml(b.pnr_code || "-")}</div>
                        ${b.eticket_number ? `<div style="font-size:11px;color:#15803d;font-weight:700">TKT: ${escapeHtml(b.eticket_number)}</div>` : ""}
                      </td>
                      <td>
                        <span class="status-badge status-PROCESSING">${escapeHtml(b.service_type)}</span>
                        <div style="font-weight:700;margin-top:4px">${escapeHtml(b.service_title)}</div>
                      </td>
                      <td>
                        <strong>${escapeHtml(b.customer_name)}</strong>
                        <div style="font-size:12px;color:var(--muted)">${escapeHtml(b.customer_phone)}</div>
                      </td>
                      <td>${escapeHtml(b.travel_date || "Flexible")}</td>
                      <td>
                        <strong>${escapeHtml(b.payment_method)}</strong>
                        ${b.transaction_id ? `<div style="font-size:11px;color:#0f766e">TrxID: ${escapeHtml(b.transaction_id)}</div>` : ""}
                        ${b.payment_slip_url ? `<a href="${escapeHtml(b.payment_slip_url)}" target="_blank" style="font-size:11px;color:var(--brand-accent);text-decoration:underline">View Payment Slip</a>` : ""}
                      </td>
                      <td><strong>${formatMoney(b.total_amount)}</strong></td>
                      <td><span class="status-badge status-${escapeHtml(b.status)}">${escapeHtml(b.status)}</span></td>
                      <td>
                        <div style="display:flex;gap:6px">
                          <button type="button" class="btn btn-primary btn-sm" onclick="window.ACAdmin.openManageBookingModal('${escapeHtml(b.id)}')">Manage / Issue</button>
                          <button type="button" class="btn btn-outline btn-sm" onclick='window.ACBooking.showBookingVoucherModal(${JSON.stringify(b).replace(/'/g, "&#39;")})'>🖨</button>
                        </div>
                      </td>
                    </tr>`
                      )
                      .join("")
              }
            </tbody>
          </table>
        </div>
      `;
      return;
    }

    if (admState.tab === "requests") {
      main.innerHTML = `
        <div class="admin-table-wrap">
          <h3 style="margin-bottom:16px">🔄 Customer Refund &amp; Reissue (Date Change) Requests</h3>
          <table class="admin-table">
            <thead>
              <tr>
                <th>Booking Ref</th>
                <th>Phone</th>
                <th>Request Type</th>
                <th>Preferred Date</th>
                <th>Customer Reason</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${
                admState.requests.length === 0
                  ? `<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--muted)">No refund or reissue requests submitted yet.</td></tr>`
                  : admState.requests
                      .map(
                        r => `
                    <tr>
                      <td><strong>${escapeHtml(r.booking_ref)}</strong></td>
                      <td>${escapeHtml(r.customer_phone)}</td>
                      <td><span class="status-badge status-PROCESSING">${escapeHtml(r.request_type)}</span></td>
                      <td>${escapeHtml(r.preferred_date || "-")}</td>
                      <td>${escapeHtml(r.reason)}</td>
                      <td><span class="status-badge status-${escapeHtml(r.status)}">${escapeHtml(r.status)}</span></td>
                      <td>
                        <button type="button" class="btn btn-primary btn-sm" onclick="window.ACAdmin.updateRequestStatus('${escapeHtml(r.id)}', 'APPROVED')">Approve</button>
                        <button type="button" class="btn btn-outline btn-sm" onclick="window.ACAdmin.updateRequestStatus('${escapeHtml(r.id)}', 'REJECTED')">Reject</button>
                      </td>
                    </tr>`
                      )
                      .join("")
              }
            </tbody>
          </table>
        </div>
      `;
      return;
    }

    if (admState.tab === "flights") {
      main.innerHTML = `
        <div class="admin-table-wrap">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
            <h3>✈ Manage Flight Deals &amp; Promo Routes</h3>
            <button type="button" class="btn btn-primary btn-sm" onclick="window.ACAdmin.openFlightModal()">+ Add Flight Route</button>
          </div>
          <table class="admin-table">
            <thead>
              <tr>
                <th>Airline &amp; Flight</th>
                <th>Route</th>
                <th>Time &amp; Stops</th>
                <th>Fare Type / Class</th>
                <th>Base + Tax (BDT)</th>
                <th>Baggage</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${admState.flights
                .map(
                  f => `
                <tr>
                  <td><strong>${escapeHtml(f.airline)}</strong> (${escapeHtml(f.flight_number)})</td>
                  <td><strong>${escapeHtml(f.from_code)} → ${escapeHtml(f.to_code)}</strong> (${escapeHtml(f.from_city)} to ${escapeHtml(f.to_city)})</td>
                  <td>${escapeHtml(f.departure_time)} - ${escapeHtml(f.arrival_time)} (${escapeHtml(f.stops)})</td>
                  <td>${escapeHtml(f.fare_type)} • ${escapeHtml(f.cabin_class)}</td>
                  <td><strong>${formatMoney(Number(f.base_fare) + Number(f.taxes || 0), "BDT")}</strong></td>
                  <td>${escapeHtml(f.baggage)}</td>
                  <td>
                    <button type="button" class="btn btn-outline btn-sm" onclick="window.ACAdmin.toggleActive('flight_deals','${escapeHtml(f.id)}',${!f.active})">${f.active ? "Hide" : "Show"}</button>
                  </td>
                </tr>`
                )
                .join("")}
            </tbody>
          </table>
        </div>
      `;
      return;
    }

    if (admState.tab === "packages") {
      main.innerHTML = `
        <div class="admin-table-wrap">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
            <h3>🕋 Manage Hajj, Umrah &amp; Holiday Tour Packages</h3>
            <button type="button" class="btn btn-primary btn-sm" onclick="window.ACAdmin.openAddPackageModal()">+ Add New Package</button>
          </div>
          <table class="admin-table">
            <thead>
              <tr>
                <th>Package Title</th>
                <th>Category &amp; Level</th>
                <th>Destination</th>
                <th>Duration</th>
                <th>Price (BDT)</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${admState.packages
                .map(
                  p => `
                <tr>
                  <td>
                    <div style="display:flex;align-items:center;gap:10px">
                      ${p.image_url ? `<img src="${escapeHtml(p.image_url)}" alt="${escapeHtml(p.title)}" style="width:48px;height:34px;border-radius:6px;object-fit:cover;border:1px solid var(--line);flex-shrink:0">` : ""}
                      <strong>${escapeHtml(p.title)}</strong>
                    </div>
                  </td>
                  <td><span class="status-badge status-PROCESSING">${escapeHtml(p.category)}</span> (${escapeHtml(p.package_level)})</td>
                  <td>${escapeHtml(p.destination)}, ${escapeHtml(p.country)}</td>
                  <td>${escapeHtml(p.duration)}</td>
                  <td><strong>${formatMoney(p.discount_price || p.price, "BDT")}</strong></td>
                  <td><span class="status-badge ${p.active ? "status-CONFIRMED" : "status-CANCELLED"}">${p.active ? "Active" : "Hidden"}</span></td>
                  <td>
                    <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">
                      <button type="button" class="btn btn-primary btn-sm" onclick="window.ACAdmin.openEditPackageModal('${escapeHtml(p.id)}')">✏ Edit</button>
                      <button type="button" class="btn btn-outline btn-sm" onclick="window.ACAdmin.toggleActive('packages','${escapeHtml(p.id)}',${!p.active})">${p.active ? "Hide" : "Activate"}</button>
                    </div>
                  </td>
                </tr>`
                )
                .join("")}
            </tbody>
          </table>
        </div>
      `;
      return;
    }

    if (admState.tab === "hotels") {
      main.innerHTML = `
        <div class="admin-table-wrap">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
            <h3>🏨 Manage Hotels Catalog</h3>
            <button type="button" class="btn btn-primary btn-sm" onclick="window.ACAdmin.openAddHotelModal()">+ Add New Hotel</button>
          </div>
          <table class="admin-table">
            <thead>
              <tr>
                <th>Hotel Name</th>
                <th>City &amp; Country</th>
                <th>Star Rating</th>
                <th>Rate / Night (BDT)</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${admState.hotels
                .map(
                  h => `
                <tr>
                  <td><strong>${escapeHtml(h.name)}</strong></td>
                  <td>${escapeHtml(h.city)}, ${escapeHtml(h.country)}</td>
                  <td>${"★".repeat(h.star_rating || 5)}</td>
                  <td><strong>${formatMoney(h.discount_price || h.price_per_night, "BDT")}</strong></td>
                  <td><span class="status-badge ${h.active ? "status-CONFIRMED" : "status-CANCELLED"}">${h.active ? "Active" : "Hidden"}</span></td>
                  <td>
                    <button type="button" class="btn btn-outline btn-sm" onclick="window.ACAdmin.toggleActive('hotels','${escapeHtml(h.id)}',${!h.active})">${h.active ? "Hide" : "Activate"}</button>
                  </td>
                </tr>`
                )
                .join("")}
            </tbody>
          </table>
        </div>
      `;
      return;
    }

    if (admState.tab === "visas") {
      main.innerHTML = `
        <div class="admin-table-wrap" style="margin-bottom:24px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
            <h3>🛂 Manage Visa Services</h3>
            <button type="button" class="btn btn-primary btn-sm" onclick="window.ACAdmin.openAddVisaModal()">+ Add Visa Country</button>
          </div>
          <table class="admin-table">
            <thead>
              <tr>
                <th>Country / Visa Title</th>
                <th>Visa Type</th>
                <th>Processing Time</th>
                <th>Fee (BDT)</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${admState.visas
                .map(
                  v => `
                <tr>
                  <td>
                    <div style="display:flex;align-items:center;gap:10px">
                      ${v.image_url ? `<img src="${escapeHtml(v.image_url)}" alt="${escapeHtml(v.country)}" style="width:48px;height:34px;border-radius:6px;object-fit:cover;border:1px solid var(--line);flex-shrink:0">` : ""}
                      <strong><span style="font-size:16px;margin-right:4px">${escapeHtml(v.flag_emoji || "🌍")}</span>${escapeHtml(v.country)}</strong>
                    </div>
                  </td>
                  <td>${escapeHtml(v.visa_type)}</td>
                  <td>${escapeHtml(v.processing_time)}</td>
                  <td><strong>${formatMoney(v.fee, "BDT")}</strong></td>
                  <td><span class="status-badge ${v.active !== false ? "status-CONFIRMED" : "status-CANCELLED"}">${v.active !== false ? "Active" : "Hidden"}</span></td>
                  <td>
                    <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">
                      <button type="button" class="btn btn-primary btn-sm" onclick="window.ACAdmin.openEditVisaModal('${escapeHtml(v.id)}')">✏ Edit</button>
                      <button type="button" class="btn btn-outline btn-sm" onclick="window.ACAdmin.toggleActive('visa_services','${escapeHtml(v.id)}',${!(v.active !== false)})">${v.active !== false ? "Hide" : "Activate"}</button>
                    </div>
                  </td>
                </tr>`
                )
                .join("")}
            </tbody>
          </table>
        </div>

        <div class="admin-table-wrap">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
            <h3>🔥 Homepage Special Offer Banners</h3>
            <button type="button" class="btn btn-primary btn-sm" onclick="window.ACAdmin.openAddBannerModal()">+ Add Promo Banner</button>
          </div>
          <table class="admin-table">
            <thead>
              <tr>
                <th>Badge</th>
                <th>Title &amp; Subtitle</th>
                <th>Target Tab</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${admState.banners
                .map(
                  b => `
                <tr>
                  <td><span class="status-badge status-CONFIRMED">${escapeHtml(b.badge_text)}</span></td>
                  <td><strong>${escapeHtml(b.title)}</strong><div style="font-size:12px;color:var(--muted)">${escapeHtml(b.subtitle)}</div></td>
                  <td>${escapeHtml(b.service_tab)}</td>
                  <td>
                    <button type="button" class="btn btn-outline btn-sm" onclick="window.ACAdmin.toggleActive('promo_banners','${escapeHtml(b.id)}',${!b.active})">${b.active ? "Hide" : "Activate"}</button>
                  </td>
                </tr>`
                )
                .join("")}
            </tbody>
          </table>
        </div>
      `;
      return;
    }

    if (admState.tab === "settings") {
      const s = window.AC.state.settings;
      main.innerHTML = `
        <div class="admin-table-wrap" style="max-width:780px">
          <h3>⚙ Site Contact, Payment Accounts &amp; Currency Settings</h3>
          <p style="font-size:13px;color:var(--muted);margin-bottom:18px">Changes saved here update airconnectltd.com immediately.</p>
          <form id="adm-settings-form">
            <div class="form-grid-2">
              <div class="form-field">
                <label>Brand Name</label>
                <input type="text" id="st-brand" value="${escapeHtml(s.brand_name)}" required>
              </div>
              <div class="form-field">
                <label>Primary Hotline Phone</label>
                <input type="text" id="st-phone" value="${escapeHtml(s.phone)}" required>
              </div>
            </div>
            <div class="form-grid-2">
              <div class="form-field">
                <label>WhatsApp Number (Digits with Country Code)</label>
                <input type="text" id="st-wa" value="${escapeHtml(s.whatsapp)}" required>
              </div>
              <div class="form-field">
                <label>Support Email</label>
                <input type="email" id="st-email" value="${escapeHtml(s.email)}" required>
              </div>
            </div>
            <div class="form-field">
              <label>Office Address</label>
              <input type="text" id="st-address" value="${escapeHtml(s.address)}" required>
            </div>
            <div class="form-grid-2">
              <div class="form-field">
                <label>bKash Account Number</label>
                <input type="text" id="st-bkash" value="${escapeHtml(s.bkash_number)}" required>
              </div>
              <div class="form-field">
                <label>Nagad Account Number</label>
                <input type="text" id="st-nagad" value="${escapeHtml(s.nagad_number)}" required>
              </div>
            </div>
            <div class="form-field">
              <label>Bank Account Details</label>
              <input type="text" id="st-bank" value="${escapeHtml(s.bank_details)}" required>
            </div>
            <button type="submit" class="btn btn-primary">💾 Save Live Site Settings</button>
          </form>
        </div>
      `;

      document.getElementById("adm-settings-form")?.addEventListener("submit", async e => {
        e.preventDefault();
        const updates = {
          brand_name: document.getElementById("st-brand").value.trim(),
          phone: document.getElementById("st-phone").value.trim(),
          whatsapp: document.getElementById("st-wa").value.trim(),
          email: document.getElementById("st-email").value.trim(),
          address: document.getElementById("st-address").value.trim(),
          bkash_number: document.getElementById("st-bkash").value.trim(),
          nagad_number: document.getElementById("st-nagad").value.trim(),
          bank_details: document.getElementById("st-bank").value.trim(),
          updated_at: new Date().toISOString()
        };
        const { error } = await window.AC.supabase.from("site_settings").update(updates).eq("id", 1);
        if (error) {
          window.AC.showToast(error.message, "error");
          return;
        }
        window.AC.state.settings = { ...window.AC.state.settings, ...updates };
        window.AC.showToast("Site & payment settings updated live!", "success");
      });
    }
  }

  function setBookingFilter(status) {
    admState.statusFilter = status;
    renderActiveTab();
  }

  function openManageBookingModal(bookingId) {
    const b = admState.bookings.find(x => x.id === bookingId);
    if (!b) return;
    const { escapeHtml, formatMoney } = window.AC;
    const paxList = Array.isArray(b.passengers) ? b.passengers : [];

    window.ACSearch.showModal(`
      <h3>Manage Booking &amp; Issue E-Ticket: <span style="color:var(--brand-primary)">${escapeHtml(b.booking_ref)}</span></h3>
      <p style="font-size:13px;color:var(--muted)">${escapeHtml(b.service_title)} • Total: <strong>${formatMoney(b.total_amount)}</strong></p>

      <div style="padding:12px;background:#f8fafc;border-radius:10px;border:1px solid var(--line);margin-bottom:14px;font-size:13px">
        <strong>Passenger Passport Manifest:</strong>
        <ul style="margin:6px 0 0;padding-left:18px">
          ${paxList.map(p => `<li><strong>${escapeHtml(p.title)} ${escapeHtml(p.first_name)} ${escapeHtml(p.last_name)}</strong> (${escapeHtml(p.type)}) — Passport: <strong>${escapeHtml(p.passport_number || "-")}</strong> (Exp: ${escapeHtml(p.passport_expiry || "-")})</li>`).join("")}
        </ul>
      </div>

      <form id="adm-manage-booking-form">
        <div class="form-grid-3">
          <div class="form-field">
            <label>Booking Status *</label>
            <select id="mb-status">
              ${["ON_HOLD", "PENDING", "PROCESSING", "CONFIRMED", "TICKETED", "CANCELLED", "COMPLETED"]
                .map(s => `<option value="${s}" ${b.status === s ? "selected" : ""}>${s}</option>`)
                .join("")}
            </select>
          </div>
          <div class="form-field">
            <label>Airline / GDS PNR Code</label>
            <input type="text" id="mb-pnr" value="${escapeHtml(b.pnr_code || "")}" placeholder="e.g. X8K2L9">
          </div>
          <div class="form-field">
            <label>Official E-Ticket / Voucher No</label>
            <input type="text" id="mb-eticket" value="${escapeHtml(b.eticket_number || "")}" placeholder="e.g. 997-2849102938">
          </div>
        </div>
        <div class="form-field">
          <label>Admin Ticketing Remarks</label>
          <input type="text" id="mb-notes" value="${escapeHtml(b.admin_notes || "")}" placeholder="Internal or customer-facing ticketing remarks">
        </div>
        <button type="submit" class="btn btn-primary" style="width:100%">💾 Update Booking &amp; Save Ticket Info</button>
      </form>
    `);

    document.getElementById("adm-manage-booking-form")?.addEventListener("submit", async e => {
      e.preventDefault();
      const updates = {
        status: document.getElementById("mb-status").value,
        pnr_code: document.getElementById("mb-pnr").value.trim(),
        eticket_number: document.getElementById("mb-eticket").value.trim(),
        admin_notes: document.getElementById("mb-notes").value.trim()
      };
      const { error } = await window.AC.supabase.from("bookings").update(updates).eq("id", bookingId);
      if (error) {
        window.AC.showToast(error.message, "error");
        return;
      }
      window.AC.showToast(`Booking ${b.booking_ref} updated!`, "success");
      window.ACSearch.closeModal();
      await refreshAllData();
      renderActiveTab();
    });
  }

  async function updateRequestStatus(reqId, status) {
    const { error } = await window.AC.supabase.from("booking_requests").update({ status }).eq("id", reqId);
    if (error) {
      window.AC.showToast(error.message, "error");
      return;
    }
    window.AC.showToast(`Request marked as ${status}.`, "success");
    await refreshAllData();
    renderActiveTab();
  }

  async function toggleActive(table, id, active) {
    const { error } = await window.AC.supabase.from(table).update({ active }).eq("id", id);
    if (error) {
      window.AC.showToast(error.message, "error");
      return;
    }
    window.AC.showToast("Visibility updated!", "success");
    await refreshAllData();
    renderActiveTab();
  }

  function openFlightModal() {
    window.ACSearch.showModal(`
      <h3>✈ Add New Flight Route / Promo Fare</h3>
      <form id="adm-add-flight-form">
        <div class="form-grid-3">
          <div class="form-field"><label>Airline Name *</label><input type="text" id="af-airline" value="Biman Bangladesh Airlines" required></div>
          <div class="form-field"><label>Airline Code *</label><input type="text" id="af-code" value="BG" required></div>
          <div class="form-field"><label>Flight No *</label><input type="text" id="af-fn" value="BG-201" required></div>
        </div>
        <div class="form-grid-2">
          <div class="form-field"><label>From City &amp; Code (e.g. Dhaka, DAC) *</label><input type="text" id="af-from-city" value="Dhaka" required><input type="text" id="af-from-code" value="DAC" style="margin-top:6px" required></div>
          <div class="form-field"><label>To City &amp; Code (e.g. Jeddah, JED) *</label><input type="text" id="af-to-city" value="Jeddah" required><input type="text" id="af-to-code" value="JED" style="margin-top:6px" required></div>
        </div>
        <div class="form-grid-3">
          <div class="form-field"><label>Base Fare (BDT) *</label><input type="number" id="af-base" value="48000" required></div>
          <div class="form-field"><label>Taxes (BDT) *</label><input type="number" id="af-tax" value="6500" required></div>
          <div class="form-field"><label>Fare Type</label><select id="af-fare"><option>Regular</option><option>Umrah</option><option>Student</option><option>Labour</option></select></div>
        </div>
        <div class="form-grid-3">
          <div class="form-field"><label>Departure Time</label><input type="text" id="af-dep" value="10:30"></div>
          <div class="form-field"><label>Arrival Time</label><input type="text" id="af-arr" value="15:45"></div>
          <div class="form-field"><label>Baggage</label><input type="text" id="af-bag" value="30 KG Check-in + 7 KG Cabin"></div>
        </div>
        <button type="submit" class="btn btn-primary" style="width:100%">+ Save Flight Route</button>
      </form>
    `);

    document.getElementById("adm-add-flight-form")?.addEventListener("submit", async e => {
      e.preventDefault();
      const payload = {
        airline: document.getElementById("af-airline").value.trim(),
        airline_code: document.getElementById("af-code").value.trim().toUpperCase(),
        flight_number: document.getElementById("af-fn").value.trim().toUpperCase(),
        from_city: document.getElementById("af-from-city").value.trim(),
        from_code: document.getElementById("af-from-code").value.trim().toUpperCase(),
        to_city: document.getElementById("af-to-city").value.trim(),
        to_code: document.getElementById("af-to-code").value.trim().toUpperCase(),
        base_fare: Number(document.getElementById("af-base").value),
        taxes: Number(document.getElementById("af-tax").value),
        fare_type: document.getElementById("af-fare").value,
        departure_time: document.getElementById("af-dep").value.trim(),
        arrival_time: document.getElementById("af-arr").value.trim(),
        baggage: document.getElementById("af-bag").value.trim(),
        featured: true,
        active: true
      };
      const { error } = await window.AC.supabase.from("flight_deals").insert([payload]);
      if (error) return window.AC.showToast(error.message, "error");
      window.AC.showToast("New flight route added!", "success");
      window.ACSearch.closeModal();
      await refreshAllData();
      renderActiveTab();
    });
  }

  function openAddPackageModal() {
    window.ACSearch.showModal(`
      <h3>🕋 Add New Hajj, Umrah or Holiday Package</h3>
      <form id="adm-add-pkg-form">
        <div class="form-field"><label>Package Title *</label><input type="text" id="ap-title" placeholder="e.g. 14 Days Ramadan Umrah Package" required></div>
        <div class="form-grid-3">
          <div class="form-field"><label>Category *</label><select id="ap-cat"><option value="UMRAH">UMRAH</option><option value="HAJJ">HAJJ</option><option value="OUTBOUND_TOUR">OUTBOUND_TOUR</option><option value="INBOUND_TOUR">INBOUND_TOUR</option></select></div>
          <div class="form-field"><label>Tier *</label><select id="ap-level"><option>Economy</option><option>Standard</option><option>Premium</option><option>VIP</option></select></div>
          <div class="form-field"><label>Duration *</label><input type="text" id="ap-dur" value="14 Days / 13 Nights" required></div>
        </div>
        <div class="form-grid-2">
          <div class="form-field"><label>Destination City *</label><input type="text" id="ap-dest" value="Makkah & Madinah" required></div>
          <div class="form-field"><label>Country *</label><input type="text" id="ap-country" value="Saudi Arabia" required></div>
        </div>
        <div class="form-grid-2">
          <div class="form-field"><label>Regular Price (BDT) *</label><input type="number" id="ap-price" value="140000" required></div>
          <div class="form-field"><label>Discount Price (BDT)</label><input type="number" id="ap-disc" value="125000"></div>
        </div>
        <div class="form-grid-2">
          <div class="form-field"><label>Image URL</label><input type="text" id="ap-img" value="https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&w=1000&q=80"></div>
          <div class="form-field"><label>Or Upload Photo</label><input type="file" id="ap-file" accept="image/*"></div>
        </div>
        <div class="form-field"><label>Package Overview *</label><textarea id="ap-desc" rows="3" required>Complete guided package with return air ticket, visa, hotels, and transport.</textarea></div>
        <button type="submit" class="btn btn-primary" style="width:100%">+ Publish Package</button>
      </form>
    `);

    document.getElementById("adm-add-pkg-form")?.addEventListener("submit", async e => {
      e.preventDefault();
      const uploadedUrl = await uploadImageToMediaBucket(document.getElementById("ap-file"));
      const title = document.getElementById("ap-title").value.trim();
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Math.floor(100 + Math.random() * 899);
      const payload = {
        title,
        slug,
        category: document.getElementById("ap-cat").value,
        package_level: document.getElementById("ap-level").value,
        duration: document.getElementById("ap-dur").value.trim(),
        destination: document.getElementById("ap-dest").value.trim(),
        country: document.getElementById("ap-country").value.trim(),
        price: Number(document.getElementById("ap-price").value),
        discount_price: Number(document.getElementById("ap-disc").value) || null,
        image_url: uploadedUrl || document.getElementById("ap-img").value.trim(),
        overview: document.getElementById("ap-desc").value.trim(),
        inclusions: ["Return Air Ticket", "Hotel Accommodation", "Airport Transfers", "Guided Support"],
        exclusions: ["Personal Expenses"],
        featured: true,
        active: true
      };
      const { error } = await window.AC.supabase.from("packages").insert([payload]);
      if (error) return window.AC.showToast(error.message, "error");
      window.AC.showToast("New package published!", "success");
      window.ACSearch.closeModal();
      await refreshAllData();
      renderActiveTab();
    });
  }

  function openEditPackageModal(pkgId) {
    const pkg = admState.packages.find(x => String(x.id) === String(pkgId));
    if (!pkg) {
      window.AC.showToast("Package not found.", "error");
      return;
    }
    const { escapeHtml } = window.AC;
    const currentSellingPrice = Number(pkg.discount_price || pkg.price || 0);
    const currentRegPrice =
      pkg.discount_price && Number(pkg.price) > Number(pkg.discount_price)
        ? Number(pkg.price)
        : "";

    window.ACSearch.showModal(`
      <h3>✏ Edit Package Details</h3>
      <p style="font-size:13px;color:var(--muted);margin:4px 0 16px">Update the package headline/title, price (BDT), and banner image below.</p>
      <form id="adm-edit-pkg-form">
        <div class="form-field">
          <label>Package Title (PACKAGE TITLE) *</label>
          <input type="text" id="ep-title" value="${escapeHtml(pkg.title || "")}" placeholder="Enter package headline / title" required>
        </div>

        <div class="form-grid-2">
          <div class="form-field">
            <label>Package Price (PRICE - BDT) *</label>
            <input type="number" id="ep-price" value="${currentSellingPrice}" min="0" step="1" required>
          </div>
          <div class="form-field">
            <label>Regular / Strikethrough Price (BDT) <small style="color:var(--muted);font-weight:400">(Optional)</small></label>
            <input type="number" id="ep-reg-price" value="${currentRegPrice}" min="0" step="1" placeholder="Leave blank if no discount">
          </div>
        </div>

        <div style="padding:12px;background:#f8fafc;border:1px solid var(--line);border-radius:12px;margin-bottom:14px">
          <label style="display:block;font-size:12px;font-weight:700;color:var(--ink);margin-bottom:8px;text-transform:uppercase">Package Image / Banner</label>
          <div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap;margin-bottom:10px">
            <img id="ep-preview-img" src="${escapeHtml(pkg.image_url || "")}" alt="Package Banner Preview" style="width:120px;height:76px;object-fit:cover;border-radius:8px;border:1px solid var(--line);background:#e2e8f0">
            <div style="flex:1;min-width:200px;font-size:12px;color:var(--muted)">
              Provide a direct image URL below or upload a new banner image file from your device.
            </div>
          </div>
          <div class="form-grid-2" style="margin-bottom:0">
            <div class="form-field" style="margin-bottom:0">
              <label>Banner Image URL *</label>
              <input type="text" id="ep-img" value="${escapeHtml(pkg.image_url || "")}" placeholder="https://..." required>
            </div>
            <div class="form-field" style="margin-bottom:0">
              <label>Or Upload New Banner Photo</label>
              <input type="file" id="ep-file" accept="image/*">
            </div>
          </div>
        </div>

        <div class="form-grid-3">
          <div class="form-field">
            <label>Category *</label>
            <select id="ep-cat">
              ${["UMRAH", "HAJJ", "OUTBOUND_TOUR", "INBOUND_TOUR"]
                .map(c => `<option value="${c}" ${pkg.category === c ? "selected" : ""}>${c}</option>`)
                .join("")}
            </select>
          </div>
          <div class="form-field">
            <label>Tier / Level *</label>
            <select id="ep-level">
              ${["Economy", "Standard", "Premium", "VIP"]
                .map(l => `<option value="${l}" ${pkg.package_level === l ? "selected" : ""}>${l}</option>`)
                .join("")}
            </select>
          </div>
          <div class="form-field">
            <label>Duration *</label>
            <input type="text" id="ep-dur" value="${escapeHtml(pkg.duration || "")}" required>
          </div>
        </div>

        <div class="form-grid-2">
          <div class="form-field">
            <label>Destination City *</label>
            <input type="text" id="ep-dest" value="${escapeHtml(pkg.destination || "")}" required>
          </div>
          <div class="form-field">
            <label>Country *</label>
            <input type="text" id="ep-country" value="${escapeHtml(pkg.country || "")}" required>
          </div>
        </div>

        <div class="form-field">
          <label>Package Overview</label>
          <textarea id="ep-desc" rows="3">${escapeHtml(pkg.overview || "")}</textarea>
        </div>

        <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:8px">
          <button type="button" class="btn btn-outline" onclick="window.ACSearch.closeModal()">Cancel</button>
          <button type="submit" id="ep-save-btn" class="btn btn-primary">💾 Save Changes</button>
        </div>
      </form>
    `);

    const imgInput = document.getElementById("ep-img");
    const fileInput = document.getElementById("ep-file");
    const previewImg = document.getElementById("ep-preview-img");

    imgInput?.addEventListener("input", () => {
      const val = imgInput.value.trim();
      if (val && previewImg) previewImg.src = val;
    });

    fileInput?.addEventListener("change", () => {
      const file = fileInput.files?.[0];
      if (file && previewImg) {
        const reader = new FileReader();
        reader.onload = ev => {
          if (ev.target?.result) previewImg.src = ev.target.result;
        };
        reader.readAsDataURL(file);
      }
    });

    document.getElementById("adm-edit-pkg-form")?.addEventListener("submit", async e => {
      e.preventDefault();
      const saveBtn = document.getElementById("ep-save-btn");
      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = "Saving Changes...";
      }

      let finalImageUrl = document.getElementById("ep-img").value.trim();
      if (fileInput?.files?.[0]) {
        const uploadedUrl = await uploadImageToMediaBucket(fileInput);
        if (uploadedUrl) {
          finalImageUrl = uploadedUrl;
        }
      }

      const newSellingPrice = Number(document.getElementById("ep-price").value);
      const rawRegPrice = document.getElementById("ep-reg-price").value.trim();
      const parsedRegPrice = rawRegPrice ? Number(rawRegPrice) : null;

      const finalRegPrice =
        parsedRegPrice && parsedRegPrice > newSellingPrice ? parsedRegPrice : newSellingPrice;
      const finalDiscountPrice = newSellingPrice;

      const updates = {
        title: document.getElementById("ep-title").value.trim(),
        price: finalRegPrice,
        discount_price: finalDiscountPrice,
        image_url: finalImageUrl,
        category: document.getElementById("ep-cat").value,
        package_level: document.getElementById("ep-level").value,
        duration: document.getElementById("ep-dur").value.trim(),
        destination: document.getElementById("ep-dest").value.trim(),
        country: document.getElementById("ep-country").value.trim(),
        overview: document.getElementById("ep-desc").value.trim()
      };

      const { error } = await window.AC.supabase
        .from("packages")
        .update(updates)
        .eq("id", pkg.id);

      if (error) {
        window.AC.showToast("Failed to update package: " + error.message, "error");
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.textContent = "💾 Save Changes";
        }
        return;
      }

      window.AC.showToast("Package updated successfully!", "success");
      window.ACSearch.closeModal();
      await refreshAllData();
      renderActiveTab();
    });
  }

  function openAddHotelModal() {
    window.ACSearch.showModal(`
      <h3>🏨 Add New Partner Hotel</h3>
      <form id="adm-add-hotel-form">
        <div class="form-field"><label>Hotel Name *</label><input type="text" id="ah-name" placeholder="e.g. Swissotel Al Maqam Makkah" required></div>
        <div class="form-grid-3">
          <div class="form-field"><label>City *</label><input type="text" id="ah-city" value="Makkah" required></div>
          <div class="form-field"><label>Country *</label><input type="text" id="ah-country" value="Saudi Arabia" required></div>
          <div class="form-field"><label>Star Rating</label><select id="ah-stars"><option value="5">5 Star</option><option value="4">4 Star</option><option value="3">3 Star</option></select></div>
        </div>
        <div class="form-field"><label>Full Address *</label><input type="text" id="ah-addr" value="Abraj Al Bait Complex, Makkah" required></div>
        <div class="form-grid-2">
          <div class="form-field"><label>Nightly Rate (BDT) *</label><input type="number" id="ah-price" value="22000" required></div>
          <div class="form-field"><label>Image URL</label><input type="text" id="ah-img" value="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1000&q=80"></div>
        </div>
        <div class="form-field"><label>Hotel Description *</label><textarea id="ah-desc" rows="2" required>Luxury hotel with direct access and world-class hospitality.</textarea></div>
        <button type="submit" class="btn btn-primary" style="width:100%">+ Save Hotel</button>
      </form>
    `);

    document.getElementById("adm-add-hotel-form")?.addEventListener("submit", async e => {
      e.preventDefault();
      const name = document.getElementById("ah-name").value.trim();
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Math.floor(100 + Math.random() * 899);
      const rate = Number(document.getElementById("ah-price").value);
      const payload = {
        name,
        slug,
        city: document.getElementById("ah-city").value.trim(),
        country: document.getElementById("ah-country").value.trim(),
        star_rating: Number(document.getElementById("ah-stars").value),
        address: document.getElementById("ah-addr").value.trim(),
        price_per_night: rate,
        discount_price: rate,
        image_url: document.getElementById("ah-img").value.trim(),
        description: document.getElementById("ah-desc").value.trim(),
        amenities: ["Free Wi-Fi", "Breakfast Available", "24/7 Reception", "Air Conditioning"],
        room_types: [{ name: "Deluxe Double/Twin Room", price: rate, capacity: "2 Adults" }]
      };
      const { error } = await window.AC.supabase.from("hotels").insert([payload]);
      if (error) return window.AC.showToast(error.message, "error");
      window.AC.showToast("New hotel added!", "success");
      window.ACSearch.closeModal();
      await refreshAllData();
      renderActiveTab();
    });
  }

  function openAddVisaModal() {
    window.ACSearch.showModal(`
      <h3>🛂 Add Country Visa Service</h3>
      <form id="adm-add-visa-form">
        <div class="form-grid-2">
          <div class="form-field"><label>Visa Service Headline / Country Title *</label><input type="text" id="av-country" placeholder="e.g. Turkey" required></div>
          <div class="form-field"><label>Country Flag Icon / Emoji</label><input type="text" id="av-flag" value="🇹🇷"></div>
        </div>
        <div class="form-grid-3">
          <div class="form-field"><label>Visa Type *</label><input type="text" id="av-type" value="Tourist Sticker / e-Visa" required></div>
          <div class="form-field"><label>Processing Time *</label><input type="text" id="av-proc" value="5 - 7 Working Days" required></div>
          <div class="form-field"><label>Total Fee (BDT) *</label><input type="number" id="av-fee" value="14500" required></div>
        </div>
        <div class="form-grid-2">
          <div class="form-field"><label>Banner Image URL</label><input type="text" id="av-img" value="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=800&q=80"></div>
          <div class="form-field"><label>Or Upload Banner Photo</label><input type="file" id="av-file" accept="image/*"></div>
        </div>
        <div class="form-field"><label>Description *</label><textarea id="av-desc" rows="2" required>Complete visa documentation, appointment & submission support.</textarea></div>
        <button type="submit" class="btn btn-primary" style="width:100%">+ Save Visa Service</button>
      </form>
    `);

    document.getElementById("adm-add-visa-form")?.addEventListener("submit", async e => {
      e.preventDefault();
      const uploadedUrl = await uploadImageToMediaBucket(document.getElementById("av-file"));
      const country = document.getElementById("av-country").value.trim();
      const slug = country.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-visa-" + Math.floor(100 + Math.random() * 899);
      const payload = {
        country,
        slug,
        flag_emoji: document.getElementById("av-flag").value.trim() || "🌍",
        visa_type: document.getElementById("av-type").value.trim(),
        processing_time: document.getElementById("av-proc").value.trim(),
        validity: "90 Days",
        max_stay: "30 Days",
        fee: Number(document.getElementById("av-fee").value),
        description: document.getElementById("av-desc").value.trim(),
        documents: ["Passport (6+ months validity)", "2 White Background Photos", "6 Months Bank Statement & Solvency"],
        image_url: uploadedUrl || document.getElementById("av-img").value.trim() || "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=800&q=80",
        active: true
      };
      const { error } = await window.AC.supabase.from("visa_services").insert([payload]);
      if (error) return window.AC.showToast(error.message, "error");
      window.AC.showToast("New visa service added!", "success");
      window.ACSearch.closeModal();
      await refreshAllData();
      renderActiveTab();
    });
  }

  function openEditVisaModal(visaId) {
    const visa = admState.visas.find(x => String(x.id) === String(visaId));
    if (!visa) {
      window.AC.showToast("Visa service not found.", "error");
      return;
    }
    const { escapeHtml } = window.AC;
    const docsText = Array.isArray(visa.documents) ? visa.documents.join("\n") : "";

    window.ACSearch.showModal(`
      <h3>✏ Edit Visa Service Details</h3>
      <p style="font-size:13px;color:var(--muted);margin:4px 0 16px">Update the visa service headline/title, fee (BDT), country flag icon, and banner image below.</p>
      <form id="adm-edit-visa-form">
        <div class="form-grid-2">
          <div class="form-field">
            <label>Visa Service Headline / Country Title *</label>
            <input type="text" id="ev-country" value="${escapeHtml(visa.country || "")}" placeholder="e.g. Malaysia or Saudi Arabia (Umrah & Tourist)" required>
          </div>
          <div class="form-field">
            <label>Visa Fee / Price (BDT) *</label>
            <input type="number" id="ev-fee" value="${Number(visa.fee || 0)}" min="0" step="1" required>
          </div>
        </div>

        <div class="form-grid-2">
          <div class="form-field">
            <label>Country Flag Icon / Emoji *</label>
            <input type="text" id="ev-flag" value="${escapeHtml(visa.flag_emoji || "🌍")}" placeholder="e.g. 🇲🇾, 🇦🇪, 🇸🇦" required>
          </div>
          <div class="form-field">
            <label>Visa Type / Category Badge *</label>
            <input type="text" id="ev-type" value="${escapeHtml(visa.visa_type || "")}" placeholder="e.g. Tourist / Student e-Visa" required>
          </div>
        </div>

        <div style="padding:12px;background:#f8fafc;border:1px solid var(--line);border-radius:12px;margin-bottom:14px">
          <label style="display:block;font-size:12px;font-weight:700;color:var(--ink);margin-bottom:8px;text-transform:uppercase">Associated Image / Banner &amp; Flag Preview</label>
          <div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap;margin-bottom:10px">
            <div style="position:relative;width:120px;height:76px;border-radius:8px;overflow:hidden;border:1px solid var(--line);background:#e2e8f0;flex-shrink:0">
              <img id="ev-preview-img" src="${escapeHtml(visa.image_url || "")}" alt="Visa Banner Preview" style="width:100%;height:100%;object-fit:cover">
              <span id="ev-preview-flag" style="position:absolute;top:6px;left:6px;background:rgba(15,23,42,0.82);color:#fff;font-size:13px;padding:2px 7px;border-radius:999px">${escapeHtml(visa.flag_emoji || "🌍")}</span>
            </div>
            <div style="flex:1;min-width:200px;font-size:12px;color:var(--muted)">
              Provide a direct image URL below or upload a new banner image file from your device.
            </div>
          </div>
          <div class="form-grid-2" style="margin-bottom:0">
            <div class="form-field" style="margin-bottom:0">
              <label>Banner Image URL *</label>
              <input type="text" id="ev-img" value="${escapeHtml(visa.image_url || "")}" placeholder="https://..." required>
            </div>
            <div class="form-field" style="margin-bottom:0">
              <label>Or Upload New Banner Photo</label>
              <input type="file" id="ev-file" accept="image/*">
            </div>
          </div>
        </div>

        <div class="form-grid-3">
          <div class="form-field">
            <label>Processing Time *</label>
            <input type="text" id="ev-proc" value="${escapeHtml(visa.processing_time || "")}" required>
          </div>
          <div class="form-field">
            <label>Validity</label>
            <input type="text" id="ev-validity" value="${escapeHtml(visa.validity || "90 Days")}">
          </div>
          <div class="form-field">
            <label>Max Stay</label>
            <input type="text" id="ev-stay" value="${escapeHtml(visa.max_stay || "30 Days")}">
          </div>
        </div>

        <div class="form-field">
          <label>Service Description</label>
          <textarea id="ev-desc" rows="2">${escapeHtml(visa.description || "")}</textarea>
        </div>

        <div class="form-field">
          <label>Required Documents Checklist <small style="color:var(--muted);font-weight:400">(One document per line)</small></label>
          <textarea id="ev-docs" rows="3">${escapeHtml(docsText)}</textarea>
        </div>

        <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:8px">
          <button type="button" class="btn btn-outline" onclick="window.ACSearch.closeModal()">Cancel</button>
          <button type="submit" id="ev-save-btn" class="btn btn-primary">💾 Save Changes</button>
        </div>
      </form>
    `);

    const imgInput = document.getElementById("ev-img");
    const fileInput = document.getElementById("ev-file");
    const flagInput = document.getElementById("ev-flag");
    const previewImg = document.getElementById("ev-preview-img");
    const previewFlag = document.getElementById("ev-preview-flag");

    imgInput?.addEventListener("input", () => {
      const val = imgInput.value.trim();
      if (val && previewImg) previewImg.src = val;
    });

    flagInput?.addEventListener("input", () => {
      if (previewFlag) previewFlag.textContent = flagInput.value.trim() || "🌍";
    });

    fileInput?.addEventListener("change", () => {
      const file = fileInput.files?.[0];
      if (file && previewImg) {
        const reader = new FileReader();
        reader.onload = ev => {
          if (ev.target?.result) previewImg.src = ev.target.result;
        };
        reader.readAsDataURL(file);
      }
    });

    document.getElementById("adm-edit-visa-form")?.addEventListener("submit", async e => {
      e.preventDefault();
      const saveBtn = document.getElementById("ev-save-btn");
      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = "Saving Changes...";
      }

      let finalImageUrl = document.getElementById("ev-img").value.trim();
      if (fileInput?.files?.[0]) {
        const uploadedUrl = await uploadImageToMediaBucket(fileInput);
        if (uploadedUrl) {
          finalImageUrl = uploadedUrl;
        }
      }

      const rawDocs = document.getElementById("ev-docs").value;
      const docsArray = rawDocs
        .split(/\r?\n/)
        .map(s => s.trim())
        .filter(Boolean);

      const updates = {
        country: document.getElementById("ev-country").value.trim(),
        fee: Number(document.getElementById("ev-fee").value),
        flag_emoji: document.getElementById("ev-flag").value.trim() || "🌍",
        visa_type: document.getElementById("ev-type").value.trim(),
        image_url: finalImageUrl,
        processing_time: document.getElementById("ev-proc").value.trim(),
        validity: document.getElementById("ev-validity").value.trim(),
        max_stay: document.getElementById("ev-stay").value.trim(),
        description: document.getElementById("ev-desc").value.trim(),
        documents: docsArray.length ? docsArray : visa.documents
      };

      const { error } = await window.AC.supabase
        .from("visa_services")
        .update(updates)
        .eq("id", visa.id);

      if (error) {
        window.AC.showToast("Failed to update visa service: " + error.message, "error");
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.textContent = "💾 Save Changes";
        }
        return;
      }

      window.AC.showToast("Visa service updated successfully!", "success");
      window.ACSearch.closeModal();
      await refreshAllData();
      renderActiveTab();
    });
  }

  function openAddBannerModal() {
    window.ACSearch.showModal(`
      <h3>🔥 Add Special Offer Banner</h3>
      <form id="adm-add-banner-form">
        <div class="form-grid-2">
          <div class="form-field"><label>Badge Label *</label><input type="text" id="ab-badge" value="SPECIAL OFFER" required></div>
          <div class="form-field"><label>Target Service Tab</label><select id="ab-tab"><option value="flight">flight</option><option value="umrah">umrah</option><option value="tour">tour</option><option value="hotel">hotel</option><option value="visa">visa</option></select></div>
        </div>
        <div class="form-field"><label>Headline Title *</label><input type="text" id="ab-title" placeholder="e.g. Special Eid & Umrah Group Departure" required></div>
        <div class="form-field"><label>Subtitle *</label><input type="text" id="ab-sub" placeholder="Book early and save up to 15% on family bookings." required></div>
        <div class="form-field"><label>Banner Image URL *</label><input type="text" id="ab-img" value="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=80" required></div>
        <button type="submit" class="btn btn-primary" style="width:100%">+ Save Promo Banner</button>
      </form>
    `);

    document.getElementById("adm-add-banner-form")?.addEventListener("submit", async e => {
      e.preventDefault();
      const payload = {
        badge_text: document.getElementById("ab-badge").value.trim(),
        service_tab: document.getElementById("ab-tab").value,
        title: document.getElementById("ab-title").value.trim(),
        subtitle: document.getElementById("ab-sub").value.trim(),
        image_url: document.getElementById("ab-img").value.trim(),
        active: true
      };
      const { error } = await window.AC.supabase.from("promo_banners").insert([payload]);
      if (error) return window.AC.showToast(error.message, "error");
      window.AC.showToast("New promo banner added!", "success");
      window.ACSearch.closeModal();
      await refreshAllData();
      renderActiveTab();
    });
  }

  document.addEventListener("DOMContentLoaded", initAdmin);

  window.ACAdmin = {
    switchTab,
    setBookingFilter,
    openManageBookingModal,
    updateRequestStatus,
    toggleActive,
    openFlightModal,
    openAddPackageModal,
    openEditPackageModal,
    openAddHotelModal,
    openAddVisaModal,
    openEditVisaModal,
    openAddBannerModal,
    logoutAdmin
  };
})();
