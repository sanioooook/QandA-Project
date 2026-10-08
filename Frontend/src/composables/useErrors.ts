import { useI18n } from 'vue-i18n';
import { ApiError } from '@/api/http';
import { LIMITS } from '@/limits';

/** Values interpolated into error messages that mention limits. */
export const ERROR_PARAMS: Record<string, Record<string, number>> = {
  login_length: { min: LIMITS.loginMin, max: LIMITS.loginMax },
  password_length: { min: LIMITS.passwordMin, max: LIMITS.passwordMax },
  title_length: { max: LIMITS.titleMax },
  description_length: { max: LIMITS.descriptionMax },
  option_length: { max: LIMITS.optionTextMax },
  options_min: { min: LIMITS.optionsMin },
  options_max: { max: LIMITS.optionsMax },
  max_votes_range: { max: LIMITS.maxVotesPerUserCap },
  max_options_range: { max: LIMITS.maxOptionsPerParticipantCap },
};

export function useErrors() {
  const { t, te } = useI18n();

  /** Translated text for an error code; unknown codes fall back to a generic message. */
  function codeMessage(code: string): string {
    const key = `errors.${code}`;
    return te(key) ? t(key, ERROR_PARAMS[code] ?? {}) : t('errors.generic');
  }

  function errorMessage(error: unknown): string {
    return error instanceof ApiError ? codeMessage(error.code) : t('errors.generic');
  }

  /** Field name -> translated message, from an API validation error. */
  function fieldErrors(error: unknown): Record<string, string> {
    if (!(error instanceof ApiError)) return {};
    return Object.fromEntries(
      Object.entries(error.fields).map(([field, codes]) => [field, codeMessage(codes[0] ?? error.code)]),
    );
  }

  return { codeMessage, errorMessage, fieldErrors };
}
