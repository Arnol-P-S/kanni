import "server-only";

import type {
  CriticOutput,
  TutorModelOutput,
  TutorRequest,
  TutorResponse,
} from "@/lib/domain";

export type CriticKind = "source" | "teaching";

export interface TutorModelAdapter {
  readonly providerId: string;
  generateTutorOutput(request: TutorRequest): Promise<TutorModelOutput>;
  runCritic(
    kind: CriticKind,
    request: TutorRequest,
    answer: TutorResponse,
  ): Promise<CriticOutput>;
}
