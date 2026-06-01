export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: "#f6f8f8", fontFamily: "'Hanken Grotesk', system-ui, sans-serif" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "60px 32px 120px" }}>
        <a href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#5c747e", fontSize: 14, textDecoration: "none", marginBottom: 48 }}>
          ← Back to Simera
        </a>
        {children}
      </div>
    </div>
  );
}
