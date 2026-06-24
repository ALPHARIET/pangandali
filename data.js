// ========================================
// PanganDali - Mock Data
// ========================================

const KOMODITAS = [
  { id: 'K001', nama: 'Cabai Merah', icon: '🌶️', satuan: 'kg', hargaRataRata: 45000 },
  { id: 'K002', nama: 'Kubis', icon: '🥬', satuan: 'kg', hargaRataRata: 12000 },
  { id: 'K003', nama: 'Wortel', icon: '🥕', satuan: 'kg', hargaRataRata: 18000 },
  { id: 'K004', nama: 'Bawang Merah', icon: '🧅', satuan: 'kg', hargaRataRata: 38000 },
  { id: 'K005', nama: 'Kembang Kol', icon: '🥦', satuan: 'kg', hargaRataRata: 15000 },
];

const LOKASI = [
  { id: 'L001', nama: 'Selupu Rejang', lat: -3.45, lng: 102.62, tipe: 'kecamatan' },
  { id: 'L002', nama: 'Curup Utara', lat: -3.46, lng: 102.60, tipe: 'kecamatan' },
  { id: 'L003', nama: 'Curup Selatan', lat: -3.50, lng: 102.61, tipe: 'kecamatan' },
  { id: 'L004', nama: 'Bermani Ulu', lat: -3.42, lng: 102.55, tipe: 'kecamatan' },
  { id: 'L005', nama: 'Kota Bengkulu', lat: -3.80, lng: 102.26, tipe: 'kota' },
  { id: 'L006', nama: 'Lubuklinggau', lat: -3.30, lng: 102.86, tipe: 'kota' },
  { id: 'L007', nama: 'Palembang', lat: -2.99, lng: 104.76, tipe: 'kota' },
];

const PETANI = [
  { id: 'P001', nama: 'Pak Andi', lokasi: 'Selupu Rejang', lokasiId: 'L001', telepon: '0812-xxxx-1234', komoditas: ['Cabai Merah', 'Wortel'], avatar: '👨‍🌾' },
  { id: 'P002', nama: 'Ibu Sari', lokasi: 'Curup Utara', lokasiId: 'L002', telepon: '0813-xxxx-5678', komoditas: ['Kubis', 'Kembang Kol'], avatar: '👩‍🌾' },
  { id: 'P003', nama: 'Pak Rudi', lokasi: 'Bermani Ulu', lokasiId: 'L004', telepon: '0815-xxxx-9012', komoditas: ['Bawang Merah', 'Cabai Merah'], avatar: '👨‍🌾' },
];

const PEMBELI = [
  { id: 'B001', nama: 'CV Segar Jaya', lokasi: 'Kota Bengkulu', tipe: 'Distributor' },
  { id: 'B002', nama: 'UD Pasar Makmur', lokasi: 'Lubuklinggau', tipe: 'Pedagang Besar' },
  { id: 'B003', nama: 'PT Hortikultura Sumatra', lokasi: 'Palembang', tipe: 'Eksportir Regional' },
];

const MITRA_LOGISTIK = [
  { id: 'ML001', nama: 'Budi Trans', pemilik: 'Budi Santoso', telepon: '0812-xxxx-4321' },
  { id: 'ML002', nama: 'Rejang Logistics', pemilik: 'Ahmad Fauzi', telepon: '0813-xxxx-8765' },
  { id: 'ML003', nama: 'Sumatra Fresh Cargo', pemilik: 'Hendra Wijaya', telepon: '0815-xxxx-2109' },
  { id: 'ML004', nama: 'Dedi Pickup', pemilik: 'Dedi Kurniawan', telepon: '0811-xxxx-6543' },
  { id: 'ML005', nama: 'Koperasi Angkut Tani', pemilik: 'Yusuf Rahman', telepon: '0822-xxxx-0987' },
];

