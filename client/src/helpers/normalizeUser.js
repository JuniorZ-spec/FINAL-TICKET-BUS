// Adapte la forme renvoyée par GET /api/users/profile (userType, travelerProfile,
// companyMember, adminProfile) au contrat { role, name, companyName } attendu par
// le reste du frontend (DefaultLayout, Header, etc.).
export function normalizeUser(profile) {
  const role =
    profile.userType === "ADMIN"
      ? "admin"
      : profile.userType === "COMPANY_MEMBER"
        ? "company"
        : "user";

  return {
    ...profile,
    role,
    name: profile.travelerProfile?.name ?? profile.adminProfile?.name ?? profile.email,
    companyName: profile.companyMember?.company?.companyName,
  };
}
