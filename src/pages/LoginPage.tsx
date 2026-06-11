import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { login } from "../api/auth";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { setAuth } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await login(email, password);
      setAuth(result.name, result.restaurantId, result.branchId);
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-inter">
      {/* Left image pane */}
      <div className="hidden md:block w-1/2 bg-slate-200 relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=1000&fit=crop"
          alt="Food"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-slate-600/30" />
      </div>

      {/* Right form pane */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 bg-cream">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          <img
            src="/greenLogo.png"
            alt="Slyce"
            className="w-7 h-7 object-contain"
          />
          <span className="font-semibold text-sm text-slyce-dark">
            for Merchant
          </span>
        </div>

        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold text-slyce-dark mb-1">
            Welcome back
          </h1>
          <p className="text-sm text-slyce-grey mb-7">
            Log in to your Slyce for Merchant Portal
          </p>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4">
              <AlertCircle size={15} className="flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              required
              className="w-full px-4 py-3 text-sm rounded-xl border border-slyce-border bg-white placeholder:text-slyce-grey focus:outline-none focus:border-green-primary transition-colors"
            />

            <div className="relative">
              <input
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
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

            <div className="flex justify-end">
              <a
                href="#"
                className="text-xs text-green-primary hover:underline font-medium"
              >
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-primary text-white py-3 rounded-xl text-sm font-semibold hover:bg-green-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && (
                <svg
                  className="animate-spin h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
              )}
              {loading ? "Logging in…" : "Log in"}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-slyce-border" />
            <span className="text-xs text-slyce-grey">or</span>
            <div className="flex-1 h-px bg-slyce-border" />
          </div>

          {/* Google Sign In */}
          <button className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl border border-slyce-border bg-white text-sm font-medium text-slyce-dark hover:bg-cream transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Sign in with Google
          </button>

          <button className="w-full mt-3 py-3 rounded-xl bg-slyce-border/40 text-sm font-medium text-slyce-grey hover:bg-slyce-border transition-colors">
            Create an account
          </button>

          <p className="text-center text-xs text-slyce-grey mt-6">
            Don't have an account?{" "}
            <Link
              to="/"
              className="text-green-primary hover:underline font-medium"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
