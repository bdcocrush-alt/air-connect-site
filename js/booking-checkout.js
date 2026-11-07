// Air Connect Ltd — Book Now Checkout, Passenger/Passport Forms, Hold/Pay & E-Ticket Voucher
(function () {
  let currentDraft = null;

  function openCheckout(payload) {
    currentDraft = {
      ...payload,
      extraBaggageBdt: 0,
      mealPreference: "Halal Standard Meal (Included)",
      bookingMode: "HOLD_PAY_LATER",
      paymentMethod: "PAY_LATER"
    };

    const sec = document.getElementById("checkout-section");
    if (!sec) return;
    sec.hidden = false;
    renderCheckoutView();
    sec.scrollIntoView({ behavior: "smooth" });
  }

  function buildPassengerFieldsHtml(adults = 1, children = 0, infants = 0) {
    const list = [];
    for (let i = 1; i <= adults; i++) list.push({ idx: list.length, type: "Adult", label: `Adult ${i} (Primary Traveller)` });
    for (let i = 1; i <= children; i++) list.push({ idx: list.length, type: "Child", label: `Child ${i} (2 - 11 Years)` });
    for (let i = 1; i <= infants; i++) list.push({ idx: list.length, type: "Infant", label: `Infant ${i} (Under 2 Years)` });

    const profile = window.AC.state.profile || {};
    const nameParts = (profile.full_name || "").split(" ");

    return list
      .map(
        (p, i) => `
      <div style="padding:16px;background:#f8fafc;border:1px solid var(--line);border-radius:12px;margin-bottom:14px" data-pax-card="${i}">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <strong style="color:var(--ink)">Passenger ${i + 1}: ${p.label}</strong>
          <span class="status-badge status-PROCESSING">${p.type}</span>
        </div>
        <input type="hidden" class="pax-type" value="${p.type}">
        <div class="form-grid-3">
          <div class="form-field">
            <label>Title *</label>
            <select class="pax-title" required>
              <option value="MR">MR</option>
              <option value="MS">MS</option>
              <option value="MRS">MRS</option>
              <option value="MSTR">MSTR</option>
              <option value="MISS">MISS</option>
            </select>
          </div>
          <div class="form-field">
            <label>First / Given Name (As in Passport) *</label>
            <input type="text" class="pax-fname" placeholder="e.g. TANVIR" value="${i === 0 ? window.AC.escapeHtml(nameParts[0] || "") : ""}" required>
          </div>
          <div class="form-field">
            <label>Last / Surname (As in Passport) *</label>
            <input type="text" class="pax-lname" placeholder="e.g. AHMED" value="${i === 0 ? window.AC.escapeHtml(nameParts.slice(1).join(" ") || "") : ""}" required>
          </div>
        </div>
        <div class="form-grid-3">
          <div class="form-field">
            <label>Gender *</label>
            <select class="pax-gender">
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
          <div class="form-field">
            <label>Date of Birth *</label>
            <input type="date" class="pax-dob" value="${p.type === "Adult" ? "1992-05-15" : p.type === "Child" ? "2018-06-10" : "2025-04-01"}" required>
          </div>
          <div class="form-field">
            <label>Nationality *</label>
            <input type="text" class="pax-nat" value="${window.AC.escapeHtml(profile.nationality || "Bangladeshi")}" required>
          </div>
        </div>
        <div class="form-grid-3">
          <div class="form-field">
            <label>Passport / NID Number *</label>
            <input type="text" class="pax-passport" placeholder="e.g. A04829102" value="${i === 0 ? window.AC.escapeHtml(profile.passport_number || "") : ""}" required>
          </div>
          <div class="form-field">
            <label>Passport Expiry Date *</label>
            <input type="date" class="pax-expiry" value="${i === 0 && profile.passport_expiry ? profile.passport_expiry : "2030-12-31"}" required>
          </div>
          <div class="form-field">
            <label>Issuing Country</label>
            <input type="text" class="pax-country" value="Bangladesh">
          </div>
        </div>
      </div>`
      )
      .join("");
  }

  function renderCheckoutView() {
    const sec = document.getElementById("checkout-section");
    if (!sec || !currentDraft) return;
    const d = currentDraft;
    const { formatMoney, escapeHtml, state } = window.AC;
    const settings = state.settings;
    const profile = state.profile || {};
    const userEmail = state.user?.email || "";

    const totalPax = (d.adults || 1) + (d.children || 0) + (d.infants || 0);
    const grandTotal = Number(d.baseAmount || 0) + Number(d.taxAmount || 0) + Number(d.extraBaggageBdt || 0);

    sec.innerHTML = `
      <div class="container">
        <div class="section-head" style="margin-top:16px">
          <div>
            <h2>Complete Your Booking</h2>
            <p>${escapeHtml(d.title)} — ${escapeHtml(d.subtitle || "")}</p>
          </div>
          <button type="button" class="btn btn-outline btn-sm" onclick="document.getElementById('checkout-section').hidden=true">✕ Cancel Checkout</button>
        </div>

        <form id="ac-checkout-form" class="checkout-layout">
          <div>
            <!-- 1. Passenger & Passport Info -->
            <div class="checkout-box">
              <h3>1. Passenger & Passport Details (${totalPax} Traveller${totalPax > 1 ? "s" : ""})</h3>
              <p style="font-size:13px;color:var(--muted);margin-top:-8px;margin-bottom:16px">
                Please enter names exactly as they appear on each passenger's Passport or Official ID.
              </p>
              <div id="checkout-pax-list">
                ${buildPassengerFieldsHtml(d.adults, d.children, d.infants)}
              </div>
            </div>

            <!-- 2. Extra Baggage & Meal Add-Ons (mynztrip style) -->
            <div class="checkout-box">
              <h3>2. Ancillary Services (Extra Baggage & Meal Preference)</h3>
              <div class="form-grid-2">
                <div class="form-field">
                  <label>Extra Checked Baggage Allowance</label>
                  <select id="chk-baggage">
                    <option value="0" ${d.extraBaggageBdt === 0 ? "selected" : ""}>Standard Included Allowance (${formatMoney(0)})</option>
                    <option value="2500" ${d.extraBaggageBdt === 2500 ? "selected" : ""}>+10 KG Extra Checked Baggage (+${formatMoney(2500)})</option>
                    <option value="4500" ${d.extraBaggageBdt === 4500 ? "selected" : ""}>+20 KG Extra Checked Baggage (+${formatMoney(4500)})</option>
                  </select>
                </div>
                <div class="form-field">
                  <label>In-Flight / Package Meal Preference</label>
                  <select id="chk-meal">
                    <option value="Halal Standard Meal">Halal Standard Meal (Complimentary)</option>
                    <option value="Asian Vegetarian Meal">Asian Vegetarian Meal</option>
                    <option value="Diabetic / Low Sodium Meal">Diabetic / Low Sodium Meal</option>
                    <option value="Child Meal">Child Meal</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- 3. Contact Details -->
            <div class="checkout-box">
              <h3>3. Primary Contact & Delivery Info (For E-Ticket & PNR SMS)</h3>
              <div class="form-grid-3">
                <div class="form-field">
                  <label>Contact Full Name *</label>
                  <input type="text" id="chk-contact-name" value="${escapeHtml(profile.full_name || "")}" placeholder="Your Full Name" required>
                </div>
                <div class="form-field">
                  <label>Email Address (For E-Ticket PDF) *</label>
                  <input type="email" id="chk-contact-email" value="${escapeHtml(userEmail)}" placeholder="you@example.com" required>
                </div>
                <div class="form-field">
                  <label>Mobile / WhatsApp Number *</label>
                  <input type="tel" id="chk-contact-phone" value="${escapeHtml(profile.phone || "")}" placeholder="+880 17XX-XXXXXX" required>
                </div>
              </div>
              <div class="form-field">
                <label>Special Notes / Wheelchair / Seat Request (Optional)</label>
                <input type="text" id="chk-notes" placeholder="e.g. Window seat preferred, Umrah group coordination, etc.">
              </div>
            </div>

            <!-- 4. Booking Mode: Hold (Pay Later) vs Pay Now -->
            <div class="checkout-box">
              <h3>4. Choose Booking & Payment Option</h3>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:18px">
                <label class="pill-radio ${d.bookingMode === "HOLD_PAY_LATER" ? "active" : ""}" style="padding:14px;border-radius:12px">
                  <input type="radio" name="bookingMode" value="HOLD_PAY_LATER" ${d.bookingMode === "HOLD_PAY_LATER" ? "checked" : ""}>
                  <div>
                    <strong style="display:block;font-size:14px">Book &amp; Hold (Pay Later)</strong>
                    <span style="font-size:12px;color:var(--muted)">Get instant Booking Reference &amp; PNR hold; pay after confirmation</span>
                  </div>
                </label>
                <label class="pill-radio ${d.bookingMode === "INSTANT_PAY" ? "active" : ""}" style="padding:14px;border-radius:12px">
                  <input type="radio" name="bookingMode" value="INSTANT_PAY" ${d.bookingMode === "INSTANT_PAY" ? "checked" : ""}>
                  <div>
                    <strong style="display:block;font-size:14px">Pay Now (bKash / Nagad / Bank)</strong>
                    <span style="font-size:12px;color:var(--muted)">Priority ticket issuance with Transaction ID / Slip upload</span>
                  </div>
                </label>
              </div>

              <div id="pay-now-panel" ${d.bookingMode === "HOLD_PAY_LATER" ? "hidden" : ""} style="padding:18px;background:#fff1f1;border:1px solid #fecaca;border-radius:12px">
                <strong style="display:block;margin-bottom:10px;color:var(--brand-primary)">Official Air Connect Ltd Payment Accounts:</strong>
                <div style="display:grid;gap:8px;font-size:13px;margin-bottom:14px">
                  <div><strong>bKash Merchant / Payment:</strong> ${escapeHtml(settings.bkash_number)}</div>
                  <div><strong>Nagad Merchant / Payment:</strong> ${escapeHtml(settings.nagad_number)}</div>
                  <div><strong>Bank Transfer:</strong> ${escapeHtml(settings.bank_details)}</div>
                </div>
                <div class="form-grid-3">
                  <div class="form-field">
                    <label>Payment Channel *</label>
                    <select id="chk-pay-method">
                      <option value="BKASH">bKash</option>
                      <option value="NAGAD">Nagad</option>
                      <option value="BANK_TRANSFER">Bank Deposit / NPSB / BEFTN</option>
                    </select>
                  </div>
                  <div class="form-field">
                    <label>Transaction ID (TrxID / Ref) *</label>
                    <input type="text" id="chk-trx-id" placeholder="e.g. BK9482019X">
                  </div>
                  <div class="form-field">
                    <label>Upload Payment Slip (Optional)</label>
                    <input type="file" id="chk-slip-file" accept="image/*,.pdf">
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Sidebar: Fare Breakdown -->
          <aside class="fare-summary-card">
            <span class="status-badge status-PROCESSING">${escapeHtml(d.serviceType)} BOOKING</span>
            <h3 style="margin:10px 0 6px;font-size:17px">${escapeHtml(d.title)}</h3>
            <p style="font-size:12px;color:var(--muted);margin:0 0 16px">${escapeHtml(d.subtitle || "")}</p>

            <div class="summary-row">
              <span>Travel Date</span>
              <strong>${escapeHtml(d.travelDate || "Flexible")}</strong>
            </div>
            ${d.returnDate ? `<div class="summary-row"><span>Return Date</span><strong>${escapeHtml(d.returnDate)}</strong></div>` : ""}
            <div class="summary-row">
              <span>Travellers</span>
              <strong>${d.adults} Adult${d.children ? `, ${d.children} Child` : ""}${d.infants ? `, ${d.infants} Infant` : ""}</strong>
            </div>
            <div class="summary-row">
              <span>Base Fare / Package</span>
              <strong>${formatMoney(d.baseAmount)}</strong>
            </div>
            <div class="summary-row">
              <span>Taxes, AIT & Fees</span>
              <strong>${formatMoney(d.taxAmount)}</strong>
            </div>
            <div class="summary-row">
              <span>Extra Baggage / Add-ons</span>
              <strong id="sum-extra-bag">${formatMoney(d.extraBaggageBdt)}</strong>
            </div>

            <div class="summary-row total">
              <span>Total Payable</span>
              <span id="sum-grand-total">${formatMoney(grandTotal)}</span>
            </div>

            <button type="submit" id="chk-submit-btn" class="btn btn-primary" style="width:100%;margin-top:16px;padding:14px">
              ${d.bookingMode === "HOLD_PAY_LATER" ? "✓ Confirm & Hold Booking" : "✓ Submit Payment & Confirm"}
            </button>
            <small style="display:block;text-align:center;color:var(--muted);margin-top:10px;font-size:11px">
              Instant Booking Reference &amp; Printable E-Ticket Voucher generated immediately.
            </small>
          </aside>
        </form>
      </div>
    `;

    // Listeners
    document.getElementById("chk-baggage")?.addEventListener("change", e => {
      currentDraft.extraBaggageBdt = Number(e.target.value || 0);
      renderCheckoutView();
    });

    sec.querySelectorAll('input[name="bookingMode"]').forEach(r => {
      r.addEventListener("change", e => {
        currentDraft.bookingMode = e.target.value;
        renderCheckoutView();
      });
    });

    document.getElementById("ac-checkout-form")?.addEventListener("submit", handleCheckoutSubmit);
  }

  async function handleCheckoutSubmit(e) {
    e.preventDefault();
    const btn = document.getElementById("chk-submit-btn");
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Processing Booking...";
    }

    try {
      const d = currentDraft;
      const paxCards = [...document.querySelectorAll("[data-pax-card]")];
      const passengers = paxCards.map(card => ({
        type: card.querySelector(".pax-type")?.value || "Adult",
        title: card.querySelector(".pax-title")?.value || "MR",
        first_name: card.querySelector(".pax-fname")?.value.trim().toUpperCase() || "",
        last_name: card.querySelector(".pax-lname")?.value.trim().toUpperCase() || "",
        gender: card.querySelector(".pax-gender")?.value || "Male",
        dob: card.querySelector(".pax-dob")?.value || "",
        nationality: card.querySelector(".pax-nat")?.value || "Bangladeshi",
        passport_number: card.querySelector(".pax-passport")?.value.trim().toUpperCase() || "",
        passport_expiry: card.querySelector(".pax-expiry")?.value || "",
        issuing_country: card.querySelector(".pax-country")?.value || "Bangladesh"
      }));

      const contactName = document.getElementById("chk-contact-name").value.trim();
      const contactEmail = document.getElementById("chk-contact-email").value.trim();
      const contactPhone = document.getElementById("chk-contact-phone").value.trim();
      const notes = document.getElementById("chk-notes").value.trim();
      const mealPref = document.getElementById("chk-meal")?.value || "Halal Standard Meal";

      let paymentMethod = "PAY_LATER";
      let trxId = null;
      let slipUrl = null;
      let status = "ON_HOLD";

      if (d.bookingMode === "INSTANT_PAY") {
        paymentMethod = document.getElementById("chk-pay-method")?.value || "BKASH";
        trxId = document.getElementById("chk-trx-id")?.value.trim() || null;
        if (!trxId) {
          window.AC.showToast("Please enter your Transaction ID (TrxID) for Pay Now, or switch to Book & Hold.", "error");
          if (btn) {
            btn.disabled = false;
            btn.textContent = "✓ Submit Payment & Confirm";
          }
          return;
        }
        status = "PENDING";

        // Upload slip if chosen
        const fileInput = document.getElementById("chk-slip-file");
        const file = fileInput?.files?.[0];
        if (file) {
          const ext = file.name.split(".").pop() || "jpg";
          const filePath = `slip-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
          const { error: upErr } = await window.AC.supabase.storage.from("slips").upload(filePath, file);
          if (!upErr) {
            const { data: pubData } = window.AC.supabase.storage.from("slips").getPublicUrl(filePath);
            slipUrl = pubData?.publicUrl || null;
          }
        }
      }

      const bookingRef = "AC-" + new Date().getFullYear() + "-" + Math.floor(100000 + Math.random() * 900000);
      const pnrCode = "PNR" + Math.random().toString(36).substring(2, 5).toUpperCase() + Math.floor(10 + Math.random() * 89);
      const totalAmount = Number(d.baseAmount || 0) + Number(d.taxAmount || 0) + Number(d.extraBaggageBdt || 0);

      const insertPayload = {
        booking_ref: bookingRef,
        user_id: window.AC.state.user?.id || null,
        service_type: d.serviceType,
        service_title: d.title,
        customer_name: contactName,
        customer_email: contactEmail,
        customer_phone: contactPhone,
        travel_date: d.travelDate || null,
        return_date: d.returnDate || null,
        adults: d.adults || 1,
        children: d.children || 0,
        infants: d.infants || 0,
        passport_number: passengers[0]?.passport_number || null,
        special_notes: notes || null,
        passengers,
        details: {
          ...d.details,
          subtitle: d.subtitle,
          extra_baggage_bdt: d.extraBaggageBdt,
          meal_preference: mealPref
        },
        base_amount: Number(d.baseAmount || 0) + Number(d.extraBaggageBdt || 0),
        tax_amount: Number(d.taxAmount || 0),
        discount_amount: 0,
        total_amount: totalAmount,
        currency: window.AC.state.currency || "BDT",
        booking_mode: d.bookingMode,
        payment_method: paymentMethod,
        transaction_id: trxId,
        payment_slip_url: slipUrl,
        pnr_code: pnrCode,
        status
      };

      const { data, error } = await window.AC.supabase
        .from("bookings")
        .insert([insertPayload])
        .select("*")
        .single();

      if (error) throw error;

      // Save recent booking ref in localStorage for instant guest lookup
      const savedRefs = JSON.parse(localStorage.getItem("ac_guest_bookings") || "[]");
      if (!savedRefs.includes(bookingRef)) {
        savedRefs.unshift(bookingRef);
        localStorage.setItem("ac_guest_bookings", JSON.stringify(savedRefs.slice(0, 20)));
      }

      document.getElementById("checkout-section").hidden = true;
      document.getElementById("results-section").hidden = true;
      window.AC.showToast(`Booking ${bookingRef} confirmed!`, "success");
      showBookingVoucherModal(data);
    } catch (err) {
      console.error("Booking submission error:", err);
      window.AC.showToast(err.message || "Could not complete booking. Please try again.", "error");
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Retry Booking";
      }
    }
  }

  function showBookingVoucherModal(booking) {
    const { formatMoney, escapeHtml, state } = window.AC;
    const settings = state.settings;
    const paxList = Array.isArray(booking.passengers) ? booking.passengers : [];

    window.ACSearch.showModal(`
      <div id="printable-voucher">
        <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid var(--brand-primary);padding-bottom:14px;margin-bottom:16px;flex-wrap:wrap;gap:12px">
          <div style="display:flex;align-items:center;gap:12px">
            <img src="assets/logo.jpg" alt="Air Connect Ltd" style="width:48px;height:48px;border-radius:10px">
            <div>
              <h2 style="font-size:20px;color:var(--ink)">Air Connect Ltd — Official Booking Voucher</h2>
              <small style="color:var(--muted)">${escapeHtml(settings.phone)} • ${escapeHtml(settings.email)}</small>
            </div>
          </div>
          <div style="text-align:right">
            <span class="status-badge status-${escapeHtml(booking.status)}">${escapeHtml(booking.status)}</span>
            <div style="font-size:18px;font-weight:800;color:var(--brand-primary);margin-top:4px">${escapeHtml(booking.booking_ref)}</div>
            <small style="color:var(--muted)">GDS PNR: <strong>${escapeHtml(booking.pnr_code || "PENDING")}</strong></small>
          </div>
        </div>

        <div style="padding:14px;background:#f8fafc;border-radius:12px;border:1px solid var(--line);margin-bottom:16px">
          <div class="form-grid-2">
            <div>
              <small style="color:var(--muted);display:block">SERVICE / ITINERARY</small>
              <strong style="font-size:15px">${escapeHtml(booking.service_title)}</strong>
              <div style="font-size:12px;color:var(--muted);margin-top:4px">
                Date: ${escapeHtml(booking.travel_date || "TBA")}${booking.return_date ? " → " + escapeHtml(booking.return_date) : ""}
              </div>
            </div>
            <div>
              <small style="color:var(--muted);display:block">PRIMARY CONTACT</small>
              <strong>${escapeHtml(booking.customer_name)}</strong>
              <div style="font-size:12px;color:var(--muted)">${escapeHtml(booking.customer_phone)} • ${escapeHtml(booking.customer_email)}</div>
              ${booking.eticket_number ? `<div style="font-size:12px;color:var(--brand-green);font-weight:700">E-Ticket No: ${escapeHtml(booking.eticket_number)}</div>` : ""}
            </div>
          </div>
        </div>

        <h4 style="margin-bottom:8px;font-size:14px">Passenger & Passport Manifest</h4>
        <div style="overflow-x:auto;margin-bottom:16px">
          <table style="width:100%;border-collapse:collapse;font-size:13px">
            <thead>
              <tr style="background:#f1f5f9;text-align:left">
                <th style="padding:8px;border:1px solid var(--line)">#</th>
                <th style="padding:8px;border:1px solid var(--line)">Passenger Name</th>
                <th style="padding:8px;border:1px solid var(--line)">Type</th>
                <th style="padding:8px;border:1px solid var(--line)">Passport / ID</th>
                <th style="padding:8px;border:1px solid var(--line)">Expiry</th>
              </tr>
            </thead>
            <tbody>
              ${
                paxList.length
                  ? paxList
                      .map(
                        (p, idx) => `
                  <tr>
                    <td style="padding:8px;border:1px solid var(--line)">${idx + 1}</td>
                    <td style="padding:8px;border:1px solid var(--line)"><strong>${escapeHtml(p.title)} ${escapeHtml(p.first_name)} ${escapeHtml(p.last_name)}</strong></td>
                    <td style="padding:8px;border:1px solid var(--line)">${escapeHtml(p.type)}</td>
                    <td style="padding:8px;border:1px solid var(--line)">${escapeHtml(p.passport_number || "-")}</td>
                    <td style="padding:8px;border:1px solid var(--line)">${escapeHtml(p.passport_expiry || "-")}</td>
                  </tr>`
                      )
                      .join("")
                  : `<tr><td colspan="5" style="padding:8px;border:1px solid var(--line)">${escapeHtml(booking.customer_name)} (${booking.adults} Adult)</td></tr>`
              }
            </tbody>
          </table>
        </div>

        <div style="display:flex;justify-content:space-between;align-items:center;padding:14px;background:#fff1f1;border-radius:12px;margin-bottom:18px;flex-wrap:wrap;gap:12px">
          <div>
            <small style="color:var(--muted);display:block">Payment Mode: <strong>${escapeHtml(booking.payment_method)}</strong></small>
            ${booking.transaction_id ? `<small style="color:var(--text)">TrxID: <strong>${escapeHtml(booking.transaction_id)}</strong></small>` : `<small style="color:var(--text)">Pay via bKash/Nagad (${escapeHtml(settings.bkash_number)}) quoting Ref <strong>${escapeHtml(booking.booking_ref)}</strong></small>`}
          </div>
          <div style="text-align:right">
            <small style="color:var(--muted);display:block">TOTAL AMOUNT</small>
            <strong style="font-size:22px;color:var(--brand-primary)">${formatMoney(booking.total_amount)}</strong>
          </div>
        </div>

        <div class="no-print" style="display:flex;justify-content:flex-end;gap:10px;flex-wrap:wrap">
          <button type="button" class="btn btn-outline" onclick="window.print()">Print / Save E-Ticket PDF</button>
          <button type="button" class="btn btn-primary" onclick="window.ACSearch.closeModal();window.ACPortal.openMyBookingsModal()">View in My Bookings</button>
        </div>
      </div>
    `);
  }

  window.ACBooking = {
    openCheckout,
    showBookingVoucherModal
  };
})();
