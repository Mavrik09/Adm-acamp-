// admin.js (ATUALIZADO: adiciona filtro Titulares, filtro Métodos e icone WhatsApp SVG)
const firebaseConfig = {
    apiKey: "AIzaSyCdUQVGtl-PVu_CIuY79AQresZuQlo1nZo",
    authDomain: "inscritos-9ce96.firebaseapp.com",
    projectId: "inscritos-9ce96",
    storageBucket: "inscritos-9ce96.firebasestorage.app",
    messagingSenderId: "123531299441",
    appId: "1:123531299441:web:15a474ec1eb6979c1e29d0",
    measurementId: "G-DXXM8LPDJG"
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ---------- refs DOM ----------
const loginForm = document.getElementById('loginForm');
const loginMessage = document.getElementById('loginMessage');
const loginScreen = document.getElementById('login-screen');
const dashboardScreen = document.getElementById('dashboard-screen');

const statusFilter = document.getElementById('statusFilter');
const abbaFilter = document.getElementById('abbaFilter');
const searchName = document.getElementById('searchName');
const btnApplyFilters = document.getElementById('btnApplyFilters');
const btnClearFilters = document.getElementById('btnClearFilters');
const inscricoesBody = document.getElementById('inscricoesBody');

const titularFilter = document.getElementById('titularFilter');
const paymentMethodFilter = document.getElementById('paymentMethodFilter');

const searchNameHealth = document.getElementById('searchNameHealth');
const inscricoesBodySaude = document.getElementById('inscricoesBodySaude');

const modal = document.getElementById('modalAdmin');
const btnCloseModalAdmin = document.getElementById('btnCloseModalAdmin');
const btnCloseModalFooter = document.getElementById('btnCloseModalFooter');
const masterIdInput = document.getElementById('masterIdInput');
const masterSearchSuggestions = document.getElementById('masterSearchSuggestions');
const groupLinkMessage = document.getElementById('groupLinkMessage');
const selectedMasterPreview = document.getElementById('selectedMasterPreview');
const btnVincular = document.getElementById('btnVincular');
const dependentesContainer = document.getElementById('dependentesContainer');

const inscricaoDocIdSpan = document.getElementById('inscricaoDocId');
const modalValorDevido = document.getElementById('modalValorDevido');
const devidoMessage = document.getElementById('devidoMessage');

const paymentForm = document.getElementById('paymentForm');
const paymentMessage = document.getElementById('paymentMessage');
const historyList = document.getElementById('historyList');

const modalNomeCompleto = document.getElementById('modalNomeCompleto');
const modalEmail = document.getElementById('modalEmail');
const modalTelefone = document.getElementById('modalTelefone');
const modalABBApai = document.getElementById('modalABBApai');
const saveDetailsButton = document.getElementById('saveDetailsButton');
const saveDetailsMessage = document.getElementById('saveDetailsMessage');

const valorDevidoDisplay = document.getElementById('valorDevidoDisplay');
const totalPagoDisplay = document.getElementById('totalPagoDisplay');
const saldoRestanteDisplay = document.getElementById('saldoRestanteDisplay');
const statusPagamentoDisplay = document.getElementById('statusPagamentoDisplay');

const masterIdDisplay = document.getElementById('masterIdDisplay');
const lastAction = document.getElementById('lastAction');
const exportCsvButton = document.getElementById('exportCsvButton');
const exportMessage = document.getElementById('exportMessage');

let currentInscricoesData = [];
let currentEditingDocId = null;

// ---------- util ----------
function debounce(fn, wait = 300){ let t; return function(...a){ clearTimeout(t); t=setTimeout(()=>fn.apply(this,a), wait); }; }
function formatCurrency(v){ const num = parseFloat(v)||0; return num.toLocaleString('pt-BR',{style:'currency',currency:'BRL'}); }

// ---------- AUTH ----------
loginForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  const email = document.getElementById('adminEmail').value;
  const password = document.getElementById('adminPassword').value;
  loginMessage.textContent = 'Entrando...';
  auth.signInWithEmailAndPassword(email, password)
    .then(()=> { showDashboard(); loginMessage.textContent = ''; })
    .catch(err => { loginMessage.textContent = 'Erro de Login: ' + (err.message||err); });
});

auth.onAuthStateChanged(user => { if(user) showDashboard(); else showLogin(); });
document.getElementById('logoutButton')?.addEventListener('click', ()=> auth.signOut().then(showLogin));

function showLogin(){ loginScreen.style.display='block'; dashboardScreen.style.display='none'; }
function showDashboard(){ loginScreen.style.display='none'; dashboardScreen.style.display='block'; showMainDashboard(); }

