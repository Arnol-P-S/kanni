import type { Metadata } from "next";
import { CheckCircle2, Network, ShieldCheck, Sparkles } from "lucide-react";
import { redirect } from "next/navigation";

import { SetupForm } from "@/components/setup-form";
import { NodesMark } from "@/components/nodes-mark";
import { isInstallationConfigured } from "@/lib/installation";

export const metadata: Metadata = {
  title: "Set up your school",
  description: "Create the first Kanni school and administrator account.",
};

export default async function SetupPage() {
  if (await isInstallationConfigured()) redirect("/login?notice=school-ready");

  return (
    <main id="main-content" className="setup-page">
      <section className="setup-story-panel">
        <div className="setup-brand"><NodesMark className="brand-mark" /><span><strong>Kanni</strong><small lang="ml">കണ്ണി</small></span></div>
        <p className="eyebrow">First-run school setup</p>
        <h1>Start with people and curriculum you control.</h1>
        <p className="setup-lead">Kanni begins empty. Create your school, add the support circle, and let teachers build grounded learning studios from material they are allowed to use.</p>
        <ul className="setup-value-list">
          <li><Network aria-hidden="true" /><span><strong>Real role mapping</strong><small>Connect each learner with the right teacher and parent.</small></span></li>
          <li><Sparkles aria-hidden="true" /><span><strong>Teacher-first AI</strong><small>One reviewed planning draft can prepare instruction for a full class.</small></span></li>
          <li><ShieldCheck aria-hidden="true" /><span><strong>School-owned boundaries</strong><small>No sample learner data, hidden accounts, or automatic AI requests.</small></span></li>
        </ul>
        <div className="setup-scope"><CheckCircle2 aria-hidden="true" /><span><strong>Focused first release</strong><small>Classes 6 to 9, teacher-led learning studios, English and Malayalam family support.</small></span></div>
      </section>
      <section className="setup-form-panel" aria-labelledby="setup-title">
        <div className="setup-form-heading"><p className="eyebrow">Clean installation</p><h2 id="setup-title">Create your school</h2><p>This takes about two minutes. You will add the other roles next.</p></div>
        <SetupForm />
      </section>
    </main>
  );
}
