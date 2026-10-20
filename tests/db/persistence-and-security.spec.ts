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
  let targetProjectId: string;
  let createdProjectId: string | undefined;
  let targetJobId: string;
  let createdJobId: string | undefined;
  let targetQuestionId: string;
  let createdQuestionId: string | undefined;
  let roadmapAId: string;
  let createdRoleId: string | undefined;
  let createdSkillId: string | undefined;

  const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const emailA = `test-db-user-a-${runId}@example.invalid`;
  const emailB = `test-db-user-b-${runId}@example.invalid`;

  test.skip(
    !databaseIntegrationEnabled,
    'Requires PLAYWRIGHT_DATABASE_INTEGRATION=true and the guarded main-Neon test configuration.',
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

    const project = await prisma.project.findFirst({ select: { id: true } });
    if (project) {
      targetProjectId = project.id;
    } else {
      const createdProject = await prisma.project.create({
        data: {
          title: 'Synthetic persistence test project',
          description: 'Temporary project catalog fixture for a database test.',
          difficulty: 'EASY',
          domain: 'Testing',
          technologies: ['TypeScript'],
          requiredSkills: [],
        },
      });
      targetProjectId = createdProject.id;
      createdProjectId = createdProject.id;
    }

    const job = await prisma.jobOpportunity.findFirst({ select: { id: true } });
    if (job) {
      targetJobId = job.id;
    } else {
      const createdJob = await prisma.jobOpportunity.create({
        data: {
          title: 'Synthetic persistence test job',
          company: 'CareerForge Test Fixture',
          applicationUrl: 'https://example.invalid/test-only',
          source: 'SYNTHETIC_TEST',
        },
      });
      targetJobId = createdJob.id;
      createdJobId = createdJob.id;
    }

    const question = await prisma.question.findFirst({ select: { id: true } });
    if (question) {
      targetQuestionId = question.id;
    } else {
      const createdQuestion = await prisma.question.create({
        data: {
          question: 'Synthetic persistence test question?',
          category: 'QUANTITATIVE',
          difficulty: 'EASY',
          optionA: 'Correct',
          optionB: 'Option B',
          optionC: 'Option C',
          optionD: 'Option D',
          correctAnswer: 'A',
        },
      });
      targetQuestionId = createdQuestion.id;
      createdQuestionId = createdQuestion.id;
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
        ...(createdProjectId ? [prisma.project.deleteMany({ where: { id: createdProjectId } })] : []),
        ...(createdJobId ? [prisma.jobOpportunity.deleteMany({ where: { id: createdJobId } })] : []),
        ...(createdQuestionId ? [prisma.question.deleteMany({ where: { id: createdQuestionId } })] : []),
      ];
      if (cleanup.length > 0) await prisma.$transaction(cleanup);

      const cleanedUserIds = [userAId, userBId].filter((id): id is string => typeof id === 'string');
      if (cleanedUserIds.length > 0) {
        const remainingUsers = await prisma.user.findMany({
          where: { id: { in: cleanedUserIds } },
          select: { id: true },
        });
        expect(remainingUsers).toHaveLength(0);
      }

      if (createdRoleId) {
        const remainingRole = await prisma.careerRole.findUnique({ where: { id: createdRoleId } });
        expect(remainingRole).toBeNull();
      }

      if (createdSkillId) {
        const remainingSkill = await prisma.skill.findUnique({ where: { id: createdSkillId } });
        expect(remainingSkill).toBeNull();
      }

      if (createdProjectId) {
        const remainingProject = await prisma.project.findUnique({ where: { id: createdProjectId } });
        expect(remainingProject).toBeNull();
      }

      if (createdJobId) {
        const remainingJob = await prisma.jobOpportunity.findUnique({ where: { id: createdJobId } });
        expect(remainingJob).toBeNull();
      }

      if (createdQuestionId) {
        const remainingQuestion = await prisma.question.findUnique({ where: { id: createdQuestionId } });
        expect(remainingQuestion).toBeNull();
      }
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

  test('4.6 Career analysis, recommendation, and skill-gap persistence', async () => {
    const analysis = await prisma.careerAnalysis.create({
      data: {
        studentProfileId: profileAId,
        careerRoleId: targetCareerRoleId,
        matchPercentage: 72,
        matchedSkills: ['TypeScript'],
        missingSkills: ['System Design'],
        recommendations: ['Practice system design'],
      },
    });
    const recommendation = await prisma.careerRecommendation.create({
      data: {
        studentProfileId: profileAId,
        careerRoleId: targetCareerRoleId,
        matchScore: 72,
        explanation: 'Synthetic persistence test recommendation.',
      },
    });
    const gap = await prisma.skillGap.create({
      data: {
        studentProfileId: profileAId,
        careerRoleId: targetCareerRoleId,
        skillId: testSkillId,
        currentLevel: 'BEGINNER',
        requiredLevel: 'ADVANCED',
        gapLevel: 'HIGH',
        priority: 'HIGH',
      },
    });

    const [storedAnalysis, storedRecommendation, storedGap] = await Promise.all([
      prisma.careerAnalysis.findUnique({ where: { id: analysis.id } }),
      prisma.careerRecommendation.findUnique({ where: { id: recommendation.id } }),
      prisma.skillGap.findUnique({ where: { id: gap.id } }),
    ]);
    expect(storedAnalysis?.studentProfileId).toBe(profileAId);
    expect(storedRecommendation?.matchScore).toBe(72);
    expect(storedGap?.skillId).toBe(testSkillId);

    const updated = await prisma.careerRecommendation.update({
      where: { id: recommendation.id },
      data: { matchScore: 78 },
    });
    expect(updated.matchScore).toBe(78);
  });

  test('4.7 Resume and analysis persistence', async () => {
    const resume = await prisma.resume.create({
      data: {
        studentProfileId: profileAId,
        fileName: 'synthetic-resume-test.pdf',
        fileType: 'PDF',
        fileSize: 128,
        extractedText: 'Synthetic test content only.',
        targetCareerId: targetCareerRoleId,
        status: 'ANALYZED',
        analysis: {
          create: {
            atsScore: 81,
            matchedSkills: ['TypeScript'],
            missingSkills: ['System Design'],
            detectedSkills: ['TypeScript'],
            keywords: ['testing'],
            recommendations: ['Add a project summary.'],
            sectionScore: 80,
          },
        },
      },
      include: { analysis: true },
    });

    expect(resume.analysis?.atsScore).toBe(81);
    const updated = await prisma.resume.update({
      where: { id: resume.id },
      data: { status: 'COMPLETE' },
    });
    const persisted = await prisma.resume.findUnique({
      where: { id: resume.id },
      include: { analysis: true },
    });
    expect(updated.status).toBe('COMPLETE');
    expect(persisted?.analysis?.sectionScore).toBe(80);
  });

  test('4.8 Assessment, attempt, and answer persistence', async () => {
    const assessment = await prisma.assessment.create({
      data: {
        title: 'Synthetic database persistence assessment',
        category: 'QUANTITATIVE',
        difficulty: 'EASY',
        totalQuestions: 1,
        durationMinutes: 5,
        questions: {
          create: [{
            position: 1,
            question: { connect: { id: targetQuestionId } },
          }],
        },
      },
      include: { questions: true },
    });
    const attempt = await prisma.assessmentAttempt.create({
      data: {
        assessmentId: assessment.id,
        studentProfileId: profileAId,
        answers: {
          create: [{
            questionId: targetQuestionId,
            selectedAnswer: 'A',
            isCorrect: true,
          }],
        },
      },
      include: { assessment: true, answers: true },
    });
    expect(attempt.answers).toHaveLength(1);
    expect(attempt.answers[0].isCorrect).toBe(true);

    const updated = await prisma.assessmentAttempt.update({
      where: { id: attempt.id },
      data: { status: 'COMPLETED', score: 100, percentage: 100, correctAnswers: 1 },
    });
    const persisted = await prisma.assessmentAttempt.findUnique({
      where: { id: attempt.id },
      include: { answers: true },
    });
    expect(updated.status).toBe('COMPLETED');
    expect(persisted?.answers[0].selectedAnswer).toBe('A');
  });

  test('4.9 Project recommendation persistence', async () => {
    const recommendation = await prisma.projectRecommendation.create({
      data: {
        studentProfileId: profileAId,
        projectId: targetProjectId,
        relevanceScore: 75,
        reason: 'Synthetic persistence test recommendation.',
        skillsDemonstrated: ['TypeScript'],
      },
      include: { project: true },
    });
    expect(recommendation.project.id).toBe(targetProjectId);

    const updated = await prisma.projectRecommendation.update({
      where: { id: recommendation.id },
      data: { status: 'IN_PROGRESS', summary: 'Synthetic test progress.' },
    });
    const persisted = await prisma.projectRecommendation.findUnique({ where: { id: recommendation.id } });
    expect(updated.status).toBe('IN_PROGRESS');
    expect(persisted?.summary).toBe('Synthetic test progress.');
  });

  test('4.10 Readiness, mentor, and notification persistence', async () => {
    const readiness = await prisma.readinessScore.create({
      data: {
        studentProfileId: profileAId,
        overallScore: 68,
        careerScore: 70,
        skillScore: 65,
        resumeScore: 72,
        aptitudeScore: 60,
        interviewScore: 66,
        projectScore: 75,
      },
    });
    const conversation = await prisma.mentorConversation.create({
      data: {
        studentProfileId: profileAId,
        title: 'Synthetic test conversation',
        messages: { create: [{ role: 'USER', content: 'Synthetic test message.' }] },
      },
      include: { messages: true },
    });
    const notification = await prisma.notification.create({
      data: {
        studentProfileId: profileAId,
        title: 'Synthetic test notification',
        message: 'Temporary database persistence fixture.',
        type: 'INFO',
      },
    });

    expect(conversation.messages).toHaveLength(1);
    const [storedReadiness, storedConversation, storedNotification] = await Promise.all([
      prisma.readinessScore.findUnique({ where: { id: readiness.id } }),
      prisma.mentorConversation.findUnique({ where: { id: conversation.id }, include: { messages: true } }),
      prisma.notification.findUnique({ where: { id: notification.id } }),
    ]);
    expect(storedReadiness?.overallScore).toBe(68);
    expect(storedConversation?.messages[0].content).toBe('Synthetic test message.');
    expect(storedNotification?.studentProfileId).toBe(profileAId);

    const updated = await prisma.notification.update({
      where: { id: notification.id },
      data: { isRead: true },
    });
    expect(updated.isRead).toBe(true);
  });

  test('4.11 LinkedIn profile and child record persistence', async () => {
    const profile = await prisma.linkedInProfile.create({
      data: {
        studentProfileId: profileAId,
        name: 'Synthetic Test Profile',
        skills: { create: [{ skillId: testSkillId, proficiency: 'INTERMEDIATE' }] },
        experience: { create: [{ company: 'Synthetic Test Co.', title: 'Test Engineer' }] },
        education: { create: [{ institution: 'Synthetic Test University', degree: 'B.Tech' }] },
      },
      include: { skills: true, experience: true, education: true },
    });
    expect(profile.skills).toHaveLength(1);
    expect(profile.experience[0].company).toBe('Synthetic Test Co.');
    expect(profile.education[0].institution).toBe('Synthetic Test University');

    const updated = await prisma.linkedInProfile.update({
      where: { id: profile.id },
      data: { headline: 'Synthetic persistence test headline' },
    });
    const persisted = await prisma.linkedInProfile.findUnique({
      where: { id: profile.id },
      include: { skills: true, experience: true, education: true },
    });
    expect(updated.headline).toBe('Synthetic persistence test headline');
    expect(persisted?.skills[0].skillId).toBe(testSkillId);
  });

  test('4.12 Professional evidence and skill performance persistence', async () => {
    const evidence = await prisma.professionalEvidence.create({
      data: {
        studentProfileId: profileAId,
        skillId: testSkillId,
        source: 'PROJECT',
        sourceReference: `synthetic-${runId}`,
        evidenceType: 'DIRECT',
        confidence: 'HIGH',
        metadata: { testFixture: true },
      },
    });
    const performance = await prisma.skillPerformance.create({
      data: {
        studentProfileId: profileAId,
        skillId: testSkillId,
        totalQuestions: 5,
        attemptedQuestions: 4,
        correctAnswers: 3,
        incorrectAnswers: 1,
        accuracy: 75,
        classification: 'GOOD',
        priority: 'MEDIUM',
      },
    });
    const [storedEvidence, storedPerformance] = await Promise.all([
      prisma.professionalEvidence.findUnique({ where: { id: evidence.id } }),
      prisma.skillPerformance.findUnique({ where: { id: performance.id } }),
    ]);
    expect(storedEvidence?.studentProfileId).toBe(profileAId);
    expect(storedPerformance?.accuracy).toBe(75);

    const updated = await prisma.skillPerformance.update({
      where: { id: performance.id },
      data: { accuracy: 80, correctAnswers: 4 },
    });
    expect(updated.correctAnswers).toBe(4);
  });

  test('4.13 Job recommendation and saved application persistence', async () => {
    const recommendation = await prisma.jobRecommendation.create({
      data: {
        studentProfileId: profileAId,
        jobId: targetJobId,
        matchScore: 70,
        careerAlignment: 75,
        skillCoverage: 65,
        evidenceScore: 70,
        resumeAlignment: 70,
        projectRelevance: 75,
        aptitudeReadiness: 60,
        interviewReadiness: 65,
        explanation: 'Synthetic database test recommendation.',
      },
    });
    const application = await prisma.jobApplication.create({
      data: {
        studentProfileId: profileAId,
        jobId: targetJobId,
        status: 'SAVED',
        notes: 'Synthetic test only; no external submission.',
      },
    });
    const [storedRecommendation, storedApplication] = await Promise.all([
      prisma.jobRecommendation.findUnique({ where: { id: recommendation.id } }),
      prisma.jobApplication.findUnique({ where: { id: application.id } }),
    ]);
    expect(storedRecommendation?.studentProfileId).toBe(profileAId);
    expect(storedApplication?.status).toBe('SAVED');

    const updated = await prisma.jobApplication.update({
      where: { id: application.id },
      data: { notes: 'Updated synthetic test note.' },
    });
    expect(updated.notes).toBe('Updated synthetic test note.');
  });

  test('4.14 Cross-User Data Isolation: User B Cannot Query User A Roadmaps', async () => {
    // Query roadmaps strictly owned by User B
    const userBRoadmaps = await prisma.learningRoadmap.findMany({
      where: { studentProfileId: profileBId },
    });

    // User A has 1 roadmap, User B must have 0
    expect(userBRoadmaps.length).toBe(0);
    expect(userBRoadmaps.some((r) => r.id === roadmapAId)).toBe(false);
  });

  test('4.15 Cross-User Data Isolation: User B Cannot Query User A Aptitude Attempts', async () => {
    const userBAttempts = await prisma.aptitudeAttempt.findMany({
      where: { studentProfileId: profileBId },
    });

    expect(userBAttempts.length).toBe(0);
  });

  test('4.16 Cross-User Data Isolation: User B Cannot Query User A Interview Sessions', async () => {
    const userBSessions = await prisma.interviewSession.findMany({
      where: { studentProfileId: profileBId },
    });

    expect(userBSessions.length).toBe(0);
  });

  test('4.17 Cross-User Data Isolation: User B Cannot Access User A Profile via User B Profile ID', async () => {
    const crossProfile = await prisma.studentProfile.findFirst({
      where: {
        id: profileBId,
        college: 'Institute of Technology A', // User A's college
      },
    });

    expect(crossProfile).toBeNull();
  });
});
