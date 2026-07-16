"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type {
  Attempt,
  Language,
  LearningRecord,
  LessonId,
  ReviewState,
  TeacherStrategy,
} from "@/lib/domain";
import {
  STORAGE_KEY,
  createLearningRecord,
  parseStoredLearningRecord,
  recordAttempt,
  selectTeacherStrategy,
  setReviewState,
} from "@/lib/learning-record";

const LANGUAGE_KEY = "kanni.language.v1";

type LearningContextValue = {
  language: Language;
  record: LearningRecord;
  setLanguage: (language: Language) => void;
  beginLesson: (lessonId: LessonId) => void;
  addAttempt: (
    attempt: Attempt,
    options?: {
      hintUsed?: boolean;
      possibleConfusionCode?: string | null;
    },
  ) => void;
  chooseStrategy: (strategy: TeacherStrategy) => void;
  updateReviewState: (reviewState: ReviewState) => void;
  resetDemo: () => void;
};

const LearningContext = createContext<LearningContextValue | null>(null);

export function LearningRecordProvider({ children }: { children: ReactNode }) {
  const [record, setRecord] = useState<LearningRecord>(() =>
    createLearningRecord("math-add-within-10", new Date(0)),
  );
  const [language, setLanguageState] = useState<Language>("ml");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const storedRecord = parseStoredLearningRecord(
        window.localStorage.getItem(STORAGE_KEY),
      );
      const storedLanguage = window.localStorage.getItem(LANGUAGE_KEY);
      if (storedRecord) setRecord(storedRecord);
      if (storedLanguage === "ml" || storedLanguage === "en") {
        setLanguageState(storedLanguage);
      }
      setHydrated(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  }, [hydrated, record]);

  const setLanguage = useCallback((nextLanguage: Language) => {
    setLanguageState(nextLanguage);
    window.localStorage.setItem(LANGUAGE_KEY, nextLanguage);
  }, []);

  const beginLesson = useCallback((lessonId: LessonId) => {
    setRecord((current) =>
      current.lessonId === lessonId
        ? current
        : createLearningRecord(lessonId),
    );
  }, []);

  const addAttempt = useCallback(
    (
      attempt: Attempt,
      options?: {
        hintUsed?: boolean;
        possibleConfusionCode?: string | null;
      },
    ) => {
      setRecord((current) => recordAttempt(current, attempt, options));
    },
    [],
  );

  const chooseStrategy = useCallback((strategy: TeacherStrategy) => {
    setRecord((current) => selectTeacherStrategy(current, strategy));
  }, []);

  const updateReviewState = useCallback((reviewState: ReviewState) => {
    setRecord((current) => setReviewState(current, reviewState));
  }, []);

  const resetDemo = useCallback(() => {
    setRecord(createLearningRecord("math-add-within-10"));
  }, []);

  const value = useMemo(
    () => ({
      language,
      record,
      setLanguage,
      beginLesson,
      addAttempt,
      chooseStrategy,
      updateReviewState,
      resetDemo,
    }),
    [
      language,
      record,
      setLanguage,
      beginLesson,
      addAttempt,
      chooseStrategy,
      updateReviewState,
      resetDemo,
    ],
  );

  return (
    <LearningContext.Provider value={value}>
      {children}
    </LearningContext.Provider>
  );
}

export function useLearningRecord(): LearningContextValue {
  const context = useContext(LearningContext);
  if (!context) {
    throw new Error(
      "useLearningRecord must be used inside LearningRecordProvider.",
    );
  }
  return context;
}
