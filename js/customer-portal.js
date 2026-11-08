// Air Connect Ltd — Customer Auth, My Bookings Portal, Track PNR, Refund/Reissue & Info Pages
(function () {
  const otpCooldowns = {};
  let otpTimerInterval = null;

  function getRemainingCooldown(email) {
    const key = (email || "").toLowerCase().trim();
    if (!key) return 0;
    const lastSent = otpCooldowns[key] || parseInt(sessionStorage.getItem(`ac_otp_${key}`) || "0", 10);
    if (!lastSent) return 0;
    const elapsed = Math.floor((Date.now() - lastSent) / 1000);
    const remaining = 60 - elapsed;
    return remaining > 0 ? remaining : 0;
  }

  function setCooldown(email) {
    const key = (email || "").toLowerCase().trim();
    if (!key) return;
    const now = Date.now();
    otpCooldowns[key] = now;
    try {
      sessionStorage.setItem(`ac_otp_${key}`, now.toString());
    } catch (e) {}
  }

  function startOtpCountdown(email, onTick, onComplete) {
    if (otpTimerInterval) clearInterval(otpTimerInterval);
    const update = () => {
      const remaining = getRemainingCooldown(email);
      if (remaining > 0) {
        if (onTick) onTick(remaining);
      } else {
        clearInterval(otpTimerInterval);
        otpTimerInterval = null;
        if (onComplete) onComplete();
      }
    };
    update();
    otpTimerInterval = setInterval(update, 1000);
  }

  async function signInWithGoogle() {
    try {
      const { error } = await window.AC.supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin + window.location.pathname
        }
      });
      if (error) {
        const msg = error.message || "";
        if (msg.includes("Unsupported provider") || msg.includes("provider is not enabled")) {
          window.AC.showToast("Google Sign-In is awaiting Google Client ID configuration in Supabase Dashboard. Please sign in with Email & Password.", "warning", 6000);
        } else {
          window.AC.showToast(msg, "error");
        }
      }
    } catch (err) {
      window.AC.showToast(err.message || "Google Sign-In failed.", "error");
    }
  }

  function getGoogleButtonHtml(actionText = "Continue with Google") {
    return `
      <button type="button" class="btn-google-auth" onclick="window.ACPortal.signInWithGoogle()">
        <svg class="google-icon" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
          <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
          <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
          <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.93 6.72-4.93z"/>
        </svg>
        <span>${actionText}</span>
      </button>
      <div class="auth-divider"><span>or with email</span></div>
    `;
  }

  function openAuthModal(defaultTab = "login", targetEmail = "") {
    const { escapeHtml } = window.AC;

    let title = "Welcome Back to Air Connect";
    let subtitle = "Manage your flights, Umrah packages, E-Tickets, and instant holds in one place.";
    if (defaultTab === "signup") {
      title = "Create Your Customer Account";
      subtitle = "Instant registration — start booking flights, hotels & tours immediately.";
    } else if (defaultTab === "forgot") {
      title = "Reset Your Password";
      subtitle = "Enter your registered email to receive an official OTP confirmation code.";
    } else if (defaultTab === "verify-otp") {
      title = "Verify OTP & Set New Password";
      subtitle = `Enter the confirmation OTP sent to ${escapeHtml(targetEmail || "your email")} and choose a new password.`;
    }

    const showTabs = defaultTab === "login" || defaultTab === "signup";

    window.ACSearch.showModal(
      `
      <div style="text-align:center;margin-bottom:18px">
        <img src="assets/logo.jpg" alt="Air Connect Ltd" style="width:52px;height:52px;border-radius:12px;margin-bottom:8px">
        <h2 id="auth-modal-title">${title}</h2>
        <p style="color:var(--muted);font-size:13px;margin:4px 0 0">${subtitle}</p>
      </div>

      ${
        showTabs
          ? `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:18px;background:#f1f5f9;padding:5px;border-radius:10px">
          <button type="button" class="btn btn-sm ${defaultTab === "login" ? "btn-primary" : ""}" id="tab-btn-login" onclick="window.ACPortal.openAuthModal('login')">Sign In</button>
          <button type="button" class="btn btn-sm ${defaultTab === "signup" ? "btn-primary" : ""}" id="tab-btn-signup" onclick="window.ACPortal.openAuthModal('signup')">Create Account</button>
        </div>`
          : ""
      }

      ${
        defaultTab === "login"
          ? `
        ${getGoogleButtonHtml("Continue with Google")}
        <form id="ac-login-form">
          <div class="form-field">
            <label>Email Address *</label>
            <input type="email" id="login-email" placeholder="you@example.com" value="${escapeHtml(targetEmail)}" required>
          </div>
          <div class="form-field">
            <label>Password *</label>
            <input type="password" id="login-password" placeholder="••••••••" required>
          </div>
          <div style="display:flex;justify-content:flex-end;margin-top:-6px;margin-bottom:14px">
            <a href="javascript:void(0)" style="font-size:12.5px;color:var(--brand-primary);font-weight:700" onclick="window.ACPortal.openAuthModal('forgot', document.getElementById('login-email')?.value || '')">Forgot Password?</a>
          </div>
          <button type="submit" class="btn btn-primary" style="width:100%" id="login-submit-btn">Sign In</button>
          <div style="text-align:center;margin-top:14px;font-size:13px;color:var(--muted)">
            Don't have an account? <a href="javascript:void(0)" style="color:var(--brand-primary);font-weight:700" onclick="window.ACPortal.openAuthModal('signup')">Create One Now</a>
          </div>
        </form>`
          : defaultTab === "signup"
          ? `
        ${getGoogleButtonHtml("Sign Up with Google")}
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
          <button type="submit" class="btn btn-primary" style="width:100%;margin-top:8px" id="su-submit-btn">Instant Sign Up</button>
          <div style="text-align:center;margin-top:14px;font-size:13px;color:var(--muted)">
            Already have an account? <a href="javascript:void(0)" style="color:var(--brand-primary);font-weight:700" onclick="window.ACPortal.openAuthModal('login')">Sign In</a>
          </div>
        </form>`
          : defaultTab === "forgot"
          ? `
        <form id="ac-forgot-form">
          <div class="form-field">
            <label>Registered Email Address *</label>
            <input type="email" id="forgot-email" placeholder="you@example.com" value="${escapeHtml(targetEmail)}" required>
          </div>
          <p style="font-size:12px;color:var(--muted);margin:-4px 0 16px;line-height:1.5">
            An official OTP code will be dispatched to your email address from <strong>@airconnectltd.com</strong>.
          </p>
          <button type="submit" class="btn btn-primary" style="width:100%" id="forgot-submit-btn">Send Confirmation OTP</button>
          <div style="text-align:center;margin-top:14px;font-size:13px">
            <a href="javascript:void(0)" style="color:var(--muted);font-weight:600" onclick="window.ACPortal.openAuthModal('login', document.getElementById('forgot-email')?.value || '')">← Back to Sign In</a>
          </div>
        </form>`
          : `
        <!-- verify-otp view -->
        <form id="ac-otp-form">
          <input type="hidden" id="otp-target-email" value="${escapeHtml(targetEmail)}">
          <div class="form-field">
            <label>Registered Email</label>
            <input type="email" value="${escapeHtml(targetEmail)}" readonly style="background:#f1f5f9;cursor:not-allowed">
          </div>
          <div class="form-field">
            <label>6-Digit Confirmation OTP *</label>
            <input type="text" id="otp-token" placeholder="e.g. 123456" maxlength="8" style="font-size:18px;letter-spacing:4px;text-align:center;font-weight:800" required>
          </div>
          <div class="form-field">
            <label>New Password (Min 6 characters) *</label>
            <input type="password" id="otp-new-password" minlength="6" placeholder="Enter new strong password" required>
          </div>
          <button type="submit" class="btn btn-primary" style="width:100%;margin-top:6px" id="otp-submit-btn">Verify OTP &amp; Update Password</button>
          
          <div id="otp-timer-box" style="margin-top:12px;padding:9px 12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;font-size:12.5px;display:flex;align-items:center;justify-content:space-between">
            <span id="otp-timer-text" style="color:var(--muted)">⏱ Resend code in <strong id="otp-timer-count" style="color:var(--brand-primary);font-weight:700">60s</strong></span>
            <button type="button" id="btn-resend-otp" class="btn btn-outline btn-sm" style="display:none;padding:3px 10px;font-size:12px;height:auto;line-height:1.5" onclick="window.ACPortal.resendOtp('${escapeHtml(targetEmail)}')">Resend Code</button>
          </div>

          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:14px;font-size:12.5px">
            <a href="javascript:void(0)" style="color:var(--muted);font-weight:600" onclick="window.ACPortal.openAuthModal('forgot', '${escapeHtml(targetEmail)}')">← Change Email</a>
            <a href="javascript:void(0)" style="color:var(--muted);font-weight:600" onclick="window.ACPortal.openAuthModal('login', '${escapeHtml(targetEmail)}')">Cancel &amp; Sign In</a>
          </div>
        </form>`
      }
    `,
      true
    );

    // If on OTP view, initialize countdown and resend button
    if (defaultTab === "verify-otp") {
      const countEl = document.getElementById("otp-timer-count");
      const textEl = document.getElementById("otp-timer-text");
      const resendBtn = document.getElementById("btn-resend-otp");

      startOtpCountdown(
        targetEmail,
        remaining => {
          if (countEl) countEl.textContent = `${remaining}s`;
          if (textEl) textEl.style.display = "inline";
          if (resendBtn) resendBtn.style.display = "none";
        },
        () => {
          if (textEl) textEl.style.display = "none";
          if (resendBtn) {
            resendBtn.style.display = "inline-flex";
            resendBtn.disabled = false;
            resendBtn.textContent = "Resend Code";
          }
        }
      );
    }

    // Form Handlers
    document.getElementById("ac-login-form")?.addEventListener("submit", async e => {
      e.preventDefault();
      const email = document.getElementById("login-email").value.trim();
      const password = document.getElementById("login-password").value;
      const btn = document.getElementById("login-submit-btn");
      btn.disabled = true;
      btn.textContent = "Signing in...";
      const { error } = await window.AC.supabase.auth.signInWithPassword({ email, password });
      if (error) {
        const msg = (error.message || "").toLowerCase();
        if (msg.includes("email not confirmed")) {
          btn.textContent = "Confirming account...";
          try {
            await window.AC.supabase.rpc("confirm_user_email_rpc", { target_email: email });
            const { error: retryErr } = await window.AC.supabase.auth.signInWithPassword({ email, password });
            if (!retryErr) {
              window.AC.showToast("Signed in successfully! Welcome back.", "success");
              window.ACSearch.closeModal();
              return;
            }
          } catch (rpcErr) {
            console.warn("Auto-confirm retry error:", rpcErr);
          }
        }
        window.AC.showToast(error.message, "error");
        btn.disabled = false;
        btn.textContent = "Sign In";
        return;
      }
      window.AC.showToast("Signed in successfully! Welcome back.", "success");
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

      // Sign up without mandatory email verification barrier
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
        btn.textContent = "Instant Sign Up";
        return;
      }

      // Auto-confirm email via database RPC function
      try {
        await window.AC.supabase.rpc("confirm_user_email_rpc", { target_email: email });
      } catch (e) {
        console.warn("Auto-confirm error:", e);
      }

      // Automatically sign in immediately so user can book right away
      if (!data?.session) {
        const { error: loginErr } = await window.AC.supabase.auth.signInWithPassword({ email, password });
        if (loginErr) {
          console.warn("Auto-login note:", loginErr.message);
        }
      }

      window.AC.showToast(`Welcome to Air Connect Ltd, ${fullName}! Your account is active.`, "success");
      window.ACSearch.closeModal();
    });

    document.getElementById("ac-forgot-form")?.addEventListener("submit", async e => {
      e.preventDefault();
      const email = document.getElementById("forgot-email").value.trim();
      const btn = document.getElementById("forgot-submit-btn");

      const remaining = getRemainingCooldown(email);
      if (remaining > 0) {
        window.AC.showToast(`A code was recently sent. Please wait ${remaining}s before requesting another.`, "info");
        openAuthModal("verify-otp", email);
        return;
      }

      btn.disabled = true;
      btn.textContent = "Sending OTP...";

      try {
        const { error } = await window.AC.supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + window.location.pathname
        });

        if (error) {
          const errMsg = (error.message || "").toLowerCase();
          if (errMsg.includes("rate limit") || errMsg.includes("security") || error.status === 429) {
            setCooldown(email);
            window.AC.showToast("A verification code was recently sent. Please wait before requesting another.", "info");
            openAuthModal("verify-otp", email);
            return;
          }
          window.AC.showToast(error.message, "error");
          btn.disabled = false;
          btn.textContent = "Send Confirmation OTP";
          return;
        }

        setCooldown(email);
        window.AC.showToast(`Confirmation OTP code dispatched to ${email}!`, "success");
        openAuthModal("verify-otp", email);
      } catch (err) {
        window.AC.showToast(err.message || "Could not send OTP.", "error");
        btn.disabled = false;
        btn.textContent = "Send Confirmation OTP";
      }
    });

    document.getElementById("ac-otp-form")?.addEventListener("submit", async e => {
      e.preventDefault();
      const email = document.getElementById("otp-target-email").value.trim();
      const token = document.getElementById("otp-token").value.trim();
      const newPassword = document.getElementById("otp-new-password").value;
      const btn = document.getElementById("otp-submit-btn");
      btn.disabled = true;
      btn.textContent = "Verifying & Updating...";

      try {
        // Verify recovery OTP
        const { error: verifyErr } = await window.AC.supabase.auth.verifyOtp({
          email,
          token,
          type: "recovery"
        });

        if (verifyErr) {
          // Fallback to email OTP if recovery type returned error
          const { error: emailOtpErr } = await window.AC.supabase.auth.verifyOtp({
            email,
            token,
            type: "email"
          });
          if (emailOtpErr) {
            window.AC.showToast("Invalid or expired OTP. Please check and try again.", "error");
            btn.disabled = false;
            btn.textContent = "Verify OTP & Update Password";
            return;
          }
        }

        // Update to new password
        const { error: updateErr } = await window.AC.supabase.auth.updateUser({
          password: newPassword
        });

        if (updateErr) {
          window.AC.showToast(updateErr.message, "error");
          btn.disabled = false;
          btn.textContent = "Verify OTP & Update Password";
          return;
        }

        window.AC.showToast("Password updated successfully! Welcome back.", "success");
        window.ACSearch.closeModal();
      } catch (err) {
        window.AC.showToast(err.message || "Verification failed.", "error");
        btn.disabled = false;
        btn.textContent = "Verify OTP & Update Password";
      }
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

  function openPaymentDetailsModal(defaultMethod = "ALL") {
    let activeFilter = defaultMethod || "ALL";
    if (activeFilter === "BKASH" || activeFilter === "NAGAD") activeFilter = "MFS";
    if (activeFilter === "BANK_TRANSFER") activeFilter = "BANK";

    function renderModalContent(filter) {
      const showMfs = filter === "ALL" || filter === "MFS";
      const showBank = filter === "ALL" || filter === "BANK";

      return `
        <div style="margin-bottom:18px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap">
            <span class="status-badge status-CONFIRMED" style="font-weight:700">OFFICIAL VERIFIED ACCOUNTS</span>
            <span class="status-badge status-PROCESSING">AIR CONNECT LTD</span>
          </div>
          <h2 style="font-size:22px;color:var(--ink);margin:0 0 6px">Payment Methods &amp; Bank Details</h2>
          <p style="font-size:13.5px;color:var(--muted);margin:0">
            Pay safely and conveniently via <strong>bKash</strong>, <strong>Nagad</strong>, or <strong>BRAC Bank PLC</strong> transfer.
          </p>
        </div>

        <!-- Filter / Switcher Bar -->
        <div class="filter-pill-bar" style="margin-bottom:18px;display:flex;gap:8px;flex-wrap:wrap">
          <button type="button" class="filter-pill ${filter === "ALL" ? "active" : ""}" data-pm-filter="ALL">All Options</button>
          <button type="button" class="filter-pill ${filter === "MFS" ? "active" : ""}" data-pm-filter="MFS">bKash &amp; Nagad</button>
          <button type="button" class="filter-pill ${filter === "BANK" ? "active" : ""}" data-pm-filter="BANK">BRAC Bank PLC</button>
        </div>

        <div style="display:grid;gap:18px">
          <!-- 1. bKash & Nagad (Mobile Banking) -->
          <div id="pm-card-mfs" style="display:${showMfs ? "block" : "none"}">
            <div class="bank-transfer-details-card" style="border-color:#fbcfe8;background:#ffffff;margin-bottom:0">
              <div class="bank-details-header" style="border-bottom-color:#fecdd3">
                <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
                  <span class="payment-logo-wrap" style="width:68px;height:34px"><img src="assets/payments/bkash.svg" alt="bKash"></span>
                  <span class="payment-logo-wrap" style="width:68px;height:34px"><img src="assets/payments/nagad.svg" alt="Nagad"></span>
                </div>
                <div>
                  <strong style="color:#e2136e;font-size:16px">bKash &amp; Nagad Official Receiver / Merchant</strong>
                  <small>Send Money or Merchant Payment to our official hotline number</small>
                </div>
              </div>

              <div class="bank-details-grid" style="margin-bottom:12px">
                <div class="bank-detail-item" style="background:#fff1f2;border-color:#fecdd3">
                  <span>Merchant / Receiver Number</span>
                  <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
                    <strong style="color:var(--brand-primary);font-size:16px">+880 1322-937800</strong>
                    <button type="button" class="btn btn-outline btn-sm" style="padding:4px 9px;font-size:11px" onclick="window.AC.copyText('+880 1322-937800', 'bKash/Nagad Number')">Copy</button>
                  </div>
                </div>
                <div class="bank-detail-item">
                  <span>Channel Type</span>
                  <strong>Personal &amp; Merchant (Send Money Accepted)</strong>
                </div>
                <div class="bank-detail-item">
                  <span>Payment Reference</span>
                  <strong>Booking Ref (e.g. AC-2026-...) or Name</strong>
                </div>
                <div class="bank-detail-item">
                  <span>Verification Speed</span>
                  <strong style="color:var(--brand-green)">Instant (10–15 minutes)</strong>
                </div>
              </div>

              <div style="padding:10px 14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;font-size:12.5px;color:var(--text);line-height:1.55">
                💡 <strong>How to Pay:</strong> Open your bKash or Nagad app → Choose <em>Send Money</em> or <em>Make Payment</em> → Enter <strong style="color:var(--brand-primary)">+880 1322-937800</strong> → Enter booking amount → Type your <strong>Booking Reference</strong> in the reference field → Confirm PIN. Save the <strong>TrxID</strong> to confirm your booking.
              </div>
            </div>
          </div>

          <!-- 2. BRAC Bank PLC Transfer -->
          <div id="pm-card-bank" style="display:${showBank ? "block" : "none"}">
            <div class="bank-transfer-details-card" style="border-color:#bfdbfe;background:#ffffff;margin-bottom:0">
              <div class="bank-details-header">
                <span class="bank-details-logo" style="height:44px;padding:4px 10px">
                  <img src="assets/payments/bracbank.png" alt="BRAC Bank PLC" style="max-height:36px;width:auto">
                </span>
                <div>
                  <strong style="color:#0054a6;font-size:16px">BRAC Bank PLC — Official Bank Account</strong>
                  <small>For BEFTN, NPSB, RTGS, BRAC Bank Astha App, or Branch Cash Deposit</small>
                </div>
              </div>

              <div class="bank-details-grid" style="margin-bottom:12px">
                <div class="bank-detail-item">
                  <span>Bank Name</span>
                  <strong>BRAC Bank PLC</strong>
                </div>
                <div class="bank-detail-item">
                  <span>Account Name</span>
                  <strong>SHAKILA JASMIN RUNA</strong>
                </div>
                <div class="bank-detail-item" style="background:#eff6ff;border-color:#bfdbfe">
                  <span>Account Number</span>
                  <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
                    <strong style="color:#0054a6;font-size:16px;letter-spacing:0.5px">1511202219754001</strong>
                    <button type="button" class="btn btn-outline btn-sm" style="padding:4px 9px;font-size:11px" onclick="window.AC.copyText('1511202219754001', 'Bank Account Number')">Copy</button>
                  </div>
                </div>
                <div class="bank-detail-item">
                  <span>Branch Name</span>
                  <strong>MIRPUR BRANCH</strong>
                </div>
                <div class="bank-detail-item">
                  <span>Routing Number</span>
                  <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
                    <strong>060262983</strong>
                    <button type="button" class="btn btn-outline btn-sm" style="padding:4px 9px;font-size:11px" onclick="window.AC.copyText('060262983', 'Routing Number')">Copy</button>
                  </div>
                </div>
                <div class="bank-detail-item">
                  <span>SWIFT Code</span>
                  <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
                    <strong>BRAKBDDH</strong>
                    <button type="button" class="btn btn-outline btn-sm" style="padding:4px 9px;font-size:11px" onclick="window.AC.copyText('BRAKBDDH', 'SWIFT Code')">Copy</button>
                  </div>
                </div>
              </div>

              <div style="padding:10px 14px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;font-size:12.5px;color:#166534;line-height:1.55">
                ✓ <strong>Transfer Guidance:</strong> Transfer from any Bangladeshi bank via Internet Banking (NPSB / BEFTN) or deposit cash at any BRAC Bank branch. Please mention your <strong>Booking Reference</strong> in the remarks/narration.
              </div>
            </div>
          </div>

          <!-- 3. Book & Hold Strip -->
          <div style="padding:12px 16px;background:#f8fafc;border:1.5px dashed var(--line);border-radius:12px;display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap">
            <div>
              <div style="display:flex;align-items:center;gap:6px">
                <span class="status-badge" style="background:#0caf61;color:#fff;font-weight:700">BOOK &amp; HOLD</span>
                <strong style="font-size:13.5px;color:var(--ink)">Prefer to hold PNR before paying?</strong>
              </div>
              <p style="font-size:12px;color:var(--muted);margin:4px 0 0">
                You can select <strong>Book &amp; Hold</strong> at checkout to reserve your tickets first, then complete payment within the hold deadline.
              </p>
            </div>
            <button type="button" class="btn btn-outline btn-sm" onclick="window.ACSearch.closeModal();window.ACPortal.openMyBookingsModal()">
              Track Booking
            </button>
          </div>
        </div>

        <div style="margin-top:20px;padding-top:14px;border-top:1px solid var(--line);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
          <a href="https://wa.me/8801322937800?text=Hello%20Air%20Connect%20Ltd%2C%20I%20have%20a%20question%20about%20payment%20methods." target="_blank" rel="noopener" class="btn btn-outline btn-sm" style="color:#059669;border-color:#34d399;display:flex;align-items:center;gap:6px">
            <svg viewBox="0 0 32 32" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M16.004 2.667C8.64 2.667 2.667 8.64 2.667 16c0 2.35.612 4.644 1.775 6.67L2.56 29.333l6.835-1.792A13.28 13.28 0 0 0 16.004 29.333c7.363 0 13.33-5.973 13.33-13.333 0-3.562-1.387-6.912-3.904-9.43A13.245 13.245 0 0 0 16.004 2.667zm6.08 16.116c-.333-.167-1.97-.972-2.275-1.083-.305-.111-.527-.167-.75.167-.222.333-.86 1.083-1.055 1.305-.194.222-.388.25-.721.083-.333-.167-1.406-.518-2.678-1.652-.99-.883-1.658-1.974-1.852-2.307-.194-.333-.02-.514.146-.68.15-.15.333-.389.5-.583.166-.195.222-.334.333-.556.111-.222.056-.417-.028-.583-.083-.167-.75-1.805-1.027-2.472-.27-.65-.546-.562-.75-.572l-.638-.011c-.222 0-.583.083-.888.417-.305.333-1.166 1.139-1.166 2.777s1.194 3.222 1.36 3.444c.167.222 2.35 3.587 5.692 5.03.795.343 1.416.548 1.9.702.798.254 1.525.218 2.1.132.64-.096 1.97-.805 2.248-1.583.277-.777.277-1.444.194-1.583-.083-.139-.305-.222-.638-.389z"/></svg>
            <span>WhatsApp Payment Support</span>
          </a>
          <button type="button" class="btn btn-primary btn-sm" onclick="window.ACSearch.closeModal()">
            Done
          </button>
        </div>
      `;
    }

    window.ACSearch.showModal(renderModalContent(activeFilter));

    function bindFilterPills() {
      document.querySelectorAll("[data-pm-filter]").forEach(btn => {
        btn.addEventListener("click", () => {
          const f = btn.getAttribute("data-pm-filter");
          activeFilter = f;
          window.ACSearch.showModal(renderModalContent(f));
          bindFilterPills();
        });
      });
    }

    bindFilterPills();
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

  async function resendOtp(email) {
    const remaining = getRemainingCooldown(email);
    if (remaining > 0) {
      window.AC.showToast(`Please wait ${remaining}s before requesting another code.`, "info");
      return;
    }
    const btn = document.getElementById("btn-resend-otp");
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Sending...";
    }
    try {
      const { error } = await window.AC.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + window.location.pathname
      });
      setCooldown(email);
      if (error) {
        const errMsg = (error.message || "").toLowerCase();
        if (errMsg.includes("rate limit") || errMsg.includes("security") || error.status === 429) {
          window.AC.showToast("A code was recently sent. Please check your inbox or wait 60s.", "info");
        } else {
          window.AC.showToast(error.message, "error");
        }
      } else {
        window.AC.showToast(`New confirmation code dispatched to ${email}!`, "success");
      }
      openAuthModal("verify-otp", email);
    } catch (err) {
      window.AC.showToast(err.message || "Could not resend OTP.", "error");
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Resend Code";
      }
    }
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
    resendOtp,
    signInWithGoogle,
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
