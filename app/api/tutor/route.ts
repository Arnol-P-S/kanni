import { NextRequest, NextResponse } from "next/server";

import {
  ADULT_GATE_COOKIE,
  getAdultGateSecret,
  verifyAdultGateToken,
} from "@/lib/adult-gate";
import { getAiCapability } from "@/lib/ai/capability";
import { generateTutorResponse } from "@/lib/ai/runtime";
import { TutorRequestSchema } from "@/lib/domain";
import {
  getGuidedAttempt,
  getGuidedHintContext,
} from "@/lib/math-activity-strategies";
import {
  boundaryResponse,
  classifyPrompt,
  unavailableResponse,
} from "@/lib/safety";

const noStoreHeaders = { "Cache-Control": "no-store" };
const MAX_TUTOR_REQUEST_BYTES = 8 * 1024;

class TutorRequestTooLargeError extends Error {}

async function readJsonWithinLimit(request: NextRequest): Promise<unknown> {
  const declaredLength = request.headers.get("content-length");
  if (declaredLength) {
    const parsedLength = Number.parseInt(declaredLength, 10);
    if (Number.isFinite(parsedLength) && parsedLength > MAX_TUTOR_REQUEST_BYTES) {
      throw new TutorRequestTooLargeError();
    }
  }

  if (!request.body) throw new SyntaxError("The request body is missing.");

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > MAX_TUTOR_REQUEST_BYTES) {
      await reader.cancel();
      throw new TutorRequestTooLargeError();
    }
    chunks.push(value);
  }

  const body = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(body));
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let parsedRequest;
  try {
    const body = await readJsonWithinLimit(request);
    const candidate =
      typeof body === "object" && body !== null && "prompt" in body
        ? {
            ...body,
            prompt:
              typeof body.prompt === "string"
                ? body.prompt.normalize("NFC").trim()
                : body.prompt,
          }
        : body;
    parsedRequest = TutorRequestSchema.parse(candidate);
  } catch (error) {
    const tooLarge = error instanceof TutorRequestTooLargeError;
    return NextResponse.json(
      {
        error: tooLarge
          ? "The tutor request is too large."
          : "The tutor request is invalid.",
      },
      { status: tooLarge ? 413 : 400, headers: noStoreHeaders },
    );
  }

  if (
    parsedRequest.mode === "guided_hint" &&
    !getGuidedAttempt(
      parsedRequest.questionId,
      parsedRequest.selectedAnswerId,
    )
  ) {
    return NextResponse.json(
      { error: "The guided-hint attempt is invalid." },
      { status: 400, headers: noStoreHeaders },
    );
  }

  const prompt =
    parsedRequest.mode === "custom_question"
      ? parsedRequest.prompt
      : getGuidedHintContext(parsedRequest.questionId).question[
          parsedRequest.language
        ];
  const route = classifyPrompt(parsedRequest.lessonId, prompt);
  if (route !== "generate") {
    return NextResponse.json(boundaryResponse(route, parsedRequest.language), {
      headers: noStoreHeaders,
    });
  }

  const secret = getAdultGateSecret();
  const token = request.cookies.get(ADULT_GATE_COOKIE)?.value;
  if (!secret || !verifyAdultGateToken(token, secret)) {
    return NextResponse.json(
      { error: "Adult confirmation is required before AI use." },
      { status: 401, headers: noStoreHeaders },
    );
  }

  if (!getAiCapability().available) {
    return NextResponse.json(unavailableResponse(parsedRequest.language), {
      headers: noStoreHeaders,
    });
  }

  try {
    const response = await generateTutorResponse(parsedRequest);
    return NextResponse.json(response, { headers: noStoreHeaders });
  } catch {
    return NextResponse.json(unavailableResponse(parsedRequest.language), {
      headers: noStoreHeaders,
    });
  }
}
