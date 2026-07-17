import type {
  ArtifactCritique,
  MakerPath,
  ScaffoldLevel,
} from "@/lib/growth-cycle";

type LocalizedText = { en: string; ml: string };

export const makerPathPresentations: Record<
  MakerPath,
  { title: LocalizedText; detail: LocalizedText; familySummary: LocalizedText }
> = {
  fair_share_plan: {
    title: { en: "Plan a fair share", ml: "തുല്യമായി പങ്കിടാനുള്ള പദ്ധതി" },
    detail: {
      en: "Use two same-sized paper snacks and show how different equal parts could be shared.",
      ml: "ഒരേ വലുപ്പമുള്ള രണ്ട് പേപ്പർ ഭക്ഷണങ്ങൾ ഉപയോഗിച്ച് വ്യത്യസ്ത തുല്യഭാഗങ്ങൾ എങ്ങനെ പങ്കിടാമെന്ന് കാണിക്കുക.",
    },
    familySummary: {
      en: "a fair-sharing plan",
      ml: "തുല്യമായി പങ്കിടാനുള്ള ഒരു പദ്ധതി",
    },
  },
  fraction_pattern: {
    title: { en: "Design a fraction pattern", ml: "ഒരു ഭിന്ന പാറ്റേൺ രൂപകൽപ്പന ചെയ്യുക" },
    detail: {
      en: "Create a paper pattern using halves and quarters, then explain the rule behind it.",
      ml: "പകുതികളും കാലുകളും ഉപയോഗിച്ച് ഒരു പേപ്പർ പാറ്റേൺ ഉണ്ടാക്കി അതിന്റെ നിയമം വിശദീകരിക്കുക.",
    },
    familySummary: {
      en: "a fraction pattern",
      ml: "ഒരു ഭിന്ന പാറ്റേൺ",
    },
  },
  teach_with_objects: {
    title: { en: "Build a mini lesson", ml: "ഒരു ചെറിയ പാഠം നിർമ്മിക്കുക" },
    detail: {
      en: "Choose safe household objects and design a way to teach halves and quarters.",
      ml: "സുരക്ഷിതമായ വീട്ടുപകരണങ്ങൾ തിരഞ്ഞെടുത്ത് പകുതിയും കാലും പഠിപ്പിക്കാൻ ഒരു മാർഗം രൂപകൽപ്പന ചെയ്യുക.",
    },
    familySummary: {
      en: "a mini lesson using objects",
      ml: "വസ്തുക്കൾ ഉപയോഗിച്ചുള്ള ഒരു ചെറിയ പാഠം",
    },
  },
};

export const artifactCritiquePresentations: Record<
  ArtifactCritique,
  LocalizedText
> = {
  evidence_missing: {
    en: "My design needs stronger evidence.",
    ml: "എന്റെ രൂപകൽപ്പനയ്ക്ക് കൂടുതൽ ശക്തമായ തെളിവ് വേണം.",
  },
  whole_size_unclear: {
    en: "I did not clearly show that the wholes are the same size.",
    ml: "മുഴുവനുകൾ ഒരേ വലുപ്പമാണെന്ന് ഞാൻ വ്യക്തമായി കാണിച്ചില്ല.",
  },
  explanation_unclear: {
    en: "Someone else may not understand my explanation yet.",
    ml: "എന്റെ വിശദീകരണം മറ്റൊരാൾക്ക് ഇനിയും മനസ്സിലാകാതിരിക്കാം.",
  },
  ready_to_test: {
    en: "My design is ready to test with another example.",
    ml: "എന്റെ രൂപകൽപ്പന മറ്റൊരു ഉദാഹരണത്തിൽ പരീക്ഷിക്കാൻ തയ്യാറാണ്.",
  },
};

export const scaffoldLevelPresentations: Record<
  ScaffoldLevel,
  { title: LocalizedText; detail: LocalizedText }
> = {
  guided: {
    title: { en: "Guided", ml: "വഴികാട്ടിയോടെ" },
    detail: {
      en: "Show the visual, explanation, and all thinking questions.",
      ml: "ദൃശ്യവും വിശദീകരണവും എല്ലാ ചിന്താ ചോദ്യങ്ങളും കാണിക്കുക.",
    },
  },
  light: {
    title: { en: "Light", ml: "ലഘു സഹായം" },
    detail: {
      en: "Remove the visual and keep one thinking question.",
      ml: "ദൃശ്യം നീക്കി ഒരു ചിന്താ ചോദ്യം മാത്രം നിലനിർത്തുക.",
    },
  },
  independent: {
    title: { en: "Independent", ml: "സ്വതന്ത്രം" },
    detail: {
      en: "The student starts with their own plan and uses only a final self-check.",
      ml: "വിദ്യാർത്ഥി സ്വന്തം പദ്ധതിയിൽ തുടങ്ങി അവസാന സ്വയംപരിശോധന മാത്രം ഉപയോഗിക്കുന്നു.",
    },
  },
};