// ---------- TABS ----------
function showMainDashboard(){ document.getElementById('dashboardMain').style.display='block'; document.getElementById('dashboardHealth').style.display='none'; document.getElementById('tabMain').classList.add('active'); document.getElementById('tabHealth').classList?.remove('active'); loadInscricoes(); }
function showHealthDashboard(){ document.getElementById('dashboardMain').style.display='none'; document.getElementById('dashboardHealth').style.display='block'; document.getElementById('tabHealth').classList.add('active'); document.getElementById('tabMain').classList?.remove('active'); loadHealthInscricoes(); }

// ---------- helpers novos ----------
function isTitularDoc(d){
  // Considera titular se não tiver inscricaoMestraId (pagamento próprio) ou se marcar vinculo 'Titular' ou campo isTitular true
  if(!d) return false;
  if(d.inscricaoMestraId == null || d.inscricaoMestraId === '' || d.inscricaoMestraId === undefined) return true;
  if(d.vinculo && String(d.vinculo).toLowerCase().includes('titular')) return true;
  if(d.isTitular === true) return true;
  return false;
}

function destacarTitulares(d){
  if(isTitularDoc(d)) return `<span class="titular-badge">Titular</span>`;
  return '';
}

function gerarLinkWhatsApp(telefone, nome){
  if(!telefone) return '';
  const telefoneLimpo = telefone.replace(/\D/g,'');
  if(telefoneLimpo.length < 10) return '';
  const url = `https://wa.me/55${telefoneLimpo}?text=Olá%20${encodeURIComponent(nome)},%20tudo%20bem?%20Referente%20a%20sua%20inscrição.`;
  // SVG do WhatsApp (pequeno, sem dependências)
  const svg = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path fill="#25D366" d="M20.52 3.48A11.93 11.93 0 0012 .02C5.37.02-.02 5.35-.02 12c0 2.12.56 4.17 1.63 5.97L0 24l6.32-1.64A11.92 11.92 0 0012 24c6.63 0 12-5.35 12-12 0-3.2-1.25-6.2-3.48-8.52z"/>
    <path fill="#fff" d="M17.6 14.2c-.3-.15-1.77-.87-2.05-.97-.28-.1-.48-.15-.68.15-.2.3-.77.97-.95 1.17-.17.2-.34.22-.64.07-.3-.15-1.27-.47-2.42-1.5-.9-.79-1.5-1.77-1.67-2.07-.17-.3-.02-.46.12-.61.12-.12.3-.31.45-.47.15-.16.2-.26.3-.43.1-.17.05-.32-.02-.47-.07-.15-.68-1.63-.93-2.24-.24-.58-.48-.5-.66-.51-.17-.01-.37-.01-.57-.01-.2 0-.52.07-.8.32-.28.26-1.08 1.06-1.08 2.6s1.1 3.02 1.26 3.23c.17.2 2.18 3.36 5.28 4.71 3.1 1.35 3.1.9 3.66.84.56-.06 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.08-.11-.28-.17-.58-.32z"/>
  </svg>`;
  return `<a class="whatsapp-link" href="${url}" target="_blank" rel="noopener" title="Abrir WhatsApp">${svg}</a>`;
}

// ---------- EXPORT CSV ----------
function formatToCsvValue(v){ if(v==null) return ''; let s = String(v).replace(/"/g,'""').replace(/\n/g,' '); if(s.includes(',')) return `"${s}"`; return s; }
function formatPaymentHistoryForCsv(pag){ if(!pag||pag.length===0) return 'Nenhum pagamento registrado'; return pag.map(p=>{
  const date = (p.data && p.data.toDate) ? p.data.toLocaleString() : (p.data||'N/A'); const valor = (p.valor||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  return `${valor} ${date} (${p.metodo||'N/A'})`;
}).join('; '); }

exportCsvButton?.addEventListener('click', exportToCsv);
async function exportToCsv(){
  exportMessage.textContent = 'Preparando exportação...';
  try{
    const snap = await db.collection('inscricoes').orderBy('nomeCompleto').get();
    const rows = [];
    snap.forEach(doc=>{ const d = doc.data(); d.id=doc.id; rows.push(d); });
    if(rows.length===0){ exportMessage.textContent='Nada para exportar'; return; }
    const headers = ["ID","Nome","Email","Telefone","PagaEm","Status","ValorDevido","TotalPago","Saldo","HistoricoPagamentos","Restricao","DescRestricao","Condicao","DescCondicao","Menor","Responsavel","TelResponsavel","NotasADM"];
    let csv = headers.map(h=>formatToCsvValue(h)).join(',')+'\n';
    rows.forEach(it=>{
      const totalPago = (it.pagamentos||[]).reduce((s,p)=>s+(parseFloat(p.valor)||0),0);
      const valorDevido = parseFloat(it.valorDevido)||0;
      const saldo = (valorDevido - totalPago).toFixed(2);
      const line = [
        it.id, it.nomeCompleto, it.email, it.telefone, it.pertenceABBApai ? 'Sim':'Não',
        it.statusPagamento, valorDevido.toFixed(2), totalPago.toFixed(2), saldo,
        formatPaymentHistoryForCsv(it.pagamentos||[]),
        it.restricaoAlimentar ? 'Sim':'Não', it.restricaoAlimentarDescricao||'',
        it.condicaoSaudeAlergia ? 'Sim':'Não', it.condicaoSaudeAlergiaDescricao||'',
        it.menorDeIdade ? 'Sim':'Não', it.responsavel ? it.responsavel.nome : '', it.responsavel ? it.responsavel.telefone : '', it.notasAdm||''
      ];
      csv += line.map(formatToCsvValue).join(',') + '\n';
    });
    const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
    const a = document.createElement('a'); const url = URL.createObjectURL(blob); a.href = url; a.download = `inscricoes_${Date.now()}.csv`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    exportMessage.textContent = `✅ ${rows.length} registros exportados!`; setTimeout(()=> exportMessage.textContent='',3000);
  }catch(err){ console.error(err); exportMessage.textContent = 'Erro ao exportar'; }
}

// ---------- PAYMENT HELPERS ----------
function calculatePaymentTotals(paymentDocData){
  const pagamentos = paymentDocData.pagamentos || [];
  const totalPago = pagamentos.reduce((s,p)=> s + (parseFloat(p.valor)||0), 0);
  const valorDevido = parseFloat(paymentDocData.valorDevido)||0;
  const saldo = valorDevido - totalPago;
  valorDevidoDisplay.textContent = formatCurrency(valorDevido);
  totalPagoDisplay.textContent = formatCurrency(totalPago);
  statusPagamentoDisplay.textContent = (paymentDocData.statusPagamento || 'PENDENTE');
  if(saldo <= 0){ saldoRestanteDisplay.style.color = 'green'; saldoRestanteDisplay.textContent = 'PAGO!'; }
  else { saldoRestanteDisplay.style.color = 'darkred'; saldoRestanteDisplay.textContent = formatCurrency(saldo); }
}

function renderPaymentHistory(pagamentos){
  historyList.innerHTML = '';
  if(!pagamentos || pagamentos.length === 0){ historyList.innerHTML = '<li>Nenhum pagamento registrado.</li>'; return; }
  const ordenados = pagamentos.sort((a,b)=>{
    const aDate = (a.timestamp && a.timestamp.toDate)? a.timestamp.toDate() : (a.data && a.data.toDate ? a.data.toDate() : new Date(0));
    const bDate = (b.timestamp && b.timestamp.toDate)? b.timestamp.toDate() : (b.data && b.data.toDate ? b.data.toDate() : new Date(0));
    return bDate - aDate;
  });
  ordenados.forEach(p=>{
    const li = document.createElement('li');
    const pd = (p.data && p.data.toDate) ? p.data.toDate() : new Date();
    const dateString = pd.toLocaleDateString('pt-BR');
    const valorString = (p.valor||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
    let prefix='PAGAMENTO', style='color:black';
    if(p.valor < 0){ prefix='ESTORNO'; style='color:darkred;font-weight:bold'; } else { style='color:green'; }
    li.innerHTML = `<span style="${style}">[${prefix}] ${dateString}: ${valorString}</span> - Lançado por: ${p.lancadoPor || 'N/A'} (${p.metodo||'N/A'})`;
    historyList.appendChild(li);
  });
}

// ---------- recalculateGroupStatus ----------
async function recalculateGroupStatus(masterId){
  try{
    const masterDocSnap = await db.collection('inscricoes').doc(masterId).get();
    if(!masterDocSnap.exists) return;
    const masterData = masterDocSnap.data();
    const totalPago = (masterData.pagamentos||[]).reduce((s,p)=> s + (parseFloat(p.valor)||0), 0);
    const valorDevido = parseFloat(masterData.valorDevido) || 0;
    const saldo = valorDevido - totalPago;
    let finalStatus = 'PENDENTE';
    if(saldo <= 0) finalStatus = 'PAGO TOTAL';
    else if(totalPago > 0) finalStatus = 'PAGO PARCIAL';
    const batch = db.batch();
    batch.update(db.collection('inscricoes').doc(masterId), { statusPagamento: finalStatus });
    const groupMembers = await db.collection('inscricoes').where('inscricaoMestraId','==',masterId).get();
    groupMembers.forEach(d => batch.update(db.collection('inscricoes').doc(d.id), { statusPagamento: finalStatus }));
    await batch.commit();
  }catch(err){ console.error('recalculateGroupStatus erro', err); }
}

// ---------- getPaymentMaster ----------
async function getPaymentMaster(currentDocSnap){
  const data = currentDocSnap.data();
  const masterId = data.inscricaoMestraId;
  if(masterId){
    const masterDoc = await db.collection('inscricoes').doc(masterId).get();
    if(masterDoc.exists) return masterDoc;
    return currentDocSnap;
  }
  return currentDocSnap;
}

// ---------- updateValorDevido ----------
async function updateValorDevido(){
  const docId = inscricaoDocIdSpan.textContent;
  const v = parseFloat(modalValorDevido.value);
  if(isNaN(v) || v < 0){ alert('Valor inválido'); return; }
  devidoMessage.textContent = 'Salvando...';
  try{
    await db.collection('inscricoes').doc(docId).update({ valorDevido: v, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
    devidoMessage.textContent = 'Valor salvo!';
    setTimeout(()=> devidoMessage.textContent = '', 2500);
    const doc = await db.collection('inscricoes').doc(docId).get();
    await updateInscricaoStatus(docId, doc.data());
    calculatePaymentTotals(doc.data());
  }catch(err){ console.error(err); devidoMessage.textContent = 'Erro ao salvar'; }
}

// ---------- updateInscricaoStatus ----------
async function updateInscricaoStatus(docId, data){
  try{
    const pagamentos = data.pagamentos || [];
    const totalPago = pagamentos.reduce((s,p)=> s + (parseFloat(p.valor)||0), 0);
    const valorDevido = parseFloat(data.valorDevido) || 0;
    let status = 'PENDENTE';
    if(valorDevido - totalPago <= 0) status = 'PAGO TOTAL';
    else if(totalPago > 0) status = 'PAGO PARCIAL';
    await db.collection('inscricoes').doc(docId).update({ statusPagamento: status, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
    if(data.inscricaoMestraId == null) await recalculateGroupStatus(docId);
  }catch(err){ console.error('updateInscricaoStatus erro', err); }
}

// ---------- pagamento: lançamento / estorno ----------
paymentForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const currentDocId = inscricaoDocIdSpan.textContent;
  const currentDocSnap = await db.collection('inscricoes').doc(currentDocId).get();
  const paymentMasterSnap = await getPaymentMaster(currentDocSnap);
  const paymentDocId = paymentMasterSnap.id;
  if(paymentDocId !== currentDocId){
    paymentMessage.textContent = 'ERRO: Pagamento deve ser lançado no Titular (verifique vínculo).'; paymentMessage.style.color='darkred'; return;
  }
  const paymentDateVal = document.getElementById('paymentDate').value;
  const paymentValue = parseFloat(document.getElementById('paymentValue').value);
  const paymentMethod = document.getElementById('paymentMethod').value;
  if(isNaN(paymentValue) || paymentDateVal === '' || !paymentMethod){
    paymentMessage.textContent = 'Insira data, valor e método.'; paymentMessage.style.color='red'; return;
  }
  const newPayment = {
    data: firebase.firestore.Timestamp.fromDate(new Date(paymentDateVal)),
    valor: paymentValue,
    metodo: paymentMethod,
    lancadoPor: firebase.auth().currentUser ? firebase.auth().currentUser.email : 'ADM',
    timestamp: new Date()
  };
  try{
    await db.collection('inscricoes').doc(paymentDocId).update({
      pagamentos: firebase.firestore.FieldValue.arrayUnion(newPayment),
      statusPagamento: paymentValue < 0 ? 'Estorno Registrado' : 'Pago Parcial'
    });
    await recalculateGroupStatus(paymentDocId);
    paymentMessage.textContent = paymentValue > 0 ? '✅ Pagamento lançado e status atualizado!' : '↩️ Estorno lançado e status atualizado!';
    paymentMessage.style.color = 'green';
    setTimeout(()=> paymentMessage.textContent = '', 3000);
    document.getElementById('paymentDate').value = '';
    document.getElementById('paymentValue').value = '';
    const doc = await db.collection('inscricoes').doc(currentDocId).get();
    editInscricao(currentDocId);
  }catch(err){ console.error(err); paymentMessage.textContent = 'Erro ao lançar pagamento'; paymentMessage.style.color='red'; }
});

// ---------- SEARCH MASTER BY NAME ----------
masterIdInput?.addEventListener('input', debounce(searchMasterIdByName, 450));
async function searchMasterIdByName(){
  const searchTerm = (masterIdInput.value||'').trim();
  masterSearchSuggestions && (masterSearchSuggestions.innerHTML = '');
  if(searchTerm.length < 3){ groupLinkMessage.textContent = 'Digite pelo menos 3 letras para buscar.'; return; }
  groupLinkMessage.textContent = 'Buscando...'; groupLinkMessage.style.color='orange';
  try{
    const termLower = searchTerm.toLowerCase();
    let results = [];
    try{
      const q = await db.collection('inscricoes')
        .where('nomeCompletoLowerCase','>=',termLower)
        .where('nomeCompletoLowerCase','<=',termLower + '\uf8ff')
        .limit(10).get();
      q.forEach(d=> results.push({ id:d.id, nome: d.data().nomeCompleto || '' }));
    }catch(idxErr){ console.warn('Busca indexada falhou:', idxErr); }
    if(results.length === 0){
      const all = await db.collection('inscricoes').limit(800).get();
      all.forEach(d=>{
        const data = d.data();
        const nome = (data.nomeCompleto||'').toLowerCase();
        if(nome.includes(termLower)) results.push({id:d.id, nome: data.nomeCompleto || ''});
      });
    }
    if(results.length === 0){ groupLinkMessage.textContent='Nenhum titular encontrado'; groupLinkMessage.style.color='red'; return; }
    groupLinkMessage.textContent = `Resultados: ${results.length} — clique para selecionar.`;
    groupLinkMessage.style.color = 'green';
    const container = masterSearchSuggestions || (function(){ const c = document.createElement('div'); c.id='masterSearchSuggestions'; masterIdInput.parentNode.appendChild(c); return c; })();
    container.innerHTML = '';
    results.forEach(r=>{
      const el = document.createElement('div'); el.className='sugg-item';
      el.dataset.id = r.id; el.dataset.nome = r.nome;
      el.innerHTML = `<div style="font-weight:700">${r.nome}</div><div style="font-size:12px;color:#666">ID: ${r.id}</div>`;
      el.onclick = ()=>{ masterIdInput.value = r.id; container.innerHTML=''; groupLinkMessage.textContent = `Titular selecionado: ${r.nome} (ID: ${r.id})`; groupLinkMessage.style.color='blue'; selectedMasterPreview.textContent = `${r.nome} (ID: ${r.id})`; };
      container.appendChild(el);
    });
  }catch(err){ console.error('searchMasterIdByName erro', err); groupLinkMessage.textContent = 'Erro na busca'; groupLinkMessage.style.color='red'; }
}

// ---------- updateGroupLink / removeGroupLink ----------
async function updateGroupLink(){
  const docId = inscricaoDocIdSpan.textContent;
  const masterId = (masterIdInput.value||'').trim();
  if(!masterId){ groupLinkMessage.textContent = 'ID do Titular vazio'; groupLinkMessage.style.color='red'; return; }
  if(masterId === docId){ groupLinkMessage.textContent = 'Não pode vincular a si mesmo'; groupLinkMessage.style.color='red'; return; }
  try{
    const masterDoc = await db.collection('inscricoes').doc(masterId).get();
    const masterNome = masterDoc.exists ? masterDoc.data().nomeCompleto || '' : '';
    await db.collection('inscricoes').doc(docId).update({
      inscricaoMestraId: masterId,
      masterId: masterId,
      masterNome: masterNome,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    groupLinkMessage.textContent = 'Vínculo salvo!';
    lastAction.textContent = new Date().toLocaleString();
    editInscricao(docId);
  }catch(err){ console.error(err); groupLinkMessage.textContent = 'Erro ao vincular'; groupLinkMessage.style.color='red'; }
}

async function removeGroupLink(){
  const docId = inscricaoDocIdSpan.textContent;
  if(!confirm('Remover vínculo?')) return;
  try{
    await db.collection('inscricoes').doc(docId).update({
      inscricaoMestraId: firebase.firestore.FieldValue.delete(),
      masterId: firebase.firestore.FieldValue.delete(),
      masterNome: firebase.firestore.FieldValue.delete(),
      vinculoTipo: firebase.firestore.FieldValue.delete(),
      vinculoObs: firebase.firestore.FieldValue.delete(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    groupLinkMessage.textContent = 'Vínculo removido.';
    editInscricao(docId);
  }catch(err){ console.error(err); groupLinkMessage.textContent = 'Erro ao remover vínculo'; groupLinkMessage.style.color='red'; }
}

// ---------- salvar detalhes ADM ----------
saveDetailsButton?.addEventListener('click', async ()=>{
  const docId = inscricaoDocIdSpan.textContent;
  const nome = modalNomeCompleto.value || '';
  const email = modalEmail.value || '';
  const telefone = modalTelefone.value || '';
  const pertence = modalABBApai.value === 'true';
  try{
    await db.collection('inscricoes').doc(docId).update({
      nomeCompleto: nome,
      nomeCompletoLowerCase: nome.toLowerCase(),
      email, telefone, pertenceABBApai: pertence, updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    saveDetailsMessage.textContent = 'Salvo!';
    setTimeout(()=> saveDetailsMessage.textContent = '', 3000);
    editInscricao(docId);
  }catch(err){ console.error(err); saveDetailsMessage.textContent = 'Erro ao salvar'; saveDetailsMessage.style.color='red'; }
});

// ---------- salvar notas ADM ----------
async function saveAdminNotes(){
  const docId = inscricaoDocIdSpan.textContent;
  const notes = document.getElementById('adminNotes') ? document.getElementById('adminNotes').value : null;
  if(notes == null) return;
  try{ await db.collection('inscricoes').doc(docId).update({ notasAdm: notes }); alert('Notas salvas'); }catch(err){ console.error(err); alert('Erro ao salvar notas'); }
}

// ---------- carregar inscrições (ATUALIZADO: onSnapshot + metodosDisponiveis) ----------
let unsubscribeInscricoes = null;

async function loadInscricoes() {
  // Cancela listener anterior, se existir
  if (unsubscribeInscricoes) unsubscribeInscricoes();

  inscricoesBody.innerHTML = '<tr><td colspan="5">Carregando...</td></tr>';

  const status = statusFilter?.value || 'Todos';
  let query = db.collection('inscricoes').orderBy('dataCadastro', 'desc');

  if (status !== 'Todos') {
    query = db.collection('inscricoes')
      .where('statusPagamento', '==', status)
      .orderBy('dataCadastro', 'desc');
  }

  // Escuta alterações em tempo real
  unsubscribeInscricoes = query.onSnapshot((snap) => {
    renderInscricoesSnapshot(snap);
  }, (err) => {
    console.error('Erro ao escutar inscrições:', err);
    inscricoesBody.innerHTML = '<tr><td colspan="5" style="color:red">Erro ao carregar. Ver console.</td></tr>';
  });
}

function renderInscricoesSnapshot(snap) {
  inscricoesBody.innerHTML = '';
  currentInscricoesData = [];

  const status = statusFilter?.value || 'Todos';
  const abba = abbaFilter?.value || 'Todos';
  const term = (searchName?.value || '').toLowerCase().trim();
  const titularSel = titularFilter?.value || 'Todos';
  const paymentMethodSel = paymentMethodFilter?.value || 'Todos';

  const methodsSet = new Set();

  snap.forEach((doc) => {
    const d = doc.data();
    d.id = doc.id;

    // coleta métodos disponíveis
    if (d.metodosDisponiveis && Array.isArray(d.metodosDisponiveis)) {
      d.metodosDisponiveis.forEach(m => methodsSet.add(String(m)));
    }
    if (d.pagamentos && Array.isArray(d.pagamentos)) {
      d.pagamentos.forEach(p => p?.metodo && methodsSet.add(String(p.metodo)));
    }
  });

  // garante que os 4 métodos principais sempre apareçam no filtro
  ['PIX', 'CARTAO', 'CARNÊ', 'DINHEIRO EM ESPÉCIE'].forEach(m => methodsSet.add(m));

  // popula o filtro de métodos
  if (paymentMethodFilter) {
    const prev = paymentMethodFilter.value || 'Todos';
    paymentMethodFilter.innerHTML = '<option value="Todos">Todos</option>';
    Array.from(methodsSet).sort().forEach(m => {
      const opt = document.createElement('option');
      opt.value = m;
      opt.textContent = m;
      paymentMethodFilter.appendChild(opt);
    });
    if (Array.from(methodsSet).includes(prev)) paymentMethodFilter.value = prev;
    else paymentMethodFilter.value = 'Todos';
  }

  snap.forEach((doc) => {
    const d = doc.data();
    d.id = doc.id;

    // aplica filtros
    if (abba !== 'Todos') {
      const abbaBool = abba === 'Sim';
      if (d.pertenceABBApai !== abbaBool) return;
    }

    if (term) {
      const nome = (d.nomeCompleto || '').toLowerCase();
      const email = (d.email || '').toLowerCase();
      if (!nome.includes(term) && !email.includes(term)) return;
    }

    if (titularSel === 'SomenteTitulares' && !isTitularDoc(d)) return;

    if (paymentMethodSel !== 'Todos') {
      const allMethods = [
        ...(d.metodosDisponiveis || []),
        ...(d.pagamentos?.map(p => p?.metodo) || [])
      ];
      if (!allMethods.includes(paymentMethodSel)) return;
    }

    currentInscricoesData.push(d);

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td data-label="Nome">
        ${d.nomeCompleto || '—'}
        ${destacarTitulares(d)}
        ${gerarLinkWhatsApp(d.telefone, d.nomeCompleto)}
      </td>
      <td data-label="E-mail">${d.email || '—'}</td>
      <td data-label="Métodos">${
        [
          ...(d.metodosDisponiveis || []),
          ...(d.pagamentos?.map(p => p?.metodo) || [])
        ].filter(Boolean).join(', ') || '—'
      }</td>
      <td data-label="Status">
        <span class="status-pill">${d.statusPagamento || 'PENDENTE'}</span>
      </td>
      <td data-label="Ações">
        <button class="action-btn" onclick="editInscricao('${d.id}')">Ver / Editar</button>
      </td>
    `;
    inscricoesBody.appendChild(tr);
  });

  if (currentInscricoesData.length === 0) {
    inscricoesBody.innerHTML = '<tr><td colspan="5">Nenhuma inscrição encontrada.</td></tr>';
  }
}

