"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { IRI_CARD, IRI_LINK } from "../../components/rhIdeia/ui";
import { useRhScope } from "../../components/rhIdeia/useRhScope";

export default function RhIdeiaAdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const scope = useRhScope();
  const teamPath = pathname?.startsWith("/admin/rh-ideia/equipe");

  if (!scope.ready) return null;

  if (!scope.seesAll && !scope.isLeader) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <section className={IRI_CARD}>
          <h1 className="text-xl font-semibold text-slate-900">Sem gestão de equipe</h1>
          <p className="mt-2 text-sm text-slate-600">
            Sua função lê o próprio manual. A avaliação da equipe fica com o líder da área.
          </p>
          <Link href="/rh-ideia/manual" className={`mt-4 inline-block text-sm ${IRI_LINK}`}>
            Abrir meu manual
          </Link>
        </section>
      </div>
    );
  }

  if (!scope.seesAll && !teamPath) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <section className={IRI_CARD}>
          <h1 className="text-xl font-semibold text-slate-900">Acesso da liderança</h1>
          <p className="mt-2 text-sm text-slate-600">
            Publicar manual, fechar premiação e ver o RH inteiro é do escritório. Você entra para
            ser avaliado e para avaliar a sua equipe.
          </p>
          <Link href="/admin/rh-ideia/equipe" className={`mt-4 inline-block text-sm ${IRI_LINK}`}>
            Ir para a minha equipe
          </Link>
        </section>
      </div>
    );
  }

  return <>{children}</>;
}
