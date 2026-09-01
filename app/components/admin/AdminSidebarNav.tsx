"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MdChevronRight, MdExpandMore } from "react-icons/md";
import {
  type NavGroupItem,
  type NavItem,
  type NavLinkItem,
  isNavGroup,
  isNavLinkActive,
} from "../../config/adminNavGrouping";

const ATENDIMENTO_HREF = "/admin/whatsapp";

interface AdminSidebarNavProps {
  items: NavItem[];
  pathname: string;
  onNavigate: () => void;
}

function NavLinkRow({
  href,
  label,
  icon: Icon,
  pathname,
  onNavigate,
  nested = false,
}: NavLinkItem & {
  pathname: string;
  onNavigate: () => void;
  nested?: boolean;
}) {
  const isActive = isNavLinkActive(pathname, href, ATENDIMENTO_HREF);

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`admin-nav-item flex items-center gap-3 rounded-xl transition-all duration-200 group ${
        nested ? "px-3 py-2 text-sm" : "px-4 py-3"
      } ${
        isActive
          ? "bg-gradient-to-r from-yellow-500 to-yellow-600 text-gray-900 font-semibold shadow-lg"
          : "text-gray-300 hover:bg-gray-700/50 hover:text-white"
      }`}
    >
      <Icon
        size={nested ? 18 : 20}
        className={`shrink-0 ${
          isActive ? "text-gray-900" : "text-gray-400 group-hover:text-white"
        }`}
      />
      <span className="font-medium admin-nav-text">{label}</span>
    </Link>
  );
}

function AdminNavGroup({
  group,
  pathname,
  onNavigate,
}: {
  group: NavGroupItem;
  pathname: string;
  onNavigate: () => void;
}) {
  const hasActiveChild = group.children.some((c) =>
    isNavLinkActive(pathname, c.href, ATENDIMENTO_HREF),
  );
  const [expanded, setExpanded] = useState(hasActiveChild);

  useEffect(() => {
    if (hasActiveChild) setExpanded(true);
  }, [hasActiveChild]);

  const GroupIcon = group.icon;

  return (
    <div className="admin-nav-group">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
        className={`admin-nav-group-toggle admin-nav-item flex w-full items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200 ${
          hasActiveChild
            ? "bg-gray-700/40 text-yellow-400"
            : "text-gray-300 hover:bg-gray-700/50 hover:text-white"
        }`}
      >
        <GroupIcon size={20} className="shrink-0 text-gray-400" />
        <span className="admin-nav-text flex-1 text-left font-medium">
          {group.label}
        </span>
        {expanded ? (
          <MdExpandMore size={20} className="shrink-0 text-gray-400" />
        ) : (
          <MdChevronRight size={20} className="shrink-0 text-gray-400" />
        )}
      </button>
      {expanded && (
        <div className="admin-nav-group-children ml-3 mt-1 space-y-1 border-l border-gray-700/50 pl-2">
          {group.children.map((child) => (
            <NavLinkRow
              key={child.href}
              {...child}
              pathname={pathname}
              onNavigate={onNavigate}
              nested
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminSidebarNav({
  items,
  pathname,
  onNavigate,
}: AdminSidebarNavProps) {
  return (
    <nav className="mt-6 space-y-2 p-4">
      {items.map((item) =>
        isNavGroup(item) ? (
          <AdminNavGroup
            key={item.label}
            group={item}
            pathname={pathname}
            onNavigate={onNavigate}
          />
        ) : (
          <NavLinkRow
            key={item.href}
            {...item}
            pathname={pathname}
            onNavigate={onNavigate}
          />
        ),
      )}
    </nav>
  );
}
