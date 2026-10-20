import "server-only";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";
import { calculateReadiness, storeDailyReadinessSnapshot } from "@/lib/readiness";

type MetricKey = keyof typeof READINESS_WEIGHTS;

const READINESS_WEIGHTS = {
  career: 12,
  skills: 18,
  resume: 12,
  aptitude: 12,
  interview: 12,
  learning: 12,
  projects: 8,
  github: 7,
  linkedin: 7,
} as const;

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function startOfDaysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(0, 0, 0, 0);
  return date;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user?.studentProfileId) {
    return new Response(JSON.stringify({ error: "Authentication required." }), { status: 401 });
  }

  try {
    const thirtyDaysAgo = startOfDaysAgo(30);
    const sevenDaysAgo = startOfDaysAgo(7);

    const [
      readiness,
      historicalSnapshots,
      recentActivity,
      activityByDay,
      completedCounts,
    ] = await Promise.all([
      calculateReadiness(user.studentProfileId),
      prisma.readinessScore.findMany({
        where: { studentProfileId: user.studentProfileId },
        orderBy: { createdAt: "asc" },
      }),
      prisma.$queryRaw<Array<{ type: string; title: string; category: string; timestamp: string }>>`
        SELECT 
          'Assessment' as type,
          'Completed assessment' as title,
          'APTITUDE' as category,
          completedAt::text as timestamp
        FROM "AssessmentAttempt"
        WHERE "studentProfileId" = ${user.studentProfileId} 
          AND status = 'COMPLETED'
          AND completedAt >= ${thirtyDaysAgo.toISOString()}
        
        UNION ALL
        
        SELECT 
          'Aptitude' as type,
          'Aptitude test' as title,
          'APTITUDE' as category,
          createdAt::text as timestamp
        FROM "AptitudeAttempt"
        WHERE "studentProfileId" = ${user.studentProfileId}
          AND createdAt >= ${thirtyDaysAgo.toISOString()}
        
        UNION ALL
        
        SELECT 
          'Interview' as type,
          'Mock interview' as title,
          'INTERVIEW' as category,
          completedAt::text as timestamp
        FROM "InterviewSession"
        WHERE "studentProfileId" = ${user.studentProfileId}
          AND status = 'COMPLETED'
          AND completedAt >= ${thirtyDaysAgo.toISOString()}
        
        UNION ALL
        
        SELECT 
          'Roadmap' as type,
          title,
          'ROADMAP' as category,
          completedAt::text as timestamp
        FROM "RoadmapTask"
        WHERE "roadmapId" IN (
          SELECT id FROM "LearningRoadmap" 
          WHERE "studentProfileId" = ${user.studentProfileId}
        )
        AND status = 'COMPLETED'
        AND completedAt >= ${thirtyDaysAgo.toISOString()}
        
        UNION ALL
        
        SELECT 
          'Project' as type,
          title,
          'PROJECT' as category,
          completedAt::text as timestamp
        FROM "ProjectRecommendation"
        WHERE "studentProfileId" = ${user.studentProfileId}
          AND status = 'COMPLETED'
          AND completedAt >= ${thirtyDaysAgo.toISOString()}
        
        UNION ALL
        
        SELECT 
          'Career Analysis' as type,
          'Career analysis' as title,
          'CAREER' as category,
          createdAt::text as timestamp
        FROM "CareerAnalysis"
        WHERE "studentProfileId" = ${user.studentProfileId}
          AND createdAt >= ${thirtyDaysAgo.toISOString()}
        
        UNION ALL
        
        SELECT 
          'Resume' as type,
          'Resume analysis' as title,
          'RESUME' as category,
          createdAt::text as timestamp
        FROM "Resume"
        WHERE "studentProfileId" = ${user.studentProfileId}
          AND status = 'ANALYZED'
          AND createdAt >= ${thirtyDaysAgo.toISOString()}
        
        ORDER BY timestamp DESC
        LIMIT 10
      `,
      prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
        SELECT 
          DATE(completedAt)::date as date,
          COUNT(*) as count
        FROM "AssessmentAttempt"
        WHERE "studentProfileId" = ${user.studentProfileId}
          AND status = 'COMPLETED'
          AND completedAt >= ${sevenDaysAgo.toISOString()}
        GROUP BY DATE(completedAt)::date
        
        UNION ALL
        
        SELECT 
          DATE(createdAt)::date as date,
          COUNT(*) as count
        FROM "AptitudeAttempt"
        WHERE "studentProfileId" = ${user.studentProfileId}
          AND createdAt >= ${sevenDaysAgo.toISOString()}
        GROUP BY DATE(createdAt)::date
        
        UNION ALL
        
        SELECT 
          DATE(completedAt)::date as date,
          COUNT(*) as count
        FROM "InterviewSession"
        WHERE "studentProfileId" = ${user.studentProfileId}
          AND status = 'COMPLETED'
          AND completedAt >= ${sevenDaysAgo.toISOString()}
        GROUP BY DATE(completedAt)::date
        
        UNION ALL
        
        SELECT 
          DATE(completedAt)::date as date,
          COUNT(*) as count
        FROM "RoadmapTask"
        WHERE "roadmapId" IN (
          SELECT id FROM "LearningRoadmap" 
          WHERE "studentProfileId" = ${user.studentProfileId}
        )
        AND status = 'COMPLETED'
        AND completedAt >= ${sevenDaysAgo.toISOString()}
        GROUP BY DATE(completedAt)::date
        
        UNION ALL
        
        SELECT 
          DATE(completedAt)::date as date,
          COUNT(*) as count
        FROM "ProjectRecommendation"
        WHERE "studentProfileId" = ${user.studentProfileId}
          AND status = 'COMPLETED'
          AND completedAt >= ${sevenDaysAgo.toISOString()}
        GROUP BY DATE(completedAt)::date
        
        ORDER BY date ASC
      `,
      Promise.all([
        prisma.assessmentAttempt.count({
          where: { studentProfileId: user.studentProfileId, status: "COMPLETED" },
        }),
        prisma.aptitudeAttempt.count({
          where: { studentProfileId: user.studentProfileId },
        }),
        prisma.interviewSession.count({
          where: { studentProfileId: user.studentProfileId, status: "COMPLETED" },
        }),
        prisma.roadmapTask.count({
          where: {
            roadmap: { studentProfileId: user.studentProfileId },
            status: "COMPLETED",
          },
        }),
        prisma.projectRecommendation.count({
          where: { studentProfileId: user.studentProfileId, status: "COMPLETED" },
        }),
        prisma.careerAction.count({
          where: { studentProfileId: user.studentProfileId, completed: true },
        }),
        prisma.careerAnalysis.count({
          where: { studentProfileId: user.studentProfileId },
        }),
        prisma.resume.count({
          where: { studentProfileId: user.studentProfileId, status: "ANALYZED" },
        }),
      ]).then(([assessments, aptitude, interviews, roadmapTasks, projects, actions, careerAnalyses, resumeAnalyses]) => ({
        assessments,
        aptitude,
        interviews,
        roadmapTasks,
        projects,
        actions,
        careerAnalyses,
        resumeAnalyses,
      })),
    ]);

    // Store today's snapshot if it doesn't exist
    await storeDailyReadinessSnapshot(user.studentProfileId, readiness);

    // Calculate readiness change from historical snapshots
    let readinessChange: number | null = null;
    if (historicalSnapshots.length >= 2) {
      const first = historicalSnapshots[0].overallScore;
      const last = historicalSnapshots[historicalSnapshots.length - 1].overallScore;
      readinessChange = last - first;
    }

    // Calculate active preparation days (days with any activity in last 7 days)
    const activeDaysSet = new Set(
      activityByDay.map((row) => row.date)
    );
    const activeDays = activeDaysSet.size;

    // Group activity by day for the last 7 days
    const activityByDayMap = new Map<string, number>();
    for (const row of activityByDay) {
      activityByDayMap.set(row.date, (activityByDayMap.get(row.date) || 0) + Number(row.count));
    }

    // Fill in missing days
    const last7Days: Array<{ date: string; count: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      last7Days.push({
        date: dateStr,
        count: activityByDayMap.get(dateStr) || 0,
      });
    }

    return new Response(
      JSON.stringify({
        readiness: {
          overallScore: readiness.overallScore,
          metrics: readiness.metrics,
          weakSkillCount: readiness.weakSkillCount,
          computedAt: readiness.computedAt,
        },
        historical: {
          snapshots: historicalSnapshots.map((s) => ({
            date: s.createdAt.toISOString().split('T')[0],
            overallScore: s.overallScore,
          })),
          change: readinessChange,
        },
        activity: {
          totalLast30Days: recentActivity.length,
          activeDaysLast7: activeDays,
          byDayLast7: last7Days,
        },
        completedCounts: {
          assessments: completedCounts.assessments,
          aptitude: completedCounts.aptitude,
          interviews: completedCounts.interviews,
          roadmapTasks: completedCounts.roadmapTasks,
          projects: completedCounts.projects,
          actions: completedCounts.actions,
          careerAnalyses: completedCounts.careerAnalyses,
          resumeAnalyses: completedCounts.resumeAnalyses,
        },
        recentActivity: recentActivity,
        generatedAt: new Date().toISOString(),
      }),
      {
        headers: {
          "Cache-Control": "no-store",
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Unable to load analytics:", error);
    return new Response(
      JSON.stringify({ error: "Unable to load analytics data." }),
      { status: 500 }
    );
  }
}
