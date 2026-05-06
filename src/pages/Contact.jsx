import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import { Mail, Phone, MapPin, Clock, MessageCircle, ArrowUp, Building2, ChevronLeft, ChevronRight } from 'lucide-react';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from 'react-icons/fa';
import styles from './Contact.module.css';

const Contact = () => {
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });
  
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0, 1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1, 0.8]);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(0);

  // Branch locations data
  const branches = [
    {
      id: "nellore",
      name: "Nellore",
      address: "Old Bypass Road, MS Nagar, MP Nagar, Nellore, Andhra Pradesh 524001",
      phone: "+91 97030 40505",
      email: "nellore@car24.com",
      timings: "Mon-Sat: 9 AM - 8 PM | Sun: 10 AM - 4 PM",
      mapEmbed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3887.123456789!2d79.962765!3d14.4558465!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a4c8cd8192d558d%3A0x717f1c6504776618!2scar24%20Travels!5e0!3m2!1sen!2sin!4v1641234567890",
      coordinates: { lat: 14.4558465, lng: 79.962765 }
    },
    {
      id: "guntur",
      name: "Guntur",
      address: "innerring road,narshimha nagar 6th line,near ushodya store,Guntur, Andhra Pradesh 522034",
      phone: "+91 9666442449",
      email: "guntur@car24.com",
      timings: "Mon-Sat: 9 AM - 8 PM | Sun: 10 AM - 4 PM",
      mapEmbed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3887.123456789!2d80.429682!3d16.335383!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a358b1b551b3d63%3A0xbc477f58ce66371b!2sCar%2024%20Travels%20Self%20Drive%20Cars%20(Guntur)!5e0!3m2!1sen!2sin!4v1641234567890",
      coordinates: { lat: 16.345678, lng: 80.456789 }
    }
  ];

  const currentBranch = branches[selectedBranch];

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, []);

  // Handle scroll to top button visibility
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const nextBranch = () => {
    setSelectedBranch((prev) => (prev + 1) % branches.length);
  };

  const prevBranch = () => {
    setSelectedBranch((prev) => (prev - 1 + branches.length) % branches.length);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.9, rotateY: 10 },
    visible: {
      opacity: 1,
      scale: 1,
      rotateY: 0,
      transition: { duration: 0.5, ease: "easeOut" }
    },
    hover: {
      scale: 1.05,
      y: -10,
      transition: { duration: 0.3 }
    }
  };

  const iconVariants = {
    hover: {
      rotate: [0, -10, 10, -5, 5, 0],
      transition: { duration: 0.5 }
    }
  };

  const contactDetails = [
    {
      icon: Mail,
      title: "Email Us",
      info: "Car24travel@gmail.com",
      detail: "Response within 24 hours",
      link: "mailto:Car24travel@gmail.com",
      color: "#10b981"
    },
    {
      icon: Phone,
      title: "Call Us",
      info: "+91 97030 40505",
      detail: "24/7 Customer Support",
      link: "tel:+919247536486",
      color: "#3b82f6"
    },
    {
      icon: MapPin,
      title: "Visit Us",
      info: "Nellore & Guntur",
      detail: "Two convenient locations",
      link: null,
      color: "#f59e0b"
    },
    {
      icon: Clock,
      title: "Business Hours",
      info: "Mon - Sat: 9 AM - 8 PM",
      detail: "Sunday: 10 AM - 4 PM",
      link: null,
      color: "#8b5cf6"
    }
  ];

  const socialLinks = [
    { icon: FaFacebook, name: "Facebook", url: "https://www.facebook.com/car24travelsoff/", color: "#1877f2" },
    { icon: FaTwitter, name: "Twitter", url: "#", color: "#1da1f2" },
    { icon: FaInstagram, name: "Instagram", url: "https://www.instagram.com/car24_travels_official/", color: "#e4405f" },
    { icon: FaLinkedin, name: "LinkedIn", url: "#", color: "#0a66c2" }
  ];

  return (
    <>
      <motion.div
        className={styles.contact}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Hero Section with Parallax */}
        <motion.section 
          className={styles.hero}
          style={{ opacity, scale }}
          ref={sectionRef}
        >
          <div className={styles.heroBackground}>
            <motion.div 
              className={styles.heroOverlay}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              transition={{ duration: 1 }}
            />
          </div>
          
          <div className={styles.heroContent}>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <span className={styles.heroBadge}>✦ Get in Touch</span>
              <h1 className={styles.heroTitle}>
                Let's Start a{" "}
                <motion.span
                  className={styles.gradientText}
                  animate={{
                    backgroundPosition: ['0% 0%', '100% 0%', '0% 0%'],
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                >
                  Conversation
                </motion.span>
              </h1>
              <p className={styles.heroSubtitle}>
                Have questions about our services? Need assistance with a booking? 
                We're here to help. Reach out to us through any of the channels below.
              </p>
            </motion.div>
          </div>
        </motion.section>

        {/* Contact Information Cards - Centered Layout */}
        <motion.div 
          className={styles.mainContainer}
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <motion.div className={styles.infoSection} variants={itemVariants}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.titleIcon}>📞</span>
              Contact Information
            </h2>
            <div className={styles.cardsGrid}>
              {contactDetails.map((detail, index) => (
                <motion.a
                  key={index}
                  href={detail.link}
                  className={styles.contactCard}
                  variants={cardVariants}
                  whileHover="hover"
                  custom={index}
                  style={{ textDecoration: detail.link ? 'none' : 'none', cursor: detail.link ? 'pointer' : 'default' }}
                >
                  <motion.div 
                    className={styles.cardIcon}
                    variants={iconVariants}
                    whileHover="hover"
                    style={{ background: `${detail.color}15` }}
                  >
                    <detail.icon size={28} style={{ color: detail.color }} />
                  </motion.div>
                  <h3>{detail.title}</h3>
                  <p className={styles.cardInfo}>{detail.info}</p>
                  <p className={styles.cardDetail}>{detail.detail}</p>
                  {detail.link && (
                    <motion.span 
                      className={styles.cardArrow}
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      →
                    </motion.span>
                  )}
                </motion.a>
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* Branch Locations Section */}
        <motion.section
          className={styles.branchSection}
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <div className={styles.container}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionBadge}>✦ Our Locations</span>
              <h2 className={styles.sectionTitle}>
                Visit Our <span className={styles.gradientText}>Branches</span>
              </h2>
              <p className={styles.sectionSubtitle}>
                We have branches in multiple cities to serve you better
              </p>
            </div>

            {/* Branch Selector */}
            <div className={styles.branchSelector}>
              {branches.map((branch, index) => (
                <button
                  key={branch.id}
                  className={`${styles.branchBtn} ${selectedBranch === index ? styles.active : ''}`}
                  onClick={() => setSelectedBranch(index)}
                >
                  <Building2 size={18} />
                  {branch.name} Branch
                </button>
              ))}
            </div>

            {/* Branch Details Card */}
            <motion.div
              key={selectedBranch}
              className={styles.branchDetailsCard}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className={styles.branchInfoGrid}>
                <div className={styles.branchInfo}>
                  <h3>{currentBranch.name} Branch</h3>
                  <div className={styles.branchInfoItem}>
                    <MapPin size={18} className={styles.branchInfoIcon} />
                    <div>
                      <strong>Address</strong>
                      <p>{currentBranch.address}</p>
                    </div>
                  </div>
                  <div className={styles.branchInfoItem}>
                    <Phone size={18} className={styles.branchInfoIcon} />
                    <div>
                      <strong>Phone</strong>
                      <a href={`tel:${currentBranch.phone}`}>{currentBranch.phone}</a>
                    </div>
                  </div>
                  <div className={styles.branchInfoItem}>
                    <Mail size={18} className={styles.branchInfoIcon} />
                    <div>
                      <strong>Email</strong>
                      <a href={`mailto:${currentBranch.email}`}>{currentBranch.email}</a>
                    </div>
                  </div>
                  <div className={styles.branchInfoItem}>
                    <Clock size={18} className={styles.branchInfoIcon} />
                    <div>
                      <strong>Business Hours</strong>
                      <p>{currentBranch.timings}</p>
                    </div>
                  </div>
                  <div className={styles.branchActions}>
                    <a href={`tel:${currentBranch.phone}`} className={styles.callBtn}>
                      <Phone size={16} />
                      Call Now
                    </a>
                    <a href={`mailto:${currentBranch.email}`} className={styles.emailBtn}>
                      <Mail size={16} />
                      Email Us
                    </a>
                  </div>
                </div>
                <div className={styles.branchMap}>
                  <iframe
                    title={`${currentBranch.name} Branch Location`}
                    src={currentBranch.mapEmbed}
                    width="100%"
                    height="100%"
                    style={{ border: 0, borderRadius: "12px" }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </div>
            </motion.div>

            {/* Navigation Buttons for Mobile */}
            <div className={styles.branchNavMobile}>
              <button onClick={prevBranch} className={styles.navBtn}>
                <ChevronLeft size={20} />
                Previous
              </button>
              <span className={styles.branchCounter}>
                {selectedBranch + 1} / {branches.length}
              </span>
              <button onClick={nextBranch} className={styles.navBtn}>
                Next
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </motion.section>

        {/* Map Section with Animation */}
        <motion.section
          className={styles.mapSection}
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <div className={styles.mapContainer}>
            <motion.div 
              className={styles.mapOverlay}
              whileHover={{ opacity: 0 }}
            >
              <div className={styles.mapOverlayContent}>
                <MapPin size={48} />
                <h3>Find All Branches</h3>
                <p>Nellore • Guntur • More coming soon</p>
              </div>
            </motion.div>
            <iframe
              title="Car24 All Locations Map"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d12345678!2d78.486671!3d17.385044!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a4c8cd8192d558d%3A0x717f1c6504776618!2sCar24%20Travels!5e0!3m2!1sen!2sin!4v1641234567890"
              width="100%"
              height="450"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              className={styles.mapIframe}
            />
          </div>
        </motion.section>

        {/* Social Media Section */}
        <motion.section
          className={styles.socialSection}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <div className={styles.socialContent}>
            <h2>Connect With Us</h2>
            <p>Follow us on social media for updates, offers, and more</p>
            <div className={styles.socialLinks}>
              {socialLinks.map((social, index) => (
                <motion.a
                  key={index}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.socialLink}
                  whileHover={{ y: -5, scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className={styles.socialIcon} style={{ background: `${social.color}15` }}>
                    <social.icon size={24} style={{ color: social.color }} />
                  </div>
                  <span>{social.name}</span>
                </motion.a>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Floating Chat Button */}
        <motion.a
          href="#"
          className={styles.chatButton}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 1, type: "spring" }}
        >
          <MessageCircle size={24} />
          <span className={styles.chatTooltip}>Chat with us</span>
        </motion.a>
      </motion.div>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <motion.button
          className={styles.scrollTopButton}
          onClick={scrollToTop}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <ArrowUp size={24} />
          <span className={styles.scrollTopTooltip}>Back to Top</span>
        </motion.button>
      )}
    </>
  );
};

export default Contact;