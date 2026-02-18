"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";

const TIER_LABELS = { bronze: "Bronze", silver: "Silver", gold: "Gold", platinum: "Platinum" };

export default function InviteAcceptPage() {
  const { token } = useParams();
  const router = useRouter();

  const [invite, setInvite] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | valid | error
  const [errorMsg, setErrorMsg] = useState("");

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyRole, setCompanyRole] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    fetch(`/api/invite/${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.valid) {
          setInvite(data.invite);
          setCompanyName(data.invite.companyName || "");
          setStatus("valid");
        } else {
          setErrorMsg(data.error || "Invalid invite");
          setStatus("error");
        }
      })
      .catch(() => {
        setErrorMsg("Failed to validate invite");
        setStatus("error");
      });
  }, [token]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError("");
    setSubmitting(true);
    try {
      const res = await fetch(`/api/invite/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, password, companyName, companyRole, phone }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push("/partner?welcome=1");
        return;
      }
      setSubmitError(data.error || "Something went wrong");
    } catch {
      setSubmitError("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f6f0]">
        <div className="text-sm text-[#999]">Validating invitation...</div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f6f0]">
        <div className="w-full max-w-md px-4">
          <div className="rounded-xl border border-[#e0dbd0] bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-xl">
              ✕
            </div>
            <h1 className="text-lg font-semibold text-[#1a1816]">Invitation Invalid</h1>
            <p className="mt-2 text-sm text-[#716960]">{errorMsg}</p>
            <a href="/contact" className="mt-6 inline-block rounded-xl bg-[#1a1816] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#3d372f]">
              Contact Us
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8f6f0] py-12">
      <div className="w-full max-w-lg px-4">
        <div className="rounded-xl border border-[#e0dbd0] bg-white shadow-sm overflow-hidden">
          {/* Header */}
          <div className="bg-[#1a1816] px-8 py-6 text-center text-white">
            <Image src="/logo.svg" alt="Logo" width={140} height={40} className="mx-auto mb-3 h-8 w-auto brightness-0 invert" />
            <h1 className="text-lg font-semibold tracking-wide">Partner Program</h1>
            <p className="mt-1 text-xs text-white/60">You&apos;ve been invited to join as a partner</p>
          </div>

          {/* Invite details */}
          <div className="border-b border-[#e0dbd0] bg-[#f8f6f0] px-8 py-4">
            <div className="flex items-center justify-between text-sm">
              <div>
                <span className="text-[#716960]">Tier: </span>
                <span className="font-semibold text-[#1a1816]">{TIER_LABELS[invite.tier] || "Bronze"}</span>
              </div>
              {invite.discount > 0 && (
                <div className="rounded-xl bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                  {invite.discount}% wholesale discount
                </div>
              )}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 p-8">
            <p className="text-sm text-[#716960]">
              Complete your registration for <strong>{invite.email}</strong>
            </p>

            <div>
              <label className="mb-1 block text-xs font-medium text-[#564f47]">Your Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
                placeholder="Full name"
                className="w-full rounded-lg border border-[#e0dbd0] px-4 py-2.5 text-sm text-[#1a1816] outline-none focus:border-[#c49340] focus:ring-1 focus:ring-[#c49340]/30"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-[#564f47]">Password *</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="Min 8 characters"
                  className="w-full rounded-lg border border-[#e0dbd0] px-4 py-2.5 pr-10 text-sm text-[#1a1816] outline-none focus:border-[#c49340] focus:ring-1 focus:ring-[#c49340]/30"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9a9184] hover:text-[#1a1816]"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    {showPassword ? (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    ) : (
                      <>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </>
                    )}
                  </svg>
                </button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-[#564f47]">Company Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Company name"
                  className="w-full rounded-lg border border-[#e0dbd0] px-4 py-2.5 text-sm text-[#1a1816] outline-none focus:border-[#c49340] focus:ring-1 focus:ring-[#c49340]/30"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[#564f47]">Your Role</label>
                <input
                  type="text"
                  value={companyRole}
                  onChange={(e) => setCompanyRole(e.target.value)}
                  placeholder="e.g. Owner, Buyer"
                  className="w-full rounded-lg border border-[#e0dbd0] px-4 py-2.5 text-sm text-[#1a1816] outline-none focus:border-[#c49340] focus:ring-1 focus:ring-[#c49340]/30"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-[#564f47]">Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(optional)"
                className="w-full rounded-lg border border-[#e0dbd0] px-4 py-2.5 text-sm text-[#1a1816] outline-none focus:border-[#c49340] focus:ring-1 focus:ring-[#c49340]/30"
              />
            </div>

            {submitError && (
              <p className="text-sm text-red-600">{submitError}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-full bg-[#1a1816] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#3d372f] disabled:bg-[#cbc4b6]"
            >
              {submitting ? "Creating your account..." : "Join Partner Program"}
            </button>

            <p className="text-center text-[11px] text-[#9a9184]">
              Already have an account? <a href="/login" className="underline hover:text-[#1a1816]">Sign in</a> — your account will be upgraded automatically.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
