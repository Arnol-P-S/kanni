"use client";

import { useEffect, useState } from "react";
import { Info, LockKeyhole } from "lucide-react";

import {
  PublicAiCapabilitySchema,
  type PublicAiCapability,
} from "@/lib/domain";

export type { PublicAiCapability } from "@/lib/domain";

const HealthResponseSchema = PublicAiCapabilitySchema.transform((ai) => ai);

export function AdultGate({
  onConfirmed,
}: {
  onConfirmed: (capability: PublicAiCapability) => void;
}) {
  const [capability, setCapability] = useState<PublicAiCapability | null>(null);
  const [checkingCapability, setCheckingCapability] = useState(true);
  const [checked, setChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    void fetch("/api/health", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Capability check failed.");
        const payload: unknown = await response.json();
        if (
          typeof payload !== "object" ||
          payload === null ||
          !("ai" in payload)
        ) {
          throw new Error("Capability response was malformed.");
        }
        const capabilityResponse = HealthResponseSchema.parse(payload.ai);
        if (!active) return;
        setCapability(capabilityResponse);
      })
      .catch((caughtError: unknown) => {
        if (caughtError instanceof DOMException && caughtError.name === "AbortError") {
          return;
        }
        if (!active) return;
        setCapability({
          available: false,
          deepCheckAvailable: false,
          provider: "disabled",
          reason: "health_unavailable",
        });
      })
      .finally(() => {
        if (active) setCheckingCapability(false);
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  async function confirmAdultGate() {
    if (!capability?.available) return;
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
      onConfirmed(capability);
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

  if (checkingCapability) {
    return (
      <section className="adult-gate" aria-live="polite">
        <div className="section-icon" aria-hidden="true">
          <LockKeyhole size={20} />
        </div>
        <div>
          <h2>Checking supervised AI</h2>
          <p>The project-authored lesson path remains available while this check runs.</p>
        </div>
      </section>
    );
  }

  if (!capability?.available) {
    return (
      <section className="adult-gate ai-disabled" aria-labelledby="ai-disabled-title">
        <div className="section-icon" aria-hidden="true">
          <Info size={20} />
        </div>
        <div>
          <h2 id="ai-disabled-title">Supervised AI is off in this release</h2>
          <p>
            Kanni is using project-authored lesson content while the runtime provider
            and child-directed-use terms are resolved. No model request is sent.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="adult-gate" aria-labelledby="adult-gate-title">
      <div className="section-icon" aria-hidden="true">
        <LockKeyhole size={20} />
      </div>
      <div>
        <h2 id="adult-gate-title">Adult-supervised AI check</h2>
        <p>
          Project-authored lesson content works without AI. AI hints and custom questions
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
            {error} Project-authored lesson content is still available.
          </p>
        ) : null}
      </div>
    </section>
  );
}
