import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet } from "../api.js";
import CarCard from "../components/CarCard.jsx";
import "../Home.css";

const HERO_SLIDES = [
  { id: 1, src: new URL('../images/pexels-mikebirdy-244280.jpg', import.meta.url).href },
  { id: 2, src: new URL('../images/image-4.jpg', import.meta.url).href },
  { id: 3, src: new URL('../images/pexels-rubenstein111rebello-10320378.jpg', import.meta.url).href },
  { id: 4, src: new URL('../images/pexels-troy-tumbin-2155848265-36184873.jpg', import.meta.url).href },
  { id: 5, src: new URL('../images/pexels-vicky-brownb-vicky-1604723384-27517023.jpg', import.meta.url).href },
];

const CATEGORIES = ["All", "SUV", "Sedan", "Hatchback", "Luxury", "Convertible", "Van", "MUV"];
const FUEL_TYPES = ["petrol", "diesel", "electric", "cng", "hybrid"];
const TRANSMISSIONS = ["manual", "automatic", "cvt", "dct"];

const WHY_US = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    title: "Fully Insured",
    desc: "Every car comes with comprehensive insurance coverage for your peace of mind.",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" />
      </svg>
    ),
    title: "24/7 Support",
    desc: "Round-the-clock customer support available via call, chat, or WhatsApp.",
  },
  // {
  //   icon: (
  //     <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
  //       <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  //     </svg>
  //   ),
  //   title: "No Hidden Charges",
  //   desc: "Transparent pricing with all taxes included. What you see is what you pay.",
  // },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
    title: "Instant Booking",
    desc: "Book in under 2 minutes. Instant confirmation with OTP-based key handover.",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="1" y="3" width="15" height="13" rx="2" /><path d="M16 8h4l3 3v5h-7V8z" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    ),
    title: "Verified Fleet",
    desc: "All cars are regularly serviced, sanitized, and verified by our team.",
  },
  // {
  //   icon: (
  //     <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
  //       <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
  //     </svg>
  //   ),
  //   title: "50+ Locations",
  //   desc: "Pick up and drop off at any of our 50+ branches across India.",
  // },
];

const TESTIMONIALS = [
  { id: 1, name: "Rahul Sharma", role: "Business Traveler", rating: 5, text: "Car24 made my business trip seamless. The car was spotless and ready on time. Will definitely book again!", initials: "RS" },
  { id: 2, name: "Priya Nair", role: "Weekend Traveler", rating: 5, text: "Explored Andhra Pradesh with a reliable SUV from Car24. Incredible service and very affordable pricing.", initials: "PN" },
  { id: 3, name: "Arjun Mehta", role: "Daily Commuter", rating: 5, text: "Best self-drive rental in the city. Easy booking, clean cars, and the staff is super helpful.", initials: "AM" },
];

const HOW_STEPS = [
  { num: "01", title: "Choose Your Car", desc: "Browse our fleet and pick the perfect car for your trip — filter by type, fuel, or seats." },
  { num: "02", title: "Select Dates", desc: "Pick your pickup and drop-off date & time. See live pricing with no hidden charges." },
  { num: "03", title: "Pay & Confirm", desc: "Simply pay the advance online and receive instant booking confirmation along with your OTP." },
  { num: "04", title: "Drive & Enjoy", desc: "Show your OTP at pickup, collect the keys, and hit the road. It's that simple!" },
];