const ARMADA = [
  { id: 'A001', mitraId: 'ML001', pengemudi: 'Budi Santoso', jenis: 'Pickup L300', plat: 'BD 1234 AB', kapasitasMaks: 1000, kapasitasKosong: 600, status: 'Tersedia', rute: 'Curup → Bengkulu', lokasiTerakhir: 'Curup Utara', lat: -3.46, lng: 102.60, jadwal: '2026-06-22 06:00' },
  { id: 'A002', mitraId: 'ML002', pengemudi: 'Rizal Fahmi', jenis: 'Truk Engkel', plat: 'BD 5678 CD', kapasitasMaks: 3000, kapasitasKosong: 1500, status: 'Kapasitas Kosong Sebagian', rute: 'Curup → Lubuklinggau', lokasiTerakhir: 'Selupu Rejang', lat: -3.45, lng: 102.62, jadwal: '2026-06-22 07:30' },
  { id: 'A003', mitraId: 'ML003', pengemudi: 'Hendra Wijaya', jenis: 'Truk Cold Box', plat: 'BD 9012 EF', kapasitasMaks: 2000, kapasitasKosong: 2000, status: 'Tersedia', rute: 'Curup → Palembang', lokasiTerakhir: 'Bermani Ulu', lat: -3.42, lng: 102.55, jadwal: '2026-06-22 05:00' },
  { id: 'A004', mitraId: 'ML004', pengemudi: 'Dedi Kurniawan', jenis: 'Pickup L300', plat: 'BD 3456 GH', kapasitasMaks: 1000, kapasitasKosong: 0, status: 'Penuh', rute: 'Curup → Bengkulu', lokasiTerakhir: 'Curup Selatan', lat: -3.50, lng: 102.61, jadwal: '2026-06-21 14:00' },
  { id: 'A005', mitraId: 'ML005', pengemudi: 'Yusuf Rahman', jenis: 'Truk Fuso', plat: 'BD 7890 IJ', kapasitasMaks: 8000, kapasitasKosong: 5000, status: 'Kapasitas Kosong Sebagian', rute: 'Curup → Palembang', lokasiTerakhir: 'Selupu Rejang', lat: -3.45, lng: 102.63, jadwal: '2026-06-22 04:00' },
];

const LAPORAN_PANEN = [
  { id: 'LP001', petaniId: 'P001', petani: 'Pak Andi', komoditas: 'Cabai Merah', jumlah: 300, satuan: 'kg', lokasi: 'Selupu Rejang', tanggal: '2026-06-20', harga: 45000, status: 'Tervalidasi', sumber: 'WhatsApp NLP' },
  { id: 'LP002', petaniId: 'P002', petani: 'Ibu Sari', komoditas: 'Kubis', jumlah: 500, satuan: 'kg', lokasi: 'Curup Utara', tanggal: '2026-06-20', harga: 12000, status: 'Tervalidasi', sumber: 'WhatsApp NLP' },
  { id: 'LP003', petaniId: 'P003', petani: 'Pak Rudi', komoditas: 'Bawang Merah', jumlah: 200, satuan: 'kg', lokasi: 'Bermani Ulu', tanggal: '2026-06-21', harga: 38000, status: 'Menunggu Validasi', sumber: 'Manual' },
  { id: 'LP004', petaniId: 'P001', petani: 'Pak Andi', komoditas: 'Wortel', jumlah: 400, satuan: 'kg', lokasi: 'Selupu Rejang', tanggal: '2026-06-21', harga: 18000, status: 'Tervalidasi', sumber: 'WhatsApp NLP' },
  { id: 'LP005', petaniId: 'P002', petani: 'Ibu Sari', komoditas: 'Kembang Kol', jumlah: 350, satuan: 'kg', lokasi: 'Curup Utara', tanggal: '2026-06-19', harga: 15000, status: 'Tervalidasi', sumber: 'Manual' },
];

