import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { requireEnv } from "@/lib/env";

/**
 * Returns the default Claude model for text/chat.
 * Called inside request handlers — env vars read at call time, not module init.
 */
export function getDefaultModel() {
  return createAnthropic({
    apiKey: requireEnv("ANTHROPIC_API_KEY"),
  })("claude-sonnet-4-6");
}

/**
 * Returns the DALL-E 3 image model (used in M1.3).
 * Called inside request handlers.
 */
export function getImageModel() {
  return createOpenAI({
    apiKey: requireEnv("OPENAI_API_KEY"),
  }).image("dall-e-3");
}
