// admin.js
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

const searchNameHealth = document.getElementById('searchNameHealth');
const inscricoesBodySaude = document.getElementById('inscricoesBodySaude');

const modal = document.getElementById('modalAdmin');
const btnCloseModalAdmin = document.getElementById('btnCloseModalAdmin');
const btnCloseModalFooter = document.getElementById('btnCloseModalFooter');
const masterIdInput = document.getElementById('masterIdInput');
const masterSearchSuggestions = document.getElementById('masterSearchSuggestions');
const groupLinkMessage = document.getElementById('groupLinkMessage');
const selectedMasterPreview = document.getElementById('selectedMasterPreview');
const btnVincular = document.getElementById('btnVincular'); // not used in reorganized but kept
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

// state
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

/* --------------- loadInscricoes (alterado para data-label) --------------- */
async function loadInscricoes(){
  inscricoesBody.innerHTML = '<tr><td colspan="4">Carregando...</td></tr>';
  const status = (statusFilter?.value || 'Todos');
  const abba = (abbaFilter?.value || 'Todos');
  const term = (searchName?.value||'').toLowerCase().trim();

  try{
    let query = db.collection('inscricoes').orderBy('dataCadastro','desc').limit(1000);
    if(status && status !== 'Todos') query = db.collection('inscricoes').where('statusPagamento','==',status).orderBy('dataCadastro','desc').limit(1000);
    const snap = await query.get();
    currentInscricoesData = [];
    inscricoesBody.innerHTML = '';
    snap.forEach(doc=>{
      const d = doc.data(); d.id = doc.id;
      if(abba && abba !== 'Todos'){
        const abbaBool = abba === 'Sim';
        if(d.pertenceABBApai !== abbaBool) return;
      }
      if(term){
        const nome = (d.nomeCompleto||'').toLowerCase();
        const email = (d.email||'').toLowerCase();
        if(!nome.includes(term) && !email.includes(term)) return;
      }
      currentInscricoesData.push(d);
      // Criando tr com data-labels para responsividade
      const tr = document.createElement('tr');

      const tdNome = document.createElement('td');
      tdNome.textContent = d.nomeCompleto || '—';
      tdNome.setAttribute('data-label','Nome');
      tr.appendChild(tdNome);

      const tdEmail = document.createElement('td');
      tdEmail.textContent = d.email || '—';
      tdEmail.setAttribute('data-label','E-mail');
      tr.appendChild(tdEmail);

      const tdStatus = document.createElement('td');
      tdStatus.innerHTML = `<span class="status-pill">${d.statusPagamento || 'PENDENTE'}</span>`;
      tdStatus.setAttribute('data-label','Status');
      tr.appendChild(tdStatus);

      const tdAcoes = document.createElement('td');
      tdAcoes.setAttribute('data-label','Ações');
      const btn = document.createElement('button');
      btn.textContent = 'Ver / Editar';
      btn.className = 'action-btn';
      btn.onclick = ()=> editInscricao(d.id);
      tdAcoes.appendChild(btn);
      tr.appendChild(tdAcoes);

      inscricoesBody.appendChild(tr);
    });
    if(currentInscricoesData.length === 0) inscricoesBody.innerHTML = '<tr><td colspan="4">Nenhuma inscrição encontrada.</td></tr>';
  } catch(err){
    console.error(err);
    inscricoesBody.innerHTML = '<tr><td colspan="4" style="color:red">Erro ao carregar. Ver console.</td></tr>';
  }
}

function clearFilters(){ statusFilter.value='Todos'; abbaFilter.value='Todos'; searchName.value=''; loadInscricoes(); }
btnApplyFilters?.addEventListener('click', loadInscricoes);
btnClearFilters?.addEventListener('click', clearFilters);
searchName?.addEventListener('input', debounce(loadInscricoes, 400));
statusFilter?.addEventListener('change', loadInscricoes);
abbaFilter?.addEventListener('change', loadInscricoes);

