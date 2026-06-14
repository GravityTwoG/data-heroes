export type Values<R extends Record<string, unknown>> = R[keyof R];
