import { useState, useEffect, useCallback } from "react";

const API = "https://primary-production-3fd339.up.railway.app/webhook";
const SENHA = process.env.REACT_APP_ADMIN_SENHA;

function Login({ onLogin }) {
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState(false);

  const tentar = () => {
    if (senha === SENHA) { onLogin(); }
    else { setErro(true); setSenha(""); setTimeout(() => setErro(false), 2000); }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0d0d0d", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Manrope','Inter',sans-serif" }}>
      <div style={{ background: "#fff", borderRadius: 12, padding: 40, width: 340, textAlign: "center" }}>
        <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Flow<span style={{ color: "#0a6e50" }}>IA</span></div>
        <div style={{ fontSize: 11, letterSpacing: 3, color: "#7a7570", marginBottom: 32 }}>ADMIN</div>
        <input
          type="password"
          value={senha}
          onChange={e => setSenha(e.target.value)}
          onKeyDown={e => e.key === "Enter" && tentar()}
          placeholder="Senha de acesso"
          style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: `1.5px solid ${erro ? "#791F1F" : "#e0dbd2"}`, fontSize: 14, marginBottom: 12, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
          autoFocus
        />
        {erro && <p style={{ color: "#791F1F", fontSize: 12, marginBottom: 8 }}>Senha incorreta</p>}
        <button onClick={tentar} style={{ width: "100%", padding: "10px", background: "#0a6e50", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
          Entrar
        </button>
      </div>
    </div>
  );
}

const PLANOS = ["Essencial", "Crescimento"];
const PLANO_VALOR = { Essencial: 297, Crescimento: 597, essencial: 297, crescimento: 597 };
const CHECKLIST_LABELS = { instancia: "Instância criada", qr: "QR Code conectado", prompt: "Prompt configurado", testado: "Agente testado", treinado: "Cliente treinado" };
const MRR_HISTORICO = [{ mes: "Jan", valor: 0 }, { mes: "Fev", valor: 1094 }, { mes: "Mar", valor: 1788 }, { mes: "Abr", valor: 1788 }, { mes: "Mai", valor: 1094 }];

const statusColor = {
  ativo: { bg: "#E1F5EE", color: "#085041", label: "Ativo" },
  suspenso: { bg: "#FAEEDA", color: "#633806", label: "Suspenso" },
  cancelado: { bg: "#FCEBEB", color: "#791F1F", label: "Cancelado" },
};
const pagColor = {
  "em dia": { bg: "#E1F5EE", color: "#085041" },
  pendente: { bg: "#FAEEDA", color: "#633806" },
  atrasado: { bg: "#FCEBEB", color: "#791F1F" },
  pago: { bg: "#E1F5EE", color: "#085041" },
};

const fmt = (v) => Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = (d) => { if (!d) return "-"; const [y, m, day] = d.split("T")[0].split("-"); return `${day}/${m}/${y}`; };
const daysUntil = (d) => d ? Math.ceil((new Date(d) - new Date()) / 86400000) : null;
const isExpiring = (d) => { const n = daysUntil(d); return n !== null && n >= 0 && n <= 7; };
const today = () => new Date().toISOString().split("T")[0];
const monthsActive = (d) => d ? Math.floor((new Date() - new Date(d)) / (30 * 86400000)) : 0;

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

export default function App() {
  const [autenticado, setAutenticado] = useState(() => sessionStorage.getItem("flowia_auth") === "1");

  const login = () => { sessionStorage.setItem("flowia_auth", "1"); setAutenticado(true); };

  if (!autenticado) return <Login onLogin={login} />;

  return <Painel />;
}

