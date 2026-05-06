import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import "../Layout.css";
import logo from "../images/Car 24 logo (1).png";

const WHATSAPP = "#";
const INSTAGRAM = "https://www.instagram.com/car24_travels_official/";
const PHONE = "9247536486";

const ROLE_LABEL = {
  user: "User", owner: "Owner", staff: "Staff",
  branch_head: "Branch Head", subadmin: "Sub-Admin",
  admin: "Admin", superadmin: "Super Admin",
};

const NAV_LINKS = [
  { to: "/", label: "Home", end: true },
  // { to: "/cars", label: "Cars" },
  { to: "/bookings", label: "Bookings" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

/* ── Icons ── */
const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.528 5.852L.057 23.5l5.797-1.522A11.95 11.95 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.006-1.371l-.36-.213-3.44.903.918-3.352-.234-.374A9.818 9.818 0 1 1 12 21.818z"/>
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
  </svg>
);

const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.11 12 19.79 19.79 0 0 1 1.04 3.4 2 2 0 0 1 3 1.22h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);

const ChevronDown = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

export default function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();
  if (!auth) {
    return (
      <div className="lyt-shell">
        <div style={{padding: '2rem', textAlign: 'center', color: '#666'}}>
          Loading...
        </div>
      </div>
    );
  }
  const { token, user, role, isOwner, isAdmin, isBranchHead, isStaff, logout } = auth;
  const loggedIn = !!token;

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => setMenuOpen(false), [location.pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function handleLogout() {
    logout();
    setDropdownOpen(false);
    navigate("/");
  }

  function getDashboardLink() {
    if (isOwner) return "/owner/dashboard";
    if (role === "superadmin") return "/superadmin/dashboard";
    if (isAdmin) return "/admin/dashboard";
    if (isBranchHead) return "/branch/dashboard";
    if (isStaff) return "/staff/dashboard";
    return "/dashboard";
  }

  return (
    <div className="lyt-shell">

      {/* ══════════ NAVBAR ══════════ */}
      <header className={`lyt-nav ${scrolled ? "scrolled" : ""}`}>

        {/* Logo */}
        <Link to="/" className="lyt-brand">
          <img src={logo} alt="Car24" className="lyt-brand-img" />
        </Link>

        {/* Center Nav Links */}
        <nav className="lyt-nav-links">
          {NAV_LINKS.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `lyt-nav-link${isActive ? " active" : ""}`}
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Right Section */}
        <div className="lyt-actions">

          {/* Social Icons */}
          <div className="lyt-social-icons">
            <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noopener noreferrer"
              className="lyt-social-btn lyt-social-wa" title="Chat on WhatsApp">
              <WhatsAppIcon />
            </a>
            <a href={INSTAGRAM} target="_blank" rel="noopener noreferrer"
              className="lyt-social-btn lyt-social-ig" title="Follow on Instagram">
              <InstagramIcon />
            </a>
            <a href={`tel:${PHONE}`}
              className="lyt-social-btn lyt-social-ph" title="Call us">
              <PhoneIcon />
            </a>
          </div>

          <div className="lyt-actions-divider" />

          {/* Auth */}
          {loggedIn ? (
            <div className="lyt-profile-wrap" ref={dropdownRef}>
              <button
                className="lyt-avatar-btn"
                onClick={() => setDropdownOpen(o => !o)}
                aria-expanded={dropdownOpen}
              >
                <div className="lyt-avatar">{user?.name?.charAt(0)?.toUpperCase() || "U"}</div>
                <span className="lyt-avatar-name">{user?.name?.split(" ")[0] || "User"}</span>
                <span className={`lyt-chevron ${dropdownOpen ? "open" : ""}`}><ChevronDown /></span>
              </button>

              {dropdownOpen && (
                <div className="lyt-dropdown">
                  <div className="lyt-dropdown-header">
                    <div className="lyt-dropdown-avatar">{user?.name?.charAt(0)?.toUpperCase() || "U"}</div>
                    <div>
                      <div className="lyt-dropdown-name">{user?.name || "User"}</div>
                      <div className="lyt-dropdown-role">{ROLE_LABEL[role] || role}</div>
                    </div>
                  </div>
                  <div className="lyt-dropdown-divider" />
                  <Link to={getDashboardLink()} className="lyt-dropdown-item" onClick={() => setDropdownOpen(false)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                    Dashboard
                  </Link>
                  <Link to="/bookings" className="lyt-dropdown-item" onClick={() => setDropdownOpen(false)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    My Bookings
                  </Link>
                  <Link to="/profile" className="lyt-dropdown-item" onClick={() => setDropdownOpen(false)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    Profile
                  </Link>
                  <div className="lyt-dropdown-divider" />
                  <button className="lyt-dropdown-item lyt-dropdown-logout" onClick={handleLogout}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="lyt-btn-ghost">Login</Link>
              <Link to="/register" className="lyt-btn-primary">Sign Up</Link>
            </>
          )}
        </div>

        {/* Hamburger */}
        <button
          className={`lyt-hamburger ${menuOpen ? "open" : ""}`}
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Toggle menu"
        >
          <span /><span /><span />
        </button>
      </header>

      {/* Mobile Overlay */}
      <div className={`lyt-overlay ${menuOpen ? "open" : ""}`} onClick={() => setMenuOpen(false)} aria-hidden="true" />

      {/* Mobile Drawer */}
      <div className={`lyt-drawer ${menuOpen ? "open" : ""}`} role="dialog" aria-label="Navigation menu">
        <div className="lyt-drawer-brand">
          <img src={logo} alt="Car24" style={{ height: 36 }} />
        </div>

        {NAV_LINKS.map(({ to, label }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `lyt-drawer-link${isActive ? " active" : ""}`}>
            {label}
          </NavLink>
        ))}

        <div className="lyt-drawer-social">
          <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noopener noreferrer" className="lyt-drawer-social-link lyt-dsw-wa">
            <WhatsAppIcon /> WhatsApp
          </a>
          <a href={INSTAGRAM} target="_blank" rel="noopener noreferrer" className="lyt-drawer-social-link lyt-dsw-ig">
            <InstagramIcon /> Instagram
          </a>
          <a href={`tel:${PHONE}`} className="lyt-drawer-social-link lyt-dsw-ph">
            <PhoneIcon /> Call Now
          </a>
        </div>

        <div className="lyt-drawer-actions">
          {loggedIn ? (
            <>
              <div className="lyt-drawer-user">
                <div className="lyt-avatar">{user?.name?.charAt(0)?.toUpperCase() || "U"}</div>
                <div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#e8edf5" }}>{user?.name}</div>
                  <div style={{ fontSize: "0.7rem", color: "#14b8a6", textTransform: "uppercase", letterSpacing: "0.05em" }}>{ROLE_LABEL[role] || role}</div>
                </div>
              </div>
              <Link to={getDashboardLink()} className="lyt-btn-ghost" style={{ textAlign: "center" }}>Dashboard</Link>
              <button onClick={handleLogout} className="lyt-btn-logout" style={{ width: "100%" }}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="lyt-btn-ghost" style={{ textAlign: "center" }}>Login</Link>
              <Link to="/register" className="lyt-btn-primary" style={{ justifyContent: "center" }}>Sign Up</Link>
            </>
          )}
        </div>
      </div>

      {/* Main */}
      <main className="lyt-main">{children}</main>

      {/* ══════════ FOOTER ══════════ */}
      <footer className="lyt-footer">
        <div className="lyt-footer-inner">

          {/* Brand Column */}
          <div className="lyt-footer-brand-col">
            <Link to="/" className="lyt-footer-logo">
              <img src={logo} alt="Car24" style={{ height: 40 }} />
            </Link>
            <p className="lyt-footer-tagline">
              India's premium self-drive car rental platform. 500+ certified cars across 50+ cities.
            </p>
            <div className="lyt-footer-social">
              <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noopener noreferrer" className="lyt-fsocial-btn lyt-fsocial-wa" title="WhatsApp">
                <WhatsAppIcon />
              </a>
              <a href={INSTAGRAM} target="_blank" rel="noopener noreferrer" className="lyt-fsocial-btn lyt-fsocial-ig" title="Instagram">
                <InstagramIcon />
              </a>
              <a href={`tel:${PHONE}`} className="lyt-fsocial-btn lyt-fsocial-ph" title="Call">
                <PhoneIcon />
              </a>
            </div>
          </div>

          {/* Company */}
          <div className="lyt-footer-col">
            <h4 className="lyt-footer-heading">Company</h4>
            <Link to="/about" className="lyt-footer-link">About Us</Link>
            <Link to="/contact" className="lyt-footer-link">Contact</Link>
            <Link to="/locations" className="lyt-footer-link">Locations</Link>
          </div>

          {/* Explore */}
          <div className="lyt-footer-col">
            <h4 className="lyt-footer-heading">Explore</h4>
            <Link to="/" className="lyt-footer-link">Browse Cars</Link>
            <Link to="/cars" className="lyt-footer-link">All Cars</Link>
            <Link to="/bookings" className="lyt-footer-link">My Bookings</Link>
          </div>

          {/* Support */}
          <div className="lyt-footer-col">
            <h4 className="lyt-footer-heading">Support</h4>
            <Link to="/help" className="lyt-footer-link">Help Center</Link>
            <Link to="/faq" className="lyt-footer-link">FAQ</Link>
            <Link to="/contact" className="lyt-footer-link">Report Issue</Link>
          </div>

          {/* Contact */}
          <div className="lyt-footer-col">
            <h4 className="lyt-footer-heading">Contact Us</h4>
            <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noopener noreferrer" className="lyt-footer-contact-item">
              <span className="lyt-fci-icon lyt-fci-wa"><WhatsAppIcon /></span>
              <span>WhatsApp Chat</span>
            </a>
            <a href={INSTAGRAM} target="_blank" rel="noopener noreferrer" className="lyt-footer-contact-item">
              <span className="lyt-fci-icon lyt-fci-ig"><InstagramIcon /></span>
              <span>@car24india</span>
            </a>
            <a href={`tel:${PHONE}`} className="lyt-footer-contact-item">
              <span className="lyt-fci-icon lyt-fci-ph"><PhoneIcon /></span>
              <span>+91 9247536486</span>
            </a>
          </div>

        </div>

        <div className="lyt-footer-bottom">
          <p>© {new Date().getFullYear()} Car24. All rights reserved.</p>
          <div className="lyt-footer-bottom-links">
            <Link to="/privacy-policy">Privacy Policy</Link>
            <Link to="/terms-and-conditions">Terms of Service</Link>
            <Link to="/cancellation-policy">Cancellation Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
