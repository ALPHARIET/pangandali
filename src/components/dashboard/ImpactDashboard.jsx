import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Legend, LineChart, Line, ComposedChart
} from 'recharts';
import {
  Download, RefreshCw, TrendingUp, TrendingDown,
  ShieldAlert, DollarSign, Truck, Activity,
  Leaf, MapPin, PackageCheck, Zap, Users,
  Clock, Droplets, Sparkles, CheckCircle, Globe
} from 'lucide-react';
import './ImpactDashboard.css';

// --- MOCK DATA ---
const monthlyFoodLossData = [
  { name: 'Jan', loss: 85, prevented: 20 },
  { name: 'Feb', loss: 78, prevented: 35 },
  { name: 'Mar', loss: 90, prevented: 45 },
  { name: 'Apr', loss: 65, prevented: 50 },
  { name: 'May', loss: 60, prevented: 70 },
  { name: 'Jun', loss: 55, prevented: 85 },
  { name: 'Jul', loss: 48, prevented: 95 },
  { name: 'Aug', loss: 42, prevented: 110 },
  { name: 'Sep', loss: 38, prevented: 125 },
  { name: 'Oct', loss: 35, prevented: 140 },
  { name: 'Nov', loss: 30, prevented: 155 },
  { name: 'Dec', loss: 25, prevented: 170 },
];

const backhaulSavingsData = [
  { name: 'Q1', trips: 120, savings: 45 },
  { name: 'Q2', trips: 180, savings: 75 },
  { name: 'Q3', trips: 250, savings: 110 },
  { name: 'Q4', trips: 310, savings: 140 },
];

const logisticsEfficiencyData = [
  { name: 'Jan', eff: 45 }, { name: 'Feb', eff: 48 }, { name: 'Mar', eff: 52 },
  { name: 'Apr', eff: 58 }, { name: 'May', eff: 65 }, { name: 'Jun', eff: 72 },
  { name: 'Jul', eff: 78 }, { name: 'Aug', eff: 82 }, { name: 'Sep', eff: 85 },
  { name: 'Oct', eff: 88 }, { name: 'Nov', eff: 91 }, { name: 'Dec', eff: 94 },
];

const annualComparisonData = [
  { year: '2024', conventional: 320, pangandali: 150 },
  { year: '2025', conventional: 280, pangandali: 450 },
  { year: '2026(P)', conventional: 210, pangandali: 780 },
];

const sparklineData = Array.from({ length: 10 }).map((_, i) => ({ value: Math.random() * 100 }));

// --- COMPONENTS ---

// Framer Motion Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};
const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } }
};

// Progress Bar Component
const ProgressBar = ({ label, value, color, icon: Icon, showPercent = true }) => (
  <div className="bi-progress-container">
    <div className="bi-progress-header">
      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {Icon && <Icon size={14} style={{ color }} />}
        {label}
      </span>
      <span>{showPercent ? `${value}%` : value}</span>
    </div>
    <div className="bi-progress-track">
      <motion.div
        className="bi-progress-fill"
        style={{ width: `${value}%`, backgroundColor: color }}
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 1, ease: 'easeOut' }}
      />
    </div>
  </div>
);

// Sparkline KPI Card
const KPICard = ({ title, value, icon: Icon, color, trend, trendVal, sparkData }) => (
  <motion.div className="bi-card bi-kpi-card" variants={itemVariants}>
    <div className="bi-kpi-top">
      <div>
        <div className="bi-overview-title">{title}</div>
        <div className="bi-kpi-val" style={{ color }}>{value}</div>
      </div>
      <div style={{ padding: '8px', borderRadius: '10px', background: `${color}15`, color }}>
        <Icon size={20} />
      </div>
    </div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '12px' }}>
      <div className={`bi-trend-badge ${trend === 'up' ? 'bi-trend-up' : 'bi-trend-down'}`}>
        {trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        {trendVal}
      </div>
      <div className="bi-kpi-chart">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={sparkData}>
            <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} isAnimationActive={true} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  </motion.div>
);