function Painel() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("dashboard");
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState("info");
  const [search, setSearch] = useState("");
  const [dashTab, setDashTab] = useState("prioritarias");
  const [newClient, setNewClient] = useState({ nome: "", instancia: "", plano: "Essencial", vencimento: "", pagamento: "pendente", status: "ativo", prompt: "", whatsapp: "", email: "", anotacoes: "", origem: "", checklist: { instancia: false, qr: false, prompt: false, testado: false, treinado: false }, mensagens_mes: 0, solicitacoes_humano: 0, pagamentos: [], log: [] });
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/clientes`);
      const data = await res.json();
      const arr = Array.isArray(data) ? data : [data];
      setClients(arr.map(normalize));
    } catch (e) {
      showToast("Erro ao carregar clientes", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const saveClient = async () => {
    if (!newClient.nome || !newClient.instancia) { showToast("Preencha nome e instância", "error"); return; }
    try {
      await fetch(`${API}/clientes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newClient),
      });
      await fetchClients();
      setNewClient({ nome: "", instancia: "", plano: "Essencial", vencimento: "", pagamento: "pendente", status: "ativo", prompt: "", whatsapp: "", email: "", anotacoes: "", origem: "", checklist: { instancia: false, qr: false, prompt: false, testado: false, treinado: false }, mensagens_mes: 0, solicitacoes_humano: 0, pagamentos: [], log: [] });
      setView("list");
      showToast("Cliente cadastrado!");
    } catch (e) { showToast("Erro ao cadastrar", "error"); }
  };

  const updateClientApi = async (id, changes) => {
    try {
      await fetch(`${API}/clientes/atualizar`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...changes }),
      });
      setClients(prev => prev.map(c => c.id === id ? { ...c, ...changes } : c));
      if (selected?.id === id) setSelected(prev => ({ ...prev, ...changes }));
    } catch (e) { showToast("Erro ao atualizar", "error"); }
  };

  const cancelarCliente = async (id) => {
    try {
      await fetch(`${API}/clientes/cancelar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setClients(prev => prev.map(c => c.id === id ? { ...c, status: "cancelado" } : c));
      showToast("Cliente cancelado");
    } catch (e) { showToast("Erro ao cancelar", "error"); }
  };

  const toggleStatus = async (id, action) => {
    if (action === "cancelar") { await cancelarCliente(id); return; }
    const status = action === "suspender" ? "suspenso" : "ativo";
    await updateClientApi(id, { status });
    showToast(action === "suspender" ? "Agente suspenso" : "Agente reativado!");
  };

  const addPaymentApi = async (clienteId, payment) => {
    try {
      await fetch(`${API}/pagamentos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cliente_id: clienteId, ...payment }),
      });
    } catch (e) { showToast("Erro ao registrar pagamento", "error"); }
  };

  const openClient = (c) => { setSelected(c); setTab("info"); setView("client"); };

  const filtered = clients.filter(c => c.nome.toLowerCase().includes(search.toLowerCase()) || (c.instancia || "").toLowerCase().includes(search.toLowerCase()));

  // MÉTRICAS
  const ativos = clients.filter(c => c.status === "ativo");
  const mrr = ativos.reduce((a, c) => a + (PLANO_VALOR[c.plano] || 0), 0);
  const churn = clients.filter(c => c.status === "cancelado").length;
  const atrasados = clients.filter(c => c.pagamento === "atrasado").length;
  const suspensos = clients.filter(c => c.status === "suspenso").length;
  const vencendo = clients.filter(c => c.status === "ativo" && isExpiring(c.vencimento)).length;
  const totalMensagens = clients.reduce((a, c) => a + (c.mensagens_mes || 0), 0);
  const renovados = clients.filter(c => c.status === "ativo" && (c.pagamentos || []).filter(p => p.status === "pago").length > 1).length;
  const taxaRenovacao = clients.length > 0 ? Math.round((renovados / clients.length) * 100) : 0;
  const fieis = clients.filter(c => c.status === "ativo" && monthsActive(c.criado_em) >= 3).length;
  const ltv = ativos.length > 0 ? Math.round(ativos.reduce((a, c) => a + (PLANO_VALOR[c.plano] || 0) * monthsActive(c.criado_em), 0) / ativos.length) : 0;
  const porPlano = PLANOS.map(p => ({ plano: p, count: ativos.filter(c => c.plano === p).length, receita: ativos.filter(c => c.plano === p).reduce((a, c) => a + (PLANO_VALOR[c.plano] || 0), 0) }));
  const novosMes = clients.filter(c => { const d = new Date(c.criado_em); const n = new Date(); return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear(); }).length;
  const origens = clients.reduce((acc, c) => { if (c.origem) acc[c.origem] = (acc[c.origem] || 0) + 1; return acc; }, {});
  const mrrAtual = [...MRR_HISTORICO, { mes: "Jun", valor: mrr }];
  const mrrMax = Math.max(...mrrAtual.map(m => m.valor), 1);

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f4f0", fontFamily: "sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Flow<span style={{ color: "#0a6e50" }}>IA</span></div>
        <div style={{ color: "#7a7570", fontSize: 13 }}>Carregando clientes...</div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f5f4f0", fontFamily: "'Manrope','Inter',sans-serif", fontSize: 14 }}>
      <div style={{ background: "#0d0d0d", color: "#f0ede6", padding: "0 24px", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: 1 }}>Flow<span style={{ color: "#0a6e50" }}>IA</span><span style={{ fontSize: 10, letterSpacing: 3, color: "rgba(240,237,230,0.35)", marginLeft: 8, fontWeight: 400 }}>ADMIN</span></div>
          <nav style={{ display: "flex", gap: 4 }}>
            {[["dashboard", "Dashboard"], ["list", "Clientes"]].map(([v, label]) => (
              <button key={v} onClick={() => setView(v)} style={{ background: view === v ? "rgba(255,255,255,0.1)" : "none", border: "none", color: view === v ? "#fff" : "rgba(240,237,230,0.5)", padding: "6px 14px", borderRadius: 6, cursor: "pointer", fontSize: 13 }}>{label}</button>
            ))}
          </nav>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={fetchClients} style={{ ...btnSt, background: "transparent", color: "#f0ede6", borderColor: "rgba(255,255,255,0.3)", fontSize: 12 }}>↻ Atualizar</button>
          {(view === "client" || view === "form") && <button onClick={() => setView("list")} style={{ ...btnSt, color: "rgba(240,237,230,0.7)", borderColor: "rgba(255,255,255,0.15)" }}>← Voltar</button>}
          {view !== "form" && <button onClick={() => setView("form")} style={{ ...btnSt, background: "#0a6e50", color: "#fff", borderColor: "#0a6e50" }}>+ Novo cliente</button>}
          <button onClick={() => { sessionStorage.removeItem("flowia_auth"); window.location.reload(); }} style={{ ...btnSt, background: "transparent", color: "rgba(240,237,230,0.4)", borderColor: "rgba(255,255,255,0.1)", fontSize: 12 }}>Sair</button>
        </div>
      </div>

      {toast && <div style={{ position: "fixed", top: 16, right: 16, zIndex: 999, background: toast.type === "error" ? "#791F1F" : "#085041", color: "#fff", padding: "10px 20px", borderRadius: 8, fontSize: 13 }}>{toast.msg}</div>}

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px" }}>

        {/* DASHBOARD */}
        {view === "dashboard" && (
          <>
            <div style={{ display: "flex", gap: 0, marginBottom: 20, borderBottom: "0.5px solid #e0dbd2" }}>
              {[["prioritarias", "🔴 Prioritárias"], ["medias", "🟡 Semanais"], ["mensais", "🔵 Mensais"]].map(([t, label]) => (
                <button key={t} onClick={() => setDashTab(t)} style={{ background: "none", border: "none", padding: "8px 20px", cursor: "pointer", fontSize: 13, color: dashTab === t ? "#0d0d0d" : "#7a7570", borderBottom: dashTab === t ? "2px solid #0d0d0d" : "2px solid transparent", marginBottom: -1, fontWeight: dashTab === t ? 500 : 400 }}>{label}</button>
              ))}
            </div>

            {dashTab === "prioritarias" && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
                  <MetricCard label="MRR Atual" value={fmt(mrr)} sub="receita recorrente mensal" color="#0a6e50" />
                  <MetricCard label="Churn" value={churn} sub="clientes cancelados" color={churn > 0 ? "#791F1F" : undefined} />
                  <MetricCard label="Pagamentos atrasados" value={atrasados} sub="aguardando cobrança" color={atrasados > 0 ? "#854F0B" : undefined} />
                  <MetricCard label="Agentes ativos" value={ativos.length} sub={`${suspensos} suspenso(s)`} color="#0a6e50" />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 16 }}>
                  <Card title="Evolução do MRR">
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 120 }}>
                      {mrrAtual.map((m, i) => (
                        <div key={m.mes} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                          <span style={{ fontSize: 9, color: "#7a7570" }}>{fmt(m.valor).replace("R$\u00a0", "R$")}</span>
                          <div style={{ width: "100%", background: i === mrrAtual.length - 1 ? "#0a6e50" : "#E1F5EE", borderRadius: "4px 4px 0 0", height: `${Math.round((m.valor / mrrMax) * 80)}px`, minHeight: m.valor > 0 ? 4 : 0 }} />
                          <span style={{ fontSize: 10, color: "#7a7570" }}>{m.mes}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                  <Card title="Alertas">
                    {vencendo === 0 && atrasados === 0 && <p style={{ color: "#7a7570", fontSize: 13 }}>Nenhum alerta ✓</p>}
                    {clients.filter(c => isExpiring(c.vencimento) && c.status === "ativo").map(c => (
                      <div key={c.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "0.5px solid #f0ede6" }}>
                        <div><span style={{ fontWeight: 500, fontSize: 13 }}>{c.nome}</span><span style={{ fontSize: 11, color: "#854F0B", marginLeft: 8 }}>vence em {daysUntil(c.vencimento)}d</span></div>
                        <a href={`https://wa.me/${c.whatsapp}`} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: "#0a6e50", textDecoration: "none" }}>Avisar →</a>
                      </div>
                    ))}
                    {clients.filter(c => c.pagamento === "atrasado").map(c => (
                      <div key={c.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "0.5px solid #f0ede6" }}>
                        <div><span style={{ fontWeight: 500, fontSize: 13 }}>{c.nome}</span><span style={{ fontSize: 11, color: "#791F1F", marginLeft: 8 }}>pagamento atrasado</span></div>
                        <a href={`https://wa.me/${c.whatsapp}`} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: "#0a6e50", textDecoration: "none" }}>Cobrar →</a>
                      </div>
                    ))}
                  </Card>
                </div>
              </>
            )}

            {dashTab === "medias" && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
                  <MetricCard label="Msgs respondidas/mês" value={totalMensagens} sub="total todos os clientes" color="#0a6e50" />
                  <MetricCard label="Taxa de renovação" value={`${taxaRenovacao}%`} sub="clientes que renovaram" color={taxaRenovacao >= 80 ? "#0a6e50" : "#854F0B"} />
                  <MetricCard label="Novos clientes/mês" value={novosMes} sub="adquiridos esse mês" />
                  <MetricCard label="Maior receita" value={fmt(Math.max(...porPlano.map(p => p.receita), 0))} sub={porPlano.find(p => p.receita === Math.max(...porPlano.map(x => x.receita)))?.plano} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <Card title="Mensagens por cliente este mês">
                    {ativos.length === 0 && <p style={{ color: "#7a7570", fontSize: 13 }}>Nenhum cliente ativo</p>}
                    {ativos.map(c => (
                      <div key={c.id} style={{ marginBottom: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: 13 }}>{c.nome}</span>
                          <span style={{ fontSize: 13, fontWeight: 500 }}>{c.mensagens_mes}</span>
                        </div>
                        <div style={{ height: 6, background: "#f0ede6", borderRadius: 4 }}>
                          <div style={{ height: "100%", background: "#0a6e50", borderRadius: 4, width: `${Math.round((c.mensagens_mes / Math.max(...clients.map(x => x.mensagens_mes), 1)) * 100)}%` }} />
                        </div>
                      </div>
                    ))}
                  </Card>
                  <Card title="Receita por plano">
                    {porPlano.map(p => (
                      <div key={p.plano} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "0.5px solid #f0ede6" }}>
                        <div><span style={{ fontSize: 13, fontWeight: 500 }}>{p.plano}</span><span style={{ fontSize: 11, color: "#7a7570", marginLeft: 8 }}>{p.count} cliente(s)</span></div>
                        <span style={{ fontSize: 13, color: "#0a6e50", fontWeight: 500 }}>{fmt(p.receita)}/mês</span>
                      </div>
                    ))}
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", fontWeight: 500 }}>
                      <span>Total</span><span style={{ color: "#0a6e50" }}>{fmt(mrr)}/mês</span>
                    </div>
                  </Card>
                </div>
              </>
            )}

            {dashTab === "mensais" && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
                  <MetricCard label="LTV médio" value={fmt(ltv)} sub="valor médio por cliente" />
                  <MetricCard label="Clientes fiéis (+3 meses)" value={fieis} sub="ativos há mais de 3 meses" color="#0a6e50" />
                  <MetricCard label="Solicit. de atendente" value={clients.reduce((a, c) => a + (c.solicitacoes_humano || 0), 0)} sub="total este mês" />
                  <MetricCard label="Origem principal" value={Object.entries(origens).sort((a, b) => b[1] - a[1])[0]?.[0] || "-"} sub="canal que mais traz" />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <Card title="Origem dos clientes">
                    {Object.entries(origens).length === 0 && <p style={{ color: "#7a7570", fontSize: 13 }}>Nenhuma origem cadastrada</p>}
                    {Object.entries(origens).sort((a, b) => b[1] - a[1]).map(([origem, count]) => (
                      <div key={origem} style={{ marginBottom: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: 13 }}>{origem}</span><span style={{ fontSize: 13, fontWeight: 500 }}>{count}</span>
                        </div>
                        <div style={{ height: 6, background: "#f0ede6", borderRadius: 4 }}>
                          <div style={{ height: "100%", background: "#0a6e50", borderRadius: 4, width: `${Math.round((count / clients.length) * 100)}%` }} />
                        </div>
                      </div>
                    ))}
                  </Card>
                  <Card title="Fidelização">
                    {ativos.map(c => (
                      <div key={c.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "0.5px solid #f0ede6" }}>
                        <span style={{ fontSize: 13 }}>{c.nome}</span>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <span style={{ fontSize: 13, color: "#7a7570" }}>{monthsActive(c.criado_em)} meses</span>
                          {monthsActive(c.criado_em) >= 3 && <Badge bg="#E1F5EE" color="#085041" label="Fiel" />}
                        </div>
                      </div>
                    ))}
                  </Card>
                </div>
              </>
            )}
          </>
        )}

        {/* LIST */}
        {view === "list" && (
          <Card title="">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <span style={{ fontWeight: 500 }}>Todos os clientes ({clients.length})</span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." style={{ ...inputSt, width: 200, padding: "6px 12px" }} />
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead><tr style={{ background: "#f9f8f6" }}>{["Negócio","Instância","Plano","Status","Msgs/mês","Vencimento","Pagamento","Ações"].map(h => <th key={h} style={{ textAlign: "left", padding: "10px 14px", fontSize: 11, fontWeight: 500, color: "#7a7570", borderBottom: "0.5px solid #e0dbd2", whiteSpace: "nowrap" }}>{h}</th>)}</tr></thead>
                <tbody>
                  {filtered.length === 0 && <tr><td colSpan={8} style={{ padding: 32, textAlign: "center", color: "#7a7570" }}>Nenhum cliente</td></tr>}
                  {filtered.map(c => (
                    <tr key={c.id} style={{ borderBottom: "0.5px solid #f0ede6" }}>
                      <td style={{ padding: "11px 14px" }}><button onClick={() => openClient(c)} style={{ background: "none", border: "none", cursor: "pointer", fontWeight: 500, color: "#0d0d0d", fontSize: 13, padding: 0, textDecoration: "underline", textDecorationColor: "#e0dbd2" }}>{c.nome}</button></td>
                      <td style={{ padding: "11px 14px", fontFamily: "monospace", fontSize: 11, color: "#7a7570" }}>{c.instancia_evolution || c.instancia}</td>
                      <td style={{ padding: "11px 14px" }}>{c.plano}</td>
                      <td style={{ padding: "11px 14px" }}><Badge bg={statusColor[c.status]?.bg} color={statusColor[c.status]?.color} label={statusColor[c.status]?.label} /></td>
                      <td style={{ padding: "11px 14px", color: "#7a7570" }}>{c.mensagens_mes}</td>
                      <td style={{ padding: "11px 14px", color: isExpiring(c.vencimento) ? "#791F1F" : undefined }}>{fmtDate(c.vencimento)}</td>
                      <td style={{ padding: "11px 14px" }}><Badge bg={pagColor[c.pagamento]?.bg} color={pagColor[c.pagamento]?.color} label={c.pagamento} /></td>
                      <td style={{ padding: "11px 14px" }}>
                        <div style={{ display: "flex", gap: 4 }}>
                          <IconBtn title="Abrir" onClick={() => openClient(c)}>📋</IconBtn>
                          {c.status === "ativo" && <IconBtn title="Suspender" onClick={() => toggleStatus(c.id, "suspender")}>⏸️</IconBtn>}
                          {c.status === "suspenso" && <IconBtn title="Reativar" onClick={() => toggleStatus(c.id, "reativar")}>▶️</IconBtn>}
                          {c.whatsapp && <a href={`https://wa.me/${c.whatsapp}`} target="_blank" rel="noreferrer" style={{ fontSize: 15, padding: "4px 6px" }}>💬</a>}
                          {c.status !== "cancelado" && <IconBtn title="Cancelar" onClick={() => setConfirmDelete(c.id)} style={{ color: "#791F1F" }}>🗑️</IconBtn>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* CLIENT */}
        {view === "client" && selected && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div>
                <h1 style={{ fontSize: 20, fontWeight: 500, marginBottom: 6 }}>{selected.nome}</h1>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontFamily: "monospace", fontSize: 12, color: "#7a7570" }}>{selected.instancia_evolution || selected.instancia}</span>
                  <Badge bg={statusColor[selected.status]?.bg} color={statusColor[selected.status]?.color} label={statusColor[selected.status]?.label} />
                  <Badge bg={pagColor[selected.pagamento]?.bg} color={pagColor[selected.pagamento]?.color} label={selected.pagamento} />
                  {monthsActive(selected.criado_em) >= 3 && <Badge bg="#E1F5EE" color="#085041" label="Cliente fiel" />}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {selected.whatsapp && <a href={`https://wa.me/${selected.whatsapp}`} target="_blank" rel="noreferrer" style={{ ...btnSt, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>💬 WhatsApp</a>}
                {selected.status === "ativo" && <button onClick={() => toggleStatus(selected.id, "suspender")} style={btnSt}>⏸️ Suspender</button>}
                {selected.status === "suspenso" && <button onClick={() => toggleStatus(selected.id, "reativar")} style={{ ...btnSt, background: "#0a6e50", color: "#fff", borderColor: "#0a6e50" }}>▶️ Reativar</button>}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
              <MetricCard label="Plano" value={selected.plano} />
              <MetricCard label="Msgs este mês" value={selected.mensagens_mes} color="#0a6e50" />
              <MetricCard label="Tempo de casa" value={`${monthsActive(selected.criado_em)} meses`} />
              <MetricCard label="Valor mensal" value={fmt(PLANO_VALOR[selected.plano] || 0)} />
            </div>

            <div style={{ display: "flex", gap: 0, marginBottom: 16, borderBottom: "0.5px solid #e0dbd2" }}>
              {[["info","Informações"],["prompt","Prompt"],["checklist","Onboarding"],["pagamentos","Pagamentos"],["log","Histórico"]].map(([t, label]) => (
                <button key={t} onClick={() => setTab(t)} style={{ background: "none", border: "none", padding: "8px 16px", cursor: "pointer", fontSize: 13, color: tab === t ? "#0d0d0d" : "#7a7570", borderBottom: tab === t ? "2px solid #0d0d0d" : "2px solid transparent", marginBottom: -1, fontWeight: tab === t ? 500 : 400 }}>{label}</button>
              ))}
            </div>

            {tab === "info" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <Card title="Contato">
                  <FormField label="WhatsApp"><input style={inputSt} value={selected.whatsapp || ""} onChange={e => { const v = e.target.value; setSelected(p => ({ ...p, whatsapp: v })); }} onBlur={e => updateClientApi(selected.id, { whatsapp: e.target.value })} /></FormField>
                  <div style={{ marginTop: 12 }}><FormField label="Email"><input style={inputSt} value={selected.email || ""} onChange={e => { const v = e.target.value; setSelected(p => ({ ...p, email: v })); }} onBlur={e => updateClientApi(selected.id, { email: e.target.value })} /></FormField></div>
                  <div style={{ marginTop: 12 }}><FormField label="Origem"><input style={inputSt} value={selected.origem || ""} onChange={e => { const v = e.target.value; setSelected(p => ({ ...p, origem: v })); }} onBlur={e => updateClientApi(selected.id, { origem: e.target.value })} placeholder="Ex: Indicação, Instagram..." /></FormField></div>
                </Card>
                <Card title="Anotações">
                  <AnotacoesEditor value={selected.anotacoes || ""} onSave={async (v) => { await updateClientApi(selected.id, { anotacoes: v }); showToast("Anotações salvas!"); }} />
                </Card>
              </div>
            )}

            {tab === "prompt" && (
              <Card title="Prompt do agente">
                <PromptEditor value={selected.prompt || ""} onSave={async (v) => { await updateClientApi(selected.id, { prompt: v }); showToast("Prompt salvo!"); }} />
              </Card>
            )}

            {tab === "checklist" && (
              <Card title="Checklist de onboarding">
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {Object.entries(CHECKLIST_LABELS).map(([key, label]) => {
                    const checked = selected.checklist?.[key];
                    return (
                      <div key={key} onClick={async () => { const checklist = { ...selected.checklist, [key]: !checked }; await updateClientApi(selected.id, { checklist }); }} style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", padding: "10px 14px", borderRadius: 8, border: `0.5px solid ${checked ? "#9FE1CB" : "#e0dbd2"}`, background: checked ? "#E1F5EE" : "#fff" }}>
                        <div style={{ width: 20, height: 20, borderRadius: 4, border: `2px solid ${checked ? "#085041" : "#ccc"}`, background: checked ? "#085041" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {checked && <span style={{ color: "#fff", fontSize: 12 }}>✓</span>}
                        </div>
                        <span style={{ fontSize: 14, color: checked ? "#085041" : "#0d0d0d", fontWeight: checked ? 500 : 400 }}>{label}</span>
                      </div>
                    );
                  })}
                </div>
                <div style={{ marginTop: 16, padding: 12, background: "#f9f8f6", borderRadius: 8 }}>
                  <span style={{ fontSize: 12, color: "#7a7570" }}>{Object.values(selected.checklist || {}).filter(Boolean).length} de {Object.keys(CHECKLIST_LABELS).length} etapas</span>
                  <div style={{ marginTop: 8, height: 4, background: "#e0dbd2", borderRadius: 4 }}>
                    <div style={{ height: "100%", background: "#0a6e50", borderRadius: 4, width: `${Math.round((Object.values(selected.checklist || {}).filter(Boolean).length / Object.keys(CHECKLIST_LABELS).length) * 100)}%` }} />
                  </div>
                </div>
              </Card>
            )}

            {tab === "pagamentos" && (
              <Card title="Pagamentos">
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, marginBottom: 20 }}>
                  <thead><tr>{["Data","Valor","Status"].map(h => <th key={h} style={{ textAlign: "left", padding: "8px 14px", fontSize: 11, fontWeight: 500, color: "#7a7570", borderBottom: "0.5px solid #e0dbd2" }}>{h}</th>)}</tr></thead>
                  <tbody>
                    {(selected.pagamentos || []).length === 0 && <tr><td colSpan={3} style={{ padding: 20, color: "#7a7570", textAlign: "center" }}>Nenhum pagamento</td></tr>}
                    {[...(selected.pagamentos || [])].reverse().map((p, i) => (
                      <tr key={i} style={{ borderBottom: "0.5px solid #f0ede6" }}>
                        <td style={{ padding: "10px 14px" }}>{fmtDate(p.data)}</td>
                        <td style={{ padding: "10px 14px" }}>{fmt(p.valor)}</td>
                        <td style={{ padding: "10px 14px" }}><Badge bg={pagColor[p.status]?.bg} color={pagColor[p.status]?.color} label={p.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ borderTop: "0.5px solid #e0dbd2", paddingTop: 16 }}>
                  <p style={{ fontWeight: 500, fontSize: 13, marginBottom: 12 }}>Registrar pagamento</p>
                  <AddPaymentForm onAdd={async (p) => {
                    await addPaymentApi(selected.id, p);
                    const pagamentos = [...(selected.pagamentos || []), p];
                    await updateClientApi(selected.id, { pagamentos, pagamento: p.status === "pago" ? "em dia" : p.status });
                    showToast("Pagamento registrado!");
                  }} plano={selected.plano} />
                </div>
              </Card>
            )}

            {tab === "log" && (
              <Card title="Histórico">
                {(selected.log || []).length === 0 && <p style={{ color: "#7a7570", fontSize: 13 }}>Nenhum registro</p>}
                {[...(selected.log || [])].reverse().map((l, i) => (
                  <div key={i} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: "0.5px solid #f0ede6" }}>
                    <span style={{ fontSize: 11, color: "#7a7570", whiteSpace: "nowrap" }}>{fmtDate(l.data)}</span>
                    <span style={{ fontSize: 13 }}>{l.msg}</span>
                  </div>
                ))}
              </Card>
            )}
          </>
        )}

        {/* FORM */}
        {view === "form" && (
          <div style={{ background: "#fff", borderRadius: 12, border: "0.5px solid #e0dbd2", padding: 28, maxWidth: 640, margin: "0 auto" }}>
            <h2 style={{ fontSize: 16, fontWeight: 500, marginBottom: 20 }}>Novo cliente</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
              <FormField label="Nome do negócio"><input style={inputSt} value={newClient.nome} onChange={e => setNewClient({ ...newClient, nome: e.target.value })} placeholder="Ex: Bella Studio" /></FormField>
              <FormField label="Instância Evolution API"><input style={inputSt} value={newClient.instancia} onChange={e => setNewClient({ ...newClient, instancia: e.target.value.toLowerCase().replace(/\s/g, "-") })} placeholder="Ex: bella-studio" /></FormField>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
              <FormField label="Plano"><select style={inputSt} value={newClient.plano} onChange={e => setNewClient({ ...newClient, plano: e.target.value })}>{PLANOS.map(p => <option key={p}>{p}</option>)}</select></FormField>
              <FormField label="Status pagamento"><select style={inputSt} value={newClient.pagamento} onChange={e => setNewClient({ ...newClient, pagamento: e.target.value })}>{["em dia","pendente","atrasado"].map(s => <option key={s}>{s}</option>)}</select></FormField>
              <FormField label="Vencimento"><input style={inputSt} type="date" value={newClient.vencimento} onChange={e => setNewClient({ ...newClient, vencimento: e.target.value })} /></FormField>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
              <FormField label="WhatsApp"><input style={inputSt} value={newClient.whatsapp} onChange={e => setNewClient({ ...newClient, whatsapp: e.target.value })} placeholder="5551999999999" /></FormField>
              <FormField label="Email"><input style={inputSt} value={newClient.email} onChange={e => setNewClient({ ...newClient, email: e.target.value })} placeholder="cliente@exemplo.com" /></FormField>
              <FormField label="Origem"><input style={inputSt} value={newClient.origem} onChange={e => setNewClient({ ...newClient, origem: e.target.value })} placeholder="Ex: Indicação" /></FormField>
            </div>
            <FormField label="Prompt do agente"><textarea style={{ ...inputSt, minHeight: 120, fontFamily: "monospace", fontSize: 12, resize: "vertical" }} value={newClient.prompt} onChange={e => setNewClient({ ...newClient, prompt: e.target.value })} placeholder="Você é a [Nome], assistente do [Negócio]..." /></FormField>
            <div style={{ marginTop: 14 }}><FormField label="Anotações iniciais"><textarea style={{ ...inputSt, minHeight: 60, resize: "vertical" }} value={newClient.anotacoes} onChange={e => setNewClient({ ...newClient, anotacoes: e.target.value })} /></FormField></div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 20 }}>
              <button onClick={() => setView("list")} style={btnSt}>Cancelar</button>
              <button onClick={saveClient} style={{ ...btnSt, background: "#0a6e50", color: "#fff", borderColor: "#0a6e50" }}>Cadastrar cliente</button>
            </div>
          </div>
        )}

        {confirmDelete && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
            <div style={{ background: "#fff", borderRadius: 12, padding: 28, maxWidth: 360, width: "90%" }}>
              <p style={{ fontWeight: 500, marginBottom: 8 }}>Cancelar cliente?</p>
              <p style={{ color: "#7a7570", fontSize: 13, marginBottom: 20 }}>O agente será desativado permanentemente.</p>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button onClick={() => setConfirmDelete(null)} style={btnSt}>Voltar</button>
                <button onClick={() => { toggleStatus(confirmDelete, "cancelar"); setConfirmDelete(null); }} style={{ ...btnSt, background: "#791F1F", color: "#fff", borderColor: "#791F1F" }}>Confirmar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PromptEditor({ value, onSave }) {
  const [v, setV] = useState(value);
  return (<><textarea style={{ ...inputSt, minHeight: 300, fontFamily: "monospace", fontSize: 12, resize: "vertical", width: "100%" }} value={v} onChange={e => setV(e.target.value)} /><div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}><button onClick={() => onSave(v)} style={{ ...btnSt, background: "#0a6e50", color: "#fff", borderColor: "#0a6e50" }}>Salvar prompt</button></div></>);
}

function AnotacoesEditor({ value, onSave }) {
  const [v, setV] = useState(value);
  return (<><textarea style={{ ...inputSt, minHeight: 120, resize: "vertical", width: "100%" }} value={v} onChange={e => setV(e.target.value)} /><div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}><button onClick={() => onSave(v)} style={{ ...btnSt, fontSize: 12, padding: "5px 12px" }}>Salvar</button></div></>);
}

