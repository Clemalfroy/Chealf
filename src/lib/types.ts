export type ActionResult<T = undefined> =
  | (T extends undefined ? { success: true; data?: undefined } : { success: true; data: T })
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };
