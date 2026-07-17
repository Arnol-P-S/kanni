import type { SupportStrategy } from "@/lib/growth-cycle";

export type GrowthSupportPresentation = {
  studentTitle: { en: string; ml: string };
  studentSteps: { en: string[]; ml: string[] };
  familyTitle: { en: string; ml: string };
  familyDetail: { en: string; ml: string };
};

export const growthSupportPresentations: Record<
  SupportStrategy,
  GrowthSupportPresentation
> = {
  fraction_strips: {
    studentTitle: {
      en: "Compare two equal paper strips",
      ml: "ഒരേ വലുപ്പമുള്ള രണ്ട് പേപ്പർ സ്ട്രിപ്പുകൾ താരതമ്യം ചെയ്യുക",
    },
    studentSteps: {
      en: [
        "Keep both whole strips the same size.",
        "Split one into two equal parts and the other into four.",
        "Compare one part from each strip.",
      ],
      ml: [
        "രണ്ട് മുഴുവൻ സ്ട്രിപ്പുകളും ഒരേ വലുപ്പത്തിൽ വയ്ക്കുക.",
        "ഒന്നിനെ രണ്ട് തുല്യഭാഗങ്ങളായും മറ്റൊന്നിനെ നാലായും വിഭജിക്കുക.",
        "ഓരോ സ്ട്രിപ്പിലെയും ഒരു ഭാഗം താരതമ്യം ചെയ്യുക.",
      ],
    },
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
    studentTitle: {
      en: "Use three comparison questions",
      ml: "മൂന്ന് താരതമ്യ ചോദ്യങ്ങൾ ഉപയോഗിക്കുക",
    },
    studentSteps: {
      en: [
        "Are both wholes the same size?",
        "How many equal parts does each whole have?",
        "Which single part takes more space?",
      ],
      ml: [
        "രണ്ട് മുഴുവനുകളും ഒരേ വലുപ്പമാണോ?",
        "ഓരോ മുഴുവനിലും എത്ര തുല്യഭാഗങ്ങളുണ്ട്?",
        "ഏത് ഒരു ഭാഗമാണ് കൂടുതൽ സ്ഥലം എടുക്കുന്നത്?",
      ],
    },
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
    studentTitle: {
      en: "Explain the comparison to someone",
      ml: "താരതമ്യം മറ്റൊരാൾക്ക് വിശദീകരിക്കുക",
    },
    studentSteps: {
      en: [
        "Show where one half and one quarter are.",
        "Say why the whole must stay the same size.",
        "Explain which single part takes more space.",
      ],
      ml: [
        "ഒരു പകുതിയും ഒരു കാലും എവിടെയാണെന്ന് കാണിക്കുക.",
        "മുഴുവനിന്റെ വലുപ്പം ഒരേ ആയിരിക്കേണ്ടത് എന്തുകൊണ്ടെന്ന് പറയുക.",
        "ഏത് ഒരു ഭാഗമാണ് കൂടുതൽ സ്ഥലം എടുക്കുന്നതെന്ന് വിശദീകരിക്കുക.",
      ],
    },
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