function AddPaymentForm({ onAdd, plano }) {
  const valor = PLANO_VALOR[plano] || 397;
  const [form, setForm] = useState({ data: today(), valor, status: "pago" });
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 10, alignItems: "end" }}>
      <FormField label="Data"><input type="date" style={inputSt} value={form.data} onChange={e => setForm({ ...form, data: e.target.value })} /></FormField>
      <FormField label="Valor (R$)"><input type="number" style={inputSt} value={form.valor} onChange={e => setForm({ ...form, valor: Number(e.target.value) })} /></FormField>
      <FormField label="Status"><select style={inputSt} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}><option value="pago">pago</option><option value="pendente">pendente</option><option value="atrasado">atrasado</option></select></FormField>
      <button onClick={() => onAdd(form)} style={{ ...btnSt, background: "#0a6e50", color: "#fff", borderColor: "#0a6e50", height: 36, whiteSpace: "nowrap" }}>+ Registrar</button>
    </div>
  );
}

function Card({ title, children }) {
  return (<div style={{ background: "#fff", borderRadius: 12, border: "0.5px solid #e0dbd2", padding: 20 }}>{title && <p style={{ fontWeight: 500, fontSize: 14, marginBottom: 16 }}>{title}</p>}{children}</div>);
}

function MetricCard({ label, value, sub, color }) {
  return (
    <div style={{ background: "#fff", borderRadius: 10, border: "0.5px solid #e0dbd2", padding: "14px 18px" }}>
      <div style={{ fontSize: 11, color: "#7a7570", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 500, color: color || "#0d0d0d", marginBottom: sub ? 2 : 0 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "#7a7570" }}>{sub}</div>}
    </div>
  );
}

function Badge({ bg, color, label }) {
  return <span style={{ background: bg, color, padding: "2px 10px", borderRadius: 100, fontSize: 11, fontWeight: 500, whiteSpace: "nowrap" }}>{label}</span>;
}

function IconBtn({ children, onClick, title, style }) {
  return <button onClick={onClick} title={title} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 15, padding: "4px 6px", borderRadius: 6, ...style }}>{children}</button>;
}

function FormField({ label, children }) {
  return (<div><label style={{ fontSize: 12, color: "#7a7570", display: "block", marginBottom: 4 }}>{label}</label>{children}</div>);
}

const btnSt = { padding: "7px 16px", borderRadius: 6, fontSize: 13, cursor: "pointer", border: "0.5px solid #ccc", background: "#fff", color: "#0d0d0d", fontFamily: "inherit" };
const inputSt = { width: "100%", padding: "8px 12px", borderRadius: 8, border: "0.5px solid #ccc", background: "#fff", color: "#0d0d0d", fontSize: 13, fontFamily: "inherit" };
