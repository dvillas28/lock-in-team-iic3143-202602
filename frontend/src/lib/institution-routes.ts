// Match InstitutionSlug in OpenAPI. A well-formed slug does not grant access.
export function isInstitutionSlug(value: string): boolean {
  return value.length <= 63 && /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(value);
}

export function institutionHomePath(institutionSlug: string): string {
  if (!isInstitutionSlug(institutionSlug)) {
    throw new TypeError("Invalid institution slug");
  }
  return "/courses";
}
