import { describe, expect, it } from 'vitest';
import {
  canConfirmEvent,
  canCreateFeedback,
  canCreateEvent,
  canCreateTeamContent,
  canDeleteEvent,
  canEditEvent,
  canManageBanner,
  canManageNotificationSettings,
  canMutateTeamContent,
  type AccountUser
} from '../src/permissions';

const users: {
  visitor: null;
  management: AccountUser;
  mentor: AccountUser;
  fll: AccountUser;
  obr: AccountUser;
} = {
  visitor: null,
  management: { username: 'gestao', role: 'management' },
  mentor: { username: 'mentor', role: 'mentor' },
  fll: { username: 'fll', role: 'fll' },
  obr: { username: 'obr', role: 'obr' }
};

describe('account permission matrix', () => {
  it('reserves technical content creation for the matching student account', () => {
    expect(canCreateTeamContent(users.fll, 'FLL')).toBe(true);
    expect(canCreateTeamContent(users.fll, 'OBR')).toBe(false);
    expect(canCreateTeamContent(users.obr, 'OBR')).toBe(true);
    expect(canCreateTeamContent(users.obr, 'FLL')).toBe(false);
    expect(canCreateTeamContent(users.management, 'FLL')).toBe(false);
    expect(canCreateTeamContent(users.mentor, 'OBR')).toBe(false);
    expect(canCreateTeamContent(users.visitor, 'FLL')).toBe(false);
  });

  it('allows only students to edit or delete content from their matching notebook, regardless of authorship', () => {
    expect(canMutateTeamContent(users.fll, { modality: 'FLL', createdBy: 'fll' })).toBe(true);
    expect(canMutateTeamContent(users.fll, { modality: 'FLL', createdBy: 'mentor' })).toBe(true);
    expect(canMutateTeamContent(users.fll, { modality: 'FLL', createdBy: 'another-student' })).toBe(true);
    expect(canMutateTeamContent(users.obr, { modality: 'OBR', createdBy: 'obr' })).toBe(true);
    expect(canMutateTeamContent(users.obr, { modality: 'OBR', createdBy: 'another-student' })).toBe(true);
    expect(canMutateTeamContent(users.obr, { modality: 'FLL', createdBy: 'obr' })).toBe(false);
    expect(canMutateTeamContent(users.fll, { modality: 'OBR', createdBy: 'fll' })).toBe(false);
    expect(canMutateTeamContent(users.management, { modality: 'FLL', createdBy: 'gestao' })).toBe(false);
    expect(canMutateTeamContent(users.mentor, { modality: 'OBR', createdBy: 'mentor' })).toBe(false);
    expect(canMutateTeamContent(users.visitor, { modality: 'FLL', createdBy: 'fll' })).toBe(false);
  });

  it('separates event planning from management approval', () => {
    expect(canCreateEvent(users.management)).toBe(true);
    expect(canCreateEvent(users.mentor)).toBe(true);
    expect(canEditEvent(users.management)).toBe(false);
    expect(canDeleteEvent(users.management)).toBe(false);
    expect(canEditEvent(users.mentor)).toBe(true);
    expect(canDeleteEvent(users.mentor)).toBe(true);
    expect(canConfirmEvent(users.management)).toBe(true);
    expect(canConfirmEvent(users.mentor)).toBe(false);
    expect(canCreateEvent(users.fll)).toBe(false);
    expect(canCreateEvent(users.visitor)).toBe(false);
  });

  it('keeps notification settings mentor-only and feedback publishing management-only', () => {
    expect(canManageNotificationSettings(users.mentor)).toBe(true);
    expect(canManageNotificationSettings(users.management)).toBe(false);
    expect(canCreateFeedback(users.management)).toBe(true);
    expect(canCreateFeedback(users.mentor)).toBe(false);
    expect(canCreateFeedback(users.fll)).toBe(false);
  });

  it('lets mentors manage every banner and students only their modality', () => {
    expect(canManageBanner(users.mentor, 'FLL')).toBe(true);
    expect(canManageBanner(users.mentor, 'OBR')).toBe(true);
    expect(canManageBanner(users.fll, 'FLL')).toBe(true);
    expect(canManageBanner(users.fll, 'OBR')).toBe(false);
    expect(canManageBanner(users.obr, 'OBR')).toBe(true);
    expect(canManageBanner(users.management, 'FLL')).toBe(false);
  });
});