const PURCHASE_ORDERS = [
  { id: 'PO001', pembeli: 'CV Segar Jaya', komoditas: 'Cabai Merah', jumlah: 200, petani: 'Pak Andi', lokasiAsal: 'Selupu Rejang', tujuan: 'Kota Bengkulu', harga: 45000, total: 9000000, status: 'Distribusi Aktif', tanggal: '2026-06-20' },
  { id: 'PO002', pembeli: 'UD Pasar Makmur', komoditas: 'Kubis', jumlah: 300, petani: 'Ibu Sari', lokasiAsal: 'Curup Utara', tujuan: 'Lubuklinggau', harga: 12000, total: 3600000, status: 'Menunggu Pembayaran', tanggal: '2026-06-21' },
  { id: 'PO003', pembeli: 'PT Hortikultura Sumatra', komoditas: 'Wortel', jumlah: 400, petani: 'Pak Andi', lokasiAsal: 'Selupu Rejang', tujuan: 'Palembang', harga: 18000, total: 7200000, status: 'Menunggu Persetujuan', tanggal: '2026-06-21' },
  { id: 'PO004', pembeli: 'CV Segar Jaya', komoditas: 'Bawang Merah', jumlah: 150, petani: 'Pak Rudi', lokasiAsal: 'Bermani Ulu', tujuan: 'Kota Bengkulu', harga: 38000, total: 5700000, status: 'Selesai', tanggal: '2026-06-18' },
];

const TUGAS_PENGIRIMAN = [
  { id: 'TP001', komoditas: 'Cabai Merah', jumlah: 200, titikAmbil: 'Selupu Rejang', tujuan: 'Kota Bengkulu', jarak: '85 km', kapasitas: '200 kg', armada: 'Budi Trans - Pickup L300', status: 'Sedang Dikirim', pengemudi: 'Budi Santoso' },
  { id: 'TP002', komoditas: 'Kubis', jumlah: 300, titikAmbil: 'Curup Utara', tujuan: 'Lubuklinggau', jarak: '120 km', kapasitas: '300 kg', armada: 'Rejang Logistics - Truk Engkel', status: 'Menunggu Pickup', pengemudi: 'Rizal Fahmi' },
  { id: 'TP003', komoditas: 'Wortel', jumlah: 400, titikAmbil: 'Selupu Rejang', tujuan: 'Palembang', jarak: '450 km', kapasitas: '400 kg', armada: 'Belum Ditentukan', status: 'Mencari Armada', pengemudi: '-' },
];

const HARGA_HISTORIS = {
  labels: ['15 Jun', '16 Jun', '17 Jun', '18 Jun', '19 Jun', '20 Jun', '21 Jun'],
  cabaiMerah: [42000, 43000, 44000, 44500, 45000, 46000, 48000],
  kubis: [11000, 11500, 12000, 12000, 12500, 12000, 12000],
  wortel: [17000, 17500, 18000, 18000, 18500, 18000, 18000],
  bawangMerah: [35000, 36000, 37000, 37500, 38000, 39000, 40000],
  kembangKol: [14000, 14500, 15000, 15000, 15500, 15000, 15000],
};

const PASOKAN_VS_PERMINTAAN = [
  { komoditas: 'Cabai Merah', pasokan: 800, permintaan: 1200 },
  { komoditas: 'Kubis', pasokan: 1500, permintaan: 1000 },
  { komoditas: 'Wortel', pasokan: 900, permintaan: 850 },
  { komoditas: 'Bawang Merah', pasokan: 500, permintaan: 750 },
  { komoditas: 'Kembang Kol', pasokan: 700, permintaan: 600 },
];

