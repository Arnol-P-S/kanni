"use client";

import { useState } from "react";
import { LockKeyhole } from "lucide-react";

export function AdultGate({
  onConfirmed,
}: {
  onConfirmed: () => void;
}) {
  const [checked, setChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirmAdultGate() {
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/adult-gate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmed: true }),
      });
      if (!response.ok) {
        throw new Error("AI setup is not available in this environment.");
      }
      onConfirmed();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Adult confirmation could not be saved.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="adult-gate" aria-labelledby="adult-gate-title">
      <div className="section-icon" aria-hidden="true">
        <LockKeyhole size={20} />
      </div>
      <div>
        <h2 id="adult-gate-title">Adult-supervised AI check</h2>
        <p>
          Static lesson content works without AI. AI hints and custom questions
          require this confirmation.
        </p>
        <label className="check-row">
          <input
            type="checkbox"
            checked={checked}
            onChange={(event) => setChecked(event.target.checked)}
          />
          <span>
            I am 18 or older and I am testing this prototype myself or
            supervising this activity.
          </span>
        </label>
        <button
          className="button secondary"
          type="button"
          disabled={!checked || submitting}
          onClick={confirmAdultGate}
        >
          {submitting ? "Confirming…" : "Confirm adult supervision"}
        </button>
        {error ? (
          <p className="inline-error" role="alert">
            {error} Reviewed lesson content is still available.
          </p>
        ) : null}
      </div>
    </section>
  );
}