function clearFilters() {
  statusFilter.value = 'Todos';
  abbaFilter.value = 'Todos';
  searchName.value = '';
  if (titularFilter) titularFilter.value = 'Todos';
  if (paymentMethodFilter) paymentMethodFilter.value = 'Todos';
  loadInscricoes();
}

// mantém filtros funcionando
btnApplyFilters?.addEventListener('click', loadInscricoes);
btnClearFilters?.addEventListener('click', clearFilters);
searchName?.addEventListener('input', debounce(loadInscricoes, 400));
statusFilter?.addEventListener('change', loadInscricoes);
abbaFilter?.addEventListener('change', loadInscricoes);
if (titularFilter) titularFilter.addEventListener('change', loadInscricoes);
if (paymentMethodFilter) paymentMethodFilter.addEventListener('change', loadInscricoes);

// ---------- LOAD HEALTH (mantida com melhorias já no seu arquivo) ----------
async function loadHealthInscricoes(){
  inscricoesBodySaude.innerHTML = '<tr><td colspan="6">Carregando...</td></tr>';
  const term = (searchNameHealth?.value||'').toLowerCase().trim();
  try{
    const snap = await db.collection('inscricoes').orderBy('nomeCompleto','asc').get();
    inscricoesBodySaude.innerHTML = '';
    let found = false;
    snap.forEach(doc=>{
      const d = doc.data(); d.id=doc.id;
      const hasFood = d.restricaoAlimentar===true || (d.restricaoAlimentarDescricao && d.restricaoAlimentarDescricao.trim()!=='');
      const hasCond = d.condicaoSaudeAlergia===true || (d.condicaoSaudeAlergiaDescricao && d.condicaoSaudeAlergiaDescricao.trim()!=='');
      const isMinor = d.menorDeIdade===true;
      if(!(hasFood||hasCond||isMinor)) return;
      if(term){
        const nome = (d.nomeCompleto||'').toLowerCase(); const email = (d.email||'').toLowerCase();
        if(!nome.includes(term) && !email.includes(term)) return;
      }
      found = true;
      const tr = document.createElement('tr');
      const tdNome = document.createElement('td'); tdNome.setAttribute('data-label','Nome / Tel'); tdNome.innerHTML = `<strong>${d.nomeCompleto||'—'}</strong><br/>Tel: ${d.telefone||'N/A'}`; tr.appendChild(tdNome);
      const tdRestr = document.createElement('td'); tdRestr.setAttribute('data-label','Restrição'); tdRestr.textContent = hasFood ? (d.restricaoAlimentarDescricao||'—') : 'Nenhuma'; tr.appendChild(tdRestr);
      const tdRisco = document.createElement('td'); tdRisco.setAttribute('data-label','Nível de Risco'); tdRisco.textContent = d.nivelRiscoSaude || 'Leve'; tr.appendChild(tdRisco);
      const tdCond = document.createElement('td'); tdCond.setAttribute('data-label','Condição'); tdCond.textContent = hasCond ? (d.condicaoSaudeAlergiaDescricao||'—') : 'Nenhuma'; tr.appendChild(tdCond);
      const tdMenor = document.createElement('td'); tdMenor.setAttribute('data-label','Menor'); tdMenor.textContent = isMinor ? 'SIM' : 'NÃO'; tr.appendChild(tdMenor);
      const tdNotes = document.createElement('td'); tdNotes.setAttribute('data-label','Notas ADM');
      tdNotes.innerHTML = `<textarea id="notes_${d.id}" rows="3" style="width:95%">${d.notasSaudeAdm||''}</textarea>
        <button onclick="saveHealthNotes('${d.id}')" style="margin-top:6px">Salvar Nota</button>
        <p id="healthMessage_${d.id}" style="margin:0;color:darkred"></p>`;
      tr.appendChild(tdNotes);
      inscricoesBodySaude.appendChild(tr);
    });
    if(!found) inscricoesBodySaude.innerHTML = '<tr><td colspan="6">Nenhum participante com atenção especial encontrado.</td></tr>';
  }catch(err){ console.error(err); inscricoesBodySaude.innerHTML = '<tr><td colspan="6" style="color:red">Erro ao carregar</td></tr>'; }
}
searchNameHealth?.addEventListener('input', debounce(loadHealthInscricoes,400));

