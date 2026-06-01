"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Building2,
  Bell,
  Shield,
  CreditCard,
  Users,
  Plug,
  Check,
  ChevronRight,
  Upload,
  Trash2,
  X,
  Loader2,
} from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useAuditData } from "@/lib/use-audit-data";
import {
  getTeamMembers,
  inviteTeamMember,
  removeTeamMember,
  getBillingStatus,
  createCheckoutSession,
  createPortalSession,
  type TeamMember,
  type BillingStatus,
} from "@/lib/api";

const TABS = [
  { id: "practice",      label: "Practice",      icon: Building2 },
  { id: "notifications", label: "Notifications",  icon: Bell },
  { id: "integrations",  label: "Integrations",   icon: Plug },
  { id: "team",          label: "Team",            icon: Users },
  { id: "billing",       label: "Billing",         icon: CreditCard },
  { id: "security",      label: "Security & HIPAA",icon: Shield },
] as const;

type TabId = typeof TABS[number]["id"];

function SaveBar({ onSave }: { onSave: () => void }) {
  return (
    <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-border">
      <button className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        Cancel
      </button>
      <button
        onClick={onSave}
        className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
      >
        Save changes
      </button>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-9 h-5 rounded-full transition-colors ${checked ? "bg-primary" : "bg-secondary border border-border"}`}
    >
      <span
        className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${checked ? "left-4" : "left-0.5"}`}
      />
    </button>
  );
}

