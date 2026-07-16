"use client";

import Link from "next/link";
import { House, LogIn, ShieldCheck } from "lucide-react";

import { NodesMark } from "@/components/nodes-mark";
import { useLearningRecord } from "@/components/learning-record-provider";

const navigation = [
  { href: "/", label: "Home", icon: House },
  { href: "/login", label: "Four-role demo", icon: LogIn },
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
          <div
            className="language-switch"
            aria-label="Learner content language"
            title="Learner content language"
          >
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
          <span className="concept-pill">Synthetic role-aware demo</span>
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
