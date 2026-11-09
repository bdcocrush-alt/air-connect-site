// Air Connect Ltd — Supabase Client, Auth, Currency & Global State
(function () {
  const cfg = window.AIRCONNECT_CONFIG;
  const supabase = window.supabase
    ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY)
    : null;

  const state = {
    user: null,
    profile: null,
    isAdmin: false,
    currency: localStorage.getItem("ac_currency") || "BDT",
    settings: {
      brand_name: "Air Connect Ltd",
      tagline: "Travel • Explore • Experience — Flights, Hotels, Holidays, Hajj & Umrah",
      phone: "+880 1322-937800",
      whatsapp: "8801322937800",
      email: "info@airconnectbd.com",
      address: "House 10, Road 2, Sector 17/D Uttara Dhaka",
      bkash_number: "+880 1322-937800",
      nagad_number: "+880 1322-937800",
      bank_details: "BRAC Bank PLC | Account Name: SHAKILA JASMIN RUNA | Account Number: 1511202219754001 | Branch Name: MIRPUR BRANCH | Routing Number: 060262983 | SWIFT Code: BRAKBDDH",
      currency_rates: { BDT: 1, USD: 0.0083, MYR: 0.037, SAR: 0.031 }
    },
    airports: cfg.DEFAULT_AIRPORTS || [],
    flightDeals: cfg.DEFAULT_FLIGHTS || [],
    hotels: cfg.DEFAULT_HOTELS || [],
    packages: cfg.DEFAULT_PACKAGES || [],
    visaServices: cfg.DEFAULT_VISAS || [],
    promoBanners: cfg.DEFAULT_BANNERS || []
  };

  function formatMoney(amountBdt, overrideCurrency) {
    const curCode = overrideCurrency || state.currency || "BDT";
    const rates = (state.settings && state.settings.currency_rates) || { BDT: 1, USD: 0.0083, MYR: 0.037, SAR: 0.031 };
    const rate = Number(rates[curCode] || cfg.CURRENCIES[curCode]?.rate || 1);
    const num = Number(amountBdt || 0) * rate;
    const sym = cfg.CURRENCIES[curCode]?.symbol || (curCode + " ");
    if (curCode === "BDT") {
      return sym + Math.round(num).toLocaleString("en-IN");
    }
    return sym + num.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  function setCurrency(code) {
    if (!cfg.CURRENCIES[code]) return;
    state.currency = code;
    localStorage.setItem("ac_currency", code);
    document.querySelectorAll("[data-currency-select]").forEach(el => {
      el.value = code;
    });
    window.dispatchEvent(new CustomEvent("ac:currency-changed", { detail: { currency: code } }));
  }

  function showToast(message, type = "info") {
    let container = document.getElementById("ac-toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "ac-toast-container";
      container.className = "ac-toast-container";
      document.body.appendChild(container);
    }
    const toast = document.createElement("div");
    toast.className = `ac-toast ac-toast-${type}`;
    const icon = type === "success" ? "✓" : type === "error" ? "✕" : "ℹ";
    toast.innerHTML = `<span class="ac-toast-icon">${icon}</span><span>${escapeHtml(message)}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add("ac-toast-hide");
      setTimeout(() => toast.remove(), 300);
    }, 4200);
  }

  function escapeHtml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function syncSessionCookie(session) {
    try {
      if (session?.access_token) {
        const maxAge = session.expires_in || 604800; // 7 days
        document.cookie = `ac_session=${encodeURIComponent(session.access_token)}; path=/; max-age=${maxAge}; SameSite=Lax; secure`;
        document.cookie = `ac_user=${encodeURIComponent(session.user?.email || "")}; path=/; max-age=${maxAge}; SameSite=Lax; secure`;
      } else {
        document.cookie = "ac_session=; path=/; max-age=0; SameSite=Lax; secure";
        document.cookie = "ac_user=; path=/; max-age=0; SameSite=Lax; secure";
      }
    } catch (e) {
      console.warn("Cookie sync error:", e);
    }
  }

  function initCookieConsent() {
    const consent = localStorage.getItem("ac_cookie_consent");
    const banner = document.getElementById("cookie-consent-banner");
    if (!consent && banner) {
      banner.hidden = false;
    }
  }

  function acceptCookies() {
    localStorage.setItem("ac_cookie_consent", "accepted");
    document.cookie = "ac_consent=true; path=/; max-age=31536000; SameSite=Lax; secure";
    const banner = document.getElementById("cookie-consent-banner");
    if (banner) banner.hidden = true;
    showToast("Cookie preferences saved.", "success");
  }

  async function syncAuthUser(session) {
    syncSessionCookie(session);
    state.user = session?.user || null;
    state.isAdmin = Boolean(
      state.user?.app_metadata?.role === "admin" ||
      ["info@airconnectbd.com", "bdcocrush@gmail.com", "admin@airconnectltd.com"].includes((state.user?.email || "").toLowerCase())
    );
    if (state.user && supabase) {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", state.user.id)
        .maybeSingle();
      state.profile = data || {
        id: state.user.id,
        full_name: state.user.user_metadata?.full_name || state.user.email.split("@")[0],
        email: state.user.email,
        phone: state.user.user_metadata?.phone || ""
      };
    } else {
      state.profile = null;
    }
    window.dispatchEvent(new CustomEvent("ac:auth-changed", { detail: { user: state.user, profile: state.profile, isAdmin: state.isAdmin } }));
  }

  async function loadInitialCatalog() {
    if (!supabase) return;
    try {
      const [
        settingsRes,
        airportsRes,
        flightsRes,
        hotelsRes,
        packagesRes,
        visaRes,
        bannersRes
      ] = await Promise.all([
        supabase.from("site_settings").select("*").limit(1).maybeSingle(),
        supabase.from("airports").select("*").order("is_popular", { ascending: false }).order("city"),
        supabase.from("flight_deals").select("*").eq("active", true).order("created_at", { ascending: false }),
        supabase.from("hotels").select("*").eq("active", true).order("featured", { ascending: false }),
        supabase.from("packages").select("*").eq("active", true).order("featured", { ascending: false }),
        supabase.from("visa_services").select("*").eq("active", true).order("featured", { ascending: false }),
        supabase.from("promo_banners").select("*").eq("active", true).order("sort_order", { ascending: true })
      ]);

      if (settingsRes.data) state.settings = { ...state.settings, ...settingsRes.data };
      if (airportsRes.data?.length) state.airports = airportsRes.data;
      if (flightsRes.data?.length) state.flightDeals = flightsRes.data;
      if (hotelsRes.data?.length) state.hotels = hotelsRes.data;
      if (packagesRes.data?.length) state.packages = packagesRes.data;
      if (visaRes.data?.length) state.visaServices = visaRes.data;
      if (bannersRes.data?.length) state.promoBanners = bannersRes.data;

      window.dispatchEvent(new CustomEvent("ac:catalog-loaded", { detail: state }));
    } catch (err) {
      console.error("Catalog load error:", err);
    }
  }

  if (supabase) {
    supabase.auth.getSession().then(({ data: { session } }) => {
      syncAuthUser(session);
    });
    supabase.auth.onAuthStateChange((event, session) => {
      syncAuthUser(session);
      if (event === "SIGNED_IN" && window.location.hash && window.location.hash.includes("access_token=")) {
        try {
          history.replaceState(null, "", window.location.pathname + window.location.search);
        } catch (_) {}
        showToast("Signed in successfully with Google!", "success");
      }
    });
  }

  function copyText(text, label = "Text") {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        showToast(`${label} copied to clipboard!`, "success");
      }).catch(() => {
        fallbackCopy(text, label);
      });
    } else {
      fallbackCopy(text, label);
    }
  }

  function fallbackCopy(text, label) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try {
      document.execCommand("copy");
      showToast(`${label} copied to clipboard!`, "success");
    } catch (e) {
      showToast(`Copy failed. Please copy manually: ${text}`, "info");
    }
    document.body.removeChild(ta);
  }

  window.AC = {
    supabase,
    state,
    formatMoney,
    setCurrency,
    showToast,
    escapeHtml,
    copyText,
    initCookieConsent,
    acceptCookies,
    syncSessionCookie,
    loadInitialCatalog,
    syncAuthUser
  };
})();
