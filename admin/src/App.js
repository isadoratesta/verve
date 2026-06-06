import { useState, useEffect, useCallback } from "react";

const API = "https://primary-production-3fd339.up.railway.app/webhook";
const SENHA = process.env.REACT_APP_ADMIN_SENHA || "FlowIA@2026#Admin";

// ─── PALETA VERVE ────────────────────────────────────────────────────────────
const C = {
  black:   "#1B1B1B",
  cream:   "#F7F4EE",
  cream2:  "#EFE8DD",
  gold:    "#A88A55",
  goldDk:  "#5F4B28",
  stone:   "#8B8378",
  muted:   "#5F5A52",
  line:    "#E5DCCD",
  white:   "#FFFFFF",
  success: "#E6F0E9",
  successTx: "#2D5A3D",
  warn:    "#F5EDD8",
  warnTx:  "#7A4F1A",
  danger:  "#F5E8E8",
  dangerTx:"#7A1F1F",
};

const FONTS = {
  serif: "'Cormorant Garamond', Georgia, serif",
  sans:  "'Inter', Arial, sans-serif",
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const fmt = (v) => Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = (d) => { if (!d) return "–"; const [y, m, day] = d.split("T")[0].split("-"); return `${day}/${m}/${y}`; };
const daysUntil = (d) => d ? Math.ceil((new Date(d) - new Date()) / 86400000) : null;
const isExpiring = (d) => { const n = daysUntil(d); return n !== null && n >= 0 && n <= 7; };
const today = () => new Date().toISOString().split("T")[0];
const monthsActive = (d) => d ? Math.floor((new Date() - new Date(d)) / (30 * 86400000)) : 0;

const PLANOS = ["Essencial", "Crescimento", "Avançado"];
const PLANO_VALOR = { Essencial: 297, Crescimento: 597, Avançado: 1197, essencial: 297, crescimento: 597, avançado: 1197 };
const CHECKLIST_LABELS = { instancia: "Instância criada", qr: "QR Code conectado", prompt: "Prompt configurado", testado: "Agente testado", treinado: "Cliente treinado" };
const MRR_HISTORICO = [{ mes: "Jan", valor: 0 }, { mes: "Fev", valor: 297 }, { mes: "Mar", valor: 594 }, { mes: "Abr", valor: 594 }, { mes: "Mai", valor: 297 }];

const statusColor = {
  ativo:     { bg: C.success, color: C.successTx, label: "Ativo" },
  suspenso:  { bg: C.warn,    color: C.warnTx,    label: "Suspenso" },
  cancelado: { bg: C.danger,  color: C.dangerTx,  label: "Cancelado" },
};
const pagColor = {
  "em dia":  { bg: C.success, color: C.successTx },
  pendente:  { bg: C.warn,    color: C.warnTx },
  atrasado:  { bg: C.danger,  color: C.dangerTx },
  pago:      { bg: C.success, color: C.successTx },
};

const normalize = (c) => ({
  ...c,
  nome: c.nome_negocio || c.nome || "",
  plano: c.plano ? c.plano.charAt(0).toUpperCase() + c.plano.slice(1) : "Essencial",
  vencimento: c.data_vencimento ? c.data_vencimento.split("T")[0] : "",
  whatsapp: c.whatsapp_contato || c.whatsapp || "",
  mensagens_mes: Number(c.mensagens_mes) || 0,
  pagamento: c.pagamento || "pendente",
  checklist: c.checklist || { instancia: false, qr: false, prompt: false, testado: false, treinado: false },
  pagamentos: c.pagamentos || [],
  log: c.log || [],
  anotacoes: c.anotacoes || "",
  origem: c.origem || "",
  solicitacoes_humano: c.solicitacoes_humano || 0,
  criado_em: c.criado_em ? c.criado_em.split("T")[0] : today(),
});

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function Login({ onLogin }) {
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState(false);

  const tentar = () => {
    if (senha === SENHA) { onLogin(); }
    else { setErro(true); setSenha(""); setTimeout(() => setErro(false), 2000); }
  };

  return (
    <div style={{ minHeight: "100vh", background: C.cream, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONTS.sans }}>
      <div style={{ background: C.white, borderRadius: 16, padding: "48px 40px", width: 360, textAlign: "center", border: `1px solid ${C.line}`, boxShadow: "0 4px 32px rgba(27,27,27,0.06)" }}>
        <div style={{ fontFamily: FONTS.serif, fontSize: 36, fontWeight: 500, color: C.black, letterSpacing: "-0.04em", marginBottom: 2 }}>
          Verve<span style={{ color: C.gold }}>.</span>
        </div>
        <div style={{ fontSize: 9, letterSpacing: "0.28em", color: C.stone, textTransform: "uppercase", fontWeight: 700, marginBottom: 40 }}>PAINEL ADMIN</div>
        <input
          type="password"
          value={senha}
          onChange={e => setSenha(e.target.value)}
          onKeyDown={e => e.key === "Enter" && tentar()}
          placeholder="Senha de acesso"
          style={{ ...iSt, border: `1.5px solid ${erro ? C.dangerTx : C.line}`, marginBottom: 12 }}
          autoFocus
        />
        {erro && <p style={{ color: C.dangerTx, fontSize: 12, marginBottom: 8 }}>Senha incorreta</p>}
        <button onClick={tentar} style={{ width: "100%", padding: "11px", background: C.black, color: C.cream, border: "none", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: FONTS.sans, letterSpacing: "0.04em" }}>
          Entrar
        </button>
      </div>
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
export default function App() {
  const [autenticado, setAutenticado] = useState(() => sessionStorage.getItem("verve_auth") === "1");
  const login = () => { sessionStorage.setItem("verve_auth", "1"); setAutenticado(true); };
  if (!autenticado) return <Login onLogin={login} />;
  return <Painel />;
}

// ─── PAINEL ───────────────────────────────────────────────────────────────────
function Painel() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("dashboard");
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState("info");
  const [search, setSearch] = useState("");
  const [dashTab, setDashTab] = useState("prioritarias");
  const emptyClient = { nome: "", instancia: "", plano: "Essencial", vencimento: "", pagamento: "pendente", status: "ativo", prompt: "", whatsapp: "", email: "", anotacoes: "", origem: "", checklist: { instancia: false, qr: false, prompt: false, testado: false, treinado: false }, mensagens_mes: 0, solicitacoes_humano: 0, pagamentos: [], log: [] };
  const [newClient, setNewClient] = useState(emptyClient);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/clientes`);
      const data = await res.json();
      setClients((Array.isArray(data) ? data : [data]).map(normalize));
    } catch { showToast("Erro ao carregar clientes", "error"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const saveClient = async () => {
    if (!newClient.nome || !newClient.instancia) { showToast("Preencha nome e instância", "error"); return; }
    try {
      await fetch(`${API}/clientes`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newClient) });
      await fetchClients();
      setNewClient(emptyClient);
      setView("list");
      showToast("Cliente cadastrado!");
    } catch { showToast("Erro ao cadastrar", "error"); }
  };

  const updateClientApi = async (id, changes) => {
    try {
      await fetch(`${API}/clientes/atualizar`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...changes }) });
      setClients(prev => prev.map(c => c.id === id ? { ...c, ...changes } : c));
      if (selected?.id === id) setSelected(prev => ({ ...prev, ...changes }));
    } catch { showToast("Erro ao atualizar", "error"); }
  };

  const cancelarCliente = async (id) => {
    try {
      await fetch(`${API}/clientes/cancelar`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      setClients(prev => prev.map(c => c.id === id ? { ...c, status: "cancelado" } : c));
      showToast("Cliente cancelado");
    } catch { showToast("Erro ao cancelar", "error"); }
  };

  const toggleStatus = async (id, action) => {
    if (action === "cancelar") { await cancelarCliente(id); return; }
    const status = action === "suspender" ? "suspenso" : "ativo";
    await updateClientApi(id, { status });
    showToast(action === "suspender" ? "Agente suspenso" : "Agente reativado!");
  };

  const addPaymentApi = async (clienteId, payment) => {
    try { await fetch(`${API}/pagamentos`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cliente_id: clienteId, ...payment }) }); }
    catch { showToast("Erro ao registrar pagamento", "error"); }
  };

  const openClient = (c) => { setSelected(c); setTab("info"); setView("client"); };
  const filtered = clients.filter(c => c.nome.toLowerCase().includes(search.toLowerCase()) || (c.instancia || "").toLowerCase().includes(search.toLowerCase()));

  // métricas
  const ativos = clients.filter(c => c.status === "ativo");
  const mrr = ativos.reduce((a, c) => a + (PLANO_VALOR[c.plano] || 0), 0);
  const churn = clients.filter(c => c.status === "cancelado").length;
  const atrasados = clients.filter(c => c.pagamento === "atrasado").length;
  const suspensos = clients.filter(c => c.status === "suspenso").length;
  const totalMensagens = clients.reduce((a, c) => a + (c.mensagens_mes || 0), 0);
  const renovados = clients.filter(c => c.status === "ativo" && (c.pagamentos || []).filter(p => p.status === "pago").length > 1).length;
  const taxaRenovacao = clients.length > 0 ? Math.round((renovados / clients.length) * 100) : 0;
  const fieis = clients.filter(c => c.status === "ativo" && monthsActive(c.criado_em) >= 3).length;
  const ltv = ativos.length > 0 ? Math.round(ativos.reduce((a, c) => a + (PLANO_VALOR[c.plano] || 0) * monthsActive(c.criado_em), 0) / ativos.length) : 0;
  const porPlano = PLANOS.map(p => ({ plano: p, count: ativos.filter(c => c.plano === p).length, receita: ativos.filter(c => c.plano === p).reduce((a, c) => a + (PLANO_VALOR[c.plano] || 0), 0) }));
  const novosMes = clients.filter(c => { const d = new Date(c.criado_em), n = new Date(); return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear(); }).length;
  const origens = clients.reduce((acc, c) => { if (c.origem) acc[c.origem] = (acc[c.origem] || 0) + 1; return acc; }, {});
  const mrrAtual = [...MRR_HISTORICO, { mes: "Jun", valor: mrr }];
  const mrrMax = Math.max(...mrrAtual.map(m => m.valor), 1);

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.cream, fontFamily: FONTS.sans }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontFamily: FONTS.serif, fontSize: 32, fontWeight: 500, color: C.black, letterSpacing: "-0.04em", marginBottom: 8 }}>Verve<span style={{ color: C.gold }}>.</span></div>
        <div style={{ color: C.stone, fontSize: 13 }}>Carregando clientes…</div>
      </div>
    </div>
  );

  // nav tab style
  const navTab = (active) => ({ background: "none", border: "none", padding: "8px 18px", cursor: "pointer", fontSize: 13, color: active ? C.black : C.stone, borderBottom: active ? `2px solid ${C.gold}` : "2px solid transparent", marginBottom: -1, fontWeight: active ? 500 : 400, fontFamily: FONTS.sans });

  return (
    <div style={{ minHeight: "100vh", background: C.cream, fontFamily: FONTS.sans, fontSize: 14 }}>

      {/* HEADER */}
      <div style={{ background: C.white, borderBottom: `1px solid ${C.line}`, padding: "0 28px", height: 58, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", lineHeight: 1 }}>
            <span style={{ fontFamily: FONTS.serif, fontSize: 26, fontWeight: 500, color: C.black, letterSpacing: "-0.04em" }}>Verve<span style={{ color: C.gold }}>.</span></span>
            <span style={{ fontSize: 8, letterSpacing: "0.26em", color: C.stone, textTransform: "uppercase", fontWeight: 700, marginTop: 1 }}>ADMIN</span>
          </div>
          <nav style={{ display: "flex", gap: 2 }}>
            {[["dashboard", "Dashboard"], ["list", "Clientes"]].map(([v, label]) => (
              <button key={v} onClick={() => setView(v)} style={{ background: view === v ? C.cream : "none", border: "none", color: view === v ? C.black : C.stone, padding: "6px 14px", borderRadius: 6, cursor: "pointer", fontSize: 13, fontFamily: FONTS.sans, fontWeight: view === v ? 500 : 400 }}>{label}</button>
            ))}
          </nav>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={fetchClients} style={{ ...bSt }}>↻ Atualizar</button>
          {(view === "client" || view === "form") && <button onClick={() => setView("list")} style={{ ...bSt }}>← Voltar</button>}
          {view !== "form" && <button onClick={() => setView("form")} style={{ ...bSt, background: C.black, color: C.cream, borderColor: C.black }}>+ Novo cliente</button>}
          <button onClick={() => { sessionStorage.removeItem("verve_auth"); window.location.reload(); }} style={{ ...bSt, color: C.stone, borderColor: C.line, fontSize: 12 }}>Sair</button>
        </div>
      </div>

      {/* TOAST */}
      {toast && <div style={{ position: "fixed", top: 16, right: 16, zIndex: 999, background: toast.type === "error" ? C.dangerTx : C.black, color: C.cream, padding: "10px 20px", borderRadius: 8, fontSize: 13 }}>{toast.msg}</div>}

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 20px" }}>

        {/* DASHBOARD */}
        {view === "dashboard" && (
          <>
            <div style={{ display: "flex", gap: 0, marginBottom: 24, borderBottom: `1px solid ${C.line}` }}>
              {[["prioritarias", "Prioritárias"], ["medias", "Semanais"], ["mensais", "Mensais"]].map(([t, label]) => (
                <button key={t} onClick={() => setDashTab(t)} style={navTab(dashTab === t)}>{label}</button>
              ))}
            </div>

            {dashTab === "prioritarias" && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
                  <MCard label="MRR Atual" value={fmt(mrr)} sub="receita recorrente mensal" accent={C.gold} />
                  <MCard label="Churn" value={churn} sub="clientes cancelados" accent={churn > 0 ? C.dangerTx : undefined} />
                  <MCard label="Pagamentos atrasados" value={atrasados} sub="aguardando cobrança" accent={atrasados > 0 ? C.warnTx : undefined} />
                  <MCard label="Agentes ativos" value={ativos.length} sub={`${suspensos} suspenso(s)`} accent={C.successTx} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 18 }}>
                  <Crd title="Evolução do MRR">
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 120 }}>
                      {mrrAtual.map((m, i) => (
                        <div key={m.mes} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                          <span style={{ fontSize: 9, color: C.stone }}>{fmt(m.valor).replace("R$\u00a0","R$")}</span>
                          <div style={{ width: "100%", background: i === mrrAtual.length - 1 ? C.gold : C.cream2, borderRadius: "4px 4px 0 0", height: `${Math.round((m.valor / mrrMax) * 80)}px`, minHeight: m.valor > 0 ? 4 : 0 }} />
                          <span style={{ fontSize: 10, color: C.stone }}>{m.mes}</span>
                        </div>
                      ))}
                    </div>
                  </Crd>
                  <Crd title="Alertas">
                    {!clients.some(c => isExpiring(c.vencimento) && c.status === "ativo") && atrasados === 0 && <p style={{ color: C.stone, fontSize: 13 }}>Nenhum alerta ✓</p>}
                    {clients.filter(c => isExpiring(c.vencimento) && c.status === "ativo").map(c => (
                      <div key={c.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `0.5px solid ${C.cream2}` }}>
                        <div><span style={{ fontWeight: 500, fontSize: 13 }}>{c.nome}</span><span style={{ fontSize: 11, color: C.warnTx, marginLeft: 8 }}>vence em {daysUntil(c.vencimento)}d</span></div>
                        <a href={`https://wa.me/${c.whatsapp}`} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: C.gold }}>Avisar →</a>
                      </div>
                    ))}
                    {clients.filter(c => c.pagamento === "atrasado").map(c => (
                      <div key={c.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `0.5px solid ${C.cream2}` }}>
                        <div><span style={{ fontWeight: 500, fontSize: 13 }}>{c.nome}</span><span style={{ fontSize: 11, color: C.dangerTx, marginLeft: 8 }}>pagamento atrasado</span></div>
                        <a href={`https://wa.me/${c.whatsapp}`} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: C.gold }}>Cobrar →</a>
                      </div>
                    ))}
                  </Crd>
                </div>
              </>
            )}

            {dashTab === "medias" && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
                  <MCard label="Msgs respondidas/mês" value={totalMensagens} sub="total todos os clientes" accent={C.successTx} />
                  <MCard label="Taxa de renovação" value={`${taxaRenovacao}%`} sub="clientes que renovaram" accent={taxaRenovacao >= 80 ? C.successTx : C.warnTx} />
                  <MCard label="Novos clientes/mês" value={novosMes} sub="adquiridos esse mês" />
                  <MCard label="Maior receita" value={fmt(Math.max(...porPlano.map(p => p.receita), 0))} sub={porPlano.find(p => p.receita === Math.max(...porPlano.map(x => x.receita)))?.plano} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
                  <Crd title="Mensagens por cliente">
                    {ativos.map(c => (
                      <div key={c.id} style={{ marginBottom: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: 13 }}>{c.nome}</span>
                          <span style={{ fontSize: 13, fontWeight: 500 }}>{c.mensagens_mes}</span>
                        </div>
                        <div style={{ height: 5, background: C.cream2, borderRadius: 4 }}>
                          <div style={{ height: "100%", background: C.gold, borderRadius: 4, width: `${Math.round((c.mensagens_mes / Math.max(...clients.map(x => x.mensagens_mes), 1)) * 100)}%` }} />
                        </div>
                      </div>
                    ))}
                  </Crd>
                  <Crd title="Receita por plano">
                    {porPlano.map(p => (
                      <div key={p.plano} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `0.5px solid ${C.cream2}` }}>
                        <div><span style={{ fontSize: 13, fontWeight: 500 }}>{p.plano}</span><span style={{ fontSize: 11, color: C.stone, marginLeft: 8 }}>{p.count} cliente(s)</span></div>
                        <span style={{ fontSize: 13, color: C.gold, fontWeight: 500 }}>{fmt(p.receita)}/mês</span>
                      </div>
                    ))}
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", fontWeight: 500 }}>
                      <span>Total</span><span style={{ color: C.gold }}>{fmt(mrr)}/mês</span>
                    </div>
                  </Crd>
                </div>
              </>
            )}

            {dashTab === "mensais" && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
                  <MCard label="LTV médio" value={fmt(ltv)} sub="valor médio por cliente" />
                  <MCard label="Clientes fiéis" value={fieis} sub="+3 meses ativos" accent={C.successTx} />
                  <MCard label="Solicit. de atendente" value={clients.reduce((a, c) => a + (c.solicitacoes_humano || 0), 0)} sub="total este mês" />
                  <MCard label="Origem principal" value={Object.entries(origens).sort((a, b) => b[1] - a[1])[0]?.[0] || "–"} sub="canal que mais traz" />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
                  <Crd title="Origem dos clientes">
                    {Object.entries(origens).length === 0 && <p style={{ color: C.stone, fontSize: 13 }}>Nenhuma origem cadastrada</p>}
                    {Object.entries(origens).sort((a, b) => b[1] - a[1]).map(([origem, count]) => (
                      <div key={origem} style={{ marginBottom: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: 13 }}>{origem}</span><span style={{ fontSize: 13, fontWeight: 500 }}>{count}</span>
                        </div>
                        <div style={{ height: 5, background: C.cream2, borderRadius: 4 }}>
                          <div style={{ height: "100%", background: C.gold, borderRadius: 4, width: `${Math.round((count / clients.length) * 100)}%` }} />
                        </div>
                      </div>
                    ))}
                  </Crd>
                  <Crd title="Fidelização">
                    {ativos.map(c => (
                      <div key={c.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `0.5px solid ${C.cream2}` }}>
                        <span style={{ fontSize: 13 }}>{c.nome}</span>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <span style={{ fontSize: 13, color: C.stone }}>{monthsActive(c.criado_em)} meses</span>
                          {monthsActive(c.criado_em) >= 3 && <Bdg bg={C.success} color={C.successTx} label="Fiel" />}
                        </div>
                      </div>
                    ))}
                  </Crd>
                </div>
              </>
            )}
          </>
        )}

        {/* LIST */}
        {view === "list" && (
          <Crd title="">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <span style={{ fontWeight: 500 }}>Todos os clientes ({clients.length})</span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar…" style={{ ...iSt, width: 200, padding: "6px 12px" }} />
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: C.cream }}>
                    {["Negócio","Instância","Plano","Status","Msgs/mês","Vencimento","Pagamento","Ações"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "10px 14px", fontSize: 11, fontWeight: 600, color: C.stone, borderBottom: `1px solid ${C.line}`, whiteSpace: "nowrap", letterSpacing: "0.04em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && <tr><td colSpan={8} style={{ padding: 32, textAlign: "center", color: C.stone }}>Nenhum cliente</td></tr>}
                  {filtered.map(c => (
                    <tr key={c.id} style={{ borderBottom: `0.5px solid ${C.cream2}` }}>
                      <td style={{ padding: "11px 14px" }}>
                        <button onClick={() => openClient(c)} style={{ background: "none", border: "none", cursor: "pointer", fontWeight: 500, color: C.black, fontSize: 13, padding: 0, textDecoration: "underline", textDecorationColor: C.line, fontFamily: FONTS.sans }}>{c.nome}</button>
                      </td>
                      <td style={{ padding: "11px 14px", fontFamily: "monospace", fontSize: 11, color: C.stone }}>{c.instancia_evolution || c.instancia}</td>
                      <td style={{ padding: "11px 14px" }}>{c.plano}</td>
                      <td style={{ padding: "11px 14px" }}><Bdg bg={statusColor[c.status]?.bg} color={statusColor[c.status]?.color} label={statusColor[c.status]?.label} /></td>
                      <td style={{ padding: "11px 14px", color: C.stone }}>{c.mensagens_mes}</td>
                      <td style={{ padding: "11px 14px", color: isExpiring(c.vencimento) ? C.dangerTx : undefined }}>{fmtDate(c.vencimento)}</td>
                      <td style={{ padding: "11px 14px" }}><Bdg bg={pagColor[c.pagamento]?.bg} color={pagColor[c.pagamento]?.color} label={c.pagamento} /></td>
                      <td style={{ padding: "11px 14px" }}>
                        <div style={{ display: "flex", gap: 4 }}>
                          <IBtn title="Abrir" onClick={() => openClient(c)}>📋</IBtn>
                          {c.status === "ativo" && <IBtn title="Suspender" onClick={() => toggleStatus(c.id, "suspender")}>⏸️</IBtn>}
                          {c.status === "suspenso" && <IBtn title="Reativar" onClick={() => toggleStatus(c.id, "reativar")}>▶️</IBtn>}
                          {c.whatsapp && <a href={`https://wa.me/${c.whatsapp}`} target="_blank" rel="noreferrer" style={{ fontSize: 15, padding: "4px 6px" }}>💬</a>}
                          {c.status !== "cancelado" && <IBtn title="Cancelar" onClick={() => setConfirmDelete(c.id)}>🗑️</IBtn>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Crd>
        )}

        {/* CLIENT */}
        {view === "client" && selected && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 500, marginBottom: 8, fontFamily: FONTS.serif, letterSpacing: "-0.02em" }}>{selected.nome}</h1>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontFamily: "monospace", fontSize: 12, color: C.stone }}>{selected.instancia_evolution || selected.instancia}</span>
                  <Bdg bg={statusColor[selected.status]?.bg} color={statusColor[selected.status]?.color} label={statusColor[selected.status]?.label} />
                  <Bdg bg={pagColor[selected.pagamento]?.bg} color={pagColor[selected.pagamento]?.color} label={selected.pagamento} />
                  {monthsActive(selected.criado_em) >= 3 && <Bdg bg={C.success} color={C.successTx} label="Cliente fiel" />}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {selected.whatsapp && <a href={`https://wa.me/${selected.whatsapp}`} target="_blank" rel="noreferrer" style={{ ...bSt, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>💬 WhatsApp</a>}
                {selected.status === "ativo" && <button onClick={() => toggleStatus(selected.id, "suspender")} style={bSt}>⏸️ Suspender</button>}
                {selected.status === "suspenso" && <button onClick={() => toggleStatus(selected.id, "reativar")} style={{ ...bSt, background: C.black, color: C.cream, borderColor: C.black }}>▶️ Reativar</button>}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
              <MCard label="Plano" value={selected.plano} />
              <MCard label="Msgs este mês" value={selected.mensagens_mes} accent={C.gold} />
              <MCard label="Tempo de casa" value={`${monthsActive(selected.criado_em)} meses`} />
              <MCard label="Valor mensal" value={fmt(PLANO_VALOR[selected.plano] || 0)} />
            </div>

            <div style={{ display: "flex", gap: 0, marginBottom: 20, borderBottom: `1px solid ${C.line}` }}>
              {[["info","Informações"],["prompt","Prompt"],["checklist","Onboarding"],["pagamentos","Pagamentos"],["log","Histórico"]].map(([t, label]) => (
                <button key={t} onClick={() => setTab(t)} style={navTab(tab === t)}>{label}</button>
              ))}
            </div>

            {tab === "info" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
                <Crd title="Contato">
                  <FF label="WhatsApp"><input style={iSt} value={selected.whatsapp || ""} onChange={e => { const v = e.target.value; setSelected(p => ({ ...p, whatsapp: v })); }} onBlur={e => updateClientApi(selected.id, { whatsapp: e.target.value })} /></FF>
                  <div style={{ marginTop: 12 }}><FF label="Email"><input style={iSt} value={selected.email || ""} onChange={e => { const v = e.target.value; setSelected(p => ({ ...p, email: v })); }} onBlur={e => updateClientApi(selected.id, { email: e.target.value })} /></FF></div>
                  <div style={{ marginTop: 12 }}><FF label="Origem"><input style={iSt} value={selected.origem || ""} onChange={e => { const v = e.target.value; setSelected(p => ({ ...p, origem: v })); }} onBlur={e => updateClientApi(selected.id, { origem: e.target.value })} placeholder="Ex: Indicação, Instagram…" /></FF></div>
                </Crd>
                <Crd title="Anotações">
                  <AnotEditor value={selected.anotacoes || ""} onSave={async (v) => { await updateClientApi(selected.id, { anotacoes: v }); showToast("Anotações salvas!"); }} />
                </Crd>
              </div>
            )}

            {tab === "prompt" && (
              <Crd title="Prompt do agente">
                <PromptEditor value={selected.prompt || ""} onSave={async (v) => { await updateClientApi(selected.id, { prompt: v }); showToast("Prompt salvo!"); }} />
              </Crd>
            )}

            {tab === "checklist" && (
              <Crd title="Checklist de onboarding">
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {Object.entries(CHECKLIST_LABELS).map(([key, label]) => {
                    const checked = selected.checklist?.[key];
                    return (
                      <div key={key} onClick={async () => { const checklist = { ...selected.checklist, [key]: !checked }; await updateClientApi(selected.id, { checklist }); }}
                        style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", padding: "10px 14px", borderRadius: 8, border: `1px solid ${checked ? C.gold : C.line}`, background: checked ? "#FAF5EC" : C.white }}>
                        <div style={{ width: 20, height: 20, borderRadius: 4, border: `2px solid ${checked ? C.gold : C.line}`, background: checked ? C.gold : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {checked && <span style={{ color: C.white, fontSize: 12 }}>✓</span>}
                        </div>
                        <span style={{ fontSize: 14, color: checked ? C.goldDk : C.black, fontWeight: checked ? 500 : 400 }}>{label}</span>
                      </div>
                    );
                  })}
                </div>
                <div style={{ marginTop: 16, padding: 12, background: C.cream, borderRadius: 8 }}>
                  <span style={{ fontSize: 12, color: C.stone }}>{Object.values(selected.checklist || {}).filter(Boolean).length} de {Object.keys(CHECKLIST_LABELS).length} etapas</span>
                  <div style={{ marginTop: 8, height: 4, background: C.line, borderRadius: 4 }}>
                    <div style={{ height: "100%", background: C.gold, borderRadius: 4, width: `${Math.round((Object.values(selected.checklist || {}).filter(Boolean).length / Object.keys(CHECKLIST_LABELS).length) * 100)}%` }} />
                  </div>
                </div>
              </Crd>
            )}

            {tab === "pagamentos" && (
              <Crd title="Pagamentos">
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, marginBottom: 20 }}>
                  <thead><tr>{["Data","Valor","Status"].map(h => <th key={h} style={{ textAlign: "left", padding: "8px 14px", fontSize: 11, fontWeight: 600, color: C.stone, borderBottom: `1px solid ${C.line}`, letterSpacing: "0.04em" }}>{h}</th>)}</tr></thead>
                  <tbody>
                    {(selected.pagamentos || []).length === 0 && <tr><td colSpan={3} style={{ padding: 20, color: C.stone, textAlign: "center" }}>Nenhum pagamento</td></tr>}
                    {[...(selected.pagamentos || [])].reverse().map((p, i) => (
                      <tr key={i} style={{ borderBottom: `0.5px solid ${C.cream2}` }}>
                        <td style={{ padding: "10px 14px" }}>{fmtDate(p.data)}</td>
                        <td style={{ padding: "10px 14px" }}>{fmt(p.valor)}</td>
                        <td style={{ padding: "10px 14px" }}><Bdg bg={pagColor[p.status]?.bg} color={pagColor[p.status]?.color} label={p.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ borderTop: `1px solid ${C.line}`, paddingTop: 16 }}>
                  <p style={{ fontWeight: 500, fontSize: 13, marginBottom: 12 }}>Registrar pagamento</p>
                  <AddPayForm onAdd={async (p) => {
                    await addPaymentApi(selected.id, p);
                    const pagamentos = [...(selected.pagamentos || []), p];
                    await updateClientApi(selected.id, { pagamentos, pagamento: p.status === "pago" ? "em dia" : p.status });
                    showToast("Pagamento registrado!");
                  }} plano={selected.plano} />
                </div>
              </Crd>
            )}

            {tab === "log" && (
              <Crd title="Histórico">
                {(selected.log || []).length === 0 && <p style={{ color: C.stone, fontSize: 13 }}>Nenhum registro</p>}
                {[...(selected.log || [])].reverse().map((l, i) => (
                  <div key={i} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: `0.5px solid ${C.cream2}` }}>
                    <span style={{ fontSize: 11, color: C.stone, whiteSpace: "nowrap" }}>{fmtDate(l.data)}</span>
                    <span style={{ fontSize: 13 }}>{l.msg}</span>
                  </div>
                ))}
              </Crd>
            )}
          </>
        )}

        {/* FORM */}
        {view === "form" && (
          <div style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.line}`, padding: 32, maxWidth: 640, margin: "0 auto" }}>
            <h2 style={{ fontSize: 20, fontWeight: 500, marginBottom: 24, fontFamily: FONTS.serif, letterSpacing: "-0.02em" }}>Novo cliente</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
              <FF label="Nome do negócio"><input style={iSt} value={newClient.nome} onChange={e => setNewClient({ ...newClient, nome: e.target.value })} placeholder="Ex: Bella Studio" /></FF>
              <FF label="Instância Evolution API"><input style={iSt} value={newClient.instancia} onChange={e => setNewClient({ ...newClient, instancia: e.target.value.toLowerCase().replace(/\s/g, "-") })} placeholder="Ex: bella-studio" /></FF>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
              <FF label="Plano"><select style={iSt} value={newClient.plano} onChange={e => setNewClient({ ...newClient, plano: e.target.value })}>{PLANOS.map(p => <option key={p}>{p}</option>)}</select></FF>
              <FF label="Status pagamento"><select style={iSt} value={newClient.pagamento} onChange={e => setNewClient({ ...newClient, pagamento: e.target.value })}>{["em dia","pendente","atrasado"].map(s => <option key={s}>{s}</option>)}</select></FF>
              <FF label="Vencimento"><input style={iSt} type="date" value={newClient.vencimento} onChange={e => setNewClient({ ...newClient, vencimento: e.target.value })} /></FF>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
              <FF label="WhatsApp"><input style={iSt} value={newClient.whatsapp} onChange={e => setNewClient({ ...newClient, whatsapp: e.target.value })} placeholder="5551999999999" /></FF>
              <FF label="Email"><input style={iSt} value={newClient.email} onChange={e => setNewClient({ ...newClient, email: e.target.value })} placeholder="cliente@exemplo.com" /></FF>
              <FF label="Origem"><input style={iSt} value={newClient.origem} onChange={e => setNewClient({ ...newClient, origem: e.target.value })} placeholder="Ex: Indicação" /></FF>
            </div>
            <FF label="Prompt do agente"><textarea style={{ ...iSt, minHeight: 120, fontFamily: "monospace", fontSize: 12, resize: "vertical" }} value={newClient.prompt} onChange={e => setNewClient({ ...newClient, prompt: e.target.value })} placeholder="Você é a [Nome], assistente do [Negócio]…" /></FF>
            <div style={{ marginTop: 14 }}><FF label="Anotações iniciais"><textarea style={{ ...iSt, minHeight: 60, resize: "vertical" }} value={newClient.anotacoes} onChange={e => setNewClient({ ...newClient, anotacoes: e.target.value })} /></FF></div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 24 }}>
              <button onClick={() => setView("list")} style={bSt}>Cancelar</button>
              <button onClick={saveClient} style={{ ...bSt, background: C.black, color: C.cream, borderColor: C.black }}>Cadastrar cliente</button>
            </div>
          </div>
        )}

        {/* MODAL CANCELAR */}
        {confirmDelete && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(27,27,27,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
            <div style={{ background: C.white, borderRadius: 14, padding: 32, maxWidth: 360, width: "90%", border: `1px solid ${C.line}` }}>
              <p style={{ fontWeight: 500, marginBottom: 8 }}>Cancelar cliente?</p>
              <p style={{ color: C.stone, fontSize: 13, marginBottom: 24 }}>O agente será desativado permanentemente.</p>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button onClick={() => setConfirmDelete(null)} style={bSt}>Voltar</button>
                <button onClick={() => { toggleStatus(confirmDelete, "cancelar"); setConfirmDelete(null); }} style={{ ...bSt, background: C.dangerTx, color: C.white, borderColor: C.dangerTx }}>Confirmar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SUBCOMPONENTES ───────────────────────────────────────────────────────────
function PromptEditor({ value, onSave }) {
  const [v, setV] = useState(value);
  return (<><textarea style={{ ...iSt, minHeight: 300, fontFamily: "monospace", fontSize: 12, resize: "vertical", width: "100%" }} value={v} onChange={e => setV(e.target.value)} /><div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}><button onClick={() => onSave(v)} style={{ ...bSt, background: C.black, color: C.cream, borderColor: C.black }}>Salvar prompt</button></div></>);
}

function AnotEditor({ value, onSave }) {
  const [v, setV] = useState(value);
  return (<><textarea style={{ ...iSt, minHeight: 120, resize: "vertical", width: "100%" }} value={v} onChange={e => setV(e.target.value)} /><div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}><button onClick={() => onSave(v)} style={{ ...bSt, fontSize: 12, padding: "5px 12px" }}>Salvar</button></div></>);
}

function AddPayForm({ onAdd, plano }) {
  const valor = PLANO_VALOR[plano] || 297;
  const [form, setForm] = useState({ data: today(), valor, status: "pago" });
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 10, alignItems: "end" }}>
      <FF label="Data"><input type="date" style={iSt} value={form.data} onChange={e => setForm({ ...form, data: e.target.value })} /></FF>
      <FF label="Valor (R$)"><input type="number" style={iSt} value={form.valor} onChange={e => setForm({ ...form, valor: Number(e.target.value) })} /></FF>
      <FF label="Status"><select style={iSt} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}><option value="pago">pago</option><option value="pendente">pendente</option><option value="atrasado">atrasado</option></select></FF>
      <button onClick={() => onAdd(form)} style={{ ...bSt, background: C.black, color: C.cream, borderColor: C.black, height: 36, whiteSpace: "nowrap" }}>+ Registrar</button>
    </div>
  );
}

function Crd({ title, children }) {
  return (
    <div style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.line}`, padding: 20 }}>
      {title && <p style={{ fontWeight: 500, fontSize: 14, marginBottom: 16, color: C.black }}>{title}</p>}
      {children}
    </div>
  );
}

