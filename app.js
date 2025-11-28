// Data master
const DATA = {
  pulsa: {
    variants: ["Telkomsel","XL/Axis","Indosat","Tri","Smartfren"],
    nominals: [5000, 10000, 20000, 50000, 100000]
  },
  diamen: {
    variants: ["Mobile Legends","Free Fire","PUBG Mobile","Genshin Impact"],
    nominals: [25, 50, 100, 250, 500] // jumlah diamond
  },
  ewallet: {
    variants: ["OVO","GoPay","DANA","ShopeePay","LinkAja"],
    nominals: [10000, 20000, 50000, 100000, 200000]
  },
  payments: [
    { code:"qris", name:"QRIS", fee: 1000 },
    { code:"transfer", name:"Transfer Bank", fee: 1500 },
    { code:"va", name:"Virtual Account", fee: 2000 },
    { code:"wallet", name:"E-Wallet", fee: 1200 },
  ]
};

// Global helpers
const Rp = n => new Intl.NumberFormat('id-ID', { style:'currency', currency:'IDR'}).format(n);
const el = id => document.getElementById(id);
const ucfirst = s => s.charAt(0).toUpperCase() + s.slice(1);
function escapeHtml(s){
  return s.replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));
}
function estimateDiamondPrice(d){ return Math.round(d * 300); }

// Lightweight nav injection (optional reuse across pages)
function renderNav(active){
  const nav = document.querySelector('.nav');
  if(!nav) return;
  nav.innerHTML = `
    <div class="brand">
      <div class="logo">↑</div>
      <a href="index.html" class="brand-name" style="text-decoration:none">TopUpin</a>
    </div>
    <div class="nav-links">
      <a href="products.html" ${active==='products'?'aria-current="page"':''}>Produk</a>
      <a href="howto.html" ${active==='howto'?'aria-current="page"':''}>Cara Top Up</a>
      <a href="topup.html" ${active==='topup'?'aria-current="page"':''}>Top Up</a>
      <a href="contact.html" ${active==='contact'?'aria-current="page"':''}>Kontak</a>
      <a href="Transaksi.html" ${active==='Transaksi'?'aria-current="page"':''}>Transakasi</a>
      <a href="index.html" ${active==='index'?'aria-current="page"':''}>Home</a>
      
    </div>
  `;
}

// Persist selected product across pages
function saveSelectedJenis(jenis){
  try { localStorage.setItem('selectedJenis', jenis); } catch(e){}
}
function getSelectedJenis(){
  try { return localStorage.getItem('selectedJenis') || 'pulsa'; } catch(e){ return 'pulsa'; }
}