export default function ImpactDashboard() {
  const [yearFilter, setYearFilter] = useState('2025');

  const handleExport = () => alert('Mengekspor laporan dashboard ke PDF...');
  const handleRefresh = () => alert('Menyegarkan data dari node terdistribusi...');

  return (
    <div className="bi-dashboard">
      <motion.div initial="hidden" animate="visible" variants={containerVariants}>
        
        {/* HEADER & FILTERS */}
        <div className="bi-header">
          <div>
            <h1 className="bi-title">Dampak & SDGs</h1>
            <p className="bi-subtitle">Evaluasi komprehensif distribusi logistik hortikultura PanganDali</p>
          </div>
          
          <div className="bi-actions">
            <select className="bi-filter-select" value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}>
              <option value="2024">Tahun 2024</option>
              <option value="2025">Tahun 2025</option>
              <option value="2026">Tahun 2026 (Proyeksi)</option>
            </select>
            <select className="bi-filter-select">
              <option value="all">Semua Komoditas</option>
              <option value="cabai">Cabai Besar</option>
              <option value="kubis">Kubis</option>
              <option value="terung">Terung</option>
              <option value="wortel">Wortel</option>
              <option value="kembangkol">Kembang Kol</option>
            </select>
            
            <button className="bi-btn bi-btn-outline" onClick={handleRefresh}>
              <RefreshCw size={14} /> Refresh
            </button>
            <button className="bi-btn bi-btn-primary" onClick={handleExport}>
              <Download size={14} /> Export Report
            </button>
          </div>
        </div>

        {/* EXECUTIVE SUMMARY (4 Cards) */}
        <div className="bi-grid-4">
          <motion.div className="bi-card bi-exec-card" variants={itemVariants}>
            <div className="bi-exec-icon" style={{ background: '#dcfce7', color: '#16a34a' }}>
              <ShieldAlert size={24} />
            </div>
            <div className="bi-exec-info">
              <span className="bi-exec-value">520<span style={{ fontSize: '14px', color: '#64748b', marginLeft: '4px' }}>Ton</span></span>
              <span className="bi-exec-label">Food Loss Prevented (Estimasi)</span>
            </div>
          </motion.div>

          <motion.div className="bi-card bi-exec-card" variants={itemVariants}>
            <div className="bi-exec-icon" style={{ background: '#f3e8ff', color: '#8b5cf6' }}>
              <DollarSign size={24} />
            </div>
            <div className="bi-exec-info">
              <span className="bi-exec-value">2.09<span style={{ fontSize: '14px', color: '#64748b', marginLeft: '4px' }}>Miliar</span></span>
              <span className="bi-exec-label">Nilai Ekonomi Diselamatkan (Estimasi)</span>
            </div>
          </motion.div>

          <motion.div className="bi-card bi-exec-card" variants={itemVariants}>
            <div className="bi-exec-icon" style={{ background: '#e0f2fe', color: '#0ea5e9' }}>
              <Truck size={24} />
            </div>
            <div className="bi-exec-info">
              <span className="bi-exec-value">840<span style={{ fontSize: '14px', color: '#64748b', marginLeft: '4px' }}>Trips</span></span>
              <span className="bi-exec-label">Total Backhaul Trips</span>
            </div>
          </motion.div>

          <motion.div className="bi-card bi-exec-card" variants={itemVariants}>
            <div className="bi-exec-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
              <Activity size={24} />
            </div>
            <div className="bi-exec-info">
              <span className="bi-exec-value">78.5<span style={{ fontSize: '14px', color: '#64748b', marginLeft: '4px' }}>%</span></span>
              <span className="bi-exec-label">Logistics Efficiency</span>
            </div>
          </motion.div>
        </div>

        {/* NATIONAL IMPACT OVERVIEW (8 Grid Cards) */}
        <h2 className="bi-section-title"><MapPin size={18} /> National Impact Overview</h2>
        <div className="bi-grid-4">
          {[
            { t: 'Total Tonnage Distributed', v: '4,250 Ton', badge: '↑ 12%', color: '#10b981' },
            { t: 'Logistics Cost Saved', v: 'Rp 450 Jt', badge: '↑ 8%', color: '#3b82f6' },
            { t: 'Active Distribution Routes', v: '24 Rute', badge: '+3 Rute', color: '#8b5cf6' },
            { t: 'Active Farmers Assisted', v: '1,205 Org', badge: '↑ 15%', color: '#f59e0b' },
            { t: 'Average Delivery Time', v: '18 Jam', badge: '↓ 4 Jam', color: '#16a34a' },
            { t: 'Carbon Emission Reduced', v: '120 Ton', badge: '↑ 20%', color: '#06b6d4' },
            { t: 'Empty Backhaul Utilized', v: '840 Truk', badge: '↑ 35%', color: '#6366f1' },
            { t: 'Farmer Price Share', v: '62%', badge: '↑ 7%', color: '#ec4899' },
          ].map((item, idx) => (
            <motion.div className="bi-card bi-overview-card" variants={itemVariants} key={idx}>
              <div className="bi-overview-header">
                <span className="bi-overview-title">{item.t}</span>
                <div className={`bi-trend-badge ${item.badge.includes('↓') ? 'bi-trend-down' : 'bi-trend-up'}`}>
                  {item.badge}
                </div>
              </div>
              <div className="bi-overview-value" style={{ color: item.color }}>{item.v}</div>
            </motion.div>
          ))}
        </div>

        {/* YOY & EFFICIENCY METRICS */}
        <div className="bi-grid-2">
          {/* YoY Growth */}
          <motion.div className="bi-card" variants={itemVariants}>
            <h3 className="bi-section-title"><TrendingUp size={18} /> Year-over-Year Growth</h3>
            <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <ProgressBar label="2024 - Fase Inisiasi" value={35} color="#cbd5e1" icon={Clock} />
              <ProgressBar label="2025 - Fase Ekspansi (Saat ini)" value={78} color="#3b82f6" icon={Activity} />
              <ProgressBar label="2026 - Target Proyeksi" value={100} color="#16a34a" icon={Sparkles} />
            </div>
            <p style={{ marginTop: '20px', fontSize: '13px', color: 'var(--bi-muted)' }}>
              Pertumbuhan nilai diselamatkan secara kumulatif diproyeksikan mencapai efisiensi maksimal pada 2026 seiring dengan penetrasi armada backhaul.
            </p>
          </motion.div>

          {/* Efficiency Metrics */}
          <motion.div className="bi-card" variants={itemVariants}>
            <h3 className="bi-section-title"><Zap size={18} /> Efficiency Metrics</h3>
            <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <ProgressBar label="Logistics Cost Efficiency" value={85} color="#10b981" />
              <ProgressBar label="Distribution Utilization" value={92} color="#10b981" />
              <ProgressBar label="Vehicle Utilization (Load Factor)" value={76} color="#f59e0b" />
              <ProgressBar label="Backhaul Utilization" value={68} color="#f59e0b" />
              <ProgressBar label="Delivery Accuracy (SLA)" value={98} color="#10b981" />
            </div>
          </motion.div>
        </div>

        {/* KPI PERFORMANCE CARDS */}
        <h2 className="bi-section-title" style={{ marginTop: '32px' }}><Activity size={18} /> Key Performance Indicators</h2>
        <div className="bi-grid-4">
          {/* TODO: verifikasi angka ini terhadap tabel indikator proposal */}
          <KPICard title="Food Loss (Estimasi)" value="520 Ton" icon={ShieldAlert} color="#16a34a" trend="up" trendVal="15%" sparkData={sparklineData} />
          {/* TODO: verifikasi angka ini terhadap tabel indikator proposal */}
          <KPICard title="Econ Value (Estimasi)" value="Rp 2.09 M" icon={DollarSign} color="#8b5cf6" trend="up" trendVal="22%" sparkData={sparklineData} />
          <KPICard title="Empty Backhaul Utilized" value="840 Trips" icon={Truck} color="#0ea5e9" trend="up" trendVal="12%" sparkData={sparklineData} />
          <KPICard title="Logistics Cost Saved" value="Rp 450 Jt" icon={TrendingUp} color="#f59e0b" trend="up" trendVal="8%" sparkData={sparklineData} />
          <KPICard title="Logistics Efficiency" value="78.5%" icon={Zap} color="#10b981" trend="up" trendVal="5%" sparkData={sparklineData} />
          <KPICard title="Total Saved Tonnage" value="1,200 T" icon={PackageCheck} color="#6366f1" trend="up" trendVal="10%" sparkData={sparklineData} />
          <KPICard title="Active Farmers" value="1,205" icon={Users} color="#ec4899" trend="up" trendVal="18%" sparkData={sparklineData} />
          <KPICard title="Successful Deliveries" value="98.5%" icon={CheckCircle} color="#06b6d4" trend="down" trendVal="0.5%" sparkData={sparklineData} />
        </div>

        {/* MAIN CHARTS ROW 1 */}
        <div className="bi-grid-2">
          <motion.div className="bi-card" variants={itemVariants}>
            <h3 className="bi-section-title">Monthly Food Loss Prevention</h3>
            <div style={{ height: '300px', width: '100%' }}>
              <ResponsiveContainer>
                <AreaChart data={monthlyFoodLossData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPrevented" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16a34a" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorLoss" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <RechartsTooltip />
                  <Legend iconType="circle" />
                  <Area type="monotone" dataKey="prevented" stroke="#16a34a" fillOpacity={1} fill="url(#colorPrevented)" name="Loss Prevented (Ton)" />
                  <Area type="monotone" dataKey="loss" stroke="#ef4444" fillOpacity={1} fill="url(#colorLoss)" name="Actual Loss (Ton)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div className="bi-card" variants={itemVariants}>
            <h3 className="bi-section-title">Backhaul & Logistics Savings</h3>
            <div style={{ height: '300px', width: '100%' }}>
              <ResponsiveContainer>
                <ComposedChart data={backhaulSavingsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <RechartsTooltip />
                  <Legend iconType="circle" />
                  <Bar yAxisId="left" dataKey="trips" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Backhaul Trips" barSize={30} />
                  <Line yAxisId="right" type="monotone" dataKey="savings" stroke="#f59e0b" strokeWidth={3} name="Savings (Juta Rp)" dot={{ r: 4 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* MAIN CHARTS ROW 2 */}
        <div className="bi-grid-2">
          <motion.div className="bi-card" variants={itemVariants}>
            <h3 className="bi-section-title">Monthly Logistics Efficiency</h3>
            <div style={{ height: '300px', width: '100%' }}>
              <ResponsiveContainer>
                <LineChart data={logisticsEfficiencyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} domain={[0, 100]} />
                  <RechartsTooltip />
                  <Line type="monotone" dataKey="eff" stroke="#8b5cf6" strokeWidth={4} name="Efficiency (%)" dot={{ r: 6, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div className="bi-card" variants={itemVariants}>
            <h3 className="bi-section-title">Annual Comparison (Volume)</h3>
            <div style={{ height: '300px', width: '100%' }}>
              <ResponsiveContainer>
                <BarChart data={annualComparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <RechartsTooltip />
                  <Legend iconType="circle" />
                  <Bar dataKey="pangandali" fill="#16a34a" radius={[4, 4, 0, 0]} name="PanganDali (Ton)" />
                  <Bar dataKey="conventional" fill="#94a3b8" radius={[4, 4, 0, 0]} name="Conventional (Ton)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* SDGS IMPACT SECTION */}
        <h2 className="bi-section-title" style={{ marginTop: '32px' }}><Globe size={18} /> Kontribusi terhadap SDGs</h2>
        <div className="bi-grid-4" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
          {[
            { id: 2, t: 'Zero Hunger', v: 85, c: '#dda63a', d: 'Ketahanan Pangan' },
            { id: 8, t: 'Decent Work', v: 72, c: '#a21942', d: 'Ekonomi Petani' },
            { id: 9, t: 'Innovation', v: 94, c: '#fd6925', d: 'Logistik Cerdas' },
            { id: 12, t: 'Responsible Consumption', v: 88, c: '#bf8b2e', d: 'Reduksi Food Loss' },
            { id: 13, t: 'Climate Action', v: 65, c: '#3f7e44', d: 'Reduksi Emisi' },
          ].map((sdg) => (
            <motion.div className="bi-card bi-sdg-card" variants={itemVariants} key={sdg.id}>
              <div className="bi-sdg-header">
                <div className="bi-sdg-icon" style={{ backgroundColor: sdg.c }}>SDG {sdg.id}</div>
                <div className="bi-sdg-title">{sdg.t}</div>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--bi-muted)', margin: 0 }}>{sdg.d}</p>
              <ProgressBar label="Progress" value={sdg.v} color={sdg.c} showPercent={true} />
            </motion.div>
          ))}
        </div>

        {/* MAP & TABLES ROW */}
        <div className="bi-grid-2">
          {/* Map Placeholder */}
          <motion.div className="bi-card" variants={itemVariants} style={{ display: 'flex', flexDirection: 'column' }}>
            <h3 className="bi-section-title"><MapPin size={18} /> Regional Impact Map (Bengkulu)</h3>
            <div style={{ flex: 1, background: '#f1f5f9', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px', border: '1px dashed #cbd5e1' }}>
              <div style={{ textAlign: 'center', color: '#64748b' }}>
                <MapPin size={48} style={{ opacity: 0.5, marginBottom: '12px' }} />
                <p>Interactive Map Component</p>
                <p style={{ fontSize: '12px' }}>Titik Distribusi, Volume, & Food Loss</p>
              </div>
            </div>
          </motion.div>

          {/* AI Insights & Top Commodities */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* AI Insight */}
            <motion.div className="bi-card bi-ai-panel" variants={itemVariants}>
              <h3 className="bi-section-title" style={{ color: '#1e3a8a' }}>
                <Sparkles size={18} color="#2563eb" /> AI Insight & Recommendation
              </h3>
              <ul className="bi-ai-list">
                <li><CheckCircle size={16} color="#16a34a" /> <span><strong>Food loss turun 18%</strong> dibanding tahun sebelumnya, disumbang terbesar oleh rute Rejang Lebong - Palembang.</span></li>
                <li><TrendingUp size={16} color="#2563eb" /> <span><strong>Efisiensi logistik meningkat 12%</strong> berkat utilisasi armada backhaul pada Q3.</span></li>
                <li><ShieldAlert size={16} color="#f59e0b" /> <span><strong>Rekomendasi:</strong> Perluas titik kumpul (hub) di area Bengkulu Utara untuk memangkas waktu tunggu panen kembang kol.</span></li>
              </ul>
            </motion.div>

            {/* Top Commodities */}
            <motion.div className="bi-card" variants={itemVariants}>
              <h3 className="bi-section-title">Top Performing Commodities</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                <ProgressBar label="Cabai Besar" value={95} color="#ef4444" />
                <ProgressBar label="Kubis" value={82} color="#8b5cf6" />
                <ProgressBar label="Terung" value={76} color="#f59e0b" />
                <ProgressBar label="Wortel" value={64} color="#10b981" />
                <ProgressBar label="Kembang Kol" value={58} color="#06b6d4" />
              </div>
            </motion.div>
          </div>
        </div>

        {/* ROUTE TABLE */}
        <motion.div className="bi-card" variants={itemVariants}>
          <h3 className="bi-section-title"><Truck size={18} /> Top Distribution Routes</h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="bi-table">
              <thead>
                <tr>
                  <th>Asal</th>
                  <th>Tujuan</th>
                  <th>Komoditas</th>
                  <th>Tonase</th>
                  <th>Waktu Tempuh</th>
                  <th>Efisiensi</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Rejang Lebong</strong></td>
                  <td>Palembang (Rencana)</td>
                  <td>Cabai Besar</td>
                  <td>120 Ton</td>
                  <td>6 Jam</td>
                  <td style={{ color: '#16a34a', fontWeight: 'bold' }}>94%</td>
                  <td><span className="bi-trend-badge bi-trend-up">Optimal</span></td>
                </tr>
                <tr>
                  <td><strong>Rejang Lebong</strong></td>
                  <td>DKI Jakarta (Rencana)</td>
                  <td>Terung</td>
                  <td>350 Ton</td>
                  <td>18 Jam</td>
                  <td style={{ color: '#16a34a', fontWeight: 'bold' }}>88%</td>
                  <td><span className="bi-trend-badge bi-trend-up">Optimal</span></td>
                </tr>
                <tr>
                  <td><strong>Kepahiang</strong></td>
                  <td>Bengkulu Kota</td>
                  <td>Kembang Kol</td>
                  <td>45 Ton</td>
                  <td>2.5 Jam</td>
                  <td style={{ color: '#f59e0b', fontWeight: 'bold' }}>72%</td>
                  <td><span className="bi-trend-badge" style={{ background: '#fef3c7', color: '#b45309' }}>Menengah</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </motion.div>

      </motion.div>
    </div>
  );
}