// ---------- SAVE HEALTH NOTES ----------
async function saveHealthNotes(docId){
  const notes = document.getElementById(`notes_${docId}`).value;
  const msg = document.getElementById(`healthMessage_${docId}`);
  msg.textContent = 'Salvando...';
  try{
    await db.collection('inscricoes').doc(docId).update({ notasSaudeAdm: notes });
    msg.textContent = 'Salvo!';
    setTimeout(()=> msg.textContent = '', 2000);
  }catch(err){ console.error(err); msg.textContent = 'Erro ao salvar'; }
}

// ---------- abrir modal e popular (editInscricao) ----------
async function editInscricao(docId){
  try{
    currentEditingDocId = docId;
    inscricaoDocIdSpan.textContent = docId;
    const docSnap = await db.collection('inscricoes').doc(docId).get({ source: 'server' });
    if(!docSnap.exists){ alert('Inscrição não encontrada'); return; }
    const data = docSnap.data();

    // payment master (titular)
    const paymentMaster = await getPaymentMaster(docSnap);
    const paymentData = paymentMaster.data();
    const paymentDocId = paymentMaster.id;

    // Vinculo: atualiza display/inputs
    masterIdInput.value = data.inscricaoMestraId || '';
    masterIdDisplay && (masterIdDisplay.textContent = data.inscricaoMestraId ? data.inscricaoMestraId : 'Nenhum');
    selectedMasterPreview.textContent = data.masterNome ? `${data.masterNome} (ID: ${data.masterId || data.inscricaoMestraId})` : (data.nomeCompleto||'Nenhum');

    const isGroupMember = (paymentDocId !== docId);
    if(isGroupMember){
      paymentForm.style.display = 'none';
      modalValorDevido.disabled = true;
      masterIdDisplay.innerHTML = `<strong style="color:darkred">MEMBRO DO GRUPO — pagamento no Titular ID: ${paymentDocId}</strong>`;
      // mostrar titular de forma mais evidente e botão para abrir titular
      const titularNome = paymentData.nomeCompleto || paymentData.nome || '—';
      if(dependentesContainer){
        dependentesContainer.innerHTML = `<div style="background:#fff3cd;padding:10px;border-radius:8px;border:1px solid #ffeeba">
          <strong>Titular:</strong> ${titularNome} <br/><small>ID: ${paymentDocId}</small>
          <div style="margin-top:8px">
            <button class="btn btn-primary" onclick="editInscricao('${paymentDocId}')">Abrir Titular</button>
          </div>
        </div>`;
      }
    } else {
      paymentForm.style.display = 'block';
      modalValorDevido.disabled = false;
      masterIdDisplay.textContent = 'Nenhum (Titular de Pagamento)';
      if(dependentesContainer){
        const depsSnap = await db.collection('inscricoes').where('inscricaoMestraId','==', docId).get();
        if(depsSnap.empty) dependentesContainer.innerHTML = '<p>Nenhum dependente vinculado.</p>';
        else{
          let html = '<p><strong>Dependentes:</strong></p><ul>';
          depsSnap.forEach(d=>{ const dv=d.data(); html += `<li>${dv.nomeCompleto||'—'} (ID: ${d.id})</li>`; });
          html += '</ul>'; dependentesContainer.innerHTML = html;
        }
      }
    }

    modalNomeCompleto.value = data.nomeCompleto || '';
    modalEmail.value = data.email || '';
    modalTelefone.value = data.telefone || '';
    modalABBApai.value = data.pertenceABBApai === true ? 'true' : 'false';
    modalValorDevido.value = data.valorDevido != null ? data.valorDevido : 0;

    // renderiza totais do titular (paymentData)
    calculatePaymentTotals(paymentData);
    renderPaymentHistory(paymentData.pagamentos || []);
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }catch(err){ console.error('editInscricao erro', err); alert('Erro ao abrir modal (ver console)'); }
}

btnCloseModalAdmin?.addEventListener('click', closeModal);
btnCloseModalFooter?.addEventListener('click', closeModal);
function closeModal(){ modal.style.display='none'; document.body.style.overflow='auto'; loadInscricoes(); }

// ---------- inicial ----------
loadInscricoes();
loadHealthInscricoes();

// fechamento ao clicar fora
modal.addEventListener('click', (ev)=>{ if(ev.target === modal) closeModal(); });

/* =========================
   Pequenas utilidades extras
   ========================= */

// Aplica tema - caso tenha botão no seu HTML (mantive)
const themeButton = document.getElementById('toggleTheme');
function applySavedTheme() {
  const saved = localStorage.getItem('theme');
  if (saved === 'dark') {
    document.body.classList.add('dark-mode');
    themeButton && (themeButton.textContent = '🌞');
  } else {
    document.body.classList.remove('dark-mode');
    themeButton && (themeButton.textContent = '🌙');
  }
}
themeButton?.addEventListener('click', () => {
  const isDark = document.body.classList.toggle('dark-mode');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  themeButton.textContent = isDark ? '🌞' : '🌙';
});
applySavedTheme();
