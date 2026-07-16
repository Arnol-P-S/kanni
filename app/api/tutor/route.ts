import { NextRequest, NextResponse } from "next/server";

import {
  ADULT_GATE_COOKIE,
  getAdultGateSecret,
  verifyAdultGateToken,
} from "@/lib/adult-gate";
import { generateTutorResponse } from "@/lib/ai/runtime";
import { TutorRequestSchema } from "@/lib/domain";
import {
  boundaryResponse,
  classifyPrompt,
  unavailableResponse,
} from "@/lib/safety";

const noStoreHeaders = { "Cache-Control": "no-store" };

export async function POST(request: NextRequest): Promise<NextResponse> {
  const secret = getAdultGateSecret();
  const token = request.cookies.get(ADULT_GATE_COOKIE)?.value;
  if (!secret || !verifyAdultGateToken(token, secret)) {
    return NextResponse.json(
      { error: "Adult confirmation is required before AI use." },
      { status: 401, headers: noStoreHeaders },
    );
  }

  let parsedRequest;
  try {
    const body: unknown = await request.json();
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
  } catch {
    return NextResponse.json(
      { error: "The tutor request is invalid." },
      { status: 400, headers: noStoreHeaders },
    );
  }

  const prompt = parsedRequest.prompt ?? "guided addition hint";
  const route = classifyPrompt(parsedRequest.lessonId, prompt);
  if (route !== "generate") {
    return NextResponse.json(boundaryResponse(route, parsedRequest.language), {
      headers: noStoreHeaders,
    });
  }

  if (
    process.env.AI_DEMO_ENABLED !== "true" ||
    !(process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN)
  ) {
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
