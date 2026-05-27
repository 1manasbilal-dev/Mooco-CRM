"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Lock, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.error("Reset token is missing from the URL.");
      return;
    }

    if (!password || !confirmPassword) {
      toast.error("Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to reset password");
      }

      toast.success("Password reset successfully!");
      setSuccess(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="flex flex-col items-center gap-4 text-center py-4">
        <div className="text-red-400 p-3 bg-red-500/10 rounded-xl border border-red-500/20">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-xl font-semibold text-slate-200">Invalid Link</h2>
        <p className="text-sm text-slate-400">
          The password reset token is missing from the URL. Please request a new link.
        </p>
        <Link 
          href="/forgot-password" 
          className="mt-2 text-sm text-emerald-400 hover:text-emerald-300 font-semibold transition"
        >
          Request new link
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex flex-col items-center gap-4 text-center py-4">
        <div className="text-emerald-400 p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
          <ShieldCheck size={32} />
        </div>
        <h2 className="text-xl font-semibold text-slate-200">Password Updated</h2>
        <p className="text-sm text-slate-400">
          Your password has been successfully reset. You can now log in with your new credentials.
        </p>
        <Link 
          href="/login" 
          className="w-full mt-2 py-3 bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-400 hover:to-blue-400 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/10 text-sm"
        >
          Log In Now <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          New Password
        </label>
        <div className="relative">
          <span className="absolute inset-y-0 left-3 flex items-center text-slate-500">
            <Lock size={18} />
          </span>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl focus:border-emerald-500/50 focus:outline-none transition text-sm text-slate-200"
            required
            minLength={6}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Confirm Password
        </label>
        <div className="relative">
          <span className="absolute inset-y-0 left-3 flex items-center text-slate-500">
            <Lock size={18} />
          </span>
          <input
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl focus:border-emerald-500/50 focus:outline-none transition text-sm text-slate-200"
            required
            minLength={6}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full mt-2 py-3 bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-400 hover:to-blue-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-500/10 text-sm"
      >
        {loading ? "Resetting..." : "Reset Password"}
        {!loading && <ArrowRight size={16} />}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen relative flex items-center justify-center bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[400px] h-[400px] rounded-full bg-blue-600/10 blur-[130px] pointer-events-none" />

      {/* Main card wrapper */}
      <div className="relative w-full max-w-md p-8 mx-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl shadow-2xl flex flex-col gap-6">
        <div className="flex flex-col items-center text-center gap-2">
          <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 text-blue-400">
            <Lock size={28} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
            Reset Password
          </h1>
          <p className="text-sm text-slate-400">
            Enter your new password to regain access to your account.
          </p>
        </div>

        <Suspense fallback={<div className="text-center text-slate-400 text-sm py-4">Loading reset form...</div>}>
          <ResetPasswordForm />
        </Suspense>

        <div className="text-center text-sm text-slate-400 border-t border-slate-800/60 pt-4">
          Remember your password?{" "}
          <Link href="/login" className="text-emerald-400 hover:text-emerald-300 font-semibold transition">
            Log In
          </Link>
        </div>
      </div>
    </div>
  );
}
