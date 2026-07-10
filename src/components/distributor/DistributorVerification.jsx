import React, { useState, useRef } from 'react';
import {
  Upload, Check, ChevronLeft, ChevronRight, LogOut,
  Building, FileText, Home, Camera, Clock, Search,
  CheckCircle, XCircle, RefreshCw, ArrowRight
} from 'lucide-react';

const STEPS = [
  { id: 1, label: 'Data Perusahaan', icon: Building },
  { id: 2, label: 'Penanggung Jawab', icon: FileText },
  { id: 3, label: 'Fasilitas Gudang', icon: Home },
];

function DistributorVerification({ user, onLogout, onStatusChange }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [submitted, setSubmitted] = useState(
    () => {
      const stored = localStorage.getItem(`pangandali_distributor_docs_${user?.email}`);
      return stored ? JSON.parse(stored).submitted : false;
    }
  );

  const [verificationStatus, setVerificationStatus] = useState(
    () => {
      const stored = localStorage.getItem(`pangandali_distributor_docs_${user?.email}`);
      return stored ? JSON.parse(stored).status : 'none';
    }
  );

  const [rejectionReason, setRejectionReason] = useState(
    () => {
      const stored = localStorage.getItem(`pangandali_distributor_docs_${user?.email}`);
      return stored ? JSON.parse(stored).rejectionReason || '' : '';
    }
  );

  // Form data
  const [formData, setFormData] = useState({
    companyName: '',
    nib: '',
    address: '',
    picName: '',
    picPhone: '',
    warehouseCapacity: '',
  });

  // File uploads
  const [uploads, setUploads] = useState({
    nibDoc: null,
    picKtp: null,
    picSelfie: null,
    warehouseFront: null,
    warehouseInside: null,
  });

  const fileInputRefs = {
    nibDoc: useRef(null),
    picKtp: useRef(null),
    picSelfie: useRef(null),
    warehouseFront: useRef(null),
    warehouseInside: useRef(null),
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

  const isStep1Valid = formData.companyName && formData.nib && formData.address && uploads.nibDoc;
  const isStep2Valid = formData.picName && formData.picPhone && uploads.picKtp && uploads.picSelfie;
  const isStep3Valid = formData.warehouseCapacity && uploads.warehouseFront && uploads.warehouseInside;

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
        type: 'distributor',
        submitted: true,
        status: 'pending',
        formData,
        uploads: Object.fromEntries(
          Object.entries(uploads).map(([k, v]) => [k, v ? v.name : null])
        ),
        submittedAt: new Date().toISOString(),
        rejectionReason: '',
        userEmail: user?.email,
        userName: user?.name,
      };
      localStorage.setItem(`pangandali_distributor_docs_${user?.email}`, JSON.stringify(docData));
      
      // Add to global verifications list for admin
      const allVerifications = JSON.parse(localStorage.getItem('pangandali_verifications') || '[]');
      const newVerification = {
        id: `dist-${Date.now()}`,
        type: 'Distributor',
        email: user?.email,
        name: formData.companyName,
        date: new Date().toISOString(),
        status: 'pending'
      };
      // Check if already exists and update, or add new
      const existingIdx = allVerifications.findIndex(v => v.email === user?.email);
      if(existingIdx >= 0) {
          allVerifications[existingIdx] = newVerification;
      } else {
          allVerifications.push(newVerification);
      }
      localStorage.setItem('pangandali_verifications', JSON.stringify(allVerifications));

      setSubmitted(true);
      setVerificationStatus('pending');
    }
  };

  const handleRefreshStatus = () => {
    const stored = localStorage.getItem(`pangandali_distributor_docs_${user?.email}`);
    if (stored) {
      const data = JSON.parse(stored);
      setVerificationStatus(data.status);
      setRejectionReason(data.rejectionReason || '');
      if (data.status === 'approved') {
        const session = JSON.parse(localStorage.getItem('pangandali_distributor_session') || '{}');
        session.verificationStatus = 'approved';
        session.isFirstLogin = false;
        localStorage.setItem('pangandali_distributor_session', JSON.stringify(session));
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
            <div className="driver-verify__upload-hint">{hint || 'JPG, PNG, PDF — Maks. 5MB'}</div>
          </>
        )}
        <input
          ref={fileInputRefs[field]}
          type="file"
          accept="image/*,application/pdf"
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
      desc: 'Dokumen distributor Anda telah dikirim dan sedang menunggu proses verifikasi oleh tim TPID. Proses ini biasanya memakan waktu 1-2 hari kerja.',
      badgeText: '⏳ Menunggu Verifikasi',
    },
    reviewing: {
      icon: Search,
      iconClass: 'reviewing',
      title: 'Sedang Ditinjau',
      desc: 'Dokumen Anda sedang ditinjau oleh tim verifikasi.',
      badgeText: '🔍 Sedang Ditinjau',
    },
    approved: {
      icon: CheckCircle,
      iconClass: 'approved',
      title: 'Dokumen Disetujui!',
      desc: 'Selamat! Akun Anda telah diverifikasi. Anda sekarang dapat mengakses dashboard distributor.',
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
              Masuk ke Dashboard Distributor
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
      <div className="driver-verify__nav">
        <div className="driver-verify__nav-brand">
          <div className="logo-icon">PD</div>
          <span>PanganDali</span>
        </div>
        <div className="driver-verify__nav-user">
          <div className="driver-verify__nav-avatar">
            {user?.name ? user.name.substring(0, 2).toUpperCase() : 'DI'}
          </div>
          <span className="driver-verify__nav-name">{user?.name || 'Distributor'}</span>
          <button className="driver-verify__nav-logout" onClick={onLogout} title="Keluar">
            <LogOut size={18} />
          </button>
        </div>
      </div>

      <div className="driver-verify__container">
        <h1 className="driver-verify__title">
          {submitted ? 'Status Verifikasi' : 'Verifikasi Distributor'}
        </h1>
        <p className="driver-verify__subtitle">
          {submitted
            ? 'Pantau status pendaftaran akun distributor Anda.'
            : 'Lengkapi profil perusahaan Anda untuk bergabung sebagai mitra distributor PanganDali.'}
        </p>

        {submitted ? (
          renderStatus()
        ) : (
          <>
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

            <div className="driver-verify__card" key={currentStep}>
              {currentStep === 1 && (
                <>
                  <h3 className="driver-verify__card-title">
                    <Building size={20} /> Data Perusahaan
                  </h3>
                  <p className="driver-verify__card-desc">
                    Isi informasi legalitas perusahaan/usaha Anda.
                  </p>
                  <div className="driver-verify__fields">
                    <div className="driver-verify__field full-width">
                      <label className="driver-verify__field-label">Nama Perusahaan / Usaha</label>
                      <input
                        className="driver-verify__field-input"
                        type="text"
                        placeholder="PT/CV/UD Nama Usaha"
                        value={formData.companyName}
                        onChange={(e) => handleInputChange('companyName', e.target.value)}
                      />
                    </div>
                    <div className="driver-verify__field">
                      <label className="driver-verify__field-label">Nomor Induk Berusaha (NIB)</label>
                      <input
                        className="driver-verify__field-input"
                        type="text"
                        placeholder="Nomor NIB"
                        value={formData.nib}
                        onChange={(e) => handleInputChange('nib', e.target.value)}
                      />
                    </div>
                    <div className="driver-verify__field full-width">
                      <label className="driver-verify__field-label">Alamat Lengkap Perusahaan</label>
                      <input
                        className="driver-verify__field-input"
                        type="text"
                        placeholder="Jalan, Kota, Provinsi"
                        value={formData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                      />
                    </div>
                    <div className="driver-verify__field full-width">
                      <label className="driver-verify__field-label">Upload Dokumen NIB</label>
                      <div className="driver-verify__upload-grid" style={{ gridTemplateColumns: '1fr', maxWidth: '300px' }}>
                         <UploadBox field="nibDoc" label="Dokumen NIB" hint="Foto jelas NIB" />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {currentStep === 2 && (
                <>
                  <h3 className="driver-verify__card-title">
                    <FileText size={20} /> Penanggung Jawab
                  </h3>
                  <p className="driver-verify__card-desc">
                    Informasi kontak penanggung jawab (PIC) yang dapat dihubungi.
                  </p>
                  <div className="driver-verify__fields">
                    <div className="driver-verify__field">
                      <label className="driver-verify__field-label">Nama Penanggung Jawab</label>
                      <input
                        className="driver-verify__field-input"
                        type="text"
                        placeholder="Nama lengkap"
                        value={formData.picName}
                        onChange={(e) => handleInputChange('picName', e.target.value)}
                      />
                    </div>
                    <div className="driver-verify__field">
                      <label className="driver-verify__field-label">Nomor WhatsApp PIC</label>
                      <input
                        className="driver-verify__field-input"
                        type="tel"
                        placeholder="08xxxxxxxxxx"
                        value={formData.picPhone}
                        onChange={(e) => handleInputChange('picPhone', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="driver-verify__upload-grid" style={{ marginTop: '20px' }}>
                    <UploadBox field="picKtp" label="Foto KTP PIC" hint="KTP asli penanggung jawab" />
                    <UploadBox field="picSelfie" label="Selfie PIC + KTP" hint="Wajah & KTP terlihat jelas" />
                  </div>
                </>
              )}

              {currentStep === 3 && (
                <>
                  <h3 className="driver-verify__card-title">
                    <Home size={20} /> Fasilitas Gudang
                  </h3>
                  <p className="driver-verify__card-desc">
                    Data kapasitas penyimpanan dan foto fasilitas gudang/toko.
                  </p>
                  <div className="driver-verify__fields">
                     <div className="driver-verify__field full-width">
                      <label className="driver-verify__field-label">Estimasi Kapasitas Gudang (Ton)</label>
                      <input
                        className="driver-verify__field-input"
                        type="number"
                        placeholder="Contoh: 10"
                        value={formData.warehouseCapacity}
                        onChange={(e) => handleInputChange('warehouseCapacity', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="driver-verify__upload-grid" style={{ marginTop: '20px' }}>
                    <UploadBox field="warehouseFront" label="Foto Gudang (Depan)" hint="Tampak luar fasilitas" />
                    <UploadBox field="warehouseInside" label="Foto Gudang (Dalam)" hint="Kondisi dalam gudang" />
                  </div>
                </>
              )}

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
                  {currentStep === 3 ? 'Kirim Pengajuan' : 'Lanjutkan'}
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

export default DistributorVerification;
