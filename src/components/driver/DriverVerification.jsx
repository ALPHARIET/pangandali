import React, { useState, useRef } from 'react';
import {
  Upload, Check, ChevronLeft, ChevronRight, LogOut,
  User, FileText, Truck, Camera, Clock, Search,
  CheckCircle, XCircle, RefreshCw, ArrowRight
} from 'lucide-react';

const STEPS = [
  { id: 1, label: 'Data Pribadi', icon: User },
  { id: 2, label: 'Dokumen Identitas', icon: FileText },
  { id: 3, label: 'Dokumen Kendaraan', icon: Truck },
];

function DriverVerification({ user, onLogout, onStatusChange }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [submitted, setSubmitted] = useState(
    () => {
      const stored = localStorage.getItem(`pangandali_driver_docs_${user?.email}`);
      return stored ? JSON.parse(stored).submitted : false;
    }
  );

  const [verificationStatus, setVerificationStatus] = useState(
    () => {
      const stored = localStorage.getItem(`pangandali_driver_docs_${user?.email}`);
      return stored ? JSON.parse(stored).status : 'none';
    }
  );

  const [rejectionReason, setRejectionReason] = useState(
    () => {
      const stored = localStorage.getItem(`pangandali_driver_docs_${user?.email}`);
      return stored ? JSON.parse(stored).rejectionReason || '' : '';
    }
  );

  // Form data
  const [formData, setFormData] = useState({
    phone: '',
    address: '',
    bankAccount: '',
    bankAccountName: '',
    npwp: '',
  });

  // File uploads (stored as file names / data URLs for demo)
  const [uploads, setUploads] = useState({
    ktp: null,
    sim: null,
    selfieKtp: null,
    stnk: null,
    vehicleFront: null,
    vehicleBack: null,
    vehicleSide: null,
  });

  const fileInputRefs = {
    ktp: useRef(null),
    sim: useRef(null),
    selfieKtp: useRef(null),
    stnk: useRef(null),
    vehicleFront: useRef(null),
    vehicleBack: useRef(null),
    vehicleSide: useRef(null),
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileSelect = (field, e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setUploads((prev) => ({
          ...prev,
          [field]: { name: file.name, dataUrl: reader.result }
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const isStep1Valid = formData.phone && formData.address && formData.bankAccount && formData.bankAccountName;
  const isStep2Valid = uploads.ktp && uploads.sim && uploads.selfieKtp;
  const isStep3Valid = uploads.stnk && uploads.vehicleFront && uploads.vehicleBack && uploads.vehicleSide;

  const canProceed = () => {
    if (currentStep === 1) return isStep1Valid;
    if (currentStep === 2) return isStep2Valid;
    if (currentStep === 3) return isStep3Valid;
    return false;
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep((prev) => prev + 1);
    } else {
      // Submit
      const docData = {
        submitted: true,
        status: 'pending',
        formData,
        uploads: Object.fromEntries(
          Object.entries(uploads).map(([k, v]) => [k, v ? v.name : null])
        ),
        submittedAt: new Date().toISOString(),
        rejectionReason: '',
      };
      localStorage.setItem(`pangandali_driver_docs_${user?.email}`, JSON.stringify(docData));
      setSubmitted(true);
      setVerificationStatus('pending');
    }
  };

  const handleRefreshStatus = () => {
    const stored = localStorage.getItem(`pangandali_driver_docs_${user?.email}`);
    if (stored) {
      const data = JSON.parse(stored);
      setVerificationStatus(data.status);
      setRejectionReason(data.rejectionReason || '');
      if (data.status === 'approved') {
        // Update driver session
        const session = JSON.parse(localStorage.getItem('pangandali_driver_session') || '{}');
        session.verificationStatus = 'approved';
        session.isFirstLogin = false;
        localStorage.setItem('pangandali_driver_session', JSON.stringify(session));
        if (onStatusChange) onStatusChange('approved');
      }
    }
  };

  const UploadBox = ({ field, label, hint }) => {
    const hasFile = !!uploads[field];
    return (
      <div
        className={`driver-verify__upload-area ${hasFile ? 'has-file' : ''}`}
        onClick={() => fileInputRefs[field].current?.click()}
      >
        {hasFile && uploads[field].dataUrl && (
          <>
            <img
              src={uploads[field].dataUrl}
              alt={label}
              className="driver-verify__upload-preview"
            />
            <div className="driver-verify__upload-overlay">
              <span className="driver-verify__upload-overlay-text">
                <Camera size={16} /> Ganti Foto
              </span>
            </div>
            <div className="driver-verify__upload-check">
              <Check size={14} />
            </div>
          </>
        )}
        {!hasFile && (
          <>
            <div className="driver-verify__upload-icon">
              <Upload size={20} />
            </div>
            <div className="driver-verify__upload-label">{label}</div>
            <div className="driver-verify__upload-hint">{hint || 'JPG, PNG — Maks. 5MB'}</div>
          </>
        )}
        <input
          ref={fileInputRefs[field]}
          type="file"
          accept="image/*"
          className="driver-verify__upload-input"
          onChange={(e) => handleFileSelect(field, e)}
        />
      </div>
    );
  };

  const statusConfig = {
    pending: {
      icon: Clock,
      iconClass: 'pending',
      title: 'Menunggu Verifikasi',
      desc: 'Dokumen Anda berhasil dikirim dan sedang menunggu proses verifikasi oleh tim kami. Proses ini biasanya memakan waktu 1-2 hari kerja.',
      badgeText: '⏳ Menunggu Verifikasi',
    },
    reviewing: {
      icon: Search,
      iconClass: 'reviewing',
      title: 'Sedang Ditinjau',
      desc: 'Dokumen Anda sedang ditinjau oleh tim verifikasi. Kami akan segera memberikan hasilnya.',
      badgeText: '🔍 Sedang Ditinjau',
    },
    approved: {
      icon: CheckCircle,
      iconClass: 'approved',
      title: 'Dokumen Disetujui!',
      desc: 'Selamat! Akun Anda telah diverifikasi dan disetujui. Anda sekarang dapat mengakses layanan Backhaul.',
      badgeText: '✅ Disetujui',
    },
    rejected: {
      icon: XCircle,
      iconClass: 'rejected',
      title: 'Dokumen Ditolak',
      desc: 'Mohon maaf, dokumen Anda tidak dapat diverifikasi. Silakan perbaiki dan kirim ulang.',
      badgeText: '❌ Ditolak',
    },
  };

  const renderStatus = () => {
    const cfg = statusConfig[verificationStatus];
    if (!cfg) return null;
    const StatusIcon = cfg.icon;

    return (
      <div className="driver-verify__card">
        <div className="driver-verify__status">
          <div className={`driver-verify__status-icon ${cfg.iconClass}`}>
            <StatusIcon size={36} />
          </div>
          <h2 className="driver-verify__status-title">{cfg.title}</h2>
          <p className="driver-verify__status-desc">{cfg.desc}</p>
          <div className={`driver-verify__status-badge ${cfg.iconClass}`}>
            {cfg.badgeText}
          </div>

          {verificationStatus === 'rejected' && rejectionReason && (
            <div className="driver-verify__status-reason">
              <strong>Alasan:</strong> {rejectionReason}
            </div>
          )}

          {verificationStatus === 'approved' ? (
            <button
              className="driver-verify__status-btn"
              onClick={() => onStatusChange && onStatusChange('approved')}
            >
              Masuk ke Halaman Utama
              <ArrowRight size={16} />
            </button>
          ) : (
            <button className="driver-verify__status-btn" onClick={handleRefreshStatus} style={{ background: 'var(--bg-muted)', color: 'var(--text-primary)', boxShadow: 'none' }}>
              <RefreshCw size={16} />
              Cek Status Terbaru
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="driver-verify">
      {/* Nav */}
      <div className="driver-verify__nav">
        <div className="driver-verify__nav-brand">
          <div className="logo-icon">PD</div>
          <span>PanganDali</span>
        </div>
        <div className="driver-verify__nav-user">
          <div className="driver-verify__nav-avatar">
            {user?.name ? user.name.substring(0, 2).toUpperCase() : 'DR'}
          </div>
          <span className="driver-verify__nav-name">{user?.name || 'Driver'}</span>
          <button className="driver-verify__nav-logout" onClick={onLogout} title="Keluar">
            <LogOut size={18} />
          </button>
        </div>
      </div>

      <div className="driver-verify__container">
        <h1 className="driver-verify__title">
          {submitted ? 'Status Verifikasi' : 'Verifikasi Dokumen'}
        </h1>
        <p className="driver-verify__subtitle">
          {submitted
            ? 'Pantau status verifikasi dokumen Anda di bawah ini.'
            : 'Lengkapi data identitas dan dokumen kendaraan Anda sebelum menggunakan layanan Backhaul.'}
        </p>

        {/* Show status if submitted */}
        {submitted ? (
          renderStatus()
        ) : (
          <>
            {/* Progress Bar */}
            <div className="driver-verify__progress">
              {STEPS.map((step, idx) => (
                <React.Fragment key={step.id}>
                  <div
                    className={`driver-verify__progress-step ${
                      currentStep === step.id ? 'active' : ''
                    } ${currentStep > step.id ? 'completed' : ''}`}
                  >
                    <div className="driver-verify__progress-circle">
                      {currentStep > step.id ? <Check size={18} /> : step.id}
                    </div>
                    <span className="driver-verify__progress-label">{step.label}</span>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div
                      className={`driver-verify__progress-line ${
                        currentStep > step.id ? 'filled' : ''
                      }`}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Step Content */}
            <div className="driver-verify__card" key={currentStep}>
              {currentStep === 1 && (
                <>
                  <h3 className="driver-verify__card-title">
                    <User size={20} /> Data Pribadi
                  </h3>
                  <p className="driver-verify__card-desc">
                    Isi informasi pribadi Anda dengan data yang valid.
                  </p>
                  <div className="driver-verify__fields">
                    <div className="driver-verify__field">
                      <label className="driver-verify__field-label">Nomor Telepon Aktif</label>
                      <input
                        className="driver-verify__field-input"
                        type="tel"
                        placeholder="08xxxxxxxxxx"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                      />
                    </div>
                    <div className="driver-verify__field">
                      <label className="driver-verify__field-label">
                        NPWP <span className="optional">(opsional)</span>
                      </label>
                      <input
                        className="driver-verify__field-input"
                        type="text"
                        placeholder="XX.XXX.XXX.X-XXX.XXX"
                        value={formData.npwp}
                        onChange={(e) => handleInputChange('npwp', e.target.value)}
                      />
                    </div>
                    <div className="driver-verify__field full-width">
                      <label className="driver-verify__field-label">Alamat Domisili</label>
                      <input
                        className="driver-verify__field-input"
                        type="text"
                        placeholder="Jl. Contoh No. 123, Kota, Provinsi"
                        value={formData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                      />
                    </div>
                    <div className="driver-verify__field">
                      <label className="driver-verify__field-label">Nomor Rekening Bank</label>
                      <input
                        className="driver-verify__field-input"
                        type="text"
                        placeholder="Nomor rekening"
                        value={formData.bankAccount}
                        onChange={(e) => handleInputChange('bankAccount', e.target.value)}
                      />
                    </div>
                    <div className="driver-verify__field">
                      <label className="driver-verify__field-label">Nama Pemilik Rekening</label>
                      <input
                        className="driver-verify__field-input"
                        type="text"
                        placeholder="Nama sesuai buku tabungan"
                        value={formData.bankAccountName}
                        onChange={(e) => handleInputChange('bankAccountName', e.target.value)}
                      />
                    </div>
                  </div>
                </>
              )}

              {currentStep === 2 && (
                <>
                  <h3 className="driver-verify__card-title">
                    <FileText size={20} /> Dokumen Identitas
                  </h3>
                  <p className="driver-verify__card-desc">
                    Unggah foto dokumen identitas Anda yang masih berlaku.
                  </p>
                  <div className="driver-verify__upload-grid">
                    <UploadBox field="ktp" label="Foto KTP" hint="Foto jelas, tidak buram" />
                    <UploadBox field="sim" label="Foto SIM" hint="Sesuai jenis kendaraan" />
                    <UploadBox
                      field="selfieKtp"
                      label="Selfie bersama KTP"
                      hint="Wajah & KTP terlihat jelas"
                    />
                  </div>
                </>
              )}

              {currentStep === 3 && (
                <>
                  <h3 className="driver-verify__card-title">
                    <Truck size={20} /> Dokumen Kendaraan
                  </h3>
                  <p className="driver-verify__card-desc">
                    Unggah foto STNK dan kendaraan Anda dari berbagai sudut.
                  </p>
                  <div className="driver-verify__upload-grid">
                    <UploadBox field="stnk" label="Foto STNK" hint="STNK kendaraan yang digunakan" />
                    <UploadBox field="vehicleFront" label="Kendaraan (Depan)" hint="Tampak depan" />
                    <UploadBox field="vehicleBack" label="Kendaraan (Belakang)" hint="Tampak belakang" />
                    <UploadBox field="vehicleSide" label="Kendaraan (Samping)" hint="Tampak samping" />
                  </div>
                </>
              )}

              {/* Navigation */}
              <div className="driver-verify__actions">
                {currentStep > 1 && (
                  <button
                    className="driver-verify__btn-back"
                    onClick={() => setCurrentStep((prev) => prev - 1)}
                  >
                    <ChevronLeft size={18} /> Kembali
                  </button>
                )}
                <button
                  className="driver-verify__btn-next"
                  onClick={handleNext}
                  disabled={!canProceed()}
                >
                  {currentStep === 3 ? 'Kirim Dokumen' : 'Lanjutkan'}
                  {currentStep === 3 ? <Check size={18} /> : <ChevronRight size={18} />}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default DriverVerification;
