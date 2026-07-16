"use client";

import Link from "next/link";
import { BookOpen, House, ShieldCheck, UsersRound } from "lucide-react";

import { NodesMark } from "@/components/nodes-mark";
import { useLearningRecord } from "@/components/learning-record-provider";

const navigation = [
  { href: "/", label: "Home", icon: House },
  {
    href: "/learn/class-1/add-within-10",
    label: "Learn",
    icon: BookOpen,
  },
  { href: "/teacher", label: "Teacher", icon: UsersRound },
  { href: "/parent", label: "Parent", icon: UsersRound },
  { href: "/trust", label: "Trust", icon: ShieldCheck },
];

export function SiteHeader() {
  const { language, setLanguage } = useLearningRecord();

  return (
    <header className="site-header">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <div className="header-inner">
        <Link className="brand" href="/" aria-label="Kanni home">
          <NodesMark className="brand-mark" />
          <span>
            <strong>Kanni</strong>
            <span lang="ml">കണ്ണി</span>
          </span>
        </Link>
        <div className="header-actions">
          <div className="language-switch" aria-label="Interface language">
            <button
              type="button"
              aria-pressed={language === "ml"}
              onClick={() => setLanguage("ml")}
              lang="ml"
            >
              മലയാളം
            </button>
            <button
              type="button"
              aria-pressed={language === "en"}
              onClick={() => setLanguage("en")}
            >
              English
            </button>
          </div>
          <span className="concept-pill">Same-device concept demo</span>
        </div>
      </div>
      <nav className="role-nav" aria-label="Main navigation">
        {navigation.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href}>
            <Icon size={18} aria-hidden="true" />
            {label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
