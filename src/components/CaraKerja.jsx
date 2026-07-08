import React from 'react';

function CaraKerja() {
  const steps = [
    {
      num: 1,
      title: 'Input Data',
      desc: 'Petani lapor panen via WhatsApp.'
    },
    {
      num: 2,
      title: 'Validasi',
      desc: 'Sistem memverifikasi kualitas & kuantitas.'
    },
    {
      num: 3,
      title: 'Matching',
      desc: 'Distributor terhubung dengan pasokan terdekat.'
    },
    {
      num: 4,
      title: 'Logistik',
      desc: 'Armada ditugaskan dengan rute backhaul optimal.'
    },
    {
      num: 5,
      title: 'Monitoring',
      desc: 'TPID pantau pergerakan harga di dashboard.'
    }
  ];

  return (
    <section className="section">
      <div className="container">
        <div className="section-title-wrapper">
          <h2 className="section-title">Cara Kerja Ekosistem</h2>
          <p className="section-desc">
            Satu siklus tertutup yang mengoptimalkan nilai dari hulu ke hilir.
          </p>
        </div>

        <div className="ekosistem-steps">
          <div className="ekosistem-connector"></div>
          
          {steps.map((step) => (
            <div className="ekosistem-step" key={step.num}>
              <div className="step-number">{step.num}</div>
              <div>
                <h3 className="step-title">{step.title}</h3>
                <p className="step-desc">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default CaraKerja;