export default function Home() {
  const [filters, setFilters] = useState({ category: "", fuelType: "", transmission: "", seater: "", model: "", colour: "", branch: "", pickupDate: "", dropoffDate: "" });
  const [activeCategory, setActiveCategory] = useState("All");
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [payload, setPayload] = useState(null);
  const [branches, setBranches] = useState([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Hero slideshow
  useEffect(() => {
    const t = setInterval(() => setCurrentSlide(p => (p + 1) % HERO_SLIDES.length), 5000);
    return () => clearInterval(t);
  }, []);

  const loadBranches = useCallback(async () => {
    try { setBranches(Array.isArray(await apiGet("/cars/get_branches")) ? await apiGet("/cars/get_branches") : []); }
    catch { setBranches([]); }
  }, []);

  const loadCars = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const q = {
        limit: 12, pageno: page,
        category: activeCategory !== "All" ? activeCategory : undefined,
        fuelType: filters.fuelType || undefined,
        transmission: filters.transmission || undefined,
        seater: filters.seater || undefined,
        model: filters.model || undefined,
        colour: filters.colour || undefined,
        branch: filters.branch || undefined,
        pickupDate: filters.pickupDate ? new Date(filters.pickupDate).toISOString() : undefined,
        dropoffDate: filters.dropoffDate ? new Date(filters.dropoffDate).toISOString() : undefined,
      };
      setPayload(await apiGet("/cars/get_cars", { query: q }));
    } catch (e) { setError(e.message || "Could not load cars"); setPayload(null); }
    finally { setLoading(false); }
  }, [filters, page, activeCategory]);

  useEffect(() => { loadBranches(); }, [loadBranches]);
  useEffect(() => { loadCars(); }, [loadCars]);

  function onFilterChange(e) { const { name, value } = e.target; setFilters(f => ({ ...f, [name]: value })); setPage(0); }
  function resetFilters() { setFilters({ category: "", fuelType: "", transmission: "", seater: "", model: "", colour: "", branch: "", pickupDate: "", dropoffDate: "" }); setActiveCategory("All"); setPage(0); }
  function applyFilters(e) { e.preventDefault(); setPage(0); loadCars(); }

  const activeFilterCount = Object.values(filters).filter(Boolean).length + (activeCategory !== "All" ? 1 : 0);
  const totalPages = payload?.totalPages ?? 0;

  return (
    <div className="hp-root">

      {/* ══════════════════════════════════════════════════════
          HERO — Full bleed with inline search bar
      ══════════════════════════════════════════════════════ */}
      <section className="hp-hero">
        {/* Slideshow background */}
        <div className="hp-hero-bg">
          {HERO_SLIDES.map((s, i) => (
            <img key={s.id} src={s.src} alt="" aria-hidden="true"
              className={`hp-hero-bg-img ${i === currentSlide ? "is-active" : "is-hidden"}`} />
          ))}
          <div className="hp-hero-overlay" />
        </div>

        {/* Hero content */}
        <div className="hp-hero-inner">
          <div className="hp-hero-text">
            <span className="hp-hero-eyebrow">
              <span className="hp-eyebrow-dot" />
              India's #1 Self-Drive Car Rental
            </span>
            <h1 className="hp-hero-title">
              Find the Right Car for Every Journey<br />
              <span className="hp-hero-title-accent">Simple. Fast. Reliable.</span>
            </h1>
            <p className="hp-hero-sub">
              100+ certified cars · 50+ cities · Instant booking · No driver needed
            </p>
          </div>

          {/* ── Inline Search Bar (drselfdrives style) ── */}
          <div className="hp-search-wrapper">
            <div className="hp-search-bar">
              <div className="hp-search-field">
                <label className="hp-search-label">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <span>Location</span>
                </label>
                <div className="hp-select-wrapper">
                  <select name="branch" value={filters.branch} onChange={onFilterChange} className="hp-search-input hp-select">
                    <option value="">All Branches</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name} — {b.city}</option>)}
                  </select>
                  <svg className="hp-select-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </div>

              <div className="hp-search-divider">
                <div className="hp-divider-line"></div>
                <div className="hp-divider-icon">
  <i className="fa-solid fa-location-dot"></i>
