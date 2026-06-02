export const metadata = { title: "Request Access — Simera Health" };

export default function WaitlistPage() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "#0b2734",
      fontFamily: "'Hanken Grotesk', system-ui, sans-serif",
      padding: "40px 24px",
    }}>
      <div style={{ textAlign: "center", maxWidth: 480 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12,
          background: "linear-gradient(135deg, #14b8a6, #0891b2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 24px", fontSize: 22, fontWeight: 800, color: "#fff",
        }}>
          S
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#ffffff", letterSpacing: "-0.03em", marginBottom: 12 }}>
          Simera is currently in private beta
        </h1>
        <p style={{ fontSize: 16, color: "#8aa0a8", lineHeight: 1.6, marginBottom: 32 }}>
          {"We're onboarding independent practices one by one to make sure every team gets a great experience. Request access and we'll be in touch."}
        </p>
        <a
          href="mailto:hello@simera.health?subject=Beta%20Access%20Request&body=Practice%20name%3A%0AYour%20name%3A%0ANumber%20of%20providers%3A%0AEHRs%2Fbilling%20software%20you%20use%3A"
          style={{
            display: "inline-block",
            padding: "13px 28px",
            background: "#14b8a6",
            color: "#ffffff",
            borderRadius: 8,
            fontSize: 15,
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Request access
        </a>
        <p style={{ fontSize: 13, color: "#5c747e", marginTop: 20 }}>
          Already have access?{" "}
          <a href="/sign-in" style={{ color: "#14b8a6", textDecoration: "none" }}>Sign in</a>
        </p>
      </div>
    </div>
  );
}
