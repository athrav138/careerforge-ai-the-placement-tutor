import { expect, test } from '@playwright/test';
import { buildCareerActionTransaction, type ActionDraft } from '../../src/lib/action-center-transaction';

const ownerProfileId = 'profile-owner-a';
const otherProfileId = 'profile-owner-b';
const draft: ActionDraft = {
  source: 'REGRESSION',
  title: 'Scoped action',
  description: 'Ownership regression fixture',
  category: 'PROFILE',
  priority: 'MEDIUM',
  reason: 'Verify profile-scoped transaction predicates',
};

test('career action regeneration scopes every database operation to the authenticated profile', () => {
  const predicates: unknown[] = [];
  const delegate = {
    deleteMany: ({ where }: { where: unknown }) => {
      predicates.push(where);
      return Promise.resolve({ count: 0 });
    },
    upsert: ({ where, create, update }: { where: unknown; create: { studentProfileId: string }; update: unknown }) => {
      predicates.push(where);
      expect(create.studentProfileId).toBe(ownerProfileId);
      expect(update).not.toHaveProperty('studentProfileId');
      return Promise.resolve({ id: 'action-a' });
    },
    findMany: ({ where }: { where: unknown }) => {
      predicates.push(where);
      return Promise.resolve([]);
    },
  };

  const operations = buildCareerActionTransaction(delegate as never, ownerProfileId, [draft]);

  expect(operations).toHaveLength(3);
  expect(predicates).toEqual([
    expect.objectContaining({ studentProfileId: ownerProfileId }),
    { studentProfileId_source: { studentProfileId: ownerProfileId, source: 'REGRESSION' } },
    { studentProfileId: ownerProfileId },
  ]);
  expect(JSON.stringify(predicates)).not.toContain(otherProfileId);
});