</div>
                <div className="hp-divider-line"></div>
              </div>

              <div className="hp-search-field hp-date-field">
                <label className="hp-search-label">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <span>Pickup</span>
                </label>
                <input
                  type="datetime-local"
                  name="pickupDate"
                  value={filters.pickupDate}
                  onChange={onFilterChange}
                  className="hp-search-input hp-date-input"
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>

              <div className="hp-search-divider hp-duration-divider">
                <div className="hp-duration-pill">
                  <span className="hp-duration-text">
                    {filters.pickupDate && filters.dropoffDate ?
                      `${Math.round((new Date(filters.dropoffDate) - new Date(filters.pickupDate)) / (1000 * 60 * 60))} hrs` :
                      'Duration'}
                  </span>
                </div>
              </div>

              <div className="hp-search-field hp-date-field">
                <label className="hp-search-label">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <span>Drop-off</span>
                </label>
                <input
                  type="datetime-local"
                  name="dropoffDate"
                  value={filters.dropoffDate}
                  onChange={onFilterChange}
                  className="hp-search-input hp-date-input"
                  min={filters.pickupDate || new Date().toISOString().slice(0, 16)}
                />
              </div>

              <button className="hp-search-btn" onClick={() => { setPage(0); loadCars(); document.getElementById("cars")?.scrollIntoView({ behavior: "smooth" }); }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <span>Find Cars</span>
              </button>
            </div>

            {/* Quick Duration Chips */}
            <div className="hp-quick-chips">
              <button
                className="hp-chip"
                onClick={() => {
                  const pickup = new Date();
                  pickup.setHours(10, 0, 0, 0);
                  const dropoff = new Date(pickup);
                  dropoff.setHours(pickup.getHours() + 6);
                  document.querySelector('[name="pickupDate"]').value = pickup.toISOString().slice(0, 16);
                  document.querySelector('[name="dropoffDate"]').value = dropoff.toISOString().slice(0, 16);
                  // Trigger change event
                  const changeEvent = new Event('change', { bubbles: true });
                  document.querySelector('[name="pickupDate"]').dispatchEvent(changeEvent);
                  document.querySelector('[name="dropoffDate"]').dispatchEvent(changeEvent);
                }}
              >
                <span>🕐</span> 6 Hours
              </button>
              <button
                className="hp-chip"
                onClick={() => {
                  const pickup = new Date();
                  pickup.setHours(10, 0, 0, 0);
                  const dropoff = new Date(pickup);
                  dropoff.setHours(pickup.getHours() + 12);
                  document.querySelector('[name="pickupDate"]').value = pickup.toISOString().slice(0, 16);
                  document.querySelector('[name="dropoffDate"]').value = dropoff.toISOString().slice(0, 16);
                  const changeEvent = new Event('change', { bubbles: true });
                  document.querySelector('[name="pickupDate"]').dispatchEvent(changeEvent);
                  document.querySelector('[name="dropoffDate"]').dispatchEvent(changeEvent);
                }}
              >
                <span>⚡</span> 12 Hours
              </button>
              <button
                className="hp-chip"
                onClick={() => {
                  const pickup = new Date();
                  pickup.setHours(10, 0, 0, 0);
                  const dropoff = new Date(pickup);
                  dropoff.setDate(pickup.getDate() + 1);
                  document.querySelector('[name="pickupDate"]').value = pickup.toISOString().slice(0, 16);
                  document.querySelector('[name="dropoffDate"]').value = dropoff.toISOString().slice(0, 16);
                  const changeEvent = new Event('change', { bubbles: true });
                  document.querySelector('[name="pickupDate"]').dispatchEvent(changeEvent);
                  document.querySelector('[name="dropoffDate"]').dispatchEvent(changeEvent);
                }}
              >
                <span>📅</span> 1 Day
              </button>
              <button
                className="hp-chip hp-chip-highlight"
                onClick={() => {
                  const pickup = new Date();
                  pickup.setHours(22, 0, 0, 0);
                  if (new Date() > pickup) pickup.setDate(pickup.getDate() + 1);
                  const dropoff = new Date(pickup);
                  dropoff.setHours(pickup.getHours() + 6);
                  document.querySelector('[name="pickupDate"]').value = pickup.toISOString().slice(0, 16);
                  document.querySelector('[name="dropoffDate"]').value = dropoff.toISOString().slice(0, 16);
                  const changeEvent = new Event('change', { bubbles: true });
                  document.querySelector('[name="pickupDate"]').dispatchEvent(changeEvent);
                  document.querySelector('[name="dropoffDate"]').dispatchEvent(changeEvent);
                }}
              >
                <span>🌙</span> Night Pickup 
              </button>
            </div>
          </div>

          {/* Stats strip */}
          <div className="hp-hero-stats">
            {[["500+", "Cars Available"], ["50+", "Cities"], ["25K+", "Happy Renters"], ["4.9★", "Avg Rating"]].map(([n, l], i) => (
              <div key={i} className="hp-hero-stat">
                <span className="hp-hero-stat-num">{n}</span>
                <span className="hp-hero-stat-lbl">{l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Slide dots */}
        {/* <div className="hp-slide-dots">
          {HERO_SLIDES.map((_, i) => (
            <button key={i} className={`hp-slide-dot ${i === currentSlide ? "active" : ""}`}
              onClick={() => setCurrentSlide(i)} aria-label={`Slide ${i + 1}`} />
          ))}
        </div> */}

        {/* Scroll cue */}
        <div className="hp-scroll-cue" aria-hidden="true"><div className="hp-scroll-line" /></div>
      </section>

      {/* ══════════════════════════════════════════════════════
          CATEGORY TABS + CAR FLEET
      ══════════════════════════════════════════════════════ */}
      <section className="hp-fleet-section" id="cars">
        <div className="hp-section-inner">

          {/* Section header */}
          <div className="hp-section-head">
            <div>
              <span className="hp-eyebrow-tag">Our Fleet</span>
              <h2 className="hp-section-title">Find Your Perfect Ride</h2>
            </div>
            <button className="hp-advanced-filter-btn" onClick={() => setFilterOpen(o => !o)}>
              <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
                <path d="M1 3h14v1.5l-5 5V15l-4-2V9.5L1 4.5V3z" />
              </svg>
              Advanced Filters
              {activeFilterCount > 0 && <span className="hp-filter-count">{activeFilterCount}</span>}
            </button>
          </div>

          {/* Category tabs */}
          <div className="hp-cat-tabs">
            {CATEGORIES.map(cat => (
              <button key={cat}
                className={`hp-cat-tab ${activeCategory === cat ? "active" : ""}`}
                onClick={() => { setActiveCategory(cat); setPage(0); }}>
                {cat}
              </button>
            ))}
          </div>

          {/* Active filter chips */}
          {activeFilterCount > 0 && (
            <div className="hp-chips">
              {activeCategory !== "All" && (
                <span className="hp-chip">Category: {activeCategory}
                  <button className="hp-chip-x" onClick={() => { setActiveCategory("All"); setPage(0); }}>×</button>
                </span>
              )}
              {Object.entries(filters).map(([k, v]) => v ? (
                <span key={k} className="hp-chip">{k}: {v}
                  <button className="hp-chip-x" onClick={() => { setFilters(f => ({ ...f, [k]: "" })); setPage(0); }}>×</button>
                </span>
              ) : null)}
              <button className="hp-clear-all" onClick={resetFilters}>Clear all</button>
            </div>
          )}

          {/* Advanced filter panel */}
          {filterOpen && (
            <form className="hp-filter-panel" onSubmit={applyFilters}>
              <div className="hp-filter-panel-head">
                <span className="hp-filter-panel-title">Refine Results</span>
                <button type="button" className="hp-filter-reset" onClick={resetFilters}>Clear all</button>
              </div>
              <div className="hp-filter-grid">
                <div className="hp-filter-field">
                  <label>Fuel Type</label>
                  <select name="fuelType" value={filters.fuelType} onChange={onFilterChange}>
                    <option value="">Any fuel</option>
                    {FUEL_TYPES.map(f => <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>)}
                  </select>
                </div>
                <div className="hp-filter-field">
                  <label>Transmission</label>
                  <select name="transmission" value={filters.transmission} onChange={onFilterChange}>
                    <option value="">Any</option>
                    {TRANSMISSIONS.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                  </select>
                </div>
                <div className="hp-filter-field">
                  <label>Seats</label>
                  <input name="seater" type="number" min="2" max="9" value={filters.seater} onChange={onFilterChange} placeholder="e.g. 5" />
                </div>
                <div className="hp-filter-field">
                  <label>Model</label>
                  <input name="model" value={filters.model} onChange={onFilterChange} placeholder="e.g. Swift" />
                </div>
                <div className="hp-filter-field">
                  <label>Colour</label>
                  <input name="colour" value={filters.colour} onChange={onFilterChange} placeholder="e.g. white" />
                </div>
                <div className="hp-filter-field">
                  <label>Branch</label>
                  <select name="branch" value={filters.branch} onChange={onFilterChange}>
                    <option value="">All branches</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name} — {b.city}</option>)}
                  </select>
                </div>
              </div>
              <div className="hp-filter-footer">
                <button type="button" className="hp-btn-ghost" onClick={resetFilters}>Reset</button>
                <button type="submit" className="hp-btn-apply">Apply Filters</button>
              </div>
            </form>
          )}

          {/* Results meta */}
          {!loading && payload?.totalCars != null && (
            <p className="hp-results-meta">
              Showing <strong>{payload.data?.length ?? 0}</strong> of <strong>{payload.totalCars}</strong> cars
              {activeCategory !== "All" && ` in ${activeCategory}`}
            </p>
          )}

          {/* Error */}
          {error && (
            <div className="hp-error">
              <span>⚠</span> {error}
              <button className="hp-retry-btn" onClick={loadCars}>Retry</button>
            </div>
          )}

          {/* Skeleton */}
          {loading && (
            <div className="hp-car-grid">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="hp-skeleton-card">
                  <div className="hp-skel-img" style={{ animationDelay: `${i * 0.07}s` }} />
                  <div className="hp-skel-body">
                    <div className="hp-skel-line" style={{ animationDelay: `${i * 0.1}s` }} />
                    <div className="hp-skel-line short" style={{ animationDelay: `${i * 0.12}s` }} />
                    <div className="hp-skel-line xshort" style={{ animationDelay: `${i * 0.14}s` }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Car grid */}
          {!loading && !error && (
            <>
              {payload?.data?.length > 0 ? (
                <div className="hp-car-grid">
                  {payload.data.map((car, i) => {
                    const status = car.isAvailable ? "available" : "booked";
                    return (
                      <div key={car.id} className="hp-car-item" style={{ animationDelay: `${i * 0.05}s` }}>
                        <CarCard car={car} status={status} />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="hp-empty">
                  <div className="hp-empty-icon">🚗</div>
                  <p className="hp-empty-title">No cars found</p>
                  <p className="hp-empty-text">Try adjusting your filters or browse all categories.</p>
                  <button className="hp-empty-btn" onClick={resetFilters}>Clear Filters</button>
                </div>
              )}

              {totalPages > 1 && (
                <div className="hp-pagination">
                  <button className="hp-page-btn" disabled={page <= 0} onClick={() => setPage(p => p - 1)}>← Previous</button>
                  <span className="hp-page-info">Page <strong>{page + 1}</strong> of <strong>{totalPages}</strong></span>
                  <button className="hp-page-btn" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next →</button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          WHY CHOOSE US
      ══════════════════════════════════════════════════════ */}
      <section className="hp-why-section">
        <div className="hp-section-inner">
          <div className="hp-section-header-center">
            <span className="hp-eyebrow-tag">Why Car24</span>
            <h2 className="hp-section-title">The Smarter Way to Drive</h2>
            <p className="hp-section-sub">Everything you need for a hassle-free self-drive experience</p>
          </div>
          <div className="hp-why-grid">
            {WHY_US.map((item, i) => (
              <div key={i} className="hp-why-card">
                <div className="hp-why-icon">{item.icon}</div>
                <h3 className="hp-why-title">{item.title}</h3>
                <p className="hp-why-desc">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════════════════ */}
      <section className="hp-how-section">
        <div className="hp-section-inner">
          <div className="hp-section-header-center">
            <span className="hp-eyebrow-tag">How It Works</span>
            <h2 className="hp-section-title">Book in 4 Simple Steps</h2>
            <p className="hp-section-sub">From browsing to driving — it takes less than 2 minutes</p>
          </div>
          <div className="hp-how-grid">
            {HOW_STEPS.map((step, i) => (
              <div key={i} className="hp-how-card">
                <div className="hp-how-num">{step.num}</div>
                {i < HOW_STEPS.length - 1 && <div className="hp-how-connector" />}
                <h3 className="hp-how-title">{step.title}</h3>
                <p className="hp-how-desc">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          TESTIMONIALS
      ══════════════════════════════════════════════════════ */}
      <section className="hp-reviews-section">
        <div className="hp-section-inner">
          <div className="hp-section-header-center">
            <span className="hp-eyebrow-tag">Customer Reviews</span>
            <h2 className="hp-section-title">What Our Customers Say</h2>
            <p className="hp-section-sub">Trusted by 25,000+ happy renters across India</p>
          </div>
          <div className="hp-reviews-grid">
            {TESTIMONIALS.map(t => (
              <div key={t.id} className="hp-review-card">
                <div className="hp-review-stars">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="#f59e0b" stroke="none">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  ))}
                </div>
                <p className="hp-review-text">"{t.text}"</p>
                <div className="hp-review-author">
                  <div className="hp-review-avatar">{t.initials}</div>
                  <div>
                    <p className="hp-review-name">{t.name}</p>
                    <p className="hp-review-role">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          FINAL CTA BANNER
      ══════════════════════════════════════════════════════ */}
      <section className="hp-cta-section">
        <div className="hp-cta-inner">
          <div className="hp-cta-glow" />
          <span className="hp-eyebrow-tag hp-eyebrow-tag--light">Get Started Today</span>
          <h2 className="hp-cta-title">Ready to Hit the Road?</h2>
          <p className="hp-cta-sub">Join 25,000+ renters. No driver. No hassle. Just drive.</p>
          <div className="hp-cta-actions">
            <a href="#cars" className="hp-cta-btn-primary">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              Browse Cars
            </a>
            <Link to="/register" className="hp-cta-btn-ghost">
              Create Free Account →
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
