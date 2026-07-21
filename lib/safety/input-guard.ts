export type InputGuardResult =
  | { status: "clear" }
  | { status: "personal_data"; code: string }
  | { status: "high_risk"; code: string }
  | { status: "prompt_injection"; code: string };

const personalDataPatterns: Array<[string, RegExp]> = [
  ["email", /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/iu],
  ["phone", /(?:\+?91[ -]?)?[6-9]\d{9}\b/u],
  ["web_address", /\b(?:https?:\/\/|www\.)\S+/iu],
  ["social_handle", /(^|\s)@[a-z0-9_]{3,30}\b/iu],
];

const highRiskPatterns: Array<[string, RegExp]> = [
  ["self_harm", /\b(?:kill myself|suicide|self[- ]?harm|hurt myself|end my life)\b/iu],
  ["abuse", /\b(?:being abused|sexual abuse|someone touched me|unsafe at home)\b/iu],
  ["immediate_danger", /\b(?:immediate danger|weapon at school|going to hurt someone)\b/iu],
  ["self_harm_ml", /(?:ആത്മഹത്യ|എന്നെത്തന്നെ കൊല്ല|സ്വയം പരിക്കേൽപ്പ)/u],
  ["danger_ml", /(?:അപകടത്തിലാണ്|എന്നെ ഉപദ്രവിക്കുന്നു|വീട്ടിൽ സുരക്ഷിതമല്ല)/u],
];

const injectionPatterns: Array<[string, RegExp]> = [
  ["instruction_override", /\b(?:ignore|disregard|forget)\b.{0,40}\b(?:instructions?|rules?|prompt)\b/iu],
  ["prompt_extraction", /\b(?:show|reveal|print)\b.{0,30}\b(?:system|developer) prompt\b/iu],
  ["role_override", /\b(?:you are now|act as)\b.{0,40}\b(?:system|administrator|unrestricted)\b/iu],
  ["prompt_token", /<\|(?:im_start|system|assistant|developer)\|>/iu],
];

export function inspectUserText(value: string, options?: { aiBound?: boolean }): InputGuardResult {
  const normalized = value.normalize("NFC");
  for (const [code, pattern] of highRiskPatterns) {
    if (pattern.test(normalized)) return { status: "high_risk", code };
  }
  for (const [code, pattern] of personalDataPatterns) {
    if (pattern.test(normalized)) return { status: "personal_data", code };
  }
  if (options?.aiBound) {
    for (const [code, pattern] of injectionPatterns) {
      if (pattern.test(normalized)) return { status: "prompt_injection", code };
    }
  }
  return { status: "clear" };
}

export function inspectTextFields(
  values: readonly string[],
  options?: { aiBound?: boolean },
): InputGuardResult {
  for (const value of values) {
    const result = inspectUserText(value, options);
    if (result.status !== "clear") return result;
  }
  return { status: "clear" };
}

export function containsDiagnosticObservation(value: string): boolean {
  return /\b(?:lazy|slow learner|low ability|weak student|diagnosed|disorder|incapable|not intelligent)\b/iu.test(
    value.normalize("NFC"),
  );
}
