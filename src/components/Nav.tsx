'use client';

import { useEffect, useState } from 'react';

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  // Scroll-reveal observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('visible');
            observer.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const close = () => setMenuOpen(false);

  return (
    <>
      <nav id="nav" className={scrolled ? 'scrolled' : ''}>
        <a href="#" className="logo">
          Beautywell<em>.</em>
        </a>
        <ul className="nav-links">
          <li><a href="#about">About</a></li>
          <li><a href="#booking">Services</a></li>
          <li><a href="#availability">Availability</a></li>
          <li><a href="#contact">Contact</a></li>
        </ul>
        <a href="#booking" className="nav-cta">Book Now</a>
        <button
          className="mobile-toggle"
          aria-label="Menu"
          onClick={() => setMenuOpen((o) => !o)}
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </nav>

      <div
        className={`mobile-overlay${menuOpen ? ' open' : ''}`}
        onClick={close}
      />
      <aside className={`mobile-menu${menuOpen ? ' open' : ''}`}>
        <a href="#about" onClick={close}>About</a>
        <a href="#booking" onClick={close}>Services</a>
        <a href="#availability" onClick={close}>Availability</a>
        <a href="#contact" onClick={close}>Contact</a>
        <a href="#booking" className="mobile-cta" onClick={close}>Book Now</a>
      </aside>
    </>
  );
}
