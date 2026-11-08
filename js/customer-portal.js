// Air Connect Ltd — Customer Auth, My Bookings Portal, Track PNR, Refund/Reissue & Info Pages
(function () {
  function openAuthModal(defaultTab = "login") {
    const { escapeHtml } = window.AC;
    window.ACSearch.showModal(
      `
      <div style="text-align:center;margin-bottom:18px">
        <img src="assets/logo.jpg" alt="Air Connect Ltd" style="width:52px;height:52px;border-radius:12px;margin-bottom:8px">
        <h2 id="auth-modal-title">${defaultTab === "login" ? "Welcome Back to Air Connect" : "Create Your Customer Account"}</h2>
        <p style="color:var(--muted);font-size:13px;margin:4px 0 0">Manage your flights, Umrah packages, E-Tickets, and instant holds in one place.</p>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:18px;background:#f1f5f9;padding:5px;border-radius:10px">
        <button type="button" class="btn btn-sm ${defaultTab === "login" ? "btn-primary" : ""}" id="tab-btn-login" onclick="window.ACPortal.openAuthModal('login')">Sign In</button>
        <button type="button" class="btn btn-sm ${defaultTab === "signup" ? "btn-primary" : ""}" id="tab-btn-signup" onclick="window.ACPortal.openAuthModal('signup')">Create Account</button>
      </div>

      ${
        defaultTab === "login"
          ? `
        <form id="ac-login-form">
          <div class="form-field">
            <label>Email Address *</label>
            <input type="email" id="login-email" placeholder="you@example.com" required>
          </div>
          <div class="form-field">
            <label>Password *</label>
            <input type="password" id="login-password" placeholder="••••••••" required>
          </div>
          <button type="submit" class="btn btn-primary" style="width:100%;margin-top:8px" id="login-submit-btn">Sign In</button>
        </form>`
          : `
        <form id="ac-signup-form">
          <div class="form-field">
            <label>Full Name (As in Passport) *</label>
            <input type="text" id="su-name" placeholder="e.g. Md Tanvir Ahmed" required>
          </div>
          <div class="form-field">
            <label>Mobile / WhatsApp Number *</label>
            <input type="tel" id="su-phone" placeholder="+880 17XX-XXXXXX" required>
          </div>
          <div class="form-field">
            <label>Email Address *</label>
            <input type="email" id="su-email" placeholder="you@example.com" required>
          </div>
          <div class="form-field">
            <label>Password (Min 6 characters) *</label>
            <input type="password" id="su-password" minlength="6" placeholder="Create a strong password" required>
          </div>
          <button type="submit" class="btn btn-primary" style="width:100%;margin-top:8px" id="su-submit-btn">Create Account</button>
        </form>`
      }
    `,
      true
    );

    document.getElementById("ac-login-form")?.addEventListener("submit", async e => {
      e.preventDefault();
      const email = document.getElementById("login-email").value.trim();
      const password = document.getElementById("login-password").value;
      const btn = document.getElementById("login-submit-btn");
      btn.disabled = true;
      btn.textContent = "Signing in...";
      const { error } = await window.AC.supabase.auth.signInWithPassword({ email, password });
      if (error) {
        window.AC.showToast(error.message, "error");
        btn.disabled = false;
        btn.textContent = "Sign In";
        return;
      }
      window.AC.showToast("Signed in successfully!", "success");
      window.ACSearch.closeModal();
    });

    document.getElementById("ac-signup-form")?.addEventListener("submit", async e => {
      e.preventDefault();
      const fullName = document.getElementById("su-name").value.trim();
      const phone = document.getElementById("su-phone").value.trim();
      const email = document.getElementById("su-email").value.trim();
      const password = document.getElementById("su-password").value;
      const btn = document.getElementById("su-submit-btn");
      btn.disabled = true;
      btn.textContent = "Creating account...";

      const { data, error } = await window.AC.supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, phone }
        }
      });

      if (error) {
        window.AC.showToast(error.message, "error");
        btn.disabled = false;
        btn.textContent = "Create Account";
        return;
      }

      if (data?.session) {
        window.AC.showToast("Account created and signed in!", "success");
      } else {
        window.AC.showToast("Account created! Please check your email or sign in.", "success");
      }
      window.ACSearch.closeModal();
    });
  }

  async function logout() {
    await window.AC.supabase.auth.signOut();
    window.AC.showToast("Signed out successfully.", "info");
  }

  async function openMyBookingsModal(filterTab = "ALL", searchRefOrPhone = "") {
    const { supabase, state, formatMoney, escapeHtml } = window.AC;

    let query = supabase.from("bookings").select("*").order("created_at", { ascending: false }).limit(30);
    const savedRefs = JSON.parse(localStorage.getItem("ac_guest_bookings") || "[]");

    if (searchRefOrPhone.trim()) {
      const q = searchRefOrPhone.trim();
      query = supabase
        .from("bookings")
        .select("*")
        .or(`booking_ref.ilike.%${q}%,customer_phone.ilike.%${q}%,pnr_code.ilike.%${q}%`)
        .order("created_at", { ascending: false });
    } else if (state.user) {
      query = supabase
        .from("bookings")
        .select("*")
        .or(`user_id.eq.${state.user.id},customer_email.eq.${state.user.email}`)
        .order("created_at", { ascending: false });
    } else if (savedRefs.length > 0) {
      query = supabase
        .from("bookings")
        .select("*")
        .in("booking_ref", savedRefs)
        .order("created_at", { ascending: false });
    } else {
      query = null;
    }

    let bookings = [];
    if (query) {
      const { data } = await query;
      bookings = data || [];
    }

    const filtered = bookings.filter(b => {
      if (filterTab === "ALL") return true;
      return b.service_type === filterTab;
    });

    window.ACSearch.showModal(`
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:14px">
        <div>
          <h2 style="font-size:22px">My Bookings &amp; PNR Tracker</h2>
          <p style="color:var(--muted);font-size:13px;margin:2px 0 0">View your bookings, download E-Tickets, pay for held bookings, or request a date change/refund.</p>
        </div>
      </div>

      <form id="track-pnr-form" style="display:flex;gap:8px;margin-bottom:16px">
        <input type="text" id="track-pnr-input" value="${escapeHtml(searchRefOrPhone)}" placeholder="Enter Booking Ref (e.g. AC-2026-...) or Phone Number" style="flex:1;padding:10px 14px;border:1px solid var(--line);border-radius:10px">
        <button type="submit" class="btn btn-primary btn-sm">Find Booking</button>
      </form>

      <div class="filter-pills" style="margin-bottom:16px">
        ${[
          ["ALL", "All Bookings"],
          ["FLIGHT", "Flights"],
          ["HOTEL", "Hotels"],
          ["UMRAH", "Hajj & Umrah"],
          ["TOUR", "Holidays"],
          ["VISA", "Visa"]
        ]
          .map(
            ([code, label]) => `
          <button type="button" class="filter-pill ${filterTab === code ? "active" : ""}" onclick="window.ACPortal.openMyBookingsModal('${code}', document.getElementById('track-pnr-input').value)">
            ${label}
          </button>`
          )
          .join("")}
      </div>

      <div style="display:flex;flex-direction:column;gap:12px;max-height:52vh;overflow-y:auto;padding-right:4px">
        ${
          filtered.length === 0
            ? `<div style="text-align:center;padding:32px;background:#f8fafc;border-radius:12px;border:1px dashed var(--line)">
                <strong>No bookings found</strong>
                <p style="font-size:13px;color:var(--muted);margin:6px 0 0">Enter your Booking Reference (AC-2026-...) or mobile number above, or book a flight/package to see it here.</p>
              </div>`
            : filtered
                .map(
                  b => `
              <div style="padding:16px;background:#f8fafc;border:1px solid var(--line);border-radius:12px">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;flex-wrap:wrap">
                  <div>
                    <span class="status-badge status-${escapeHtml(b.status)}">${escapeHtml(b.status)}</span>
                    <strong style="margin-left:8px;color:var(--brand-primary)">${escapeHtml(b.booking_ref)}</strong>
                    <span style="font-size:12px;color:var(--muted);margin-left:8px">PNR: <strong>${escapeHtml(b.pnr_code || "TBA")}</strong></span>
                    <h4 style="margin:6px 0 2px;font-size:15px">${escapeHtml(b.service_title)}</h4>
                    <small style="color:var(--muted)">
                      Travel Date: ${escapeHtml(b.travel_date || "Flexible")} • ${escapeHtml(b.customer_name)} (${escapeHtml(b.customer_phone)})
                    </small>
                  </div>
                  <div style="text-align:right">
                    <strong style="font-size:18px;color:var(--ink);display:block">${formatMoney(b.total_amount)}</strong>
                    <small style="color:var(--muted)">${escapeHtml(b.payment_method)}</small>
                  </div>
                </div>

                <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;padding-top:12px;border-top:1px dashed var(--line)">
                  <button type="button" class="btn btn-outline btn-sm" onclick='window.ACPortal.viewVoucherById("${escapeHtml(b.id)}")'>
                    E-Ticket / Voucher
                  </button>
                  ${
                    b.status === "ON_HOLD"
                      ? `<button type="button" class="btn btn-primary btn-sm" onclick='window.ACPortal.openPayHoldModal("${escapeHtml(b.id)}", "${escapeHtml(b.booking_ref)}", ${Number(b.total_amount || 0)})'>
                          Pay Now to Issue Ticket
                        </button>`
                      : ""
                  }
                  <button type="button" class="btn btn-outline btn-sm" onclick='window.ACPortal.openRefundReissueModal("${escapeHtml(b.id)}", "${escapeHtml(b.booking_ref)}", "${escapeHtml(b.customer_phone)}")'>
                    Date Change / Refund Request
                  </button>
                </div>
              </div>`
                )
                .join("")
        }
      </div>
    `);

    document.getElementById("track-pnr-form")?.addEventListener("submit", e => {
      e.preventDefault();
      const val = document.getElementById("track-pnr-input").value;
      openMyBookingsModal(filterTab, val);
    });
  }

  async function viewVoucherById(bookingId) {
    const { data, error } = await window.AC.supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .maybeSingle();
    if (error || !data) {
      window.AC.showToast("Could not load voucher.", "error");
      return;
    }
    window.ACBooking.showBookingVoucherModal(data);
  }

  function openPayHoldModal(bookingId, bookingRef, totalAmount, initialMethod = "BKASH") {
    const { formatMoney, escapeHtml } = window.AC;
    const renderHoldMethodCard = m => window.ACBooking.getPaymentDetailsPanelHtml(m);

    window.ACSearch.showModal(
      `
      <h3>Complete Payment for ${escapeHtml(bookingRef)}</h3>
      <p style="font-size:13px;color:var(--muted);margin-bottom:14px">Amount Payable: <strong style="color:var(--brand-primary)">${formatMoney(totalAmount)}</strong></p>

      <div class="payment-methods-grid" style="margin-bottom:14px">
        <label class="payment-option-card ${initialMethod === "BKASH" ? "active" : ""}" data-ph-card="BKASH">
          <input type="radio" name="phChoice" value="BKASH" ${initialMethod === "BKASH" ? "checked" : ""}>
          <div class="payment-logo-wrap"><img src="assets/payments/bkash.svg" alt="bKash"></div>
          <div class="payment-option-info">
            <strong>bKash Payment</strong>
            <span class="payment-merchant-num">+880 1322-937800</span>
            <small>Merchant / Send Money</small>
          </div>
        </label>
        <label class="payment-option-card ${initialMethod === "NAGAD" ? "active" : ""}" data-ph-card="NAGAD">
          <input type="radio" name="phChoice" value="NAGAD" ${initialMethod === "NAGAD" ? "checked" : ""}>
          <div class="payment-logo-wrap"><img src="assets/payments/nagad.svg" alt="Nagad"></div>
          <div class="payment-option-info">
            <strong>Nagad Payment</strong>
            <span class="payment-merchant-num">+880 1322-937800</span>
            <small>Merchant / Send Money</small>
          </div>
        </label>
        <label class="payment-option-card ${initialMethod === "BANK_TRANSFER" ? "active" : ""}" data-ph-card="BANK_TRANSFER">
          <input type="radio" name="phChoice" value="BANK_TRANSFER" ${initialMethod === "BANK_TRANSFER" ? "checked" : ""}>
          <div class="payment-logo-wrap"><img src="assets/payments/bracbank.png" alt="BRAC Bank PLC"></div>
          <div class="payment-option-info">
            <strong>Bank Transfer</strong>
            <span class="payment-merchant-num" style="color:#0054a6">BRAC Bank PLC</span>
            <small>A/C: 1511202219754001</small>
          </div>
        </label>
      </div>

      <div id="ph-details-box" style="margin-bottom:14px">
        ${renderHoldMethodCard(initialMethod)}
      </div>

      <form id="pay-hold-form">
        <div class="form-field">
          <label>Payment Method *</label>
          <select id="ph-method" required>
            <option value="BKASH" ${initialMethod === "BKASH" ? "selected" : ""}>bKash (+880 1322-937800)</option>
            <option value="NAGAD" ${initialMethod === "NAGAD" ? "selected" : ""}>Nagad (+880 1322-937800)</option>
            <option value="BANK_TRANSFER" ${initialMethod === "BANK_TRANSFER" ? "selected" : ""}>Bank Transfer — BRAC Bank PLC (1511202219754001)</option>
          </select>
        </div>
        <div class="form-field">
          <label>Transaction ID (TrxID) *</label>
          <input type="text" id="ph-trx" placeholder="Enter bKash/Nagad/Bank TrxID" required>
        </div>
        <button type="submit" class="btn btn-primary" style="width:100%">Submit Payment Details</button>
      </form>
    `,
      true
    );

    const syncHoldMethod = m => {
      document.querySelectorAll("[data-ph-card]").forEach(c => {
        const isSel = c.getAttribute("data-ph-card") === m;
        c.classList.toggle("active", isSel);
        const r = c.querySelector('input[type="radio"]');
        if (r) r.checked = isSel;
      });
      const sel = document.getElementById("ph-method");
      if (sel) sel.value = m;
      const box = document.getElementById("ph-details-box");
      if (box) box.innerHTML = renderHoldMethodCard(m);
    };

    document.querySelectorAll("[data-ph-card]").forEach(card => {
      card.addEventListener("click", () => syncHoldMethod(card.getAttribute("data-ph-card")));
    });
    document.getElementById("ph-method")?.addEventListener("change", e => syncHoldMethod(e.target.value));

    document.getElementById("pay-hold-form")?.addEventListener("submit", async e => {
      e.preventDefault();
      const method = document.getElementById("ph-method").value;
      const trx = document.getElementById("ph-trx").value.trim();
      const { error } = await window.AC.supabase
        .from("bookings")
        .update({
          booking_mode: "INSTANT_PAY",
          payment_method: method,
          transaction_id: trx,
          status: "PENDING"
        })
        .eq("id", bookingId);
      if (error) {
        window.AC.showToast(error.message, "error");
        return;
      }
      window.AC.showToast(`Payment submitted for ${bookingRef}! Our ticketing desk is verifying it.`, "success");
      openMyBookingsModal("ALL", bookingRef);
    });
  }

  function openPaymentDetailsModal(defaultMethod = "BANK_TRANSFER") {
    const active = defaultMethod || "BANK_TRANSFER";
    window.ACSearch.showModal(`
      <div style="margin-bottom:14px">
        <span class="status-badge status-PROCESSING">OFFICIAL PAYMENT ACCOUNTS</span>
        <h2 style="margin:8px 0 4px;font-size:21px">Air Connect Ltd — Payment Methods</h2>
        <p style="font-size:13px;color:var(--muted);margin:0">Click any payment option below to view official account details.</p>
      </div>

      <div class="payment-methods-grid" style="margin-bottom:16px">
        <label class="payment-option-card ${active === "BKASH" ? "active" : ""}" data-modal-pay="BKASH">
          <input type="radio" name="modalPayChoice" value="BKASH" ${active === "BKASH" ? "checked" : ""}>
          <div class="payment-logo-wrap"><img src="assets/payments/bkash.svg" alt="bKash"></div>
          <div class="payment-option-info">
            <strong>bKash Payment</strong>
            <span class="payment-merchant-num">+880 1322-937800</span>
            <small>Merchant / Send Money</small>
          </div>
        </label>

        <label class="payment-option-card ${active === "NAGAD" ? "active" : ""}" data-modal-pay="NAGAD">
          <input type="radio" name="modalPayChoice" value="NAGAD" ${active === "NAGAD" ? "checked" : ""}>
          <div class="payment-logo-wrap"><img src="assets/payments/nagad.svg" alt="Nagad"></div>
          <div class="payment-option-info">
            <strong>Nagad Payment</strong>
            <span class="payment-merchant-num">+880 1322-937800</span>
            <small>Merchant / Send Money</small>
          </div>
        </label>

        <label class="payment-option-card ${active === "BANK_TRANSFER" ? "active" : ""}" data-modal-pay="BANK_TRANSFER">
          <input type="radio" name="modalPayChoice" value="BANK_TRANSFER" ${active === "BANK_TRANSFER" ? "checked" : ""}>
          <div class="payment-logo-wrap"><img src="assets/payments/bracbank.png" alt="BRAC Bank PLC"></div>
          <div class="payment-option-info">
            <strong>Bank Transfer</strong>
            <span class="payment-merchant-num" style="color:#0054a6">BRAC Bank PLC</span>
            <small>A/C: 1511202219754001</small>
          </div>
        </label>
      </div>

      <div id="modal-payment-details-body">
        ${window.ACBooking.getPaymentDetailsPanelHtml(active)}
      </div>
    `);

    document.querySelectorAll("[data-modal-pay]").forEach(card => {
      card.addEventListener("click", () => {
        const m = card.getAttribute("data-modal-pay");
        document.querySelectorAll("[data-modal-pay]").forEach(c => {
          const isSel = c.getAttribute("data-modal-pay") === m;
          c.classList.toggle("active", isSel);
          const r = c.querySelector('input[type="radio"]');
          if (r) r.checked = isSel;
        });
        const body = document.getElementById("modal-payment-details-body");
        if (body) body.innerHTML = window.ACBooking.getPaymentDetailsPanelHtml(m);
      });
    });
  }

  function openRefundReissueModal(bookingId, bookingRef, customerPhone) {
    const { escapeHtml, state } = window.AC;
    window.ACSearch.showModal(
      `
      <h3>Request Reissue (Date Change) or Refund</h3>
      <p style="font-size:13px;color:var(--muted)">Booking Reference: <strong>${escapeHtml(bookingRef)}</strong></p>
      <form id="refund-reissue-form">
        <div class="form-field">
          <label>Request Type *</label>
          <select id="rr-type" required>
            <option value="REISSUE">Flight / Package Date Change (Reissue)</option>
            <option value="REFUND">Refund Request</option>
            <option value="CANCEL">Cancel Hold Booking</option>
          </select>
        </div>
        <div class="form-field">
          <label>Preferred New Travel Date (If Date Change)</label>
          <input type="date" id="rr-date">
        </div>
        <div class="form-field">
          <label>Reason / Remarks *</label>
          <textarea id="rr-reason" rows="3" placeholder="Please share details for our reservation desk..." required></textarea>
        </div>
        <button type="submit" class="btn btn-primary" style="width:100%">Submit Request</button>
      </form>
    `,
      true
    );

    document.getElementById("refund-reissue-form")?.addEventListener("submit", async e => {
      e.preventDefault();
      const reqType = document.getElementById("rr-type").value;
      const prefDate = document.getElementById("rr-date").value || null;
      const reason = document.getElementById("rr-reason").value.trim();

      const { error } = await window.AC.supabase.from("booking_requests").insert([
        {
          booking_id: bookingId,
          booking_ref: bookingRef,
          user_id: state.user?.id || null,
          customer_phone: customerPhone || "",
          request_type: reqType,
          preferred_date: prefDate,
          reason
        }
      ]);
      if (error) {
        window.AC.showToast(error.message, "error");
        return;
      }
      window.AC.showToast(`Your ${reqType} request for ${bookingRef} has been submitted!`, "success");
      window.ACSearch.closeModal();
    });
  }

  function openInfoModal(page) {
    const { state, escapeHtml } = window.AC;
    const s = state.settings;
    const pages = {
      about: {
        title: "About Air Connect Ltd",
        body: `
          <p><strong>Air Connect Ltd</strong> is a premier Bangladesh-based Travel & Semi-OTA platform offering domestic and international air ticketing, world-wide hotel reservations, inbound & outbound holiday packages, Hajj & Umrah spiritual journeys, and global visa assistance.</p>
          <p>Our mission is to empower travellers across Bangladesh and abroad with transparent fares, instant booking holds, verified Makkah/Madinah & global hotels, and 24/7 dedicated customer support.</p>
          <ul>
            <li><strong>24/7 Reservations Hotline:</strong> ${escapeHtml(s.phone)}</li>
            <li><strong>Official Email:</strong> ${escapeHtml(s.email)}</li>
            <li><strong>Head Office:</strong> ${escapeHtml(s.address)}</li>
          </ul>`
      },
      faq: {
        title: "Frequently Asked Questions (FAQ)",
        body: `
          <h4>1. How does "Book & Hold (Pay Later)" work?</h4>
          <p>You can select any flight, hotel, or Umrah/holiday package, enter passenger passport details, and click "Book & Hold". You will immediately receive an official Booking Reference (AC-2026-...) and PNR hold while you complete payment via bKash, Nagad, or Bank Transfer.</p>
          <h4>2. How fast are E-Tickets issued after payment?</h4>
          <p>Once you submit your bKash/Nagad/Bank Transaction ID in checkout or under "My Bookings", our ticketing desk verifies and issues your official airline E-Ticket within 15–30 minutes.</p>
          <h4>3. Can I request a Date Change (Reissue) or Refund online?</h4>
          <p>Yes! Open "My Bookings", locate your booking by Reference or Phone Number, and click "Date Change / Refund Request".</p>`
      },
      refund: {
        title: "Refund, Cancellation & Reissue Policy",
        body: `
          <p>1. <strong>Air Tickets:</strong> Refund and reissue charges follow the respective airline's fare rules plus a standard agency processing fee. Non-refundable promotional tickets may only qualify for tax refunds.</p>
          <p>2. <strong>Hajj, Umrah & Holiday Packages:</strong> Cancellations made 15+ days prior to departure are eligible for refund after deducting visa/airline non-refundable deposits.</p>
          <p>3. <strong>Refund Processing Time:</strong> Approved refunds are credited back to the customer's bank or MFS (bKash/Nagad) account within 5–10 working days.</p>`
      },
      privacy: {
        title: "Privacy Policy & Data Protection",
        body: `
          <p>Air Connect Ltd strictly protects your personal data, passport numbers, and travel records using encrypted Supabase PostgreSQL storage with Row-Level Security (RLS). Passenger passport details are used solely for airline PNR generation, hotel check-in, and embassy visa filing.</p>`
      },
      terms: {
        title: "Terms & Conditions",
        body: `
          <p>By booking through Air Connect Ltd (airconnectltd.com), travellers confirm that all passenger names and passport details match their official travel documents with at least 6 months validity from the date of international travel.</p>`
      }
    };
    const info = pages[page] || pages.about;
    window.ACSearch.showModal(`
      <h2>${info.title}</h2>
      <div style="line-height:1.7;color:var(--text);margin-top:12px">${info.body}</div>
    `);
  }

  function renderHeaderAuthArea() {
    const el = document.getElementById("header-auth-area");
    if (!el) return;
    const { user, profile, isAdmin } = window.AC.state;
    const { escapeHtml } = window.AC;

    if (!user) {
      el.innerHTML = `
        <button type="button" class="btn btn-outline btn-sm" onclick="window.ACPortal.openMyBookingsModal()">
          My Bookings
        </button>
        <button type="button" class="btn btn-primary btn-sm" onclick="window.ACPortal.openAuthModal('login')">
          Sign In / Register
        </button>
      `;
    } else {
      const displayName = profile?.full_name || user.email.split("@")[0];
      el.innerHTML = `
        <button type="button" class="btn btn-outline btn-sm" onclick="window.ACPortal.openMyBookingsModal()">
          My Bookings
        </button>
        ${isAdmin ? `<a href="admin.html" class="btn btn-accent btn-sm">Admin Panel</a>` : ""}
        <span style="font-size:13px;font-weight:700;color:var(--ink)">${escapeHtml(displayName)}</span>
        <button type="button" class="btn btn-outline btn-sm" onclick="window.ACPortal.logout()">Logout</button>
      `;
    }
  }

  window.addEventListener("ac:auth-changed", renderHeaderAuthArea);

  window.ACPortal = {
    openAuthModal,
    logout,
    openMyBookingsModal,
    viewVoucherById,
    openPayHoldModal,
    openRefundReissueModal,
    openInfoModal,
    openPaymentDetailsModal,
    renderHeaderAuthArea
  };
})();