function MCard({ label, value, sub, accent }) {
  return (
    <div style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.line}`, padding: "16px 20px" }}>
      <div style={{ fontSize: 11, color: C.stone, marginBottom: 6, letterSpacing: "0.04em", textTransform: "uppercase", fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 500, color: accent || C.black, fontFamily: FONTS.serif, letterSpacing: "-0.02em" }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: C.stone, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function Bdg({ bg, color, label }) {
  return <span style={{ background: bg, color, padding: "3px 10px", borderRadius: 100, fontSize: 11, fontWeight: 500, whiteSpace: "nowrap" }}>{label}</span>;
}

function IBtn({ children, onClick, title }) {
  return <button onClick={onClick} title={title} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 15, padding: "4px 6px", borderRadius: 6 }}>{children}</button>;
}

function FF({ label, children }) {
  return (<div><label style={{ fontSize: 12, color: C.stone, display: "block", marginBottom: 4, fontWeight: 500 }}>{label}</label>{children}</div>);
}

const bSt = { padding: "7px 16px", borderRadius: 8, fontSize: 13, cursor: "pointer", border: `1px solid ${C.line}`, background: C.white, color: C.black, fontFamily: FONTS.sans };
const iSt = { width: "100%", padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.line}`, background: C.white, color: C.black, fontSize: 13, fontFamily: FONTS.sans, boxSizing: "border-box" };
