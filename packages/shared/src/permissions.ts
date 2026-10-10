export type AccountRole = 'management' | 'mentor' | 'obr' | 'fll';
export type AccountUser = { username: string; role: AccountRole };
export type PermissionSubject = { modality?: string; createdBy?: string };

const normalizedModality = (subject: PermissionSubject | string) =>
  (typeof subject === 'string' ? subject : subject.modality || '').toUpperCase();

export const canCreateTeamContent = (user: AccountUser | null, modality: string) =>
  Boolean(user && (
    (user.role === 'fll' && normalizedModality(modality) === 'FLL') ||
    (user.role === 'obr' && normalizedModality(modality) === 'OBR')
  ));

export const canMutateTeamContent = (user: AccountUser | null, subject: PermissionSubject) =>
  Boolean(
    user &&
    canCreateTeamContent(user, normalizedModality(subject)) &&
    subject.createdBy === user.username
  );

export const canCreateEvent = (user: AccountUser | null) =>
  user?.role === 'management' || user?.role === 'mentor';
export const canEditEvent = (user: AccountUser | null) => user?.role === 'mentor';
export const canDeleteEvent = (user: AccountUser | null) => user?.role === 'mentor';
export const canConfirmEvent = (user: AccountUser | null) => user?.role === 'management';

