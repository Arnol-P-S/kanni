"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
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
const LOCAL_STORE_EVENT = "kanni:local-store-change";
const SERVER_RECORD = createLearningRecord(
  "math-add-within-10",
  new Date(0),
);
const SERVER_RECORD_SNAPSHOT = JSON.stringify(SERVER_RECORD);

function subscribeToLocalStore(onStoreChange: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY || event.key === LANGUAGE_KEY) {
      onStoreChange();
    }
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(LOCAL_STORE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(LOCAL_STORE_EVENT, onStoreChange);
  };
}

function getRecordSnapshot(): string {
  return window.localStorage.getItem(STORAGE_KEY) ?? SERVER_RECORD_SNAPSHOT;
}

function getLanguageSnapshot(): Language {
  const storedLanguage = window.localStorage.getItem(LANGUAGE_KEY);
  return storedLanguage === "ml" || storedLanguage === "en"
    ? storedLanguage
    : "ml";
}

function announceLocalStoreChange(): void {
  window.dispatchEvent(new Event(LOCAL_STORE_EVENT));
}

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
  const recordSnapshot = useSyncExternalStore(
    subscribeToLocalStore,
    getRecordSnapshot,
    () => SERVER_RECORD_SNAPSHOT,
  );
  const language = useSyncExternalStore(
    subscribeToLocalStore,
    getLanguageSnapshot,
    () => "ml" as const,
  );
  const record = useMemo(
    () => parseStoredLearningRecord(recordSnapshot) ?? SERVER_RECORD,
    [recordSnapshot],
  );

  const updateRecord = useCallback(
    (update: (current: LearningRecord) => LearningRecord) => {
      const current =
        parseStoredLearningRecord(window.localStorage.getItem(STORAGE_KEY)) ??
        SERVER_RECORD;
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(update(current)));
      announceLocalStoreChange();
    },
    [],
  );

  const setLanguage = useCallback((nextLanguage: Language) => {
    window.localStorage.setItem(LANGUAGE_KEY, nextLanguage);
    announceLocalStoreChange();
  }, []);

  const beginLesson = useCallback((lessonId: LessonId) => {
    updateRecord((current) =>
      current.lessonId === lessonId
        ? current
        : createLearningRecord(lessonId),
    );
  }, [updateRecord]);

  const addAttempt = useCallback(
    (
      attempt: Attempt,
      options?: {
        hintUsed?: boolean;
        possibleConfusionCode?: string | null;
      },
    ) => {
      updateRecord((current) => recordAttempt(current, attempt, options));
    },
    [updateRecord],
  );

  const chooseStrategy = useCallback((strategy: TeacherStrategy) => {
    updateRecord((current) => selectTeacherStrategy(current, strategy));
  }, [updateRecord]);

  const updateReviewState = useCallback((reviewState: ReviewState) => {
    updateRecord((current) => setReviewState(current, reviewState));
  }, [updateRecord]);

  const resetDemo = useCallback(() => {
    updateRecord(() => createLearningRecord("math-add-within-10"));
  }, [updateRecord]);

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
