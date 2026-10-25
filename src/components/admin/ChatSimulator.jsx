import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Send, RotateCcw, Wrench, Smartphone, X, Plus } from 'lucide-react';
import { api } from '../../api';
import './AdminTools.css';

const ROLE_LABEL = { petani: 'Petani', driver: 'Mitra Logistik', distributor: 'Distributor' };
const POLL_MS = 2500;

function formatTime(iso) {
  // Backend SQLite mengembalikan waktu tanpa zona; anggap UTC.
  const d = new Date(/[zZ]|[+-]\d\d:\d\d$/.test(iso) ? iso : `${iso}Z`);
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function PhonePane({ contact, showTools, onClose }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const lastId = useRef(0);
  const scroller = useRef(null);

  const merge = useCallback((incoming) => {
    if (!incoming.length) return;
    setMessages((prev) => {
      const seen = new Set(prev.map((m) => m.id));
      const next = [...prev, ...incoming.filter((m) => !seen.has(m.id))].sort((a, b) => a.id - b.id);
      lastId.current = next.length ? next[next.length - 1].id : 0;
      return next;
    });
  }, []);

  const poll = useCallback(async () => {
    try {
      merge(await api('/api/sim/messages', { params: { phone: contact.phone, after_id: lastId.current } }));
    } catch (e) {
      setError(e.message);
    }
  }, [contact.phone, merge]);

  useEffect(() => {
    setMessages([]);
    lastId.current = 0;
    poll();
    const t = setInterval(poll, POLL_MS);
    return () => clearInterval(t);
  }, [poll]);

  useEffect(() => {
    if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight;
  }, [messages, sending]);

  const send = async (e) => {
    e.preventDefault();
    const body = text.trim();
    if (!body || sending) return;
    setText('');
    setSending(true);
    setError('');
    // Tampilkan pesan keluar lebih dulu; id sementara negatif diganti saat polling.
    const temp = { id: -Date.now(), direction: 'in', text: body, created_at: new Date().toISOString(), pending: true };
    setMessages((prev) => [...prev, temp]);
    try {
      await api('/api/sim/chat', { method: 'POST', body: { phone: contact.phone, text: body } });
      setMessages((prev) => prev.filter((m) => m.id !== temp.id));
      await poll();
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== temp.id));
      setText(body);
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const reset = async () => {
    if (!window.confirm(`Hapus riwayat chat ${contact.phone}?`)) return;
    await api(`/api/sim/conversations/${contact.phone}`, { method: 'DELETE' });
    setMessages([]);
    lastId.current = 0;
  };

  return (
    <div className="sim-phone">
      <div className={`sim-phone-head role-${contact.role}`}>
        <div className="sim-avatar">{(contact.name || contact.phone).slice(0, 2).toUpperCase()}</div>
        <div className="sim-head-info">
          <div className="sim-head-name">{contact.name || `+${contact.phone}`}</div>
          <div className="sim-head-sub">
            {ROLE_LABEL[contact.role] || 'Nomor baru'} · +{contact.phone}
          </div>
        </div>
        <button type="button" className="sim-icon-btn" title="Hapus riwayat" onClick={reset}>
          <RotateCcw size={15} />
        </button>
        <button type="button" className="sim-icon-btn" title="Tutup" onClick={onClose}>
          <X size={15} />
        </button>
      </div>

      <div className="sim-messages" ref={scroller}>
        {messages.length === 0 && <div className="sim-empty">Belum ada pesan. Ketik sesuatu seperti pengguna WhatsApp.</div>}
        {messages.map((m) => (
          <div key={m.id} className={`sim-bubble ${m.direction === 'in' ? 'sim-out' : 'sim-in'} ${m.meta?.notifikasi ? 'sim-notif' : ''}`}>
            {m.meta?.notifikasi && <div className="sim-tag">Notifikasi sistem</div>}
            {m.meta?.fallback && <div className="sim-tag sim-tag-warn">Fallback (LLM gangguan)</div>}
            <div className="sim-text">{m.text}</div>
            {showTools && m.meta?.tools?.length > 0 && (
              <div className="sim-tools">
                {m.meta.tools.map((t, i) => (
                  <div key={i} className="sim-tool">
                    <Wrench size={11} /> <b>{t.tool}</b>({t.args})
                    <div className="sim-tool-result">{JSON.stringify(t.hasil)}</div>
                  </div>
                ))}
              </div>
            )}
            {showTools && m.meta?.alasan && <div className="sim-tool-result">{m.meta.alasan}</div>}
            <div className="sim-time">{m.pending ? 'mengirim...' : formatTime(m.created_at)}</div>
          </div>
        ))}
        {sending && <div className="sim-typing">Agent sedang mengetik...</div>}
      </div>

      {error && <div className="sim-error">{error}</div>}

      <form className="sim-input" onSubmit={send}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Ketik pesan" disabled={sending} />
        <button type="submit" disabled={sending || !text.trim()} aria-label="Kirim">
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}

function ChatSimulator() {
  const [contacts, setContacts] = useState([]);
  const [open, setOpen] = useState([]);
  const [showTools, setShowTools] = useState(true);
  const [newPhone, setNewPhone] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api('/api/sim/contacts')
      .then((list) => {
        setContacts(list);
        // Buka satu HP per peran sebagai awal, seperti tampilan 3 HP di sim-wa.
        const first = ['petani', 'driver', 'distributor'].map((r) => list.find((c) => c.role === r)).filter(Boolean);
        setOpen(first);
      })
      .catch((e) => setError(e.message));
  }, []);

  const openContact = (c) => {
    if (open.some((o) => o.phone === c.phone)) return;
    setOpen((prev) => [...prev.slice(-2), c]);
  };

  const openNew = (e) => {
    e.preventDefault();
    let digits = newPhone.replace(/\D/g, '');
    if (digits.startsWith('0')) digits = `62${digits.slice(1)}`;
    if (digits.length < 9) {
      setError('Nomor tidak valid.');
      return;
    }
    const known = contacts.find((c) => c.phone === digits);
    openContact(known || { phone: digits, role: 'baru', name: null });
    setNewPhone('');
    setError('');
  };

  return (
    <div className="tool-page">
      <div className="tool-page-head">
        <div>
          <h2 className="tool-page-title">Simulator Chat</h2>
          <p className="tool-page-desc">
            Uji agent tanpa biaya WhatsApp. Pesan diproses lewat jalur yang sama dengan webhook WA, memakai database yang
            sama, dan notifikasi lintas peran muncul di HP penerima.
          </p>
        </div>
        <label className="sim-toggle">
          <input type="checkbox" checked={showTools} onChange={(e) => setShowTools(e.target.checked)} /> Tampilkan tool call
        </label>
      </div>

      {error && <div className="tool-alert tool-alert-error">{error}</div>}

      <div className="sim-contacts">
        {contacts.map((c) => (
          <button
            key={c.phone}
            type="button"
            className={`tool-chip ${open.some((o) => o.phone === c.phone) ? 'active' : ''}`}
            onClick={() => openContact(c)}
            title={c.detail || ''}
          >
            <Smartphone size={13} /> {c.name || c.phone} <span className="text-muted">({ROLE_LABEL[c.role]})</span>
          </button>
        ))}
        <form className="sim-new" onSubmit={openNew}>
          <input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="Nomor petani baru, mis. 0857..." />
          <button type="submit" className="tool-chip">
            <Plus size={13} /> Buka
          </button>
        </form>
      </div>

      <div className="sim-grid">
        {open.map((c) => (
          <PhonePane key={c.phone} contact={c} showTools={showTools} onClose={() => setOpen((p) => p.filter((o) => o.phone !== c.phone))} />
        ))}
      </div>
    </div>
  );
}

export default ChatSimulator;
