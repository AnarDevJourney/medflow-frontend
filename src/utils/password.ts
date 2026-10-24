// Same policy as the backend (DOC 3.3): 8–72 characters (bytes), a letter and a digit
export const PASSWORD_POLICY = {
  minLength: 8,
  maxLength: 72,
  letter: /[A-Za-z]/,
  digit: /\d/,
};

export type PasswordProblem = "length" | "tooLong" | "letter" | "digit";

export function passwordProblems(password: string): PasswordProblem[] {
  const problems: PasswordProblem[] = [];
  if (password.length < PASSWORD_POLICY.minLength) problems.push("length");
  if (new TextEncoder().encode(password).length > PASSWORD_POLICY.maxLength)
    problems.push("tooLong");
  if (!PASSWORD_POLICY.letter.test(password)) problems.push("letter");
  if (!PASSWORD_POLICY.digit.test(password)) problems.push("digit");
  return problems;
}
