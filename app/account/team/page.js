"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuthStore } from "@/lib/auth-store";
import { useTranslation } from "@/lib/i18n/useTranslation";

const ROLE_STYLES = {
  admin: "bg-purple-50 text-purple-700",
  member: "bg-blue-50 text-blue-700",
  viewer: "bg-gray-100 text-gray-600",
};

const ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "member", label: "Member" },
  { value: "viewer", label: "Viewer" },
];

function formatCurrency(cents) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(cents / 100);
}

export default function TeamPage() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const isB2b = user?.accountType === "B2B" && user?.b2bApproved;

  const [team, setTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Invite form state
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");

  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editRole, setEditRole] = useState("");
  const [editCanOrder, setEditCanOrder] = useState(true);
  const [editCanApprove, setEditCanApprove] = useState(false);
  const [editSpendLimit, setEditSpendLimit] = useState("");
  const [saving, setSaving] = useState(false);

  // Delete state
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadTeam = useCallback(async () => {
    try {
      setError("");
      const res = await fetch("/api/account/team");
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to load team");
        return;
      }
      const data = await res.json();
      setTeam(data.team);
      setMembers(data.members);
      setIsOwner(data.isOwner);
    } catch {
      setError("Failed to load team");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isB2b) loadTeam();
    else setLoading(false);
  }, [isB2b, loadTeam]);

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviteError("");
    setInviteSuccess("");
    setInviting(true);

    try {
      const res = await fetch("/api/account/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        setInviteError(data.error || "Failed to invite");
        return;
      }
      setInviteSuccess(`${data.member.email} has been added to the team`);
      setInviteEmail("");
      setInviteRole("member");
      loadTeam();
    } catch {
      setInviteError("Failed to invite member");
    } finally {
      setInviting(false);
    }
  };

  const startEdit = (member) => {
    const perms =
      member.permissions && typeof member.permissions === "object"
        ? member.permissions
        : {};
    setEditingId(member.id);
    setEditRole(member.role);
    setEditCanOrder(perms.canOrder !== false);
    setEditCanApprove(perms.canApprove === true);
    setEditSpendLimit(perms.spendLimit ? String(perms.spendLimit / 100) : "");
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async (memberId) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/account/team/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: editRole,
          permissions: {
            canOrder: editCanOrder,
            canApprove: editCanApprove,
            spendLimit: editSpendLimit
              ? Math.round(parseFloat(editSpendLimit) * 100)
              : 0,
          },
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to update");
        return;
      }
      setEditingId(null);
      loadTeam();
    } catch {
      setError("Failed to update member");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (memberId) => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/account/team/${memberId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to remove");
        return;
      }
      setConfirmDeleteId(null);
      loadTeam();
    } catch {
      setError("Failed to remove member");
    } finally {
      setDeleting(false);
    }
  };

  if (!isB2b) {
    return (
      <div className="rounded-2xl border border-[var(--color-gray-200)] bg-[var(--color-gray-50)] p-8 text-center">
        <p className="text-sm text-[var(--color-gray-500)]">
          {t("team.b2bRequired") ||
            "Team management is available for approved B2B accounts."}
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-[var(--color-gray-400)]">
        {t("common.loading") || "Loading..."}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-[var(--color-gray-900)]">
          {t("team.title") || "Team Management"}
        </h1>
        <p className="mt-1 text-sm text-[var(--color-gray-500)]">
          {team
            ? `${team.companyName} — ${members.length}/${team.maxMembers} ${t("team.membersCount") || "members"}`
            : t("team.subtitle") || "Manage your team members and permissions"}
        </p>
      </div>

      {/* Global error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
          <button
            onClick={() => setError("")}
            className="ml-2 font-medium underline"
          >
            {t("common.dismiss") || "Dismiss"}
          </button>
        </div>
      )}

      {/* Invite form — owner/admin only */}
      {isOwner && (
        <div className="rounded-2xl border border-[var(--color-gray-200)] bg-white p-4">
          <h2 className="text-sm font-semibold text-[var(--color-gray-900)]">
            {t("team.inviteMember") || "Invite Team Member"}
          </h2>
          <form
            onSubmit={handleInvite}
            className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end"
          >
            <div className="flex-1">
              <label className="block text-xs font-medium text-[var(--color-gray-600)]">
                {t("team.emailLabel") || "Email address"}
              </label>
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="mt-1 w-full rounded-lg border border-[var(--color-gray-300)] px-3 py-2 text-sm outline-none focus:border-[var(--color-gray-900)] focus:ring-1 focus:ring-[var(--color-gray-900)]"
              />
            </div>
            <div className="w-full sm:w-36">
              <label className="block text-xs font-medium text-[var(--color-gray-600)]">
                {t("team.roleLabel") || "Role"}
              </label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[var(--color-gray-300)] px-3 py-2 text-sm outline-none focus:border-[var(--color-gray-900)] focus:ring-1 focus:ring-[var(--color-gray-900)]"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {t(`team.role.${r.value}`) || r.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={inviting}
              className="rounded-lg bg-[var(--color-gray-900)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-gray-800)] disabled:opacity-50"
            >
              {inviting
                ? t("team.inviting") || "Inviting..."
                : t("team.invite") || "Invite"}
            </button>
          </form>
          {inviteError && (
            <p className="mt-2 text-xs text-red-600">{inviteError}</p>
          )}
          {inviteSuccess && (
            <p className="mt-2 text-xs text-emerald-600">{inviteSuccess}</p>
          )}
        </div>
      )}

      {/* Members list */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-[var(--color-gray-900)]">
          {t("team.membersList") || "Team Members"}
        </h2>

        {members.length === 0 ? (
          <div className="rounded-2xl border border-[var(--color-gray-200)] bg-[var(--color-gray-50)] p-8 text-center">
            <p className="text-sm text-[var(--color-gray-500)]">
              {t("team.noMembers") ||
                "No team members yet. Invite your first team member above."}
            </p>
          </div>
        ) : (
          members.map((member) => (
            <div
              key={member.id}
              className="rounded-2xl border border-[var(--color-gray-200)] bg-white p-4"
            >
              {/* Member header */}
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-[var(--color-gray-900)]">
                    {member.name || member.email}
                  </p>
                  {member.name && (
                    <p className="text-xs text-[var(--color-gray-500)]">
                      {member.email}
                    </p>
                  )}
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${ROLE_STYLES[member.role] || ROLE_STYLES.member}`}
                >
                  {t(`team.role.${member.role}`) || member.role}
                </span>
              </div>

              {/* Permissions summary */}
              {member.permissions &&
                typeof member.permissions === "object" && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <PermBadge
                      label={t("team.perm.canOrder") || "Can Order"}
                      enabled={member.permissions.canOrder !== false}
                    />
                    <PermBadge
                      label={t("team.perm.canApprove") || "Can Approve"}
                      enabled={member.permissions.canApprove === true}
                    />
                    {member.permissions.spendLimit > 0 && (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                        {t("team.perm.spendLimit") || "Limit"}:{" "}
                        {formatCurrency(member.permissions.spendLimit)}
                      </span>
                    )}
                  </div>
                )}

              {/* Joined date */}
              <p className="mt-2 text-[10px] text-[var(--color-gray-400)]">
                {t("team.joined") || "Joined"}{" "}
                {new Date(member.joinedAt).toLocaleDateString("en-CA")}
              </p>

              {/* Edit/Delete actions — owner only */}
              {isOwner && editingId !== member.id && (
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => startEdit(member)}
                    className="rounded-lg border border-[var(--color-gray-300)] px-3 py-1.5 text-xs font-medium text-[var(--color-gray-700)] transition-colors hover:bg-[var(--color-gray-50)]"
                  >
                    {t("team.editPerms") || "Edit Permissions"}
                  </button>
                  {confirmDeleteId === member.id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-red-600">
                        {t("team.confirmRemove") || "Remove this member?"}
                      </span>
                      <button
                        onClick={() => handleDelete(member.id)}
                        disabled={deleting}
                        className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        {deleting
                          ? t("team.removing") || "Removing..."
                          : t("team.confirmYes") || "Yes, Remove"}
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="rounded-lg border border-[var(--color-gray-300)] px-3 py-1.5 text-xs font-medium text-[var(--color-gray-700)] hover:bg-[var(--color-gray-50)]"
                      >
                        {t("team.confirmNo") || "Cancel"}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(member.id)}
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                    >
                      {t("team.remove") || "Remove"}
                    </button>
                  )}
                </div>
              )}

              {/* Inline permissions editor */}
              {isOwner && editingId === member.id && (
                <div className="mt-3 rounded-lg border border-[var(--color-gray-200)] bg-[var(--color-gray-50)] p-3">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {/* Role */}
                    <div>
                      <label className="block text-xs font-medium text-[var(--color-gray-600)]">
                        {t("team.roleLabel") || "Role"}
                      </label>
                      <select
                        value={editRole}
                        onChange={(e) => setEditRole(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-[var(--color-gray-300)] px-3 py-1.5 text-sm outline-none"
                      >
                        {ROLE_OPTIONS.map((r) => (
                          <option key={r.value} value={r.value}>
                            {t(`team.role.${r.value}`) || r.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Spend Limit */}
                    <div>
                      <label className="block text-xs font-medium text-[var(--color-gray-600)]">
                        {t("team.perm.spendLimit") || "Spend Limit"} (CAD)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={editSpendLimit}
                        onChange={(e) => setEditSpendLimit(e.target.value)}
                        placeholder="0 = no limit"
                        className="mt-1 w-full rounded-lg border border-[var(--color-gray-300)] px-3 py-1.5 text-sm outline-none"
                      />
                    </div>

                    {/* Can Order toggle */}
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={editCanOrder}
                        onChange={(e) => setEditCanOrder(e.target.checked)}
                        className="rounded border-[var(--color-gray-300)]"
                      />
                      <span className="text-xs text-[var(--color-gray-700)]">
                        {t("team.perm.canOrder") || "Can place orders"}
                      </span>
                    </label>

                    {/* Can Approve toggle */}
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={editCanApprove}
                        onChange={(e) => setEditCanApprove(e.target.checked)}
                        className="rounded border-[var(--color-gray-300)]"
                      />
                      <span className="text-xs text-[var(--color-gray-700)]">
                        {t("team.perm.canApprove") || "Can approve orders"}
                      </span>
                    </label>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => saveEdit(member.id)}
                      disabled={saving}
                      className="rounded-lg bg-[var(--color-gray-900)] px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[var(--color-gray-800)] disabled:opacity-50"
                    >
                      {saving
                        ? t("common.saving") || "Saving..."
                        : t("common.save") || "Save"}
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="rounded-lg border border-[var(--color-gray-300)] px-4 py-1.5 text-xs font-medium text-[var(--color-gray-700)] transition-colors hover:bg-[var(--color-gray-50)]"
                    >
                      {t("common.cancel") || "Cancel"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Owner note */}
      {isOwner && team && (
        <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs text-blue-800">
          <p className="font-semibold">
            {t("team.ownerNote") || "Team Owner"}
          </p>
          <p className="mt-1">
            {t("team.ownerDescription") ||
              "As the team owner, you can invite members, assign roles, and set spending limits. Team members with the 'admin' role can also invite new members."}
          </p>
        </div>
      )}
    </div>
  );
}

function PermBadge({ label, enabled }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
        enabled
          ? "bg-emerald-50 text-emerald-700"
          : "bg-gray-100 text-gray-400 line-through"
      }`}
    >
      {label}
    </span>
  );
}
