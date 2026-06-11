import { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { setPassword } from "../api/auth";

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "At least 8 characters", ok: password.length >= 8 },
    { label: "Contains a number",      ok: /\d/.test(password) },
    { label: "Contains a letter",      ok: /[a-zA-Z]/.test(password) },
  ];
  return (
    <div className="flex flex-col gap-1 mt-2">
      {checks.map((c) => (
        <div key={c.label} className="flex items-center gap-1.5">
          <div
            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
              c.ok ? "bg-green-primary" : "bg-slyce-border"
            }`}
          />
          <span className={`text-[10px] ${c.ok ? "text-green-primary" : "text-slyce-grey"}`}>
            {c.label}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function SetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [password, setPasswordVal]   = useState("");
  const [confirm, setConfirm]        = useState("");
  const [showPwd, setShowPwd]        = useState(false);
  const [showConfirm, setShowConfirm]= useState(false);
  const [loading, setLoading]        = useState(false);
  const [success, setSuccess]        = useState(false);
  const [error, setError]            = useState<string | null>(null);

  const passwordsMatch = password === confirm && confirm.length > 0;
  const isValid = password.length >= 8 && /\d/.test(password) && /[a-zA-Z]/.test(password);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    if (!isValid)        { setError("Password does not meet the requirements."); return; }
    if (!passwordsMatch) { setError("Passwords do not match."); return; }

    setError(null);
    setLoading(true);
    try {
      await setPassword(token, password);
      setSuccess(true);
      // Auto-redirect to login after 3 s
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to set password. The link may have expired.");
    } finally {
      setLoading(false);
    }
  }

  /* ── Invalid / missing token ── */
  if (!token) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={22} className="text-red-500" />
          </div>
          <h1 className="text-lg font-bold text-slyce-dark mb-2">Invalid Link</h1>
          <p className="text-sm text-slyce-grey mb-6">
            This password setup link is missing or invalid. Please check your email
            for the correct link or contact support.
          </p>
          <Link
            to="/login"
            className="inline-block w-full bg-green-primary text-white py-3 rounded-xl text-sm font-semibold hover:bg-green-600 transition-colors"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  /* ── Success state ── */
  if (success) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-green-primary/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={22} className="text-green-primary" />
          </div>
          <h1 className="text-lg font-bold text-slyce-dark mb-2">Password Set!</h1>
          <p className="text-sm text-slyce-grey mb-1">
            Your password has been saved. You can now log in to the Slyce Merchant Portal.
          </p>
          <p className="text-xs text-slyce-grey mb-6">Redirecting to login…</p>
          <Link
            to="/login"
            className="inline-block w-full bg-green-primary text-white py-3 rounded-xl text-sm font-semibold hover:bg-green-600 transition-colors"
          >
            Log in now
          </Link>
        </div>
      </div>
    );
  }

  /* ── Main form ── */
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4 font-inter">
      <div className="bg-white rounded-2xl shadow-sm w-full max-w-sm p-8">

        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          <img src="/greenLogo.png" alt="Slyce" className="w-7 h-7 object-contain" />
          <span className="font-semibold text-sm text-slyce-dark">for Merchant</span>
        </div>

        <h1 className="text-2xl font-bold text-slyce-dark mb-1">Set your password</h1>
        <p className="text-sm text-slyce-grey mb-7">
          Your application was approved! Create a password to activate your
          Slyce Merchant account.
        </p>

        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-5">
            <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-slyce-dark mb-1.5">
              New password
            </label>
            <div className="relative">
              <input
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={(e) => { setPasswordVal(e.target.value); setError(null); }}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 pr-10 text-sm rounded-xl border border-slyce-border bg-white placeholder:text-slyce-grey focus:outline-none focus:border-green-primary transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slyce-grey hover:text-slyce-dark"
              >
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {password && <PasswordStrength password={password} />}
          </div>

          {/* Confirm password */}
          <div>
            <label className="block text-xs font-semibold text-slyce-dark mb-1.5">
              Confirm password
            </label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirm}
                onChange={(e) => { setConfirm(e.target.value); setError(null); }}
                placeholder="••••••••"
                required
                className={`w-full px-4 py-3 pr-10 text-sm rounded-xl border bg-white placeholder:text-slyce-grey focus:outline-none transition-colors ${
                  confirm.length > 0
                    ? passwordsMatch
                      ? "border-green-primary focus:border-green-primary"
                      : "border-red-400 focus:border-red-400"
                    : "border-slyce-border focus:border-green-primary"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slyce-grey hover:text-slyce-dark"
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {confirm.length > 0 && !passwordsMatch && (
              <p className="text-[10px] text-red-500 mt-1">Passwords do not match.</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !isValid || !passwordsMatch}
            className="w-full bg-green-primary text-white py-3 rounded-xl text-sm font-semibold hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
          >
            {loading && <Loader2 size={15} className="animate-spin" />}
            {loading ? "Saving…" : "Set Password & Activate Account"}
          </button>
        </form>

        <p className="text-center text-xs text-slyce-grey mt-6">
          Already have a password?{" "}
          <Link to="/login" className="text-green-primary hover:underline font-medium">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
