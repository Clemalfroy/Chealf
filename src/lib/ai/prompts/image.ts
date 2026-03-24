export const IMAGE_STYLE_PROMPT =
  "Professional food photography: overhead or 45-degree angle shot, " +
  "natural soft daylight, shallow depth of field, warm editorial tones. " +
  "Dish served on a simple ceramic or linen-textured plate. " +
  "Clean minimal background (stone, wood, or matte linen). " +
  "No text, no watermarks, no hands. Photorealistic, high detail. " +
  "Aspect ratio 16:9. ";

export function buildImagePrompt(dishPrompt: string): string {
  return IMAGE_STYLE_PROMPT + dishPrompt;
}