/* --------------- loadHealthInscricoes (com data-labels) --------------- */
async function loadHealthInscricoes(){
  inscricoesBodySaude.innerHTML = '<tr><td colspan="5">Carregando...</td></tr>';
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
      const tdCond = document.createElement('td'); tdCond.setAttribute('data-label','Condição'); tdCond.textContent = hasCond ? (d.condicaoSaudeAlergiaDescricao||'—') : 'Nenhuma'; tr.appendChild(tdCond);
      const tdMenor = document.createElement('td'); tdMenor.setAttribute('data-label','Menor'); tdMenor.textContent = isMinor ? 'SIM' : 'NÃO'; tr.appendChild(tdMenor);
      const tdNotes = document.createElement('td'); tdNotes.setAttribute('data-label','Notas ADM');
      tdNotes.innerHTML = `<textarea id="notes_${d.id}" rows="3" style="width:95%">${d.notasSaudeAdm||''}</textarea>
        <button onclick="saveHealthNotes('${d.id}')" style="margin-top:6px">Salvar Nota</button>
        <p id="healthMessage_${d.id}" style="margin:0;color:darkred"></p>`;
      tr.appendChild(tdNotes);
      inscricoesBodySaude.appendChild(tr);
    });
    if(!found) inscricoesBodySaude.innerHTML = '<tr><td colspan="5">Nenhum participante com atenção especial encontrado.</td></tr>';
  }catch(err){ console.error(err); inscricoesBodySaude.innerHTML = '<tr><td colspan="5" style="color:red">Erro ao carregar</td></tr>'; }
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

// ---------- PAYMENT HELPERS (mantidos) ----------
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
    li.innerHTML = `<span style="${style}">[${prefix}] ${dateString}: ${valorString}</span> - Lançado por: ${p.lancadoPor || 'N/A'}`;
    historyList.appendChild(li);
  });
}

// ---------- recalculateGroupStatus (mantida) ----------
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

// ---------- abrir modal e popular (editInscricao) ----------
// Mostrei que esta função carrega dados e decide se a inscrição é dependente ou titular.
// Mantive a lógica do seu arquivo original para não perder funcionalidades. (referência do código original).
async function editInscricao(docId){
  try{
    currentEditingDocId = docId;
    inscricaoDocIdSpan.textContent = docId;
    // força leitura do server para evitar cache
    const docSnap = await db.collection('inscricoes').doc(docId).get({ source: 'server' });
    if(!docSnap.exists){ alert('Inscrição não encontrada'); return; }
    const data = docSnap.data();

    // determina documento de pagamento (titular)
    const paymentMaster = await getPaymentMaster(docSnap);
    const paymentData = paymentMaster.data();
    const paymentDocId = paymentMaster.id;

    // Vinculo: atualiza display/inputs
    masterIdInput.value = data.inscricaoMestraId || '';
    masterIdDisplay.textContent = data.inscricaoMestraId ? data.inscricaoMestraId : 'Nenhum';
    selectedMasterPreview.textContent = data.masterNome ? `${data.masterNome} (ID: ${data.masterId || data.inscricaoMestraId})` : (data.nomeCompleto||'Nenhum');

    // decide exibição do formulário de pagamento: se é dependente, oculta (pagamento é no titular)
    const isGroupMember = (paymentDocId !== docId);
    if(isGroupMember){
      paymentForm.style.display = 'none';
      modalValorDevido.disabled = true;
      masterIdDisplay.innerHTML = `<strong style="color:darkred">MEMBRO DO GRUPO — pagamento no Titular ID: ${paymentDocId}</strong>`;
      if(dependentesContainer) dependentesContainer.innerHTML = '<p style="color:blue">Esta inscrição é dependente — pagamentos controlados no Titular.</p>';
    } else {
      paymentForm.style.display = 'block';
      modalValorDevido.disabled = false;
      masterIdDisplay.textContent = 'Nenhum (Titular de Pagamento)';
      // lista dependentes do titular
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

    // preenche campos pessoais
    modalNomeCompleto.value = data.nomeCompleto || '';
    modalEmail.value = data.email || '';
    modalTelefone.value = data.telefone || '';
    modalABBApai.value = data.pertenceABBApai === true ? 'true' : 'false';
    modalValorDevido.value = data.valorDevido != null ? data.valorDevido : 0;
    // renderiza totais do TITULAR (paymentData)
    calculatePaymentTotals(paymentData);
    renderPaymentHistory(paymentData.pagamentos || []);
    // abre modal
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }catch(err){ console.error('editInscricao erro', err); alert('Erro ao abrir modal (ver console)'); }
}

// fechar modal
btnCloseModalAdmin?.addEventListener('click', closeModal);
btnCloseModalFooter?.addEventListener('click', closeModal);
function closeModal(){ modal.style.display='none'; document.body.style.overflow='auto'; loadInscricoes(); }

// ---------- getPaymentMaster (mantida) ----------
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

// ---------- updateValorDevido (mantida) ----------
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

// ---------- updateInscricaoStatus (gera/atualiza status no banco) ----------
async function updateInscricaoStatus(docId, data){
  try{
    const pagamentos = data.pagamentos || [];
    const totalPago = pagamentos.reduce((s,p)=> s + (parseFloat(p.valor)||0), 0);
    const valorDevido = parseFloat(data.valorDevido) || 0;
    let status = 'PENDENTE';
    if(valorDevido - totalPago <= 0) status = 'PAGO TOTAL';
    else if(totalPago > 0) status = 'PAGO PARCIAL';
    await db.collection('inscricoes').doc(docId).update({ statusPagamento: status, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
    // se for titular, recalcula grupo
    if(data.inscricaoMestraId == null) await recalculateGroupStatus(docId);
  }catch(err){ console.error('updateInscricaoStatus erro', err); }
}

// ---------- pagamento: lançamento / estorno (mantida) ----------
paymentForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const currentDocId = inscricaoDocIdSpan.textContent;
  const currentDocSnap = await db.collection('inscricoes').doc(currentDocId).get();
  const paymentMasterSnap = await getPaymentMaster(currentDocSnap);
  const paymentDocId = paymentMasterSnap.id;
  // segurança: só lançar no titular
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
    // grava no array de pagamentos do titular (estrutura antiga compatível)
    await db.collection('inscricoes').doc(paymentDocId).update({
      pagamentos: firebase.firestore.FieldValue.arrayUnion(newPayment),
      statusPagamento: paymentValue < 0 ? 'Estorno Registrado' : 'Pago Parcial'
    });
    // recalc status do grupo
    await recalculateGroupStatus(paymentDocId);
    paymentMessage.textContent = paymentValue > 0 ? '✅ Pagamento lançado e status atualizado!' : '↩️ Estorno lançado e status atualizado!';
    paymentMessage.style.color = 'green';
    setTimeout(()=> paymentMessage.textContent = '', 3000);
    // limpar campos
    document.getElementById('paymentDate').value = '';
    document.getElementById('paymentValue').value = '';
    // recarregar modal e dados
    const doc = await db.collection('inscricoes').doc(currentDocId).get();
    editInscricao(currentDocId);
  }catch(err){ console.error(err); paymentMessage.textContent = 'Erro ao lançar pagamento'; paymentMessage.style.color='red'; }
});