// TopUp page logic
function initTopUpForm(){
  if(!el('jenis')) return; // only run on topup.html

  const state = {
    jenis: getSelectedJenis(),
    target: "",
    variant: "",
    nominal: null,
    customNominal: null,
    payment: null
  };

  function formatNominalLabel(n){
    if(state.jenis === 'diamen') return `${n} Diamond`;
    return Rp(n);
  }

  function onJenisChange(){
    state.jenis = el('jenis').value;
    saveSelectedJenis(state.jenis);

    // Variant list
    const variant = el('variant');
    variant.innerHTML = "";
    DATA[state.jenis].variants.forEach(v=>{
      const o = document.createElement('option');
      o.value = v; o.textContent = v;
      variant.appendChild(o);
    });
    state.variant = DATA[state.jenis].variants[0];

    // Nominal list
    const nominal = el('nominal');
    nominal.innerHTML = "";
    DATA[state.jenis].nominals.forEach(n=>{
      const o = document.createElement('option');
      o.value = n; o.textContent = formatNominalLabel(n);
      nominal.appendChild(o);
    });
    state.nominal = DATA[state.jenis].nominals[0];

    // Placeholder & help
    const target = el('target');
    const help = el('variant-help');
    if(state.jenis === 'pulsa'){
      target.placeholder = "Nomor HP (contoh: 081234567890)";
      help.textContent = "Pilih operator kartu yang digunakan.";
    } else if(state.jenis === 'diamen'){
      target.placeholder = "User ID Game (contoh: 123456789)";
      help.textContent = "Pilih game yang ingin di-top up.";
    } else {
      target.placeholder = "Nomor HP terhubung ke E-Wallet (contoh: 081234567890)";
      help.textContent = "Pilih platform e-Wallet.";
    }

    // Payment methods
    const row = el('payRow');
    row.innerHTML = "";
    DATA.payments.forEach(p=>{
      const btn = document.createElement('button');
      btn.className = 'pay';
      btn.textContent = `${p.name}`;
      btn.onclick = ()=>{
        state.payment = p;
        document.querySelectorAll('.pay').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        renderSummary();
      };
      row.appendChild(btn);
    });

    // Reset fields
    el('customNominal').value = "";
    state.customNominal = null;
    renderSummary();
  }

  function renderSummary(){
    state.target = el('target').value.trim();
    state.variant = el('variant').value;
    const selectNom = el('nominal').value ? Number(el('nominal').value) : null;
    const customNom = el('customNominal').value ? Number(el('customNominal').value) : null;
    state.nominal = selectNom;
    state.customNominal = customNom || null;

    let nilai = selectNom;
    if(state.customNominal && state.jenis !== 'diamen'){
      nilai = state.customNominal;
    }
    const fee = state.payment ? state.payment.fee : 0;
    const subtotal = state.jenis === 'diamen' ? estimateDiamondPrice(nilai) : nilai;
    const total = subtotal + fee;

    const lines = [];
    lines.push(`<strong>Jenis:</strong> ${ucfirst(state.jenis)}`);
    if(state.target) lines.push(`<strong>Tujuan:</strong> ${escapeHtml(state.target)}`);
    lines.push(`<strong>Varian:</strong> ${state.variant}`);
    lines.push(`<strong>Nominal:</strong> ${state.jenis==='diamen' ? (nilai+' Diamond') : Rp(nilai)}`);
    lines.push(`<strong>Metode bayar:</strong> ${state.payment ? state.payment.name : 'Belum dipilih'}`);
    lines.push(`<strong>Subtotal:</strong> ${Rp(subtotal)}`);
    lines.push(`<strong>Biaya admin:</strong> ${Rp(fee)}`);
    lines.push(`<strong>Total bayar:</strong> ${Rp(total)}`);

    el('summary').innerHTML = lines.map(l=>`• ${l}`).join('<br/>');
  }

  function validate(){
    el('error').textContent = "";
    const errs = [];
    if(!state.target){
      errs.push("Nomor HP / User ID belum diisi.");
    } else {
      if(state.jenis !== 'diamen'){
        const hp = state.target.replace(/\s+/g,'');
        if(!/^0[0-9]{9,13}$/.test(hp)) errs.push("Format nomor HP kurang valid.");
      }
    }
    if(!state.variant) errs.push("Varian belum dipilih.");
    if(!state.nominal) errs.push("Nominal belum dipilih.");
    if(!state.payment) errs.push("Metode pembayaran belum dipilih.");
    if(errs.length){
      el('error').innerHTML = errs.map(e=>`• ${e}`).join('<br/>');
      return false;
    }
    return true;
  }

  function submitOrder(){
    renderSummary();
    if(!validate()) return;
    const btn = el('submitBtn');
    btn.disabled = true; btn.textContent = "Memproses...";
    setTimeout(()=>{
      const orderId = 'TU-' + Math.random().toString(36).slice(2,8).toUpperCase();
      const msg = `
        Pesanan berhasil dibuat!
        <span class="success">Order ID: ${orderId}</span><br/>
        Silakan selesaikan pembayaran sesuai metode yang dipilih.
      `;
      el('error').innerHTML = msg;
      btn.disabled = false; btn.textContent = "Bayar sekarang";
    }, 1200);
  }

  function resetForm(){
    el('target').value = "";
    el('customNominal').value = "";
    document.querySelectorAll('.pay').forEach(b=>b.classList.remove('active'));
    renderSummary();
    el('error').textContent = "";
  }

  // Bind events
  el('jenis').addEventListener('change', onJenisChange);
  el('target').addEventListener('input', renderSummary);
  el('variant').addEventListener('change', renderSummary);
  el('nominal').addEventListener('change', renderSummary);
  el('customNominal').addEventListener('input', renderSummary);
  el('submitBtn').addEventListener('click', submitOrder);
  el('resetBtn')?.addEventListener('click', resetForm);

  // Init
  el('jenis').value = state.jenis;
  onJenisChange();
}

// Product selection buttons on products page
function initProductCards(){
  document.querySelectorAll('[data-pick]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const jenis = btn.getAttribute('data-pick');
      saveSelectedJenis(jenis);
      window.location.href = 'topup.html';
    });
  });
}

// Page bootstrap
document.addEventListener('DOMContentLoaded', ()=>{
  const page = document.body.getAttribute('data-page');
  renderNav(page);
  if(page === 'products') initProductCards();
  if(page === 'topup') initTopUpForm();
});
