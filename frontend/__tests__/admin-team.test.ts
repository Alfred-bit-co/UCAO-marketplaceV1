import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { friendlyAdminTeamError, isAdminTeamUnavailable } from "@/lib/admin-team";

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
