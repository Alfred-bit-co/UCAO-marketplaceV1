import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { friendlyAdminTeamError, isAdminTeamUnavailable } from "@/lib/admin-team";
import { isStaffSignup } from "@/lib/utils";

describe("équipe d'administration", () => {
  it("traduit chaque refus de la base", () => {
    expect(friendlyAdminTeamError({ message: "USER_NOT_FOUND" })).toContain("Aucun compte");
    expect(friendlyAdminTeamError({ message: "EMAIL_NOT_CONFIRMED" })).toContain("confirmé");
    expect(friendlyAdminTeamError({ message: "ACCOUNT_SUSPENDED" })).toContain("suspendu");
    expect(friendlyAdminTeamError({ message: "ALREADY_OWNER" })).toContain("propriétaire");
    expect(friendlyAdminTeamError({ message: "Accès refusé", code: "42501" })).toContain("Seul le propriétaire");
  });

  it("n'affiche jamais le message technique brut", () => {
    expect(friendlyAdminTeamError({ message: "relation private.platform_admins does not exist" })).not.toContain("platform_admins");
  });

  it("reconnaît une base où le SQL n'a pas encore été lancé", () => {
    expect(isAdminTeamUnavailable({ code: "PGRST202" })).toBe(true);
    expect(isAdminTeamUnavailable({ code: "42501" })).toBe(false);
  });
});

describe("inscription du personnel sans carte", () => {
  it("reconnaît uniquement les marques prévues", () => {
    expect(isStaffSignup({ account_type: "personnel" })).toBe(true);
    expect(isStaffSignup({ signup_kind: "admin" })).toBe(true);
    expect(isStaffSignup({ account_type: "etudiant" })).toBe(false);
    expect(isStaffSignup({ account_type: "PERSONNEL" })).toBe(false);
    expect(isStaffSignup({ role: "admin" })).toBe(false);
    expect(isStaffSignup(null)).toBe(false);
    expect(isStaffSignup(undefined)).toBe(false);
  });

  it("n'accorde aucun droit à partir de cette marque", () => {
    const sources = ["middleware.ts", "lib/admin-team.ts", "components/navbar.tsx", "app/admin/page.tsx"];
    for (const file of sources) {
      expect(readFileSync(join(__dirname, "..", file), "utf8"), file).not.toMatch(/signup_kind|isStaffSignup|user_metadata/);
    }
  });
});

describe("SQL du compte personnel", () => {
  const sql = readFileSync(join(__dirname, "..", "..", "supabase", "migrations", "PROPOSITION_20261119_compte_personnel.sql"), "utf8");
  const active = sql.split(/\r?\n/).filter((line) => !line.trim().startsWith("--")).join("\n");

  it("ne modifie pas handle_new_user", () => {
    expect(active).not.toMatch(/function\s+public\.handle_new_user/i);
  });

  it("n'ouvre l'envoi de la profession qu'aux comptes connectés", () => {
    expect(active).toContain("revoke execute on function public.submit_staff_verification(text, text) from public, anon;");
    expect(active).toContain("raise exception 'Non authentifie'");
    expect(active).toContain("verification_status = 'pending'");
  });

  it("empêche de changer soi-même de type de compte ou de profession", () => {
    expect(active).toContain("create trigger trg_guard_account_type");
    expect(active).toContain("current_setting('app.account_rpc', true)");
  });
});

describe("SQL des administrateurs nommés", () => {
  const sql = readFileSync(join(__dirname, "..", "..", "supabase", "migrations", "PROPOSITION_20261118_admins_nommes.sql"), "utf8");
  const active = sql.split(/\r?\n/).filter((line) => !line.trim().startsWith("--")).join("\n");

  it("réserve chaque fonction de gestion au propriétaire", () => {
    for (const name of ["owner_set_admin", "owner_list_admins", "owner_list_admin_audit"]) {
      const start = active.indexOf(`function public.${name}(`);
      const body = active.slice(start, active.indexOf("$$;", active.indexOf("$$", start) + 2));
      expect(body, name).toContain("if not private.is_owner() then");
    }
  });

  it("n'ouvre aucune fonction de gestion aux visiteurs", () => {
    for (const signature of ["am_i_admin()", "owner_set_admin(text, boolean)", "owner_list_admins()", "owner_list_admin_audit()"]) {
      expect(active, signature).toContain(`revoke execute on function public.${signature} from public, anon;`);
    }
  });

  it("exige un e-mail confirmé et ne contient aucune clé", () => {
    expect(active).toContain("EMAIL_NOT_CONFIRMED");
    expect(sql).not.toMatch(/re_[A-Za-z0-9]{16,}/);
  });
});
