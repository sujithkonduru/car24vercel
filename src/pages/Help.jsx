import { Link } from "react-router-dom";
import "./Help.css";

const TOPICS = [
  {
    icon: "🚗",
    title: "Booking a Car",
    desc: "Learn how to search, filter, and book a car in minutes.",
    link: "/faq#booking",
    label: "Booking Guide",
  },
  {
    icon: "💳",
    title: "Payments & Pricing",
    desc: "Understand advance payments, platform fees, and wallet credits.",
    link: "/faq#payment",
    label: "Payment FAQ",
  },
  {
    icon: "❌",
    title: "Cancellations & Refunds",
    desc: "How to cancel a booking and get your advance refunded as credits.",
    link: "/faq#booking",
    label: "Cancellation Policy",
  },
  {
    icon: "📄",
    title: "Documents Required",
    desc: "What ID and licence documents you need to rent or list a car.",
    link: "/faq#vehicles",
    label: "Document Guide",
  },
  {
    icon: "🏢",
    title: "Find a Branch",
    desc: "Locate the nearest Car24 branch for pickup and drop-off.",
    link: "/locations",
    label: "View Locations",
  },
  {
    icon: "🔑",
    title: "Account & Profile",
    desc: "Manage your account, reset your password, and update your profile.",
    link: "/faq#account",
    label: "Account Help",
  },
];

const CONTACT_OPTIONS = [
  {
    icon: "💬",
    title: "WhatsApp",
    desc: "Chat with us instantly — fastest response.",
    href: "#",
    label: "Open WhatsApp",
    external: true,
  },
  {
    icon: "📞",
    title: "Call Us",
    desc: "Speak to our support team directly.",
    href: "tel:9247536486",
    label: "+91 9247536486",
    external: false,
  },
  {
    icon: "✉️",
    title: "Email",
    desc: "Send us a message — we reply within 24 hours.",
    href: "/contact",
    label: "Send Message",
    external: false,
  },
];

export default function Help() {
  return (
    <div className="help-page">
      {/* Hero */}
      <div className="help-hero">
        <span className="help-eyebrow">Help Center</span>
        <h1 className="help-title">How can we help you?</h1>
        <p className="help-subtitle">
          Browse topics below or reach out to our support team directly.
        </p>
      </div>

      <div className="help-body">
        {/* Topics */}
        <section className="help-section">
          <h2 className="help-section-title">Browse Topics</h2>
          <div className="help-grid">
            {TOPICS.map((t) => (
              <Link key={t.title} to={t.link} className="help-card">
                <span className="help-card-icon">{t.icon}</span>
                <div className="help-card-body">
                  <h3>{t.title}</h3>
                  <p>{t.desc}</p>
                </div>
                <span className="help-card-link">
                  {t.label}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Contact */}
        <section className="help-section">
          <h2 className="help-section-title">Contact Support</h2>
          <div className="help-contact-grid">
            {CONTACT_OPTIONS.map((c) => (
              <a
                key={c.title}
                href={c.href}
                target={c.external ? "_blank" : undefined}
                rel={c.external ? "noopener noreferrer" : undefined}
                className="help-contact-card"
              >
                <span className="help-contact-icon">{c.icon}</span>
                <div>
                  <h3>{c.title}</h3>
                  <p>{c.desc}</p>
                  <span className="help-contact-label">{c.label} →</span>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* Quick links */}
        <div className="help-quick">
          <p>Looking for something else?</p>
          <div className="help-quick-links">
            <Link to="/faq">Full FAQ</Link>
            <Link to="/about">About Car24</Link>
            <Link to="/locations">Our Locations</Link>
            <Link to="/register">Create Account</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
