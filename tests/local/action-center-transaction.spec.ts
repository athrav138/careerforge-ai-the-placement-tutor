import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { expect, test } from '@playwright/test';
import { buildCareerActionTransaction, type ActionDraft } from '../../src/lib/action-center-transaction';

const prisma = new PrismaClient();
const runId = randomUUID();
let userId: string | undefined;
let studentProfileId: string;

const regeneratedDrafts: ActionDraft[] = [
  {
    source: 'KEEP',
    title: 'Updated action',
    description: 'Updated by regeneration',
    category: 'PROFILE',
    priority: 'HIGH',
    reason: 'Current source remains relevant',
  },
  {
    source: 'NEW',
    title: 'New action',
    description: 'Created by regeneration',
    category: 'SKILL',
    priority: 'MEDIUM',
    reason: 'New source is relevant',
  },
];

test.describe('Career action transaction on disposable local PostgreSQL', () => {
  test.beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        name: 'Transaction Test User',
        email: `careerforge-action-transaction-${runId}@example.invalid`,
        studentProfile: { create: {} },
      },
      select: { id: true, studentProfile: { select: { id: true } } },
    });
    userId = user.id;
    studentProfileId = user.studentProfile!.id;

    await prisma.careerAction.createMany({
      data: [
        {
          studentProfileId,
          source: 'KEEP',
          title: 'Original action',
          description: 'Must be restored after rollback',
          category: 'PROFILE',
          priority: 'LOW',
          reason: 'Original reason',
        },
        {
          studentProfileId,
          source: 'STALE',
          title: 'Stale action',
          description: 'Deletion must be rolled back',
          category: 'SKILL',
          priority: 'LOW',
          reason: 'Stale reason',
        },
        {
          studentProfileId,
          source: 'COMPLETED',
          title: 'Completed action',
          description: 'Completed rows are preserved',
          category: 'PROFILE',
          priority: 'LOW',
          reason: 'Completed reason',
          completed: true,
        },
      ],
    });
  });

  test.afterAll(async () => {
    try {
      if (userId) await prisma.user.deleteMany({ where: { id: userId } });
    } finally {
      await prisma.$disconnect();
    }
  });

  test('rolls back stale deletion and upserts after a later foreign-key failure, then commits successfully', async () => {
    const findSnapshot = () => prisma.careerAction.findMany({
      where: { studentProfileId },
      select: { source: true, title: true, description: true, reason: true, completed: true },
      orderBy: { source: 'asc' },
    });
    const initialRows = await findSnapshot();
    const operations = buildCareerActionTransaction(prisma.careerAction, studentProfileId, regeneratedDrafts);
    const injectedFailure = prisma.careerAction.create({
      data: {
        studentProfileId: 'missing-profile-for-rollback-test',
        source: 'INJECTED_FAILURE',
        title: 'This insert must fail',
        description: 'Foreign-key failure after regeneration writes',
        category: 'TEST',
        priority: 'LOW',
        reason: 'Rollback verification',
      },
    });

    await expect(prisma.$transaction([...operations.slice(0, -1), injectedFailure])).rejects.toBeTruthy();
    expect(await findSnapshot()).toEqual(initialRows);

    const committed = await prisma.$transaction(operations);
    const returnedRows = committed[committed.length - 1] as Awaited<ReturnType<typeof findSnapshot>>;
    expect(returnedRows.map((row) => row.source).sort()).toEqual(['COMPLETED', 'KEEP', 'NEW']);
    expect(returnedRows.find((row) => row.source === 'KEEP')?.title).toBe('Updated action');
    expect(returnedRows.find((row) => row.source === 'NEW')?.title).toBe('New action');
  });
});
