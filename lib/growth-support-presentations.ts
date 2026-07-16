import type { SupportStrategy } from "@/lib/growth-cycle";

export type GrowthSupportPresentation = {
  studentTitle: string;
  studentSteps: string[];
  familyTitle: { en: string; ml: string };
  familyDetail: { en: string; ml: string };
};

export const growthSupportPresentations: Record<
  SupportStrategy,
  GrowthSupportPresentation
> = {
  fraction_strips: {
    studentTitle: "Compare two equal paper strips",
    studentSteps: [
      "Keep both whole strips the same size.",
      "Split one into two equal parts and the other into four.",
      "Compare one part from each strip.",
    ],
    familyTitle: {
      en: "Use two equal sheets of paper.",
      ml: "ഒരേ വലുപ്പമുള്ള രണ്ട് കടലാസുകൾ എടുക്കുക.",
    },
    familyDetail: {
      en: "Fold one into two equal parts and the other into four equal parts. Compare one part from each sheet.",
      ml: "ഒന്ന് രണ്ട് തുല്യ ഭാഗങ്ങളായും മറ്റൊന്ന് നാല് തുല്യ ഭാഗങ്ങളായും മടക്കുക. ഓരോ കടലാസിലെയും ഒരു ഭാഗം താരതമ്യം ചെയ്യുക.",
    },
  },
  guided_questions: {
    studentTitle: "Use three comparison questions",
    studentSteps: [
      "Are both wholes the same size?",
      "How many equal parts does each whole have?",
      "Which single part takes more space?",
    ],
    familyTitle: {
      en: "Ask three short questions.",
      ml: "മൂന്ന് ചെറിയ ചോദ്യങ്ങൾ ചോദിക്കുക.",
    },
    familyDetail: {
      en: "Ask whether the wholes are equal, how many equal parts each has, and which single part takes more space.",
      ml: "മുഴുവൻ ഭാഗങ്ങൾ ഒരേ വലുപ്പമാണോ, ഓരോന്നിലും എത്ര തുല്യ ഭാഗങ്ങളുണ്ട്, ഏത് ഒരു ഭാഗമാണ് കൂടുതൽ സ്ഥലം എടുക്കുന്നത് എന്ന് ചോദിക്കുക.",
    },
  },
  explain_to_someone: {
    studentTitle: "Explain the comparison to someone",
    studentSteps: [
      "Show where one half and one quarter are.",
      "Say why the whole must stay the same size.",
      "Explain which single part takes more space.",
    ],
    familyTitle: {
      en: "Ask the learner to teach the idea to you.",
      ml: "ഈ ആശയം നിങ്ങളെ പഠിപ്പിക്കാൻ പഠിതാവിനോട് പറയുക.",
    },
    familyDetail: {
      en: "Let the learner show one half and one quarter, then explain why one half takes more space when the wholes are equal.",
      ml: "ഒരു പകുതിയും ഒരു നാലിലൊന്നും കാണിച്ച്, മുഴുവൻ ഭാഗങ്ങൾ തുല്യമായിരിക്കുമ്പോൾ ഒരു പകുതി എന്തുകൊണ്ട് കൂടുതൽ സ്ഥലം എടുക്കുന്നു എന്ന് വിശദീകരിക്കാൻ പറയുക.",
    },
  },
};
