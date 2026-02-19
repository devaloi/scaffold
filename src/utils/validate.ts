export function isValidProjectName(name: string): boolean {
  return /^[a-z][a-z0-9-]*$/.test(name);
}

export function validateWithPattern(value: string, pattern: string): boolean {
  return new RegExp(pattern).test(value);
}
