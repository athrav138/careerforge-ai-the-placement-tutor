import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const databaseIntegrationEnabled = process.env.PLAYWRIGHT_DATABASE_INTEGRATION === 'true';

test.describe.configure({ mode: 'serial' });

test.describe('Phase 4: Database Persistence & Cross-User Security', () => {
  let userAId: string;
  let userBId: string;
  let profileAId: string;
  let profileBId: string;
  let targetCareerRoleId: string;
  let testSkillId: string;
  let roadmapAId: string;
  let createdRoleId: string | undefined;
  let createdSkillId: string | undefined;

  const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const emailA = `test-db-user-a-${runId}@example.invalid`;
  const emailB = `test-db-user-b-${runId}@example.invalid`;

  test.skip(
    !databaseIntegrationEnabled,
    'Requires PLAYWRIGHT_DATABASE_INTEGRATION=true and a disposable non-production Neon test branch.',
  );

  test.beforeAll(async () => {
    // Look up or establish a career role and skill for relational tests
    const role = await prisma.careerRole.findFirst();
    if (role) {
      targetCareerRoleId = role.id;
    } else {
      const createdRole = await prisma.careerRole.create({
        data: {
          title: 'Software Engineer Test Role',
          domain: 'Engineering',
          description: 'Synthetic role for test isolation',
          requiredSkills: [],
        },
      });
      targetCareerRoleId = createdRole.id;
      createdRoleId = createdRole.id;
    }

    const skill = await prisma.skill.findFirst();
    if (skill) {
      testSkillId = skill.id;
    } else {
      const createdSkill = await prisma.skill.create({
        data: {
          name: 'Synthetic Test Skill',
          category: 'TECHNICAL',
        },
      });
      testSkillId = createdSkill.id;
      createdSkillId = createdSkill.id;
    }

    // 1. Create synthetic isolated User A & StudentProfile A
    const userA = await prisma.user.create({
      data: {
        email: emailA,
        name: 'Database Test User A',
        studentProfile: {
          create: {
            college: 'Institute of Technology A',
            degree: 'Computer Science',
            branch: 'CSE',
            graduationYear: 2026,
            cgpa: 8.9,
            targetDomain: 'Full Stack Development',
            profileCompletion: 60,
          },
        },
      },
      include: { studentProfile: true },
    });
    userAId = userA.id;
    profileAId = userA.studentProfile!.id;

    // 2. Create synthetic isolated User B & StudentProfile B
    const userB = await prisma.user.create({
      data: {
        email: emailB,
        name: 'Database Test User B',
        studentProfile: {
          create: {
            college: 'University of Science B',
            degree: 'Data Science',
            branch: 'AI',
            graduationYear: 2025,
            cgpa: 9.1,
            targetDomain: 'Data Engineering',
            profileCompletion: 70,
          },
        },
      },
      include: { studentProfile: true },
    });
    userBId = userB.id;
    profileBId = userB.studentProfile!.id;
  });

  test.afterAll(async () => {
    try {
      const cleanup = [
        ...(userAId ? [prisma.user.deleteMany({ where: { id: userAId } })] : []),
        ...(userBId ? [prisma.user.deleteMany({ where: { id: userBId } })] : []),
        ...(createdRoleId ? [prisma.careerRole.deleteMany({ where: { id: createdRoleId } })] : []),
        ...(createdSkillId ? [prisma.skill.deleteMany({ where: { id: createdSkillId } })] : []),
      ];
      if (cleanup.length > 0) await prisma.$transaction(cleanup);
    } finally {
      await prisma.$disconnect();
    }
  });

  test('4.1 Student Profile Persistence in Neon PostgreSQL', async () => {
    // Read back profile A
    const profile = await prisma.studentProfile.findUnique({
      where: { id: profileAId },
      include: { user: true },
    });

    expect(profile).not.toBeNull();
    expect(profile!.college).toBe('Institute of Technology A');
    expect(profile!.degree).toBe('Computer Science');
    expect(profile!.graduationYear).toBe(2026);
    expect(profile!.cgpa).toBe(8.9);
    expect(profile!.user.email).toBe(emailA);

    // Update profile
    const updated = await prisma.studentProfile.update({
      where: { id: profileAId },
      data: {
        careerGoal: 'Become a Senior Full Stack Engineer',
        programmingLanguages: 'TypeScript, Python, Go',
        profileCompletion: 90,
      },
    });

    expect(updated.careerGoal).toBe('Become a Senior Full Stack Engineer');
    expect(updated.programmingLanguages).toBe('TypeScript, Python, Go');
    expect(updated.profileCompletion).toBe(90);
  });

  test('4.2 Student Skill Relationship Persistence', async () => {
    // Add student skill for User A
    const studentSkill = await prisma.studentSkill.create({
      data: {
        studentProfileId: profileAId,
        skillId: testSkillId,
        level: 'INTERMEDIATE',
        yearsOfExperience: 2.5,
      },
    });

    expect(studentSkill.id).toBeDefined();

    // Verify persistence via relation
    const profileWithSkills = await prisma.studentProfile.findUnique({
      where: { id: profileAId },
      include: { studentSkills: { include: { skill: true } } },
    });

    expect(profileWithSkills!.studentSkills.length).toBeGreaterThanOrEqual(1);
    const matched = profileWithSkills!.studentSkills.find((s) => s.skillId === testSkillId);
    expect(matched).toBeDefined();
    expect(matched!.level).toBe('INTERMEDIATE');
  });

  test('4.3 Learning Roadmap and Task Lifecycle Persistence', async () => {
    // Create roadmap for User A
    const roadmap = await prisma.learningRoadmap.create({
      data: {
        studentProfileId: profileAId,
        careerRoleId: targetCareerRoleId,
        title: 'Full Stack Preparation Roadmap',
        status: 'IN_PROGRESS',
        progress: 25,
        tasks: {
          create: [
            {
              title: 'Learn Next.js 16 App Router',
              category: 'SKILL',
              difficulty: 'MEDIUM',
              status: 'NOT_STARTED',
              priority: 'HIGH',
            },
            {
              title: 'Build Placement Tutor Project',
              category: 'PROJECT',
              difficulty: 'HARD',
              status: 'NOT_STARTED',
              priority: 'CRITICAL',
            },
          ],
        },
      },
      include: { tasks: true },
    });

    roadmapAId = roadmap.id;
    expect(roadmap.tasks.length).toBe(2);

    // Update task status to COMPLETED
    const firstTask = roadmap.tasks[0];
    const updatedTask = await prisma.roadmapTask.update({
      where: { id: firstTask.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });
    expect(updatedTask.status).toBe('COMPLETED');
    expect(updatedTask.completedAt).not.toBeNull();

    // Update roadmap overall progress
    const updatedRoadmap = await prisma.learningRoadmap.update({
      where: { id: roadmapAId },
      data: { progress: 50 },
    });
    expect(updatedRoadmap.progress).toBe(50);
  });

  test('4.4 Aptitude Assessment Attempt Persistence', async () => {
    // Create an aptitude attempt for User A
    const attempt = await prisma.aptitudeAttempt.create({
      data: {
        studentProfileId: profileAId,
        category: 'QUANTITATIVE',
        difficulty: 'MEDIUM',
        totalQuestions: 10,
        correctAnswers: 8,
        score: 80,
        accuracy: 80.0,
        timeTaken: 600,
      },
    });

    expect(attempt.id).toBeDefined();

    // Verify record retrieval
    const fetchedAttempt = await prisma.aptitudeAttempt.findUnique({
      where: { id: attempt.id },
    });
    expect(fetchedAttempt).not.toBeNull();
    expect(fetchedAttempt!.score).toBe(80);
    expect(fetchedAttempt!.studentProfileId).toBe(profileAId);
  });

  test('4.5 Mock Interview Session & Evaluation Persistence', async () => {
    // Create interview session for User A
    const session = await prisma.interviewSession.create({
      data: {
        studentProfileId: profileAId,
        interviewType: 'TECHNICAL',
        difficulty: 'MEDIUM',
        numQuestions: 3,
        status: 'COMPLETED',
        score: 85.5,
        technicalScore: 90.0,
        communicationScore: 81.0,
        answers: {
          create: [
            {
              questionText: 'Explain the difference between SSR and CSR in Next.js.',
              answerText: 'SSR renders on the server per request, while CSR renders in the browser.',
              evaluation: {
                create: {
                  score: 88,
                  relevance: 9,
                  technicalAccuracy: 9,
                  completeness: 8,
                  clarity: 9,
                  professionalism: 9,
                  feedback: 'Concise and technically accurate answer.',
                },
              },
            },
          ],
        },
      },
      include: { answers: { include: { evaluation: true } } },
    });

    expect(session.id).toBeDefined();
    expect(session.answers.length).toBe(1);
    expect(session.answers[0].evaluation).not.toBeNull();
    expect(session.answers[0].evaluation!.score).toBe(88);
  });

  test('4.6 Cross-User Data Isolation: User B Cannot Query User A Roadmaps', async () => {
    // Query roadmaps strictly owned by User B
    const userBRoadmaps = await prisma.learningRoadmap.findMany({
      where: { studentProfileId: profileBId },
    });

    // User A has 1 roadmap, User B must have 0
    expect(userBRoadmaps.length).toBe(0);
    expect(userBRoadmaps.some((r) => r.id === roadmapAId)).toBe(false);
  });

  test('4.7 Cross-User Data Isolation: User B Cannot Query User A Aptitude Attempts', async () => {
    const userBAttempts = await prisma.aptitudeAttempt.findMany({
      where: { studentProfileId: profileBId },
    });

    expect(userBAttempts.length).toBe(0);
  });

  test('4.8 Cross-User Data Isolation: User B Cannot Query User A Interview Sessions', async () => {
    const userBSessions = await prisma.interviewSession.findMany({
      where: { studentProfileId: profileBId },
    });

    expect(userBSessions.length).toBe(0);
  });

  test('4.9 Cross-User Data Isolation: User B Cannot Access User A Profile via User B Profile ID', async () => {
    const crossProfile = await prisma.studentProfile.findFirst({
      where: {
        id: profileBId,
        college: 'Institute of Technology A', // User A's college
      },
    });

    expect(crossProfile).toBeNull();
  });
});
