// Komponen bersama untuk halaman Supir dan Distributor.
import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, LogOut } from 'lucide-react';
import './Portal.css';

// Tandai bagian yang sedang terlihat supaya pengguna tahu posisinya di halaman.
function useActiveSection(links) {
  const [active, setActive] = useState(links[0]?.[0]);
  useEffect(() => {
    let tunda = 0;
    const hitung = () => {
      tunda = 0;
      // Bagian aktif = bagian terakhir yang tepi atasnya sudah melewati 40% tinggi layar.
      // Sebelum bagian pertama (area hero), bagian pertama dianggap aktif.
      const batas = window.innerHeight * 0.4;
      let pilih = links[0]?.[0];
      for (const [href] of links) {
        const el = document.querySelector(href);
        if (el && el.getBoundingClientRect().top <= batas) pilih = href;
      }
      setActive(pilih);
    };
    // Throttle ~10x/detik; cukup untuk penanda tab dan tidak bergantung pada frame render.
    const onScroll = () => {
      if (!tunda) tunda = setTimeout(hitung, 100);
    };
    hitung();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      clearTimeout(tunda);
    };
  }, [links]);
  return active;
}

export function PortalBar({ role, user, links, onLogout }) {
  const active = useActiveSection(links);
  const tabsRef = useRef(null);
  useEffect(() => {
    // Geser chip aktif ke area terlihat tanpa ikut menggulir halaman
    const box = tabsRef.current;
    const chip = box?.querySelector('a.active');
    if (box && chip) box.scrollTo({ left: chip.offsetLeft - 16, behavior: 'smooth' });
  }, [active]);
  const nama = user?.name || role;
  const inisial = nama
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return (
    <header className="portal-bar">
      <div className="portal-wrap">
        <div className="portal-bar__row">
          <div className="portal-brand">
            <img src="/logo.png" alt="" className="portal-brand__icon" />
            <span>PanganDali</span>
            <span className="portal-brand__role">{role}</span>
          </div>
          <nav className="portal-links" aria-label="Bagian halaman">
            {links.map(([href, label]) => (
              <a key={href} href={href} className={active === href ? 'active' : ''} aria-current={active === href ? 'location' : undefined}>
                {label}
              </a>
            ))}
          </nav>
          <div className="portal-user">
            <span className="portal-user__name">{nama}</span>
            <div className="portal-avatar" aria-hidden="true">{inisial}</div>
            <button className="portal-logout" onClick={onLogout} aria-label="Keluar">
              <LogOut size={18} />
              <span>Keluar</span>
            </button>
          </div>
        </div>
        <nav className="portal-tabs" aria-label="Bagian halaman" ref={tabsRef}>
          {links.map(([href, label]) => (
            <a key={href} href={href} className={active === href ? 'active' : ''} aria-current={active === href ? 'location' : undefined}>
              {label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}

export function PortalHero({ chip, title, lead, actions, art, facts }) {
  return (
    <section className="portal-hero">
      <div className="portal-wrap">
        <div className="portal-hero__grid">
          <div>
            <span className="portal-chip">{chip}</span>
            <h1 className="portal-hero__title">{title}</h1>
            <p className="portal-hero__lead">{lead}</p>
            <div className="portal-hero__actions">{actions}</div>
          </div>
          <div className="portal-hero__art" aria-hidden="true">{art}</div>
        </div>
        <div className="portal-facts">
          {facts.map((f) => (
            <div className="portal-fact" key={f.label}>
              <div className="portal-fact__icon">{f.icon}</div>
              <div style={{ minWidth: 0 }}>
                <div className="portal-fact__label">{f.label}</div>
                <div className="portal-fact__value">{f.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function SectionHead({ icon, eyebrow, title, desc }) {
  return (
    <div className="portal-head">
      <span className="portal-eyebrow">{icon}{eyebrow}</span>
      <h2>{title}</h2>
      {desc && <p>{desc}</p>}
    </div>
  );
}

export function BenefitGrid({ items }) {
  return (
    <div className="portal-benefits">
      {items.map((b) => (
        <div className="portal-benefit" key={b.title}>
          <div className="portal-benefit__icon" style={{ background: b.color, color: b.iconColor }}>{b.icon}</div>
          <div>
            <h3>{b.title}</h3>
            <p>{b.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function StepList({ steps }) {
  return (
    <ol className="portal-steps">
      {steps.map((s) => (
        <li className="portal-step" key={s.num}>
          <div className="portal-step__num">{s.num}</div>
          <div>
            <h3>{s.title}</h3>
            <p>{s.desc}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function FaqList({ items }) {
  const [open, setOpen] = useState(null);
  return (
    <div className="portal-faq">
      {items.map((item, idx) => {
        const isOpen = open === idx;
        return (
          <div className={`portal-faq__item ${isOpen ? 'open' : ''}`} key={item.q}>
            <button
              className="portal-faq__q"
              onClick={() => setOpen(isOpen ? null : idx)}
              aria-expanded={isOpen}
              aria-controls={`faq-${idx}`}
            >
              <span>{item.q}</span>
              <ChevronDown size={18} />
            </button>
            {isOpen && (
              <div className="portal-faq__a" id={`faq-${idx}`}>{item.a}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function PortalFooter({ title, desc }) {
  return (
    <footer className="portal-footer">
      <div className="portal-wrap portal-footer__row">
        <div>
          <strong>{title}</strong>
          <div style={{ marginTop: 4 }}>{desc}</div>
        </div>
        <div>© {new Date().getFullYear()} PanganDali · Purwarupa untuk stabilitas harga pangan</div>
      </div>
    </footer>
  );
}

// Aksi tulis selalu dikonfirmasi dulu (sama dengan aturan agent WhatsApp).
export function ConfirmButton({ label, confirm, onConfirm, variant = 'primary', disabled }) {
  const [tanya, setTanya] = useState(false);
  const [sibuk, setSibuk] = useState(false);
  if (!tanya) {
    return (
      <button type="button" className={`p-btn p-btn--${variant} p-btn--sm`} disabled={disabled} onClick={() => setTanya(true)}>
        {label}
      </button>
    );
  }
  return (
    <span className="p-confirm" role="group" aria-label={confirm}>
      <span className="p-confirm__q">{confirm}</span>
      <button
        type="button"
        className="p-btn p-btn--primary p-btn--sm"
        disabled={sibuk}
        onClick={async () => {
          setSibuk(true);
          try {
            await onConfirm();
          } finally {
            setSibuk(false);
            setTanya(false);
          }
        }}
      >
        Ya
      </button>
      <button type="button" className="p-btn p-btn--ghost p-btn--sm" onClick={() => setTanya(false)} disabled={sibuk}>Batal</button>
    </span>
  );
}
