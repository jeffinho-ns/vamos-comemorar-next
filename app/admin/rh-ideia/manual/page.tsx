"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { IRI_FIELD, RhIdeiaShell } from "../../../components/rhIdeia/RhIdeiaShell";
import { PlaybookReader } from "../../../components/rhIdeia/PlaybookReader";
import { roleLabel } from "../../../components/rhIdeia/PlaybookTeamTable";
import {
  IRI_BTN_PRIMARY,
  IRI_BTN_SECONDARY,
  IRI_CARD,
  IRI_MUTED,
  IRI_SOFT,
} from "../../../components/rhIdeia/ui";
import { useSaasAccess } from "../../../hooks/useSaasAccess";
import { iriFetch } from "../../../lib/rhIdeia/api";
import type { IriEstablishment, IriPlaybookChapter } from "../../../lib/rhIdeia/types";

type Candidate = { id: number; name?: string | null; email?: string | null };
type Profile = {
  user_id: number;
  user_name?: string | null;
  role_key: string;
  establishment_id: number;
  establishment_name?: string | null;
};
type Role = { key: string; label: string };

export default function AdminPlaybookPage() {
  const { canAccessRhIdeia, isSuperAdmin, isAdmin } = useSaasAccess();
  const allowed = canAccessRhIdeia || isSuperAdmin || isAdmin;
  const [houses, setHouses] = useState<IriEstablishment[]>([]);
  const [people, setPeople] = useState<Candidate[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [chapters, setChapters] = useState<IriPlaybookChapter[]>([]);
  const [userId, setUserId] = useState("");
  const [establishmentId, setEstablishmentId] = useState("");
  const [roleKey, setRoleKey] = useState("garcom");
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [houseRes, peopleRes, roleRes, profileRes, chapterRes] = await Promise.all([
      iriFetch<IriEstablishment[]>("/establishments"),
      iriFetch<Candidate[]>("/playbook/candidates"),
      iriFetch<Role[]>("/playbook/roles"),
      iriFetch<Profile[]>("/playbook/profiles"),
      iriFetch<IriPlaybookChapter[]>("/playbook/chapters"),
    ]);
    if (houseRes.success && houseRes.data) setHouses(houseRes.data);
    if (peopleRes.success && peopleRes.data) setPeople(peopleRes.data);
    if (roleRes.success && roleRes.data) setRoles(roleRes.data);
    if (profileRes.success && profileRes.data) setProfiles(profileRes.data);
    if (chapterRes.success && chapterRes.data) setChapters(chapterRes.data);
    if (!profileRes.success) setMessage(profileRes.message || "Sem permissão para o manual completo.");
  }, []);

  useEffect(() => {
    if (allowed) load();
  }, [allowed, load]);

  async function publish() {
    const res = await iriFetch("/playbook/seed", { method: "POST" });
    setMessage(res.success ? "Manual do Seu Justino publicado." : res.message || "Falha ao publicar.");
    load();
  }

  async function assign(event: FormEvent) {
    event.preventDefault();
    const res = await iriFetch("/playbook/profiles", {
      method: "POST",
      body: JSON.stringify({
        user_id: Number(userId),
        establishment_id: Number(establishmentId),
        role_key: roleKey,
      }),
    });
    setMessage(res.success ? "Função gravada. A pessoa passa a ver só esse manual." : res.message || "Falha ao gravar.");
    load();
  }

  if (!allowed) return null;

  return (
    <RhIdeiaShell mode="admin" title="Manual por função">
      {message && <p className={`mb-4 text-sm ${IRI_SOFT}`}>{message}</p>}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <button type="button" onClick={publish} className={IRI_BTN_PRIMARY}>
          Publicar manual do Seu Justino
        </button>
        <p className={`text-sm ${IRI_MUTED}`}>O texto fica no sistema. Não há arquivo para baixar.</p>
      </div>
      <form onSubmit={assign} className={`mb-6 grid gap-3 ${IRI_CARD} md:grid-cols-4`}>
        <select className={IRI_FIELD} value={userId} onChange={(event) => setUserId(event.target.value)} required>
          <option value="">Pessoa</option>
          {people.map((person) => (
            <option key={person.id} value={person.id}>
              {person.name || person.email}
            </option>
          ))}
        </select>
        <select className={IRI_FIELD} value={establishmentId} onChange={(event) => setEstablishmentId(event.target.value)} required>
          <option value="">Unidade</option>
          {houses.map((house) => (
            <option key={house.id} value={house.id}>
              {house.name}
            </option>
          ))}
        </select>
        <select className={IRI_FIELD} value={roleKey} onChange={(event) => setRoleKey(event.target.value)}>
          {roles.map((role) => (
            <option key={role.key} value={role.key}>
              {role.label}
            </option>
          ))}
        </select>
        <button type="submit" className={IRI_BTN_SECONDARY}>
          Gravar função
        </button>
      </form>
      <ul className={`mb-8 space-y-1 text-sm ${IRI_SOFT}`}>
        {profiles.map((profile) => (
          <li key={profile.user_id}>
            {profile.user_name} · {roleLabel(profile.role_key)} · {profile.establishment_name}
          </li>
        ))}
      </ul>
      <PlaybookReader chapters={chapters} watermark="RH" canMark={false} onRead={() => undefined} />
    </RhIdeiaShell>
  );
}
