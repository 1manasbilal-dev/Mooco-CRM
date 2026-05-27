"use client";

import React, { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Mail, ArrowLeft, ShieldQuestion, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      toast.success("Reset link request processed");
      setSubmitted(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to request password reset");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[400px] h-[400px] rounded-full bg-blue-600/10 blur-[130px] pointer-events-none" />

      {/* Main card wrapper */}
      <div className="relative w-full max-w-md p-8 mx-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl shadow-2xl flex flex-col gap-6">
        <div className="flex flex-col items-center text-center gap-2">
          <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
            <ShieldQuestion size={28} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
            Forgot Password
          </h1>
          <p className="text-sm text-slate-400">
            {submitted 
              ? "We have processed your request."
              : "Enter your email to receive a password reset link."}
          </p>
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-slate-500">
                  <Mail size={18} />
                </span>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl focus:border-emerald-500/50 focus:outline-none transition text-sm text-slate-200"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-400 hover:to-blue-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-500/10 text-sm"
            >
              {loading ? "Processing..." : "Send Reset Link"}
            </button>
          </form>
        ) : (
          <div className="flex flex-col items-center gap-4 text-center py-4">
            <div className="text-emerald-400">
              <CheckCircle2 size={48} />
            </div>
            <p className="text-sm text-slate-300">
              If the email <strong>{email}</strong> matches our records, a password reset link has been logged to the server console. 
            </p>
            <p className="text-xs text-slate-500 bg-slate-950/40 p-3 rounded-lg border border-slate-800/60">
              Check your terminal/console where the Mooco CRM server is running to find the clickable reset link.
            </p>
          </div>
        )}

        <div className="text-center text-sm text-slate-400 border-t border-slate-800/60 pt-4">
          <Link href="/login" className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-semibold transition">
            <ArrowLeft size={14} /> Back to Log In
          </Link>
        </div>
      </div>
    </div>
  );
}
