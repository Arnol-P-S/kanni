import {
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  House,
  School,
  UserRoundCog,
} from "lucide-react";
import Link from "next/link";

import { NodesMark } from "@/components/nodes-mark";
import { PublicFooter } from "@/components/public-footer";
import { PublicHeader } from "@/components/public-header";
import { copy, getRequestLocale } from "@/lib/i18n";

export default async function HomePage() {
  const locale = await getRequestLocale();
  const roles = [
    {
      icon: BookOpenCheck,
      title: copy(locale, { en: "Student", ml: "വിദ്യാർത്ഥി" }),
      detail: copy(locale, {
        en: "Try, ask for support, revise, and explain what changed.",
        ml: "ശ്രമിക്കുക, സഹായം തേടുക, വീണ്ടും ശ്രമിക്കുക, എന്താണ് മാറിയതെന്ന് വിശദീകരിക്കുക.",
      }),
    },
    {
      icon: School,
      title: copy(locale, { en: "Teacher", ml: "അധ്യാപകൻ" }),
      detail: copy(locale, {
        en: "Plan for likely misconceptions, choose support, and review evidence.",
        ml: "സാധ്യമായ തെറ്റിദ്ധാരണകൾ മുൻകൂട്ടി കാണുക, പിന്തുണ തിരഞ്ഞെടുക്കുക, പഠന തെളിവ് പരിശോധിക്കുക.",
      }),
    },
    {
      icon: House,
      title: copy(locale, { en: "Parent", ml: "രക്ഷിതാവ്" }),
      detail: copy(locale, {
        en: "See one clear update and one teacher-reviewed activity for home.",
        ml: "വ്യക്തമായ ഒരു അപ്ഡേറ്റും അധ്യാപകൻ പരിശോധിച്ച ഒരു വീട്ടുപ്രവർത്തനവും കാണുക.",
      }),
    },
    {
      icon: UserRoundCog,
      title: copy(locale, { en: "School", ml: "സ്കൂൾ" }),
      detail: copy(locale, {
        en: "Connect the right people and see where a learning cycle needs help.",
        ml: "ശരിയായ ആളുകളെ ബന്ധിപ്പിച്ച് പഠനചക്രത്തിന് എവിടെയാണ് സഹായം വേണ്ടതെന്ന് കാണുക.",
      }),
    },
  ];

  return (
    <>
      <PublicHeader locale={locale} returnTo="/" />
      <main id="main-content">
        <section className="page-shell product-hero">
          <div className="product-hero-copy">
            <p className="eyebrow">
              {copy(locale, {
                en: "Learning support, connected",
                ml: "ബന്ധിപ്പിച്ച പഠനപിന്തുണ",
              })}
            </p>
            <h1>
              {copy(locale, {
                en: "Help every learner take the next useful step.",
                ml: "ഓരോ പഠിതാവിനും അടുത്ത ഉപകാരപ്രദമായ ചുവടുവെയ്പ്പ് നടത്താൻ സഹായിക്കുക.",
              })}
            </h1>
            <p className="hero-lead">
              {copy(locale, {
                en: "Kanni gives students, teachers, parents, and school leaders one shared learning cycle. Each person gets the right task, at the right time, with the right context.",
                ml: "വിദ്യാർത്ഥി, അധ്യാപകൻ, രക്ഷിതാവ്, സ്കൂൾ നേതൃത്വം എന്നിവരെ ഒരു പഠനചക്രത്തിൽ കണ്ണി ബന്ധിപ്പിക്കുന്നു. ഓരോരുത്തർക്കും ശരിയായ സമയത്ത് ആവശ്യമായ പ്രവർത്തിയും വിവരവും ലഭിക്കുന്നു.",
              })}
            </p>
            <div className="hero-actions">
              <Link className="button primary" href="/login">
                {copy(locale, { en: "Sign in to Kanni", ml: "കണ്ണിയിൽ സൈൻ ഇൻ ചെയ്യുക" })}
                <ArrowRight size={19} aria-hidden="true" />
              </Link>
              <a className="button secondary" href="#how-it-works">
                {copy(locale, { en: "See how it works", ml: "ഇത് എങ്ങനെ പ്രവർത്തിക്കുന്നു" })}
              </a>
            </div>
            <ul className="hero-proof-list">
              <li>
                <CheckCircle2 aria-hidden="true" />
                {copy(locale, { en: "Teacher-reviewed support", ml: "അധ്യാപകൻ പരിശോധിച്ച പിന്തുണ" })}
              </li>
              <li>
                <CheckCircle2 aria-hidden="true" />
                {copy(locale, { en: "Clear family handoff", ml: "കുടുംബത്തിനുള്ള വ്യക്തമായ കൈമാറ്റം" })}
              </li>
              <li>
                <CheckCircle2 aria-hidden="true" />
                {copy(locale, { en: "English and Malayalam", ml: "ഇംഗ്ലീഷും മലയാളവും" })}
              </li>
            </ul>
          </div>
          <div className="product-hero-visual" aria-label="Connected learning support circle">
            <div className="hero-mark-wrap"><NodesMark className="hero-mark" /></div>
            <div className="support-node support-node-student"><BookOpenCheck aria-hidden="true" /><span>{roles[0].title}</span></div>
            <div className="support-node support-node-teacher"><School aria-hidden="true" /><span>{roles[1].title}</span></div>
            <div className="support-node support-node-parent"><House aria-hidden="true" /><span>{roles[2].title}</span></div>
            <div className="support-node support-node-school"><UserRoundCog aria-hidden="true" /><span>{roles[3].title}</span></div>
            <p>{copy(locale, { en: "One goal. One shared next step.", ml: "ഒരു ലക്ഷ്യം. പങ്കിട്ട ഒരു അടുത്ത ചുവടുവെയ്പ്പ്." })}</p>
          </div>
        </section>

        <section className="role-value-section">
          <div className="page-shell">
            <div className="section-heading centered-heading">
              <p className="eyebrow">{copy(locale, { en: "Built around real work", ml: "യഥാർത്ഥ പ്രവർത്തിയെ കേന്ദ്രീകരിച്ച്" })}</p>
              <h2>{copy(locale, { en: "One platform, four useful perspectives", ml: "ഒരു പ്ലാറ്റ്ഫോം, നാല് ഉപകാരപ്രദമായ കാഴ്ചപ്പാടുകൾ" })}</h2>
            </div>
            <div className="role-value-grid">
              {roles.map(({ icon: Icon, title, detail }) => (
                <article key={title}>
                  <span className="role-value-icon"><Icon aria-hidden="true" /></span>
                  <h3>{title}</h3>
                  <p>{detail}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="page-shell product-cycle-section">
          <div className="section-heading">
            <p className="eyebrow">{copy(locale, { en: "A complete learning cycle", ml: "പൂർണ്ണമായ പഠനചക്രം" })}</p>
            <h2>{copy(locale, { en: "A decision in one workspace changes the next step in another.", ml: "ഒരു പ്രവർത്തിസ്ഥലത്തിലെ തീരുമാനം മറ്റൊന്നിലെ അടുത്ത ചുവടുവെയ്പ്പ് മാറ്റുന്നു." })}</h2>
          </div>
          <ol className="product-cycle-grid">
            {[
              {
                title: { en: "Teacher plans", ml: "അധ്യാപകൻ ആസൂത്രണം ചെയ്യുന്നു" },
                detail: { en: "Choose a support strategy and publish a clear goal.", ml: "പിന്തുണാ രീതി തിരഞ്ഞെടുത്ത് വ്യക്തമായ ലക്ഷ്യം പ്രസിദ്ധീകരിക്കുന്നു." },
              },
              {
                title: { en: "Student responds", ml: "വിദ്യാർത്ഥി പ്രതികരിക്കുന്നു" },
                detail: { en: "Try, open the selected support, revise, and explain.", ml: "ശ്രമിച്ച്, തിരഞ്ഞെടുത്ത പിന്തുണ ഉപയോഗിച്ച്, വീണ്ടും ശ്രമിച്ച് വിശദീകരിക്കുന്നു." },
              },
              {
                title: { en: "Teacher reviews", ml: "അധ്യാപകൻ പരിശോധിക്കുന്നു" },
                detail: { en: "Read the evidence and approve one next support.", ml: "പഠന തെളിവ് പരിശോധിച്ച് അടുത്ത പിന്തുണ അംഗീകരിക്കുന്നു." },
              },
              {
                title: { en: "Parent continues", ml: "രക്ഷിതാവ് തുടരുന്നു" },
                detail: { en: "Try one short home activity and send a useful response.", ml: "ചെറിയൊരു വീട്ടുപ്രവർത്തനം ചെയ്ത് ഉപകാരപ്രദമായ പ്രതികരണം അയക്കുന്നു." },
              },
            ].map((step, index) => (
              <li key={step.title.en}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{copy(locale, step.title)}</h3>
                <p>{copy(locale, step.detail)}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="product-cta">
          <div className="page-shell product-cta-inner">
            <div>
              <p className="eyebrow">{copy(locale, { en: "Ready for the next step", ml: "അടുത്ത ചുവടുവെയ്പ്പിന് തയ്യാറാണ്" })}</p>
              <h2>{copy(locale, { en: "Bring the whole support circle into one place.", ml: "മുഴുവൻ പിന്തുണാ വലയത്തെയും ഒരിടത്തേക്ക് കൊണ്ടുവരൂ." })}</h2>
            </div>
            <Link className="button primary" href="/login">
              {copy(locale, { en: "Open your workspace", ml: "നിങ്ങളുടെ പ്രവർത്തിസ്ഥലം തുറക്കുക" })}
              <ArrowRight size={19} aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>
      <PublicFooter locale={locale} />
    </>
  );
}