const EWS_ALERTS = [
  { id: 'EWS001', level: 'Kritis', komoditas: 'Cabai Merah', pesan: 'Risiko kenaikan harga cabai merah. Pasokan turun 33% dari permintaan.', waktu: '2 jam lalu', rekomendasi: 'Prioritaskan distribusi cabai dari Selupu Rejang dan Bermani Ulu.' },
  { id: 'EWS002', level: 'Waspada', komoditas: 'Bawang Merah', pesan: 'Pasokan bawang merah menurun. Defisit 250 kg dari permintaan mingguan.', waktu: '5 jam lalu', rekomendasi: 'Koordinasi dengan petani Bermani Ulu untuk percepatan panen.' },
  { id: 'EWS003', level: 'Waspada', komoditas: 'Cabai Merah', pesan: 'Distribusi tertunda di jalur Curup-Bengkulu akibat keterbatasan armada.', waktu: '8 jam lalu', rekomendasi: 'Aktifkan armada kosong terdekat untuk pengiriman ke Kota Bengkulu.' },
  { id: 'EWS004', level: 'Aman', komoditas: 'Kubis', pesan: 'Surplus kubis 500 kg di Curup Utara. Harga stabil.', waktu: '1 hari lalu', rekomendasi: 'Arahkan surplus ke pasar Lubuklinggau dan Palembang.' },
  { id: 'EWS005', level: 'Aman', komoditas: 'Kembang Kol', pesan: 'Pasokan dan permintaan seimbang. Distribusi berjalan lancar.', waktu: '1 hari lalu', rekomendasi: 'Pantau kenaikan harga bawang dalam 48 jam.' },
];

const RISIKO_KOMODITAS = [
  { komoditas: 'Cabai Merah', pasokan: 800, permintaan: 1200, hargaRataRata: 48000, tren: 'naik', status: 'Kritis', perubahanHarga: '+6.7%' },
  { komoditas: 'Bawang Merah', pasokan: 500, permintaan: 750, hargaRataRata: 40000, tren: 'naik', status: 'Waspada', perubahanHarga: '+5.3%' },
  { komoditas: 'Wortel', pasokan: 900, permintaan: 850, hargaRataRata: 18000, tren: 'stabil', status: 'Aman', perubahanHarga: '+0.0%' },
  { komoditas: 'Kubis', pasokan: 1500, permintaan: 1000, hargaRataRata: 12000, tren: 'turun', status: 'Aman', perubahanHarga: '-4.0%' },
  { komoditas: 'Kembang Kol', pasokan: 700, permintaan: 600, hargaRataRata: 15000, tren: 'stabil', status: 'Aman', perubahanHarga: '-3.2%' },
];

const BACKHAUL_KANDIDAT = [
  { armadaId: 'A003', pengemudi: 'Hendra Wijaya', mitra: 'Sumatra Fresh Cargo', jenis: 'Truk Cold Box', kapasitasKosong: 2000, lokasiTerakhir: 'Bermani Ulu', rute: 'Curup → Palembang', jarak: '12 km dari pickup', skor: 92, alasan: ['Kapasitas mencukupi', 'Lokasi terdekat', 'Rute searah', 'Jadwal sesuai'] },
  { armadaId: 'A005', pengemudi: 'Yusuf Rahman', mitra: 'Koperasi Angkut Tani', jenis: 'Truk Fuso', kapasitasKosong: 5000, lokasiTerakhir: 'Selupu Rejang', rute: 'Curup → Palembang', jarak: '3 km dari pickup', skor: 87, alasan: ['Kapasitas lebih dari cukup', 'Rute searah', 'Jadwal sesuai'] },
  { armadaId: 'A002', pengemudi: 'Rizal Fahmi', mitra: 'Rejang Logistics', jenis: 'Truk Engkel', kapasitasKosong: 1500, lokasiTerakhir: 'Selupu Rejang', rute: 'Curup → Lubuklinggau', jarak: '3 km dari pickup', skor: 67, alasan: ['Kapasitas mencukupi', 'Lokasi dekat'] },
  { armadaId: 'A001', pengemudi: 'Budi Santoso', mitra: 'Budi Trans', jenis: 'Pickup L300', kapasitasKosong: 600, lokasiTerakhir: 'Curup Utara', rute: 'Curup → Bengkulu', jarak: '18 km dari pickup', skor: 41, alasan: ['Kapasitas kurang'] },
];