function Field({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between py-4 border-b border-border last:border-0">
      <div className="flex-1 mr-8">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

// ── Tab panels ───────────────────────────────────────────────────────────────

function PracticeTab() {
  const auditData = useAuditData();
  const { user } = useUser();
  const [saved, setSaved] = useState(false);
  const [name, setName] = useState(auditData.practiceName);
  const [specialty, setSpecialty] = useState("Family Medicine");
  const [npi, setNpi] = useState("1234567890");
  const [taxId, setTaxId] = useState("**-*******");
  const [timezone, setTimezone] = useState("America/New_York");
  const [providers, setProviders] = useState("3");
  const contactEmail = user?.emailAddresses?.[0]?.emailAddress ?? "";

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <h2 className="text-base font-semibold text-foreground mb-1">Practice Information</h2>
      <p className="text-sm text-muted-foreground mb-6">
        This information appears on your audit reports and benchmarking comparisons.
      </p>

      <div className="space-y-4">
        {[
          { label: "Practice Name", value: name, onChange: setName, type: "text" },
          { label: "Specialty", value: specialty, onChange: setSpecialty, type: "text" },
          { label: "Number of Providers", value: providers, onChange: setProviders, type: "number" },
          { label: "NPI Number", value: npi, onChange: setNpi, type: "text" },
          { label: "Tax ID (EIN)", value: taxId, onChange: setTaxId, type: "text" },
          { label: "Timezone", value: timezone, onChange: setTimezone, type: "text" },
        ].map((f) => (
          <div key={f.label}>
            <label className="text-xs font-medium text-foreground block mb-1.5">{f.label}</label>
            <input
              type={f.type}
              value={f.value}
              onChange={(e) => f.onChange(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg outline-none focus:border-primary transition-colors"
            />
          </div>
        ))}
        <div>
          <label className="text-xs font-medium text-foreground block mb-1.5">Contact Email</label>
          <input
            type="email"
            value={contactEmail}
            readOnly
            className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg outline-none text-muted-foreground"
          />
        </div>
      </div>

      <div className="pt-6 mt-6 border-t border-border">
        <label className="text-xs font-medium text-foreground block mb-1.5">
          Contracted Fee Schedule (optional)
        </label>
        <p className="text-xs text-muted-foreground mb-3">
          Upload a JSON file mapping CPT codes to contracted rates for precise underpayment detection.
          Format: <code className="bg-secondary px-1 py-0.5 rounded text-[11px]">{`{"99214": 165.00, "99215": 210.00}`}</code>
        </p>
        <button className="flex items-center gap-2 px-3 py-2 border border-dashed border-border rounded-lg text-sm text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors">
          <Upload className="w-4 h-4" />
          Upload rates.json
        </button>
      </div>

      <div className="flex items-center justify-between pt-6 mt-6 border-t border-border">
        <div />
        <button
          onClick={handleSave}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
            saved
              ? "bg-emerald-500 text-white"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          }`}
        >
          {saved ? <><Check className="w-3.5 h-3.5" /> Saved</> : "Save changes"}
        </button>
      </div>
    </div>
  );
}

function NotificationsTab() {
  const [alerts, setAlerts] = useState({
    deadlineApproaching: true,
    newDenialPattern: true,
    payerPolicyChange: true,
    weeklyDigest: true,
    monthlyReport: false,
    criticalOnly: false,
  });

  const toggle = (k: keyof typeof alerts) =>
    setAlerts((p) => ({ ...p, [k]: !p[k] }));

  return (
    <div>
      <h2 className="text-base font-semibold text-foreground mb-1">Notifications</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Choose when Simera alerts you. Delivered by email and in-app.
      </p>

      <div className="bg-card border border-border rounded-lg divide-y divide-border">
        <Field label="Appeal deadline approaching" sub="Alert when a denial is 30 days from expiring">
          <Toggle checked={alerts.deadlineApproaching} onChange={() => toggle("deadlineApproaching")} />
        </Field>
        <Field label="New denial pattern detected" sub="When a payer starts denying a code they previously paid">
          <Toggle checked={alerts.newDenialPattern} onChange={() => toggle("newDenialPattern")} />
        </Field>
        <Field label="Payer policy change" sub="Prior auth requirement additions or removals">
          <Toggle checked={alerts.payerPolicyChange} onChange={() => toggle("payerPolicyChange")} />
        </Field>
        <Field label="Weekly digest" sub="Summary of new leakage found and recovery progress every Monday">
          <Toggle checked={alerts.weeklyDigest} onChange={() => toggle("weeklyDigest")} />
        </Field>
        <Field label="Monthly audit report" sub="Full PDF report emailed on the 1st of each month">
          <Toggle checked={alerts.monthlyReport} onChange={() => toggle("monthlyReport")} />
        </Field>
        <Field label="Critical alerts only" sub="Suppress all non-critical notifications">
          <Toggle checked={alerts.criticalOnly} onChange={() => toggle("criticalOnly")} />
        </Field>
      </div>

      <div className="mt-6">
        <label className="text-xs font-medium text-foreground block mb-1.5">Alert email addresses</label>
        <input
          type="email"
          defaultValue="drriverview@riveviewfamily.com"
          className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg outline-none focus:border-primary transition-colors"
        />
        <p className="text-xs text-muted-foreground mt-1">Separate multiple addresses with commas</p>
      </div>

      <SaveBar onSave={() => {}} />
    </div>
  );
}

function IntegrationsTab() {
  const integrations = [
    {
      name: "Athenahealth",
      description: "Auto-import 835 ERA files from your athenahealth account",
      status: "available",
      logo: "A",
    },
    {
      name: "Kareo / Tebra",
      description: "Sync denial data and push recovery tasks back to Kareo",
      status: "available",
      logo: "K",
    },
    {
      name: "AdvancedMD",
      description: "Import ERA files and patient ledger data",
      status: "available",
      logo: "M",
    },
    {
      name: "Change Healthcare",
      description: "Clearinghouse connection for automated 835 delivery",
      status: "connected",
      logo: "C",
    },
    {
      name: "Office Ally",
      description: "Free clearinghouse — pull ERA files automatically",
      status: "available",
      logo: "O",
    },
    {
      name: "Epic (coming soon)",
      description: "Direct EHR integration via FHIR API",
      status: "soon",
      logo: "E",
    },
  ];

  return (
    <div>
      <h2 className="text-base font-semibold text-foreground mb-1">Integrations</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Connect your billing software so Simera automatically pulls new 835 files — no manual uploads.
      </p>

      <div className="space-y-3">
        {integrations.map((int) => (
          <div key={int.name} className="flex items-center gap-4 p-4 bg-card border border-border rounded-lg">
            <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-sm font-bold text-foreground flex-shrink-0">
              {int.logo}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{int.name}</p>
              <p className="text-xs text-muted-foreground">{int.description}</p>
            </div>
            {int.status === "connected" && (
              <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Connected
              </span>
            )}
            {int.status === "available" && (
              <button className="flex items-center gap-1 text-xs text-primary font-medium hover:underline">
                Connect <ChevronRight className="w-3 h-3" />
              </button>
            )}
            {int.status === "soon" && (
              <span className="text-xs text-muted-foreground bg-secondary border border-border px-2.5 py-1 rounded-full">
                Coming soon
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  billing_staff: "Billing Staff",
  viewer: "Viewer",
};

function initials(name: string | null | undefined, email: string): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    return parts[0][0].toUpperCase();
  }
  return email[0]?.toUpperCase() ?? "?";
}

function TeamTab() {
  const { user } = useUser();
  const userName = user?.fullName ?? user?.firstName ?? "You";
  const userEmail = user?.emailAddresses?.[0]?.emailAddress ?? "";
  const userInitials = user?.firstName && user?.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : userName[0]?.toUpperCase() ?? "U";

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState("billing_staff");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");

  const [removing, setRemoving] = useState<Set<string>>(new Set());

  const fetchMembers = useCallback(async () => {
    setLoadingMembers(true);
    const data = await getTeamMembers();
    setMembers(data);
    setLoadingMembers(false);
  }, []);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    setInviteError("");
    try {
      await inviteTeamMember(inviteEmail.trim(), inviteName.trim(), inviteRole);
      setInviteEmail("");
      setInviteName("");
      setInviteRole("billing_staff");
      await fetchMembers();
    } catch (err: any) {
      setInviteError(err?.message ?? "Failed to send invite.");
    } finally {
      setInviting(false);
    }
  }

  async function handleRemove(email: string) {
    setRemoving((prev) => new Set(prev).add(email));
    try {
      await removeTeamMember(email);
      setMembers((prev) => prev.filter((m) => m.member_email !== email));
    } catch {
      // silently keep in list on failure
    } finally {
      setRemoving((prev) => { const s = new Set(prev); s.delete(email); return s; });
    }
  }

  return (
    <div>
      <h2 className="text-base font-semibold text-foreground mb-1">Team Members</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Manage who has access to your Simera account. All users must sign a BAA.
      </p>

      {/* Member list */}
      <div className="space-y-2 mb-6">
        {/* Current user — always first */}
        <div className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg">
          <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-semibold text-primary flex-shrink-0">
            {userInitials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">{userName}</p>
            <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
          </div>
          <span className="text-xs text-primary border border-primary/30 bg-primary/5 rounded px-2 py-0.5 flex-shrink-0">
            You (Owner)
          </span>
        </div>

        {/* Invited members */}
        {loadingMembers ? (
          <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading team…
          </div>
        ) : members.length === 0 ? (
          <p className="text-sm text-muted-foreground px-1">No team members invited yet.</p>
        ) : (
          members.map((m) => (
            <div key={m.member_email} className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg">
              <div className="w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center text-xs font-semibold text-foreground flex-shrink-0">
                {initials(m.member_name, m.member_email)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {m.member_name || m.member_email}
                </p>
                {m.member_name && (
                  <p className="text-xs text-muted-foreground truncate">{m.member_email}</p>
                )}
              </div>
              <span className="text-xs text-muted-foreground border border-border rounded px-2 py-0.5 flex-shrink-0">
                {ROLE_LABELS[m.role] ?? m.role}
              </span>
              {m.accepted_at ? (
                <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium flex-shrink-0">
                  <Check className="w-3 h-3" /> Accepted
                </span>
              ) : (
                <span className="text-xs text-amber-600 font-medium flex-shrink-0">Pending</span>
              )}
              <button
                onClick={() => handleRemove(m.member_email)}
                disabled={removing.has(m.member_email)}
                className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-40 flex-shrink-0"
                title="Remove member"
              >
                {removing.has(m.member_email)
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <X className="w-3.5 h-3.5" />}
              </button>
            </div>
          ))
        )}
      </div>

      {/* Invite form */}
      <div className="border border-border rounded-lg p-4 bg-card">
        <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">Invite a team member</p>
        <form onSubmit={handleInvite} className="space-y-3">
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Email address <span className="text-destructive">*</span></label>
            <input
              type="email"
              required
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="billing@yourpractice.com"
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg outline-none focus:border-primary transition-colors"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Name <span className="text-muted-foreground font-normal">(optional)</span></label>
            <input
              type="text"
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              placeholder="Maria Santos"
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg outline-none focus:border-primary transition-colors"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Role</label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg outline-none focus:border-primary transition-colors"
            >
              <option value="billing_staff">Billing Staff</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          {inviteError && (
            <p className="text-xs text-destructive">{inviteError}</p>
          )}
          <button
            type="submit"
            disabled={inviting || !inviteEmail.trim()}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {inviting ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending…</> : "Send Invite"}
          </button>
        </form>
      </div>
    </div>
  );
}

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  starter: "Starter",
  growth: "Growth",
};

const STATUS_BADGE: Record<
  string,
  { label: string; className: string }
> = {
  active:    { label: "Active",   className: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  trialing:  { label: "Trial",    className: "text-blue-600 bg-blue-50 border-blue-200" },
  past_due:  { label: "Past Due", className: "text-amber-600 bg-amber-50 border-amber-200" },
  canceled:  { label: "Canceled", className: "text-red-600 bg-red-50 border-red-200" },
};

const PLANS = [
  {
    id: "starter" as const,
    name: "Starter",
    price: "$149",
    features: [
      "1 provider",
      "Up to 3 835 uploads/month",
      "All analysis features",
      "Email support",
    ],
  },
  {
    id: "growth" as const,
    name: "Growth",
    price: "$299",
    features: [
      "Up to 5 providers",
      "Unlimited uploads",
      "Priority support",
      "Team members",
    ],
    highlighted: true,
  },
];

function BillingTab() {
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    getBillingStatus()
      .then(setBilling)
      .catch(() => setError("Could not load billing info."))
      .finally(() => setLoading(false));
  }, []);

  const handleSubscribe = async (plan: "starter" | "growth") => {
    setCheckoutLoading(plan);
    setError(null);
    try {
      const url = await createCheckoutSession(plan);
      window.location.href = url;
    } catch (e: any) {
      setError(e.message ?? "Failed to start checkout.");
      setCheckoutLoading(null);
    }
  };

  const handlePortal = async () => {
    setPortalLoading(true);
    setError(null);
    try {
      const url = await createPortalSession();
      window.location.href = url;
    } catch (e: any) {
      setError(e.message ?? "Failed to open billing portal.");
      setPortalLoading(false);
    }
  };

  const plan = billing?.plan ?? "free";
  const subStatus = billing?.status ?? "active";
  const badge = STATUS_BADGE[subStatus] ?? STATUS_BADGE.active;
  const isPaid = plan !== "free";

  const renewalDate = billing?.current_period_end
    ? new Date(billing.current_period_end).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const showPlanCards = !isPaid || subStatus === "canceled";

  return (
    <div>
      <h2 className="text-base font-semibold text-foreground mb-1">Billing & Subscription</h2>
      <p className="text-sm text-muted-foreground mb-6">Manage your Simera subscription.</p>

      {error && (
        <div className="flex items-center gap-2 p-3 mb-5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <span className="w-4 h-4 flex-shrink-0 text-red-500">!</span>
          {error}
        </div>
      )}

      {/* Current plan card */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-5 mb-6">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading subscription...
          </div>
        ) : (
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs text-primary font-semibold uppercase tracking-wider mb-1">
                Current Plan
              </p>
              <div className="flex items-center gap-2.5 mb-1">
                <p className="text-xl font-bold text-foreground">
                  {PLAN_LABELS[plan] ?? plan}
                </p>
                <span
                  className={`text-[11px] font-medium border px-2 py-0.5 rounded-full ${badge.className}`}
                >
                  {badge.label}
                </span>
              </div>
              {plan === "starter" && (
                <p className="text-sm text-muted-foreground">1 provider · 3 uploads/month · $149/month</p>
              )}
              {plan === "growth" && (
                <p className="text-sm text-muted-foreground">Up to 5 providers · Unlimited uploads · $299/month</p>
              )}
              {plan === "free" && (
                <p className="text-sm text-muted-foreground">Limited access — subscribe to unlock full analysis</p>
              )}
            </div>

            {isPaid && renewalDate && subStatus !== "canceled" && (
              <div className="text-right flex-shrink-0">
                <p className="text-xs text-muted-foreground">Renews</p>
                <p className="text-sm font-medium text-foreground">{renewalDate}</p>
              </div>
            )}
          </div>
        )}

        {isPaid && !loading && (
          <div className="mt-4 pt-4 border-t border-primary/15">
            <button
              onClick={handlePortal}
              disabled={portalLoading}
              className="flex items-center gap-1.5 text-xs text-primary font-medium hover:underline disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {portalLoading && <Loader2 className="w-3 h-3 animate-spin" />}
              Manage billing
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Plan cards — shown when on free plan or subscription is canceled */}
      {showPlanCards && (
        <>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            {plan === "free" ? "Choose a plan" : "Reactivate subscription"}
          </p>
          <div className="grid grid-cols-2 gap-4">
            {PLANS.map((p) => (
              <div
                key={p.id}
                className={`relative flex flex-col rounded-xl border p-5 transition-all ${
                  p.highlighted
                    ? "border-primary/40 bg-primary/5 shadow-sm"
                    : "border-border bg-card"
                }`}
              >
                {p.highlighted && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] font-semibold bg-primary text-primary-foreground px-2.5 py-0.5 rounded-full uppercase tracking-wide">
                    Most popular
                  </span>
                )}

                <div className="mb-4">
                  <p className="text-sm font-semibold text-foreground">{p.name}</p>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-bold text-foreground">{p.price}</span>
                    <span className="text-xs text-muted-foreground">/mo</span>
                  </div>
                </div>

                <ul className="space-y-2 mb-5 flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe(p.id)}
                  disabled={!!checkoutLoading}
                  className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                    p.highlighted
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-secondary text-foreground border border-border hover:bg-secondary/80"
                  }`}
                >
                  {checkoutLoading === p.id && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  )}
                  Subscribe
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function SecurityTab() {
  const [mfa, setMfa] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState(true);
  const [auditLog, setAuditLog] = useState(true);

  return (
    <div>
      <h2 className="text-base font-semibold text-foreground mb-1">Security & HIPAA</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Simera is HIPAA-compliant. Below are your account-level security controls.
      </p>

      {/* HIPAA status */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6 flex items-start gap-3">
        <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-emerald-800">HIPAA BAA on file</p>
          <p className="text-xs text-emerald-700 mt-0.5">
            Business Associate Agreement signed May 31, 2026. All 835 data is encrypted at rest (AES-256)
            and in transit (TLS 1.3). Files are auto-deleted after 7 days. Audit logs retained 7 years.
          </p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg divide-y divide-border mb-6">
        <Field label="Two-factor authentication" sub="Require 2FA for all team members">
          <Toggle checked={mfa} onChange={setMfa} />
        </Field>
        <Field label="Session timeout" sub="Auto-logout after 30 minutes of inactivity">
          <Toggle checked={sessionTimeout} onChange={setSessionTimeout} />
        </Field>
        <Field label="Access audit log" sub="Log all user actions for compliance review">
          <Toggle checked={auditLog} onChange={setAuditLog} />
        </Field>
      </div>

      {/* Data */}
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Data & Privacy</p>
      <div className="space-y-2">
        <button className="w-full flex items-center justify-between p-3 bg-card border border-border rounded-lg hover:border-border/80 transition-colors group">
          <div className="text-left">
            <p className="text-sm font-medium text-foreground">Download all data</p>
            <p className="text-xs text-muted-foreground">Export all audit history as JSON</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
        </button>
        <button className="w-full flex items-center justify-between p-3 bg-card border border-red-200 rounded-lg hover:border-red-300 transition-colors group">
          <div className="text-left">
            <p className="text-sm font-medium text-red-600">Delete all data</p>
            <p className="text-xs text-muted-foreground">Permanently delete all 835 files and audit history</p>
          </div>
          <Trash2 className="w-4 h-4 text-red-400 group-hover:text-red-600" />
        </button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("practice");

  const panels: Record<TabId, React.ReactNode> = {
    practice:      <PracticeTab />,
    notifications: <NotificationsTab />,
    integrations:  <IntegrationsTab />,
    team:          <TeamTab />,
    billing:       <BillingTab />,
    security:      <SecurityTab />,
  };

  return (
    <div className="p-6 max-w-[900px]">
      <div className="mb-6">
        <h1 className="text-lg font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your practice, team, and account preferences</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar nav */}
        <nav className="w-44 flex-shrink-0 space-y-0.5">
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors text-left ${
                  active
                    ? "bg-primary/8 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <tab.icon className={`w-4 h-4 flex-shrink-0 ${active ? "text-primary" : ""}`} />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Panel */}
        <div className="flex-1 bg-card border border-border rounded-xl p-6 min-h-[500px]">
          {panels[activeTab]}
        </div>
      </div>
    </div>
  );
}
