import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { House, ArrowRight, User, Stethoscope, Users, LogIn, AlertCircle } from "lucide-react";
import { useAuth } from "../hooks/use-auth";
import { formatApiError } from "../api/client";
import { BackendStatusBanner } from "../components/backend-status-banner";
import { SmritiSetuLogo } from "../components/SmritiSetuLogo";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign In | SmritiSetu" },
      { name: "description", content: "Sign in to SmritiSetu cognitive companion platform." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { login, demoLogin } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage("Please enter your email address.");
      return;
    }
    if (!password) {
      setErrorMessage("Please enter your password.");
      return;
    }

    setIsLoading(true);

    try {
      const user = await login(cleanEmail, password);
      if (user.role === "caretaker") {
        navigate({ to: "/caregiver" });
      } else if (user.role === "doctor") {
        navigate({ to: "/doctor" });
      } else {
        navigate({ to: "/" });
      }
    } catch (err: unknown) {
      setErrorMessage(formatApiError(err, "Sign in failed. Check your credentials."));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemo = async (role: "patient" | "caretaker" | "doctor") => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await demoLogin(role);
      if (role === "caretaker") {
        navigate({ to: "/caregiver" });
      } else if (role === "doctor") {
        navigate({ to: "/doctor" });
      } else {
        navigate({ to: "/" });
      }
    } catch (err: unknown) {
      setErrorMessage(formatApiError(err, "Failed to load demo profile"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <BackendStatusBanner />
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-3.5 group">
          <SmritiSetuLogo size={56} showGlow={true} className="group-hover:scale-105 transition-transform" />
          <div className="text-left">
            <span className="font-display text-3xl sm:text-4xl font-bold text-cream block leading-tight group-hover:text-sun transition-colors">
              SmritiSetu
            </span>
            <span className="text-xs text-sun font-bold uppercase tracking-wider">
              স্মৃতি সেতু · Cognitive Companion
            </span>
          </div>
        </Link>
        <h1 className="mt-6 text-2xl sm:text-3xl font-bold tracking-tight text-cream">Welcome Back</h1>
        <p className="mt-1.5 text-sm sm:text-base text-cream/70">
          Sign in to access your daily companion, medicine, and care plans.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg px-4">
        {/* Quick Demo Logins Box */}
        <div className="mb-6 rounded-2xl border-2 border-sun/40 bg-surface/80 p-5 shadow-card">
          <p className="text-xs font-extrabold uppercase tracking-wider text-sun mb-3 text-center">
            ⚡ Quick 1-Click Demo Profiles (Pre-Configured)
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleDemo("patient")}
              className="flex flex-col items-center justify-center p-3 rounded-xl border border-clay bg-ink text-cream hover:bg-sun hover:text-ink transition duration-200 text-center"
            >
              <User size={22} className="mb-1 text-sun" />
              <span className="text-xs font-bold">Lalita</span>
              <span className="text-[10px] opacity-70">Patient</span>
            </button>

            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleDemo("caretaker")}
              className="flex flex-col items-center justify-center p-3 rounded-xl border border-clay bg-ink text-cream hover:bg-sun hover:text-ink transition duration-200 text-center"
            >
              <Users size={22} className="mb-1 text-tea-confirm" />
              <span className="text-xs font-bold">Rahul</span>
              <span className="text-[10px] opacity-70">Caregiver</span>
            </button>

            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleDemo("doctor")}
              className="flex flex-col items-center justify-center p-3 rounded-xl border border-clay bg-ink text-cream hover:bg-sun hover:text-ink transition duration-200 text-center"
            >
              <Stethoscope size={22} className="mb-1 text-fire" />
              <span className="text-xs font-bold">Dr. Sharma</span>
              <span className="text-[10px] opacity-70">Doctor</span>
            </button>
          </div>
        </div>

        {/* Credentials Login Form */}
        <div className="rounded-2xl border border-clay bg-surface p-8 shadow-card">
          {errorMessage && (
            <div className="mb-6 flex items-center gap-3 rounded-xl border border-fire/60 bg-fire/15 p-4 text-sm text-cream">
              <AlertCircle size={20} className="shrink-0 text-fire" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="email" className="block text-base font-bold text-cream mb-2">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="h-12 text-base bg-ink border-clay text-cream focus-visible:ring-sun"
              />
            </div>

            <div>
              <Label htmlFor="password" className="block text-base font-bold text-cream mb-2">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-12 text-base bg-ink border-clay text-cream focus-visible:ring-sun"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              variant="cream"
              size="touch"
              className="w-full text-lg mt-2 font-bold"
            >
              {isLoading ? (
                "Signing In…"
              ) : (
                <>
                  <LogIn size={20} /> SIGN IN
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-cream/70">
            Don't have an account yet?{" "}
            <Link to="/register" className="font-bold text-sun hover:underline">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
