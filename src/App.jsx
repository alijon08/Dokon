import { useState, useEffect } from "react";
import { getAllData, saveProducts, saveTransactions, saveFinance } from "./api.js";
import { Html5QrcodeScanner } from "html5-qrcode";

const USERS = [
  { username: "admin", password: "admin", role: "admin", name: "Admin" },
  { username: "kassir", password: "kassir", role: "kassir", name: "Kassir" },
];

const NAV_ITEMS = {
  admin: [
    { id: "dashboard", label: "Bosh sahifa", icon: "⊞" },
    { id: "products", label: "Tovarlar", icon: "▦" },
    { id: "income", label: "Kirim", icon: "↓" },
    { id: "sales", label: "Sotuv", icon: "↑" },
    { id: "finance", label: "Moliya", icon: "₸" },
    { id: "reports", label: "Hisobot", icon: "≡" },
  ],
  kassir: [
    { id: "sales", label: "Sotuv", icon: "↑" },
    { id: "dashboard", label: "Bosh sahifa", icon: "⊞" },
  ],
};

export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
   const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showScanner, setShowScanner] = useState(false);
  const [onScanResult, setOnScanResult] = useState(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const openScanner = (callback) => {
    setOnScanResult(() => callback);
    setShowScanner(true);
  };

  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [finance, setFinance] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState(""); // "", "ok", "offline"

  useEffect(() => {
    (async () => {
      try {
        const data = await getAllData();
        setProducts(data.products || []);
        setTransactions(data.transactions || []);
        setFinance(data.finance || []);
        setSyncStatus("ok");
      } catch {
        setSyncStatus("offline");
      }
      setLoaded(true);
    })();
  }, []);

  const handleSaveProducts = async (data) => {
    setProducts(data);
    setSyncing(true);
    try { await saveProducts(data); setSyncStatus("ok"); }
    catch { setSyncStatus("offline"); }
    setSyncing(false);
  };

  const handleSaveTransactions = async (data) => {
    setTransactions(data);
    setSyncing(true);
    try { await saveTransactions(data); setSyncStatus("ok"); }
    catch { setSyncStatus("offline"); }
    setSyncing(false);
  };

  const handleSaveFinance = async (data) => {
    setFinance(data);
    setSyncing(true);
    try { await saveFinance(data); setSyncStatus("ok"); }
    catch { setSyncStatus("offline"); }
    setSyncing(false);
  };

  const handleLogin = () => {
    const found = USERS.find(u => u.username === loginForm.username && u.password === loginForm.password);
    if (found) {
      setUser(found);
      setPage(found.role === "kassir" ? "sales" : "dashboard");
      setLoginError("");
    } else {
      setLoginError("Login yoki parol noto'g'ri!");
    }
  };

  if (!loaded) return (
    <div style={styles.loadingWrap}>
      <div style={styles.spinner} />
      <span style={styles.loadingText}>Ma'lumotlar yuklanmoqda...</span>
    </div>
  );

  if (!user) return <LoginPage form={loginForm} setForm={setLoginForm} onLogin={handleLogin} error={loginError} />;

  const navItems = NAV_ITEMS[user.role];

  return (
    <div style={styles.appWrap}>
      <aside style={{ ...styles.sidebar, width: sidebarOpen ? 220 : 64 }}>
        <div style={styles.sidebarHeader}>
          {sidebarOpen && <span style={styles.logo}>DO'KON<span style={styles.logoAccent}>PRO</span></span>}
          <button style={styles.toggleBtn} onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? "◁" : "▷"}
          </button>
        </div>
        <nav style={styles.nav}>
          {navItems.map(item => (
            <button
              key={item.id}
              style={{ ...styles.navBtn, ...(page === item.id ? styles.navBtnActive : {}) }}
              onClick={() => setPage(item.id)}
            >
              <span style={styles.navIcon}>{item.icon}</span>
              {sidebarOpen && <span style={styles.navLabel}>{item.label}</span>}
            </button>
          ))}
        </nav>
        <div style={styles.sidebarFooter}>
          <div style={styles.userBadge}>
            <span style={styles.userAvatar}>{user.name[0]}</span>
            {sidebarOpen && (
              <div>
                <div style={styles.userName}>{user.name}</div>
                <div style={styles.userRole}>{user.role === "admin" ? "Administrator" : "Kassir"}</div>
              </div>
            )}
          </div>
          {sidebarOpen && (
            <div style={styles.syncBadge}>
              {syncing ? "⟳ Saqlanmoqda..." : syncStatus === "ok" ? "✓ Sinxronlashdi" : "⚠ Offline"}
            </div>
          )}
          <button style={styles.logoutBtn} onClick={() => setUser(null)}>
            {sidebarOpen ? "Chiqish" : "✕"}
          </button>
        </div>
      </aside>

      <main style={styles.main}>
        <div style={styles.topbar}>
          <h1 style={styles.pageTitle}>
            {navItems.find(n => n.id === page)?.label || ""}
          </h1>
          <div style={styles.dateChip}>{new Date().toLocaleDateString("uz-UZ", { day: "2-digit", month: "long", year: "numeric" })}</div>
        </div>

        <div style={styles.content}>
          {page === "dashboard" && <Dashboard products={products} transactions={transactions} finance={finance} />}
          {page === "products" && <Products products={products} saveProducts={handleSaveProducts} />}
          {page === "income" && <Income products={products} saveProducts={handleSaveProducts} transactions={transactions} saveTransactions={handleSaveTransactions} />}
          {page === "sales" && <Sales products={products} saveProducts={handleSaveProducts} transactions={transactions} saveTransactions={handleSaveTransactions} />}
          {page === "finance" && <Finance finance={finance} saveFinance={handleSaveFinance} transactions={transactions} />}
          {page === "reports" && <Reports products={products} transactions={transactions} finance={finance} />}
        </div>
      </main>
    </div>
  );
}