const WHATSAPP_CONVERSATIONS = [
  {
    id: 'WA001',
    messages: [
      { from: 'petani', text: 'Saya panen cabai 300 kg hari ini di Selupu Rejang', time: '08:30' },
      { from: 'system', text: '✅ Data panen berhasil diekstraksi!', time: '08:30' },
      { from: 'system', text: '📋 Hasil Parsing:\n• Komoditas: Cabai Merah\n• Jumlah: 300 kg\n• Lokasi: Selupu Rejang\n• Waktu: Hari ini\n• Status: Menunggu validasi', time: '08:30', parsed: true },
      { from: 'system', text: 'Terima kasih Pak Andi! Data panen Anda telah diterima dan akan divalidasi oleh admin.', time: '08:31' },
    ]
  },
  {
    id: 'WA002',
    messages: [
      { from: 'petani', text: 'Pak, hari ini saya panen kubis 500 kg di Curup Utara, siap dikirim besok pagi.', time: '09:15' },
      { from: 'system', text: '✅ Data panen berhasil diekstraksi!', time: '09:15' },
      { from: 'system', text: '📋 Hasil Parsing:\n• Komoditas: Kubis\n• Jumlah: 500 kg\n• Lokasi: Curup Utara\n• Jadwal tersedia: Besok pagi\n• Status: Menunggu validasi', time: '09:15', parsed: true },
      { from: 'system', text: 'Terima kasih Ibu Sari! Kami akan segera mencarikan pembeli dan armada untuk komoditas Anda.', time: '09:16' },
    ]
  },
  {
    id: 'WA003',
    messages: [
      { from: 'petani', text: '🎤 Voice Note (00:12)', time: '10:00', isVoice: true },
      { from: 'system', text: '🔊 Voice note diterima\n📝 Transkripsi berhasil', time: '10:00' },
      { from: 'system', text: '✅ Data panen berhasil diekstraksi dari voice note!', time: '10:00' },
      { from: 'system', text: '📋 Hasil Parsing:\n• Komoditas: Bawang Merah\n• Jumlah: 200 kg\n• Lokasi: Bermani Ulu\n• Waktu: Hari ini\n• Status: Menunggu validasi', time: '10:01', parsed: true },
    ]
  },
];

const ADMIN_USERS = [
  { id: 'U001', nama: 'Pak Andi', role: 'Petani', email: 'andi@mail.com', status: 'Aktif', bergabung: '2026-01-15' },
  { id: 'U002', nama: 'Ibu Sari', role: 'Petani', email: 'sari@mail.com', status: 'Aktif', bergabung: '2026-02-20' },
  { id: 'U003', nama: 'Pak Rudi', role: 'Petani', email: 'rudi@mail.com', status: 'Aktif', bergabung: '2026-03-10' },
  { id: 'U004', nama: 'CV Segar Jaya', role: 'Pembeli', email: 'segarjaya@mail.com', status: 'Aktif', bergabung: '2026-01-20' },
  { id: 'U005', nama: 'Budi Trans', role: 'Mitra Logistik', email: 'buditrans@mail.com', status: 'Aktif', bergabung: '2026-02-01' },
  { id: 'U006', nama: 'TPID Rejang Lebong', role: 'TPID', email: 'tpid@rl.go.id', status: 'Aktif', bergabung: '2026-01-01' },
  { id: 'U007', nama: 'Dedi Pickup', role: 'Mitra Logistik', email: 'dedi@mail.com', status: 'Tidak Aktif', bergabung: '2026-04-15' },
];

const REKOMENDASI_INTERVENSI = [
  { id: 'R001', prioritas: 'Tinggi', tipe: 'Distribusi', pesan: 'Prioritaskan distribusi cabai dari Selupu Rejang ke Kota Bengkulu', ikon: '🚛' },
  { id: 'R002', prioritas: 'Tinggi', tipe: 'Armada', pesan: 'Aktifkan armada kosong terdekat untuk pengiriman ke Kota Bengkulu', ikon: '🚚' },
  { id: 'R003', prioritas: 'Sedang', tipe: 'Koordinasi', pesan: 'Koordinasi dengan petani Bermani Ulu untuk percepatan panen bawang merah', ikon: '🤝' },
  { id: 'R004', prioritas: 'Sedang', tipe: 'Monitoring', pesan: 'Pantau kenaikan harga bawang merah dalam 48 jam', ikon: '📊' },
];
