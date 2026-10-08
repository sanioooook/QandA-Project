// Mirrors Server/src/QandA.Api/Domain/Limits.cs, used for client-side validation and error texts.
export const LIMITS = {
  loginMin: 3,
  loginMax: 30,
  passwordMin: 8,
  passwordMax: 128,
  titleMax: 200,
  descriptionMax: 1000,
  optionTextMax: 200,
  optionsMin: 2,
  optionsMax: 30,
  maxVotesPerUserCap: 30,
  maxOptionsPerParticipantCap: 10,
} as const;

export const LOGIN_PATTERN = /^[A-Za-z0-9_.@-]+$/;