function LoginPage({ form, setForm, onLogin, error }) {
  return (
    <div style={styles.loginWrap}>
      <div style={styles.loginCard}>
        <div style={styles.loginLogo}>DO'KON<span style={styles.logoAccent}>PRO</span></div>
        <p style={styles.loginSub}>Do'kon boshqaruv tizimi</p>
        <div style={styles.field}>
          <label style={styles.label}>Foydalanuvchi nomi</label>
          <input style={styles.input} value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} placeholder="admin yoki kassir" onKeyDown={e => e.key === "Enter" && onLogin()} />
        </div>
        <div style={styles.field}>
          <label style={styles.label}>Parol</label>
          <input style={styles.input} type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="••••••••" onKeyDown={e => e.key === "Enter" && onLogin()} />
        </div>
        {error && <div style={styles.errorMsg}>{error}</div>}
        <button style={styles.loginBtn} onClick={onLogin}>Kirish</button>
        <div style={styles.hint}><b>Admin:</b> admin / admin123<br /><b>Kassir:</b> kassir / kassir123</div>
      </div>
    </div>
  );
}

function Dashboard({ products, transactions, finance }) {
  const today = new Date().toDateString();
  const todaySales = transactions.filter(t => t.type === "sale" && new Date(t.date).toDateString() === today);
  const totalRevenue = todaySales.reduce((s, t) => s + t.total, 0);
  const totalCost = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.total, 0);
  const totalSold = transactions.filter(t => t.type === "sale").reduce((s, t) => s + t.total, 0);
  const profit = totalSold - totalCost;
  const financeTotal = finance.reduce((s, f) => s + f.amount, 0);

  const cards = [
    { label: "Bugungi sotuv", value: fmt(totalRevenue), color: "#22c55e", icon: "↑" },
    { label: "Jami kirim (xarid)", value: fmt(totalCost), color: "#f59e0b", icon: "↓" },
    { label: "Umumiy foyda", value: fmt(profit), color: profit >= 0 ? "#6366f1" : "#ef4444", icon: "₸" },
    { label: "Chiqimlar", value: fmt(financeTotal), color: "#ef4444", icon: "✕" },
    { label: "Tovar turlari", value: products.length, color: "#0ea5e9", icon: "▦" },
    { label: "Jami tranzaksiya", value: transactions.length, color: "#8b5cf6", icon: "≡" },
  ];

  return (
    <div>
      <div style={styles.cardGrid}>
        {cards.map(c => (
          <div key={c.label} style={{ ...styles.statCard, borderTop: `3px solid ${c.color}` }}>
            <div style={{ ...styles.statIcon, color: c.color }}>{c.icon}</div>
            <div style={styles.statValue}>{c.value}</div>
            <div style={styles.statLabel}>{c.label}</div>
          </div>
        ))}
      </div>
      <div style={styles.sectionTitle}>So'nggi tranzaksiyalar</div>
      <div style={styles.table}>
        <div style={styles.tableHead}><span>Sana</span><span>Turi</span><span>Tovar</span><span>Summa</span></div>
        {transactions.slice(-10).reverse().map((t, i) => (
          <div key={i} style={styles.tableRow}>
            <span>{new Date(t.date).toLocaleDateString("uz-UZ")}</span>
            <span style={{ color: t.type === "sale" ? "#22c55e" : "#f59e0b" }}>{t.type === "sale" ? "Sotuv" : "Kirim"}</span>
            <span>{t.productName}</span>
            <span style={{ fontWeight: 700 }}>{fmt(t.total)} so'm</span>
          </div>
        ))}
        {transactions.length === 0 && <div style={styles.empty}>Tranzaksiyalar yo'q</div>}
      </div>
    </div>
  );
}