// ---------- SEARCH MASTER BY NAME (sugestões clicáveis) ----------
masterIdInput?.addEventListener('input', debounce(searchMasterIdByName, 450));
async function searchMasterIdByName(){
  const searchTerm = (masterIdInput.value||'').trim();
  masterSearchSuggestions && (masterSearchSuggestions.innerHTML = '');
  if(searchTerm.length < 3){ groupLinkMessage.textContent = 'Digite pelo menos 3 letras para buscar.'; return; }
  groupLinkMessage.textContent = 'Buscando...'; groupLinkMessage.style.color='orange';
  try{
    const termLower = searchTerm.toLowerCase();
    // 1) tenta consulta indexada
    let results = [];
    try{
      const q = await db.collection('inscricoes')
        .where('nomeCompletoLowerCase','>=',termLower)
        .where('nomeCompletoLowerCase','<=',termLower + '\uf8ff')
        .limit(10).get();
      q.forEach(d=> results.push({ id:d.id, nome: d.data().nomeCompleto || '' }));
    }catch(idxErr){ console.warn('Busca indexada falhou:', idxErr); }
    // 2) fallback (pegar e filtrar — cuidado se coleção for gigante)
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
    // montar sugestões
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

// ---------- updateGroupLink / removeGroupLink (mantidas) ----------
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
    // reload
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

// ---------- salvar notas ADM (se houver botão separado) ----------
async function saveAdminNotes(){
  const docId = inscricaoDocIdSpan.textContent;
  const notes = document.getElementById('adminNotes') ? document.getElementById('adminNotes').value : null;
  if(notes == null) return;
  try{ await db.collection('inscricoes').doc(docId).update({ notasAdm: notes }); alert('Notas salvas'); }catch(err){ console.error(err); alert('Erro ao salvar notas'); }
}

// ---------- iniciais ----------
loadInscricoes();
loadHealthInscricoes();

// fechamento ao clicar fora
modal.addEventListener('click', (ev)=>{ if(ev.target === modal) closeModal(); });

// ================= END =================
// Observação: mantive e organizei as funções de pagamento e vínculo do seu admin.js original.
// Referências: renderPaymentHistory / paymentForm / updateValorDevido / recalculateGroupStatus. :contentReference[oaicite:4]{index=4} :contentReference[oaicite:5]{index=5}