# Air Connect Ltd — Complete Technical Documentation & Architecture Reference

> **Website:** [https://airconnectltd.com/](https://airconnectltd.com/)  
> **Repository:** `bdcocrush-alt/air-connect-site` (Branch: `main`)  
> **Deployment:** GitHub Pages (Custom Domain `airconnectltd.com` via `CNAME` and `.nojekyll`)  
> **Backend & Database:** Supabase (`AirConnect-Production`, Project Ref: `jemwovidbymdztofwgsd`)  
> **Support Hotline / Official WhatsApp:** `+880 1322-937800` (`8801322937800`)  
> **Official Email:** `info@airconnectbd.com`  

---

## 1. Project Overview & Philosophy

Air Connect Ltd is a modern Online Travel Agency (OTA) web application engineered for speed, high visual polish, and zero frontend framework overhead. Built using standard web standards (Vanilla JavaScript ES6+ modular architecture, CSS3 custom design system, and HTML5), it connects directly to Supabase for authentication, real-time catalog data, booking transactions, and administration.

This document serves as the single source of truth for all implementations, design decisions, database schemas, and workflows across the project.

---

## 2. Directory Structure & File Manifest

```text
Airconnect web deb/
├── .nojekyll                 # Ensures GitHub Pages serves static files directly
├── 404.html                  # Fallback 404 redirect for custom domain routing
├── CNAME                     # Domain configuration (airconnectltd.com)
├── index.html                # Main OTA portal (Hero, Search Engine, Offers, Tours, Umrah, Visas)
├── admin.html                # Operational admin panel (Customer database, bookings, rates, deals)
├── documentation.md          # Comprehensive technical and architecture documentation (this file)
├── robots.txt                # Search engine crawler guidelines
├── sitemap.xml               # SEO sitemap
├── assets/
│   ├── favicon.png           # Website favicon
│   ├── apple-touch-icon.png  # iOS app icon
│   ├── logo.jpg              # Air Connect Ltd official logo
│   ├── coxs-bazar.webp       # Destination asset
│   ├── himchori-coxs-bazar.webp
│   ├── promo-singapore-airlines.png
│   ├── airlines/             # Carrier logos (biman, usbangla, saudia, emirates, qatar, etc.)
│   └── payments/             # Payment badges (bkash.svg, nagad.svg, bracbank.png)
├── css/
│   └── styles.css            # Complete design system, responsive breakpoints, animations, print rules
└── js/
    ├── config.js             # Supabase credentials, currencies, fallback catalog datasets
    ├── supabase-client.js    # Global AC client, auth listener, cookies, currency conversion
    ├── search-and-results.js # Hero engine, tab indicator, card renderers, carousels, searches
    ├── booking-checkout.js   # Checkout flow, PNR hold generation, passenger forms, payments
    ├── customer-portal.js    # Auth modals (Email/Pass, OTP reset, Google OAuth), My Bookings, Vouchers
    └── admin.js              # Admin dashboard, Customer Database, booking status lifecycle
```

---

## 3. Technology Stack & Integrations

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Hosting & CI/CD** | GitHub Pages | Deployed automatically on commit to `main` branch. |
| **Database** | PostgreSQL (Supabase) | Managed Postgres database with Row Level Security (RLS). |
| **Authentication** | Supabase Auth (GoTrue) | Email/Password, Email OTP Password Reset, Google OAuth. |
| **Session Persistence** | Secure Cookies + LocalStorage | `ac_session` JWT token, `ac_user` email cookie, `localStorage`. |
| **Styling & Motion** | Custom CSS3 (BEM) | GPU-accelerated transforms, glassmorphism, spring curves. |
| **Typography** | Inter & Plus Jakarta Sans | Google Fonts (`400`, `500`, `600`, `700`, `800`). |

---

## 4. Key Architectural Implementations

### 4.1. Hero Section & Micro-Interactions (60fps)
* **Ambient Looping Destination Video:**
  * Implemented via `<video class="hero-bg-video" autoplay muted loop playsinline>` streaming a high-definition, lightweight (~4MB) tropical aerial lagoon video with gentle crystal-clear turquoise ocean waves.
  * **Static Fallback:** High-resolution poster (`assets/` and Unsplash HD) with container background image to eliminate layout shift on slow connections or low-power modes.
  * **Layering & Readability:** Positioned at `z-index: 0`, topped with `.hero-video-overlay` gradient (`rgba(15, 23, 42, 0.46)` to `rgba(15, 23, 42, 0.52)`) at `z-index: 1`, ensuring headline and search form elements maintain high contrast.
* **Modern Glassmorphism Search Card:**
  * `.search-card` features `background: rgba(255, 255, 255, 0.94)`, `backdrop-filter: blur(20px) saturate(180%)`, and `box-shadow: 0 24px 64px rgba(15, 23, 42, 0.22)`.
* **Staggered 60fps Entrance Motion:**
  * Animated with `@keyframes heroFadeUp` and spring easing (`cubic-bezier(0.16, 1, 0.3, 1)`):
    * Headline (`#hero-title`): `delay: 0.1s`
    * Subheadline (`#hero-subtitle`): `delay: 0.22s`
    * Service Tabs Bar (`.search-tabs-bar`): `delay: 0.32s`
    * Main Search Card (`.search-card`): `delay: 0.42s`
* **Sliding Active Tab Indicator:**
  * `.search-tab-pill-slider` lives inside `.search-tabs-bar`.
  * Switching tabs (Flights, Hotels, Tour Packages, Umrah Packages, Visa Services) smoothly translates the indicator with GPU-accelerated `transform: translateX(...)` and dynamic width calculation in `updateSearchTabSlider()`.
* **Smooth 180° Swap Button Rotation:**
  * The airport swap button (`#fl-swap-btn`) uses `transition: transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)`.
  * On click, it accumulates 180° rotations (`rotate(180deg)` → `rotate(360deg)` → `rotate(540deg)`) and swaps select and subtitle values in-place without tearing down or flickering the form DOM.
* **Search Button Polish:**
  * `.search-submit-btn` has a vibrant crimson gradient, subtle `-3px` elevation hover lift, and an atmospheric red glow (`box-shadow: 0 10px 28px rgba(192, 0, 0, 0.38)`).
  * An ambient, gentle light-shimmer sweep (`@keyframes btnShimmerSweep`) sweeps across the button every 5.5s.
* **Dynamic Rotating Headline Word Cycle:**
  * In the main hero headline (`From Plans to Paradise — Instantly`), the word `"Paradise"` dynamically transitions through a curated 5-destination sequence: `"Paradise"` → `"Makkah"` → `"Maldives"` → `"Dubai"` → `"The World"` (looping continuously every 2.8s).
  * The surrounding words (`From Plans to` and `— Instantly`) stay strictly static and pinned.
  * **Zero Cumulative Layout Shift (CLS = 0):** `measureRotatorWidth()` measures the widest rendered word (`"The World"`) via a transient off-screen DOM canvas element in matching typography and locks `.hero-word-rotator` width (`Math.ceil(maxWidth + 8) + 'px'`).
  * **Subtle Vertical Slide + Fade Transition:** Driven by 60fps GPU transforms (`translateY(100%)` → `translateY(0)` → `translateY(-100%)`) with `opacity: 0` → `1` → `0` using `transition: transform 0.55s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.55s cubic-bezier(0.16, 1, 0.3, 1)`.
  * **Tab Switch Safety:** When switching to other service tabs (Hotels, Tours, Umrah, Visa), the rotation timer safely stops and the tab's dedicated title renders cleanly; when switching back to Flights, `initHeroWordRotator()` re-initializes seamlessly.

---

### 4.2. Homepage Section Hierarchy
The homepage structure adheres strictly to the following layout below the hero search widget:
1. **Special Offers & Exclusive Deals (`#offers-section`):**
   * Features horizontal navigation controls (**Left ‹** and **Right ›** circular buttons) in the section header.
   * Auto-slide timer (4.5s) with pause-on-hover (`mouseenter`), touch-pause, and drag-scroll.
   * Boundary wrap: clicking **›** at the end cycles back to the start, and clicking **‹** at the start cycles to the end.
2. **Tour Packages (`#tour-packages-section`):**
   * Divided into two distinct, interactive smooth-sliding carousels:
     * **Inbound Packages (Explore Bangladesh)** (`#home-inbound-slider`): Cox's Bazar, Sundarbans, Saint Martin, Sylhet, Hill Tracts.
     * **Outbound Packages (International Holidays)** (`#home-outbound-slider`): Malaysia, Dubai, Maldives, Thailand, Singapore.
   * Both support circular arrow controls (`‹` and `›`), mouse drag-to-scroll, and mobile touch swipe.
3. **Dedicated Umrah Packages (`#umrah-packages-section`):**
   * Grid layout showcasing Haram-view hotels, direct flights, Muallim assistance, and verified visa processing.
4. **Visa Services (`#hotels-visas-section`):**
   * Dedicated grid presenting processing requirements, fees, and instant application forms for UAE, Saudi Arabia, and Thailand visas.
5. **Trending Destinations & Payment Guarantee Footer.**

---

### 4.3. Customer Authentication & Security

#### Automatic Email Confirmation (No Verification Blockers)
* To prevent new users from getting stuck in an "Email not confirmed" state, two PostgreSQL enhancements are deployed on Supabase:
  1. **Trigger `handle_new_user()`:** Runs `AFTER INSERT ON auth.users`. Automatically sets `email_confirmed_at = now()`, extracts the display name from metadata, and inserts an `ACTIVE` record into `public.profiles`.
  2. **Security Definer RPC `confirm_user_email_rpc(target_email)`:** Can be invoked by the client after sign-up to guarantee instant account activation.
* New accounts receive an HTTP 200 response with immediate access token issuance and login.

#### OTP Password Reset with Rate-Limit Protection
* Triggered from "Forgot Password?" in the Customer Login modal.
* Calls `supabase.auth.resetPasswordForEmail(email)`.
* **60-Second Cooldown:** Client tracks `sessionStorage.getItem('ac_otp_' + email)` and shows a countdown timer.
* **HTTP 429 Interception:** If Supabase returns rate-limit or security throttles, the UI suppresses raw error alerts, transitions directly to the OTP verification view, and displays the remaining cooldown seconds.

#### Google OAuth Social Login
* "Continue with Google" buttons are embedded inside both Customer Login and Sign-Up modals.
* Triggers `signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + window.location.pathname } })`.
* Upon redirect back to `https://airconnectltd.com/`, the authentication listener automatically captures the session, syncs session cookies, strips the messy token hash from the browser URL bar via `history.replaceState()`, and updates the header to show the user's name and "My Bookings".

#### Transparent Frosted Cookie & Privacy Consent Banner
* **Glassmorphism Design:** `background: rgba(15, 23, 42, 0.55)` with `-webkit-backdrop-filter: blur(16px) saturate(180%)` and subtle white border.
* **Clean Single Button:** Displays concise text (*"We use essential security cookies and encrypted session tokens for authentication and secure bookings. Learn more in our Privacy Policy."*) and a single red **"Accept All Cookies"** button.
* **Mobile Zero-Overlap:** On mobile screens, the banner is elevated to `bottom: 68px/74px` centered above the bottom navigation, ensuring a clean **20px+ vertical gap** above the floating WhatsApp button (`bottom: 14px`).

---

### 4.4. Payment Methods & Verification
* **Payment Methods Modal:** Accessible via footer links, booking hold screens, and header options.
* **Official Accounts:**
  * **bKash & Nagad:** Receiver / Merchant hotline **`+880 1322-937800`**.
  * **BRAC Bank PLC:**
    * Account Name: `SHAKILA JASMIN RUNA`
    * Account Number: `1511202219754001`
    * Branch: `MIRPUR BRANCH`
    * Routing Number: `060262983`
    * SWIFT Code: `BRAKBDDH`
* **Instant Booking & PNR Hold:** Users can select "BOOK & HOLD" to generate a real PNR ticket hold with a deadline (typically 24 hours) allowing them to confirm and pay offline via bKash/Nagad/Bank.

---

### 4.5. Admin Panel & Customer Management
* **Route:** `admin.html` (Accessible by accounts with `role: 'admin'` or registered owner emails `info@airconnectbd.com`, `bdcocrush@gmail.com`, `admin@airconnectltd.com`).
* **Customer Database Section:**
  * Real-time query of `public.profiles`.
  * Key Performance Indicator (KPI) metric cards: Total Customers, Active Accounts, Customers with Bookings, System Administrators.
  * Search bar filtering by customer name, email, phone, and passport number.
  * Customer table displaying registration timestamps, account statuses, and quick action buttons.
* **Bookings Management:** Filter by PNR, customer name, date; update booking status (`PENDING`, `CONFIRMED`, `TICKETED`, `CANCELLED`); upload/view e-tickets.

---

## 5. Database Schema & RPC Functions

### 5.1. `public.profiles`
```sql
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL DEFAULT '',
  nationality text NOT NULL DEFAULT 'Bangladeshi',
  passport_number text,
  passport_expiry date,
  role text NOT NULL DEFAULT 'customer', -- 'customer' | 'admin'
  status text NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE' | 'SUSPENDED'
  last_sign_in_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
```

### 5.2. `handle_new_user()` Trigger Function
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  is_owner boolean;
  user_display_name text;
BEGIN
  is_owner := lower(NEW.email) IN ('info@airconnectbd.com', 'bdcocrush@gmail.com', 'admin@airconnectltd.com');
  user_display_name := COALESCE(
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'name',
    split_part(NEW.email, '@', 1)
  );

  -- Auto-confirm email so customers never face "Email not confirmed" error
  UPDATE auth.users
  SET email_confirmed_at = COALESCE(email_confirmed_at, now()),
      raw_app_meta_data = CASE 
        WHEN is_owner THEN COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
        ELSE raw_app_meta_data
      END
  WHERE id = NEW.id;

  INSERT INTO public.profiles (id, full_name, email, phone, role, status)
  VALUES (
    NEW.id,
    user_display_name,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data ->> 'phone', ''),
    CASE WHEN is_owner THEN 'admin' ELSE 'customer' END,
    'ACTIVE'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone = COALESCE(NULLIF(EXCLUDED.phone, ''), public.profiles.phone),
    status = 'ACTIVE';

  RETURN NEW;
END;
$$;
```

### 5.3. `confirm_user_email_rpc()` RPC Function
```sql
CREATE OR REPLACE FUNCTION public.confirm_user_email_rpc(target_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE auth.users
  SET email_confirmed_at = COALESCE(email_confirmed_at, now())
  WHERE lower(email) = lower(trim(target_email));
  RETURN true;
END;
$$;
```

---

## 6. Google Cloud & Supabase OAuth Configuration Guide

To operate the Google Social Login feature on `airconnectltd.com`:

1. **Google Cloud Console (`https://console.cloud.google.com/`):**
   * **Authorized JavaScript Origins:**
     * `https://airconnectltd.com`
     * `https://jemwovidbymdztofwgsd.supabase.co`
   * **Authorized Redirect URIs:**
     * `https://jemwovidbymdztofwgsd.supabase.co/auth/v1/callback`
2. **Supabase Dashboard (`https://supabase.com/dashboard/project/jemwovidbymdztofwgsd`):**
   * **Authentication → Providers → Google:**
     * Toggle **Enable Google provider** to **ON**.
     * Paste **Client ID** and **Client Secret** generated from Google Cloud.
   * **Authentication → URL Configuration:**
     * **Site URL:** `https://airconnectltd.com`
     * **Redirect URLs (Allowlist):**
       * `https://airconnectltd.com/**`
       * `https://airconnectltd.com/*`
       * `https://airconnectltd.com`
       * `http://localhost:*` *(for local debugging)*

---

## 7. Quality Assurance & Regression Checklist

When modifying code in future sprints, verify the following:
1. **JavaScript Syntax Integrity:** Run `node -c <file.js>` on all files in `js/`.
2. **Asset Path Validation:** Ensure all local images in `assets/` and `assets/airlines/` exist.
3. **Hero Tabs Smooth Scroll:** Ensure clicking "Hotels" or "Flights" in the header nav scrolls smoothly to `#flights` and switches the search form tab.
4. **Interactive Sliders:** Check that `home-inbound-slider`, `home-outbound-slider`, and `home-offers-grid` support both button clicks (`‹` / `›`) and mouse touch/drag-to-scroll.
5. **WhatsApp & Cookie Banner Clearance:** On mobile viewports ($\le 480\text{px}$), verify that the Cookie Consent banner does not touch or cover the floating WhatsApp button.
6. **Deploy Verification:** GitHub Pages commits to `main` must include clean paths (avoiding subfolders or broken relative paths).

---

## 8. Summary of Recent Commits (Git Log Reference)

* `eb85132`: Kept only single red "Accept All Cookies" button in consent banner.
* `72933d0`: Polished mobile header, modals, sliders, and card grid responsiveness.
* `989a50d`: Added clean OAuth hash removal and Google sign-in toast.
* `67493c4`: Fixed hotel anchor navigation and improved Google OAuth alert guidance.
* `9481b8a`: Added horizontal navigation controls (`‹` and `›`) and interactive touch/drag slider to Special Offers section.
* `df0cb6d`: Shortened cookie consent text and elevated banner above floating WhatsApp button on mobile.
* `b82b1a4`: Made cookie consent banner background transparent with frosted glassmorphism effect.
* `b283ecf`: Implemented ambient destination background video, frosted glass search card, 60fps entrance motion, sliding tab indicator, 180° swap rotation, and search button shimmer.
