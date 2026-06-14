import { Repositories } from "../interfaces/repo";
import { buildPreferences } from "./preferences";

export const buildUseCases = (params: { repositories: Repositories }) => {
  return {
    preferences: buildPreferences(params),
  };
};

export type UseCases = ReturnType<typeof buildUseCases>;