function Products({ products, saveProducts }) {
  const [form, setForm] = useState({ name: "", barcode: "", buyPrice: "", sellPrice: "", qty: "" });
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [msg, setMsg] = useState("");

  const generateBarcode = () => setForm({ ...form, barcode: (Math.floor(Math.random() * 9e12) + 1e12).toString() });

  const handleSave = () => {
    if (!form.name || !form.sellPrice) { setMsg("Nom va sotuv narxi majburiy!"); return; }
    const item = { id: editing ?? Date.now().toString(), name: form.name, barcode: form.barcode || Date.now().toString(), buyPrice: parseFloat(form.buyPrice) || 0, sellPrice: parseFloat(form.sellPrice), qty: parseInt(form.qty) || 0 };
    const updated = editing ? products.map(p => p.id === editing ? item : p) : [...products, item];
    saveProducts(updated);
    setForm({ name: "", barcode: "", buyPrice: "", sellPrice: "", qty: "" });
    setEditing(null);
    setMsg("Saqlandi ✓");
    setTimeout(() => setMsg(""), 2000);
  };

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.barcode.includes(search));

  return (
    <div>
      <div style={styles.formCard}>
        <div style={styles.formTitle}>{editing ? "Tahrirlash" : "Yangi tovar qo'shish"}</div>
        <div style={styles.formGrid}>
          <div style={styles.field}><label style={styles.label}>Tovar nomi *</label><input style={styles.input} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Masalan: Shampun" /></div>
          <div style={styles.field}>
            <label style={styles.label}>Barkod / QR kod</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input style={{ ...styles.input, flex: 1 }} value={form.barcode} onChange={e => setForm({ ...form, barcode: e.target.value })} placeholder="Skanerlang yoki kiriting" />
              <button style={styles.smallBtn} onClick={generateBarcode}>Auto</button>
            </div>
          </div>
          <div style={styles.field}><label style={styles.label}>Xarid narxi (so'm)</label><input style={styles.input} type="number" value={form.buyPrice} onChange={e => setForm({ ...form, buyPrice: e.target.value })} placeholder="0" /></div>
          <div style={styles.field}><label style={styles.label}>Sotuv narxi (so'm) *</label><input style={styles.input} type="number" value={form.sellPrice} onChange={e => setForm({ ...form, sellPrice: e.target.value })} placeholder="0" /></div>
          <div style={styles.field}><label style={styles.label}>Boshlang'ich miqdor</label><input style={styles.input} type="number" value={form.qty} onChange={e => setForm({ ...form, qty: e.target.value })} placeholder="0" /></div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button style={styles.primaryBtn} onClick={handleSave}>{editing ? "Saqlash" : "Qo'shish"}</button>
          {editing && <button style={styles.ghostBtn} onClick={() => { setEditing(null); setForm({ name: "", barcode: "", buyPrice: "", sellPrice: "", qty: "" }); }}>Bekor</button>}
          {msg && <span style={styles.successMsg}>{msg}</span>}
        </div>
      </div>
      <div style={styles.searchBar}>
        <input style={{ ...styles.input, maxWidth: 300 }} value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Qidirish..." />
        <span style={styles.countChip}>{filtered.length} ta tovar</span>
      </div>
      <div style={styles.table}>
        <div style={{ ...styles.tableHead, gridTemplateColumns: "2fr 1.5fr 1fr 1fr 0.7fr 0.8fr" }}><span>Nom</span><span>Barkod</span><span>Xarid</span><span>Sotuv</span><span>Miqdor</span><span>Amal</span></div>
        {filtered.map(p => (
          <div key={p.id} style={{ ...styles.tableRow, gridTemplateColumns: "2fr 1.5fr 1fr 1fr 0.7fr 0.8fr" }}>
            <span style={{ fontWeight: 600 }}>{p.name}</span>
            <span style={styles.mono}>{p.barcode}</span>
            <span>{fmt(p.buyPrice)}</span>
            <span style={{ color: "#22c55e", fontWeight: 700 }}>{fmt(p.sellPrice)}</span>
            <span style={{ color: p.qty <= 5 ? "#ef4444" : "#fff" }}>{p.qty}</span>
            <span style={{ display: "flex", gap: 4 }}>
              <button style={styles.iconBtn} onClick={() => { setForm({ name: p.name, barcode: p.barcode, buyPrice: p.buyPrice, sellPrice: p.sellPrice, qty: p.qty }); setEditing(p.id); }}>✎</button>
              <button style={{ ...styles.iconBtn, color: "#ef4444" }} onClick={() => { if (confirm("O'chirilsinmi?")) saveProducts(products.filter(x => x.id !== p.id)); }}>✕</button>
            </span>
          </div>
        ))}
        {filtered.length === 0 && <div style={styles.empty}>Tovarlar yo'q</div>}
      </div>
    </div>
  );
}

function Income({ products, saveProducts, transactions, saveTransactions }) {
  const [barcode, setBarcode] = useState("");
  const [found, setFound] = useState(null);
  const [qty, setQty] = useState("");
  const [paid, setPaid] = useState("");
  const [msg, setMsg] = useState("");

  const searchProduct = () => {
    const p = products.find(p => p.barcode === barcode || p.name.toLowerCase() === barcode.toLowerCase());
    setFound(p || null);
    if (!p) setMsg("Tovar topilmadi!");
    else setMsg("");
  };

  const handleIncome = () => {
    if (!found || !qty || !paid) { setMsg("Barcha maydonlarni to'ldiring!"); return; }
    const updated = products.map(p => p.id === found.id ? { ...p, qty: p.qty + parseInt(qty) } : p);
    const tx = { id: Date.now().toString(), date: new Date().toISOString(), type: "income", productName: found.name, qty: parseInt(qty), price: parseFloat(paid) / parseInt(qty), total: parseFloat(paid) };
    saveProducts(updated);
    saveTransactions([...transactions, tx]);
    setMsg(`✓ ${found.name} — ${qty} dona kirim qilindi`);
    setBarcode(""); setFound(null); setQty(""); setPaid("");
    setTimeout(() => setMsg(""), 3000);
  };

  return (
    <div>
      <div style={styles.formCard}>
        <div style={styles.formTitle}>Tovar kirim qilish</div>
        <div style={{ display: "flex", gap: 8 }}>
          <input style={{ ...styles.input, flex: 1 }} value={barcode} onChange={e => setBarcode(e.target.value)} placeholder="Barkod yoki nom kiriting" onKeyDown={e => e.key === "Enter" && searchProduct()} />
          <button style={styles.primaryBtn} onClick={searchProduct}>Topish</button>
        </div>
        {found && (
          <div style={{ ...styles.formCard, marginTop: 16 }}>
            <span style={{ fontWeight: 700, color: "#fff" }}>{found.name}</span>
            <span style={{ marginLeft: 12, color: "#64748b" }}>Mavjud: {found.qty} dona</span>
            <div style={{ ...styles.formGrid, marginTop: 12 }}>
              <div style={styles.field}><label style={styles.label}>Miqdor (dona)</label><input style={styles.input} type="number" value={qty} onChange={e => setQty(e.target.value)} /></div>
              <div style={styles.field}><label style={styles.label}>To'langan summa (so'm)</label><input style={styles.input} type="number" value={paid} onChange={e => setPaid(e.target.value)} /></div>
            </div>
            <button style={styles.primaryBtn} onClick={handleIncome}>Kirim qilish</button>
          </div>
        )}
        {msg && <div style={{ marginTop: 8, color: found ? "#22c55e" : "#ef4444", fontSize: 13 }}>{msg}</div>}
      </div>
      <div style={styles.sectionTitle}>Kirim tarixi</div>
      <div style={styles.table}>
        <div style={{ ...styles.tableHead, gridTemplateColumns: "1.5fr 2fr 1fr 1fr 1fr" }}><span>Sana</span><span>Tovar</span><span>Miqdor</span><span>Narx/dona</span><span>Jami</span></div>
        {transactions.filter(t => t.type === "income").slice().reverse().map((t, i) => (
          <div key={i} style={{ ...styles.tableRow, gridTemplateColumns: "1.5fr 2fr 1fr 1fr 1fr" }}>
            <span>{new Date(t.date).toLocaleDateString("uz-UZ")}</span>
            <span style={{ fontWeight: 600 }}>{t.productName}</span>
            <span>{t.qty} dona</span>
            <span>{fmt(t.price)}</span>
            <span style={{ color: "#f59e0b", fontWeight: 700 }}>{fmt(t.total)} so'm</span>
          </div>
        ))}
        {transactions.filter(t => t.type === "income").length === 0 && <div style={styles.empty}>Kirimlar yo'q</div>}
      </div>
    </div>
  );
}

function Sales({ products, saveProducts, transactions, saveTransactions }) {
  const [barcode, setBarcode] = useState("");
  const [cart, setCart] = useState([]);
  const [msg, setMsg] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [paid, setPaid] = useState("");

  const addToCart = () => {
    const p = products.find(p => p.barcode === barcode || p.name.toLowerCase() === barcode.toLowerCase());
    if (!p) { setMsg("Tovar topilmadi!"); return; }
    if (p.qty <= 0) { setMsg("Omborda yo'q!"); return; }
    const existing = cart.find(c => c.id === p.id);
    if (existing) setCart(cart.map(c => c.id === p.id ? { ...c, qty: c.qty + 1 } : c));
    else setCart([...cart, { ...p, qty: 1 }]);
    setBarcode(""); setMsg("");
  };

  const total = cart.reduce((s, c) => s + c.sellPrice * c.qty, 0);
  const change = parseFloat(paid) - total;

  const handleSell = () => {
    if (cart.length === 0) return;
    const updatedProducts = products.map(p => { const c = cart.find(c => c.id === p.id); return c ? { ...p, qty: p.qty - c.qty } : p; });
    const newTxs = cart.map(c => ({ id: Date.now().toString() + c.id, date: new Date().toISOString(), type: "sale", productName: c.name, qty: c.qty, price: c.sellPrice, total: c.sellPrice * c.qty }));
    saveProducts(updatedProducts);
    saveTransactions([...transactions, ...newTxs]);
    setCart([]); setShowPayment(false); setPaid("");
    setMsg("✓ Sotuv amalga oshirildi!");
    setTimeout(() => setMsg(""), 3000);
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24, alignItems: "start" }}>
      <div>
        <div style={styles.formCard}>
          <div style={styles.formTitle}>Tovar qo'shish</div>
          <div style={{ display: "flex", gap: 8 }}>
            <input style={{ ...styles.input, flex: 1 }} value={barcode} onChange={e => setBarcode(e.target.value)} placeholder="Barkod skanerlang yoki nom kiriting" onKeyDown={e => e.key === "Enter" && addToCart()} autoFocus />
            <button style={styles.primaryBtn} onClick={addToCart}>Qo'shish</button>
          </div>
          {msg && <div style={{ marginTop: 8, color: msg.startsWith("✓") ? "#22c55e" : "#ef4444", fontSize: 13 }}>{msg}</div>}
        </div>
        <div style={styles.table}>
          <div style={{ ...styles.tableHead, gridTemplateColumns: "2fr 1fr 1fr 1fr 0.5fr" }}><span>Tovar</span><span>Narx</span><span>Miqdor</span><span>Jami</span><span></span></div>
          {cart.map(c => (
            <div key={c.id} style={{ ...styles.tableRow, gridTemplateColumns: "2fr 1fr 1fr 1fr 0.5fr" }}>
              <span style={{ fontWeight: 600 }}>{c.name}</span>
              <span>{fmt(c.sellPrice)}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <button style={styles.qtyBtn} onClick={() => setCart(cart.map(x => x.id === c.id ? { ...x, qty: Math.max(1, x.qty - 1) } : x))}>−</button>
                {c.qty}
                <button style={styles.qtyBtn} onClick={() => setCart(cart.map(x => x.id === c.id ? { ...x, qty: x.qty + 1 } : x))}>+</button>
              </span>
              <span style={{ fontWeight: 700, color: "#22c55e" }}>{fmt(c.sellPrice * c.qty)}</span>
              <button style={{ ...styles.iconBtn, color: "#ef4444" }} onClick={() => setCart(cart.filter(x => x.id !== c.id))}>✕</button>
            </div>
          ))}
          {cart.length === 0 && <div style={styles.empty}>Savatcha bo'sh</div>}
        </div>
      </div>
      <div style={styles.cartSummary}>
        <div style={styles.cartTitle}>Hisob-kitob</div>
        <div style={styles.cartTotal}><span>Jami:</span><span style={{ color: "#22c55e", fontSize: 22, fontWeight: 800 }}>{fmt(total)} so'm</span></div>
        {showPayment && (
          <div style={styles.field}>
            <label style={styles.label}>Berilgan pul</label>
            <input style={styles.input} type="number" value={paid} onChange={e => setPaid(e.target.value)} placeholder="0" autoFocus />
            {paid && <div style={{ marginTop: 8, color: change >= 0 ? "#22c55e" : "#ef4444", fontWeight: 700 }}>{change >= 0 ? `Qaytim: ${fmt(change)} so'm` : `Yetarli emas: ${fmt(Math.abs(change))} so'm`}</div>}
          </div>
        )}
        <button style={{ ...styles.primaryBtn, width: "100%", marginTop: 8, padding: "14px", fontSize: 16 }} onClick={() => showPayment ? handleSell() : setShowPayment(true)} disabled={cart.length === 0}>
          {showPayment ? "To'lovni tasdiqlash ✓" : "To'lovga o'tish →"}
        </button>
        {showPayment && <button style={{ ...styles.ghostBtn, width: "100%", marginTop: 4 }} onClick={() => setShowPayment(false)}>Bekor</button>}
      </div>
    </div>
  );
}

function Finance({ finance, saveFinance, transactions }) {
  const [form, setForm] = useState({ type: "tax", amount: "", note: "", date: new Date().toISOString().split("T")[0] });
  const [msg, setMsg] = useState("");
  const types = { tax: "Soliq", communal: "Kommunal", salary: "Maosh", other: "Boshqa" };

  const handleAdd = () => {
    if (!form.amount) { setMsg("Summani kiriting!"); return; }
    saveFinance([...finance, { id: Date.now().toString(), ...form, amount: parseFloat(form.amount) }]);
    setForm({ type: "tax", amount: "", note: "", date: new Date().toISOString().split("T")[0] });
    setMsg("✓ Qo'shildi"); setTimeout(() => setMsg(""), 2000);
  };

  const totalSales = transactions.filter(t => t.type === "sale").reduce((s, t) => s + t.total, 0);
  const totalFinance = finance.reduce((s, f) => s + f.amount, 0);

  return (
    <div>
      <div style={styles.cardGrid}>
        {Object.entries(types).map(([key, label]) => (
          <div key={key} style={{ ...styles.statCard, borderTop: "3px solid #ef4444" }}>
            <div style={styles.statValue}>{fmt(finance.filter(f => f.type === key).reduce((s, f) => s + f.amount, 0))} so'm</div>
            <div style={styles.statLabel}>{label}</div>
          </div>
        ))}
        <div style={{ ...styles.statCard, borderTop: "3px solid #22c55e" }}>
          <div style={styles.statValue}>{fmt(totalSales - totalFinance)} so'm</div>
          <div style={styles.statLabel}>Sof foyda</div>
        </div>
      </div>
      <div style={styles.formCard}>
        <div style={styles.formTitle}>Chiqim qo'shish</div>
        <div style={styles.formGrid}>
          <div style={styles.field}><label style={styles.label}>Turi</label><select style={styles.input} value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>{Object.entries(types).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
          <div style={styles.field}><label style={styles.label}>Summa (so'm)</label><input style={styles.input} type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0" /></div>
          <div style={styles.field}><label style={styles.label}>Sana</label><input style={styles.input} type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
          <div style={styles.field}><label style={styles.label}>Izoh</label><input style={styles.input} value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} placeholder="Ixtiyoriy" /></div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button style={styles.primaryBtn} onClick={handleAdd}>Qo'shish</button>
          {msg && <span style={styles.successMsg}>{msg}</span>}
        </div>
      </div>
      <div style={styles.table}>
        <div style={{ ...styles.tableHead, gridTemplateColumns: "1.5fr 2fr 1fr 1fr 0.5fr" }}><span>Sana</span><span>Izoh</span><span>Turi</span><span>Summa</span><span></span></div>
        {finance.slice().reverse().map((f, i) => (
          <div key={i} style={{ ...styles.tableRow, gridTemplateColumns: "1.5fr 2fr 1fr 1fr 0.5fr" }}>
            <span>{new Date(f.date).toLocaleDateString("uz-UZ")}</span>
            <span>{f.note || "—"}</span>
            <span>{types[f.type]}</span>
            <span style={{ color: "#ef4444", fontWeight: 700 }}>{fmt(f.amount)} so'm</span>
            <button style={{ ...styles.iconBtn, color: "#ef4444" }} onClick={() => saveFinance(finance.filter(x => x.id !== f.id))}>✕</button>
          </div>
        ))}
        {finance.length === 0 && <div style={styles.empty}>Chiqimlar yo'q</div>}
      </div>
    </div>
  );
}

function Reports({ products, transactions, finance }) {
  const sales = transactions.filter(t => t.type === "sale");
  const incomes = transactions.filter(t => t.type === "income");
  const totalSales = sales.reduce((s, t) => s + t.total, 0);
  const totalCost = incomes.reduce((s, t) => s + t.total, 0);
  const totalFinance = finance.reduce((s, f) => s + f.amount, 0);
  const profit = totalSales - totalCost - totalFinance;

  const topProducts = [...products].map(p => ({
    ...p,
    sold: sales.filter(s => s.productName === p.name).reduce((sum, s) => sum + s.qty, 0),
    revenue: sales.filter(s => s.productName === p.name).reduce((sum, s) => sum + s.total, 0),
  })).sort((a, b) => b.revenue - a.revenue).slice(0, 10);

  const lowStock = products.filter(p => p.qty <= 5);

  return (
    <div>
      <div style={styles.cardGrid}>
        {[
          { label: "Jami sotuv", value: fmt(totalSales) + " so'm", color: "#22c55e" },
          { label: "Jami xarid xarajat", value: fmt(totalCost) + " so'm", color: "#f59e0b" },
          { label: "Jami chiqimlar", value: fmt(totalFinance) + " so'm", color: "#ef4444" },
          { label: "Sof foyda", value: fmt(profit) + " so'm", color: profit >= 0 ? "#6366f1" : "#ef4444" },
        ].map(c => (
          <div key={c.label} style={{ ...styles.statCard, borderTop: `3px solid ${c.color}` }}>
            <div style={{ ...styles.statValue, color: c.color }}>{c.value}</div>
            <div style={styles.statLabel}>{c.label}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div>
          <div style={styles.sectionTitle}>Top sotilgan tovarlar</div>
          <div style={styles.table}>
            <div style={{ ...styles.tableHead, gridTemplateColumns: "2fr 1fr 1fr" }}><span>Tovar</span><span>Soni</span><span>Daromad</span></div>
            {topProducts.map((p, i) => (
              <div key={i} style={{ ...styles.tableRow, gridTemplateColumns: "2fr 1fr 1fr" }}>
                <span>{p.name}</span><span>{p.sold} dona</span><span style={{ color: "#22c55e", fontWeight: 700 }}>{fmt(p.revenue)}</span>
              </div>
            ))}
            {topProducts.length === 0 && <div style={styles.empty}>Ma'lumot yo'q</div>}
          </div>
        </div>
        <div>
          <div style={styles.sectionTitle}>⚠ Kam qolgan tovarlar</div>
          <div style={styles.table}>
            <div style={{ ...styles.tableHead, gridTemplateColumns: "2fr 1fr" }}><span>Tovar</span><span>Qolgan</span></div>
            {lowStock.map((p, i) => (
              <div key={i} style={{ ...styles.tableRow, gridTemplateColumns: "2fr 1fr" }}>
                <span>{p.name}</span><span style={{ color: "#ef4444", fontWeight: 700 }}>{p.qty} dona</span>
              </div>
            ))}
            {lowStock.length === 0 && <div style={styles.empty}>Hamma tovar yetarli ✓</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

const fmt = (n) => Number(n || 0).toLocaleString("uz-UZ");

const styles = {
    appWrap: { 
    display: "flex", 
    height: "100vh", 
    background: "#0f1117", 
    color: "#e2e8f0",
    flexDirection: window.innerWidth < 768 ? "column" : "row" // Mobil uchun
  },
  bottomNav: {
    display: "flex",
    justifyContent: "space-around",
    background: "#13151f",
    borderTop: "1px solid #1e2030",
    padding: "10px 0",
    position: "fixed",
    bottom: 0,
    width: "100%",
    zIndex: 100
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.9)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: 20
  },
  modalContent: {
    background: "#13151f",
    padding: 20,
    borderRadius: 16,
    width: "100%",
    maxWidth: 400,
    textAlign: "center"
  },

  loadingWrap: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", background: "#0f1117", gap: 16 },
  spinner: { width: 40, height: 40, borderRadius: "50%", border: "3px solid #6366f1", borderTopColor: "transparent", animation: "spin 1s linear infinite" },
  loadingText: { color: "#94a3b8", fontFamily: "monospace" },
  loginWrap: { display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "linear-gradient(135deg, #0f1117 0%, #1e1b4b 100%)", fontFamily: "'Segoe UI', sans-serif" },
  loginCard: { background: "#1a1d2e", border: "1px solid #2d2f45", borderRadius: 16, padding: "40px 36px", width: "100%", maxWidth: 400, boxShadow: "0 24px 64px rgba(0,0,0,0.6)" },
  loginLogo: { fontSize: 32, fontWeight: 900, color: "#fff", letterSpacing: 2, textAlign: "center", marginBottom: 4 },
  loginSub: { color: "#64748b", textAlign: "center", marginBottom: 32, fontSize: 14 },
  loginBtn: { width: "100%", padding: "14px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", border: "none", borderRadius: 10, fontSize: 16, fontWeight: 700, cursor: "pointer", marginTop: 8 },
  hint: { marginTop: 20, padding: "12px 16px", background: "#0f1117", borderRadius: 8, fontSize: 12, color: "#64748b", lineHeight: 1.8 },
  appWrap: { display: "flex", minHeight: "100vh", background: "#0f1117", fontFamily: "'Segoe UI', sans-serif", color: "#e2e8f0" },
  sidebar: { background: "#13151f", borderRight: "1px solid #1e2030", display: "flex", flexDirection: "column", transition: "width 0.2s", overflow: "hidden", flexShrink: 0 },
  sidebarHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 16px", borderBottom: "1px solid #1e2030" },
  logo: { fontSize: 18, fontWeight: 900, color: "#fff", letterSpacing: 2, whiteSpace: "nowrap" },
  logoAccent: { color: "#6366f1" },
  toggleBtn: { background: "none", border: "1px solid #2d2f45", color: "#94a3b8", borderRadius: 6, width: 28, height: 28, cursor: "pointer", fontSize: 12, flexShrink: 0 },
  nav: { flex: 1, padding: "12px 8px", display: "flex", flexDirection: "column", gap: 4 },
  navBtn: { display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 8, border: "none", background: "none", color: "#94a3b8", cursor: "pointer", width: "100%", textAlign: "left", transition: "all 0.15s", fontSize: 14 },
  navBtnActive: { background: "#1e1b4b", color: "#a5b4fc" },
  navIcon: { fontSize: 16, width: 20, textAlign: "center", flexShrink: 0 },
  navLabel: { whiteSpace: "nowrap" },
  sidebarFooter: { padding: "12px 8px", borderTop: "1px solid #1e2030" },
  userBadge: { display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", marginBottom: 8 },
  userAvatar: { width: 32, height: 32, borderRadius: "50%", background: "#6366f1", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, flexShrink: 0, lineHeight: "32px", textAlign: "center" },
  userName: { fontSize: 13, fontWeight: 600, color: "#e2e8f0", whiteSpace: "nowrap" },
  userRole: { fontSize: 11, color: "#64748b", whiteSpace: "nowrap" },
  syncBadge: { fontSize: 11, color: "#64748b", padding: "4px 10px", marginBottom: 6, textAlign: "center" },
  logoutBtn: { width: "100%", padding: "8px", background: "none", border: "1px solid #2d2f45", color: "#94a3b8", borderRadius: 8, cursor: "pointer", fontSize: 13 },
  main: { flex: 1, display: "flex", flexDirection: "column", overflow: "auto" },
  topbar: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 28px", borderBottom: "1px solid #1e2030", background: "#13151f" },
  pageTitle: { fontSize: 20, fontWeight: 700, color: "#fff", margin: 0 },
  dateChip: { background: "#1e2030", color: "#64748b", padding: "6px 14px", borderRadius: 20, fontSize: 13 },
  content: { padding: "28px", flex: 1, overflowY: "auto" },
  cardGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16, marginBottom: 28 },
  statCard: { background: "#13151f", border: "1px solid #1e2030", borderRadius: 12, padding: "20px 16px" },
  statIcon: { fontSize: 20, marginBottom: 8 },
  statValue: { fontSize: 20, fontWeight: 800, color: "#fff", marginBottom: 4 },
  statLabel: { fontSize: 12, color: "#64748b" },
  formCard: { background: "#13151f", border: "1px solid #1e2030", borderRadius: 12, padding: "24px", marginBottom: 24 },
  formTitle: { fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 16 },
  formGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16, marginBottom: 16 },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 12, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 },
  input: { background: "#0f1117", border: "1px solid #2d2f45", borderRadius: 8, padding: "10px 14px", color: "#e2e8f0", fontSize: 14, outline: "none" },
  primaryBtn: { background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontWeight: 700, cursor: "pointer", fontSize: 14 },
  ghostBtn: { background: "none", border: "1px solid #2d2f45", color: "#94a3b8", borderRadius: 8, padding: "10px 20px", cursor: "pointer", fontSize: 14 },
  smallBtn: { background: "#1e2030", border: "1px solid #2d2f45", color: "#94a3b8", borderRadius: 8, padding: "10px 14px", cursor: "pointer", fontSize: 13 },
  iconBtn: { background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 16, padding: "4px 6px" },
  qtyBtn: { background: "#1e2030", border: "1px solid #2d2f45", color: "#fff", borderRadius: 4, width: 24, height: 24, cursor: "pointer", fontSize: 14, lineHeight: 1 },
  successMsg: { color: "#22c55e", fontSize: 13, fontWeight: 600 },
  errorMsg: { color: "#ef4444", fontSize: 13, marginTop: 8 },
  searchBar: { display: "flex", alignItems: "center", gap: 12, marginBottom: 16 },
  countChip: { background: "#1e2030", color: "#64748b", padding: "6px 14px", borderRadius: 20, fontSize: 13 },
  table: { background: "#13151f", border: "1px solid #1e2030", borderRadius: 12, overflow: "hidden" },
  tableHead: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", padding: "12px 16px", background: "#0f1117", fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, gap: 8 },
  tableRow: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", padding: "12px 16px", borderTop: "1px solid #1e2030", fontSize: 14, gap: 8, alignItems: "center" },
  empty: { padding: "32px", textAlign: "center", color: "#475569", fontSize: 14 },
  mono: { fontFamily: "monospace", fontSize: 12, color: "#64748b" },
  sectionTitle: { fontSize: 15, fontWeight: 700, color: "#94a3b8", marginBottom: 12, marginTop: 24 },
  cartSummary: { background: "#13151f", border: "1px solid #1e2030", borderRadius: 12, padding: "24px", position: "sticky", top: 0 },
  cartTitle: { fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 16 },
  cartTotal: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, padding: "12px 0", borderTop: "1px solid #1e2030", borderBottom: "1px solid #1e2030" },
  function ScannerModal({ onClose, onScan }) {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner("reader", { 
      fps: 10, 
      qrbox: { width: 250, height: 150 }, // Shtrix kod uchun kengroq
      aspectRatio: 1.0 
    });
    scanner.render(onScan, (err) => {});
    return () => scanner.clear();
  }, []);

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modalContent}>
        <div id="reader" style={{ width: "100%" }}></div>
        <button style={styles.btnDanger} onClick={onClose}>Yopish</button>
      </div>
    </div>
  );
}

};
