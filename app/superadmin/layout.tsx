"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MdBusiness, MdDashboard, MdLogout } from "react-icons/md";
import { clearAuthSession } from "../utils/authSession";
import { useRouter } from "next/navigation";

const NAV = [
  { href: "/superadmin", label: "Dashboard", icon: MdDashboard },
  { href: "/superadmin/organizations", label: "Organizações", icon: MdBusiness },
];

export default function SuperadminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <aside className="w-64 border-r border-slate-800 bg-slate-900/80 p-4 flex flex-col">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-widest text-amber-400">
            Agilizai SaaS
          </p>
          <h1 className="text-lg font-bold">Super Admin</h1>
        </div>
        <nav className="space-y-1 flex-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/superadmin"
                ? pathname === "/superadmin"
                : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                  active
                    ? "bg-amber-500/20 text-amber-300"
                    : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="space-y-2 border-t border-slate-800 pt-4 text-sm">
          <Link href="/admin" className="block text-slate-400 hover:text-white">
            ← Painel operacional
          </Link>
          <button
            type="button"
            className="flex items-center gap-2 text-red-400 hover:text-red-300"
            onClick={() => {
              clearAuthSession();
              router.push("/login");
            }}
          >
            <MdLogout size={18} />
            Sair
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-6 md:p-10">{children}</main>
    </div>
  );
}
