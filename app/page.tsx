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
import { isInstallationConfigured } from "@/lib/installation";

export default async function HomePage() {
  const [locale, configured] = await Promise.all([
    getRequestLocale(),
    isInstallationConfigured(),
  ]);
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
        en: "Connect each learner to the responsible adults and monitor handoffs without reading private work.",
        ml: "ഓരോ പഠിതാവിനെയും ഉത്തരവാദിത്തമുള്ള മുതിർന്നവരുമായി ബന്ധിപ്പിച്ച് സ്വകാര്യ പഠനപ്രവർത്തി വായിക്കാതെ കൈമാറ്റങ്ങൾ നിരീക്ഷിക്കുക.",
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
                en: "Curriculum-grounded learning studios",
                ml: "പാഠ്യപദ്ധതിയെ അടിസ്ഥാനമാക്കിയ പഠന സ്റ്റുഡിയോകൾ",
              })}
            </p>
            <h1>
              {copy(locale, {
                en: "Teachers prepare the ground. Learners do the thinking.",
                ml: "അധ്യാപകർ പഠനത്തിന് വഴിയൊരുക്കുന്നു. ചിന്തിക്കുന്നത് പഠിതാക്കളാണ്.",
              })}
            </h1>
            <p className="hero-lead">
              {copy(locale, {
                en: "A teacher builds from a source the school is allowed to use. The learner predicts, makes, critiques, revises, and reflects. The teacher then reduces or changes support, and the parent receives one reviewed home activity.",
                ml: "സ്കൂളിന് ഉപയോഗിക്കാൻ അനുമതിയുള്ള ഉറവിടത്തിൽ നിന്ന് അധ്യാപകൻ പ്രവർത്തനം തയ്യാറാക്കുന്നു. പഠിതാവ് പ്രവചിക്കുന്നു, നിർമ്മിക്കുന്നു, വിമർശിക്കുന്നു, തിരുത്തുന്നു, ചിന്തിക്കുന്നു. തുടർന്ന് അധ്യാപകൻ പിന്തുണ കുറയ്ക്കുകയോ മാറ്റുകയോ ചെയ്യുന്നു. രക്ഷിതാവിന് പരിശോധിച്ച ഒരു വീട്ടുപ്രവർത്തനം ലഭിക്കുന്നു.",
              })}
            </p>
            <div className="hero-actions">
              <Link className="button primary" href={configured ? "/login" : "/setup"}>
                {configured
                  ? copy(locale, { en: "Sign in to Kanni", ml: "കണ്ണിയിൽ സൈൻ ഇൻ ചെയ്യുക" })
                  : copy(locale, { en: "Set up your school", ml: "നിങ്ങളുടെ സ്കൂൾ സജ്ജമാക്കുക" })}
                <ArrowRight size={19} aria-hidden="true" />
              </Link>
              <a className="button secondary" href="#how-it-works">
                {copy(locale, { en: "See how it works", ml: "ഇത് എങ്ങനെ പ്രവർത്തിക്കുന്നു" })}
              </a>
            </div>
            <ul className="hero-proof-list">
              <li>
                <CheckCircle2 aria-hidden="true" />
                {copy(locale, { en: "Teacher-requested AI only", ml: "അധ്യാപകൻ ആവശ്യപ്പെടുമ്പോൾ മാത്രം AI" })}
              </li>
              <li>
                <CheckCircle2 aria-hidden="true" />
                {copy(locale, { en: "Source IDs checked before use", ml: "ഉപയോഗത്തിന് മുമ്പ് ഉറവിട ഐഡികൾ പരിശോധിക്കുന്നു" })}
              </li>
              <li>
                <CheckCircle2 aria-hidden="true" />
                {copy(locale, { en: "Scaffolds fade by teacher decision", ml: "അധ്യാപക തീരുമാനപ്രകാരം പിന്തുണ കുറയുന്നു" })}
              </li>
            </ul>
          </div>
          <div className="product-hero-visual" aria-label="Connected learning support circle">
            <div className="hero-mark-wrap"><NodesMark className="hero-mark" /></div>
            <div className="support-node support-node-student"><BookOpenCheck aria-hidden="true" /><span>{roles[0].title}</span></div>
            <div className="support-node support-node-teacher"><School aria-hidden="true" /><span>{roles[1].title}</span></div>
            <div className="support-node support-node-parent"><House aria-hidden="true" /><span>{roles[2].title}</span></div>
            <div className="support-node support-node-school"><UserRoundCog aria-hidden="true" /><span>{roles[3].title}</span></div>
            <p>{copy(locale, { en: "One source. Several learner routes. One reviewed loop.", ml: "ഒരു ഉറവിടം. പല പഠനവഴികൾ. പരിശോധിച്ച ഒരു പഠനചക്രം." })}</p>
          </div>
        </section>

        <section className="role-value-section">
          <div className="page-shell">
            <div className="section-heading centered-heading">
              <p className="eyebrow">{copy(locale, { en: "Built around responsibility", ml: "ഉത്തരവാദിത്തത്തെ കേന്ദ്രീകരിച്ച്" })}</p>
              <h2>{copy(locale, { en: "One platform, four different jobs", ml: "ഒരു പ്ലാറ്റ്ഫോം, നാല് വ്യത്യസ്ത ചുമതലകൾ" })}</h2>
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
            <p className="eyebrow">{copy(locale, { en: "The agency loop", ml: "പഠിതാവിന്റെ പ്രവർത്തനചക്രം" })}</p>
            <h2>{copy(locale, { en: "The learner's evidence changes what support comes next.", ml: "പഠിതാവിന്റെ തെളിവ് അടുത്ത പിന്തുണയെ മാറ്റുന്നു." })}</h2>
          </div>
          <ol className="product-cycle-grid">
            {[
              {
                title: { en: "Teacher grounds", ml: "അധ്യാപകൻ ഉറവിടം ചേർക്കുന്നു" },
                detail: { en: "Add a permission-safe source, prepare several routes, and review every AI draft.", ml: "അനുമതിയുള്ള ഉറവിടം ചേർത്ത് പല വഴികൾ തയ്യാറാക്കി ഓരോ AI കരടും പരിശോധിക്കുന്നു." },
              },
              {
                title: { en: "Learner creates", ml: "പഠിതാവ് നിർമ്മിക്കുന്നു" },
                detail: { en: "Predict, make a first version, critique it, revise it, and explain the change.", ml: "പ്രവചിച്ച് ആദ്യ രൂപം നിർമ്മിച്ച് അത് വിമർശിച്ച് തിരുത്തി മാറ്റം വിശദീകരിക്കുന്നു." },
              },
              {
                title: { en: "Teacher reviews", ml: "അധ്യാപകൻ പരിശോധിക്കുന്നു" },
                detail: { en: "Read the full thinking sequence and choose guided, light, or independent support next.", ml: "മുഴുവൻ ചിന്താക്രമവും വായിച്ച് അടുത്തതായി കൂടുതൽ, കുറഞ്ഞ, അല്ലെങ്കിൽ സ്വതന്ത്ര പിന്തുണ തിരഞ്ഞെടുക്കുന്നു." },
              },
              {
                title: { en: "Family continues", ml: "കുടുംബം തുടരുന്നു" },
                detail: { en: "Try one teacher-reviewed activity without receiving the learner's private draft.", ml: "പഠിതാവിന്റെ സ്വകാര്യ കരട് ലഭിക്കാതെ അധ്യാപകൻ പരിശോധിച്ച ഒരു പ്രവർത്തനം ചെയ്യുന്നു." },
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
            <Link className="button primary" href={configured ? "/login" : "/setup"}>
              {configured
                ? copy(locale, { en: "Open your workspace", ml: "നിങ്ങളുടെ പ്രവർത്തിസ്ഥലം തുറക്കുക" })
                : copy(locale, { en: "Create your school", ml: "നിങ്ങളുടെ സ്കൂൾ സൃഷ്ടിക്കുക" })}
              <ArrowRight size={19} aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>
      <PublicFooter locale={locale} />
    </>
  );
}
