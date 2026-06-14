import { Logger } from "@/lib/logger";

import { Repositories } from "../interfaces/repo";
import { buildPreferences } from "./preferences";

export const buildUseCases = (params: { repositories: Repositories; logger: Logger }) => {
  return {
    preferences: buildPreferences(params),
  };
};

export type UseCases = ReturnType<typeof buildUseCases>;
