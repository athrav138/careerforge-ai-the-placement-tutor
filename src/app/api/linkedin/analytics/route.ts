import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !user.studentProfileId) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const profile = await prisma.linkedInProfile.findUnique({
      where: { studentProfileId: user.studentProfileId },
      include: {
        skills: {
          include: {
            skill: true,
          },
        },
        experience: true,
        education: true,
      },
    });

    if (!profile) {
      return NextResponse.json({ error: "LinkedIn profile not found" }, { status: 404 });
    }

    // Profile Completeness
    const profileCompleteness = {
      hasName: !!profile.name && profile.name.trim().length > 0,
      hasHeadline: !!profile.headline && profile.headline.trim().length > 0,
      hasAbout: !!profile.about && profile.about.trim().length > 50,
      hasLocation: !!profile.location && profile.location.trim().length > 0,
      hasSkills: profile.skills.length > 0,
      hasExperience: profile.experience.length > 0,
      hasEducation: profile.education.length > 0,
    };

    const completenessKeys = Object.keys(profileCompleteness);
    const profileCompletenessScore = completenessKeys.length > 0
      ? (Object.values(profileCompleteness).reduce((sum, val) => sum + (val ? 1 : 0), 0) / completenessKeys.length) * 100
      : 0;
    const safeCompletenessScore = isNaN(profileCompletenessScore) ? 0 : Math.min(100, Math.max(0, Math.round(profileCompletenessScore)));

    // Skills Analysis
    const skillBreakdown = profile.skills.reduce((acc, skill) => {
      if (!skill.skill) return acc;
      const category = skill.skill.category || "PROFESSIONAL";
      if (!acc[category]) acc[category] = [];
      acc[category].push({
        name: skill.skill.name || "Skill",
        proficiency: skill.proficiency,
        endorsements: skill.endorsements || 0,
      });
      return acc;
    }, {} as Record<string, Array<{ name: string; proficiency: string | null; endorsements: number }>>);

    const rawSkillsScore = profile.skills.length > 0
      ? Math.min(100, profile.skills.length * 10)
      : 0;
    const safeSkillsScore = isNaN(rawSkillsScore) ? 0 : Math.round(rawSkillsScore);

    // Experience Analysis
    const experienceAnalysis = {
      totalRoles: profile.experience.length,
      currentRoles: profile.experience.filter(e => e.isCurrent).length,
      hasDescriptions: profile.experience.filter(e => e.description && e.description.trim().length > 20).length,
      averageRoleLength: profile.experience.length > 0
        ? profile.experience.reduce((sum, e) => {
            const start = e.startDate ? new Date(e.startDate).getTime() : NaN;
            let end = e.endDate ? new Date(e.endDate).getTime() : NaN;
            if (e.isCurrent && isNaN(end)) {
              end = Date.now();
            }
            if (!isNaN(start) && !isNaN(end) && end >= start) {
              return sum + ((end - start) / (365.25 * 24 * 60 * 60 * 1000));
            }
            return sum;
          }, 0) / profile.experience.length
        : 0,
    };

    const safeAvgRoleLength = isNaN(experienceAnalysis.averageRoleLength) ? 0 : experienceAnalysis.averageRoleLength;

    const rawExperienceScore = profile.experience.length > 0
      ? (experienceAnalysis.currentRoles * 30 +
         (experienceAnalysis.hasDescriptions / profile.experience.length) * 40 +
         Math.min(30, safeAvgRoleLength * 10))
      : 0;
    const safeExperienceScore = isNaN(rawExperienceScore) ? 0 : Math.min(100, Math.max(0, Math.round(rawExperienceScore)));

    // Education Analysis
    const educationAnalysis = {
      totalInstitutions: profile.education.length,
      hasDegrees: profile.education.filter(e => e.degree && e.degree.trim().length > 0).length,
      hasFields: profile.education.filter(e => e.field && e.field.trim().length > 0).length,
    };

    const rawEducationScore = profile.education.length > 0
      ? ((educationAnalysis.hasDegrees / profile.education.length) * 50 +
         (educationAnalysis.hasFields / profile.education.length) * 50)
      : 0;
    const safeEducationScore = isNaN(rawEducationScore) ? 0 : Math.min(100, Math.max(0, Math.round(rawEducationScore)));

    // Career Alignment
    let requiredSkills: string[] = [];
    try {
      const studentProfile = await prisma.studentProfile.findUnique({
        where: { id: user.studentProfileId },
        include: {
          targetCareer: {
            include: {
              skillRelations: true,
            },
          },
        },
      });
      requiredSkills = studentProfile?.targetCareer?.skillRelations.map(s => s.name.toLowerCase()) || [];
    } catch {
      requiredSkills = [];
    }

    const linkedinSkillNames = profile.skills.map(s => s.skill?.name?.toLowerCase()).filter(Boolean) as string[];
    const matchedCount = profile.skills.filter(s => s.skill?.name && requiredSkills.includes(s.skill.name.toLowerCase())).length;

    const careerAlignment = {
      relevantSkills: profile.skills.filter(s => s.skill?.name && requiredSkills.includes(s.skill.name.toLowerCase())),
      missingSkills: requiredSkills.filter(skill => !linkedinSkillNames.includes(skill)),
      alignmentPercentage: requiredSkills.length > 0
        ? (matchedCount / requiredSkills.length) * 100
        : 0,
    };

    const safeCareerAlignmentScore = isNaN(careerAlignment.alignmentPercentage) ? 0 : Math.min(100, Math.max(0, Math.round(careerAlignment.alignmentPercentage)));

    // Evidence Coverage
    const evidenceCoverage = {
      totalSkills: profile.skills.length,
      endorsedSkills: profile.skills.filter(s => s.endorsements > 0).length,
      highlyEndorsedSkills: profile.skills.filter(s => s.endorsements >= 5).length,
      skillsWithProficiency: profile.skills.filter(s => !!s.proficiency).length,
    };

    const rawEvidenceCoverageScore = profile.skills.length > 0
      ? ((evidenceCoverage.endorsedSkills / profile.skills.length) * 50 +
         (evidenceCoverage.skillsWithProficiency / profile.skills.length) * 50)
      : 0;
    const safeEvidenceCoverageScore = isNaN(rawEvidenceCoverageScore) ? 0 : Math.min(100, Math.max(0, Math.round(rawEvidenceCoverageScore)));

    const analytics = {
      profileCompleteness: {
        score: safeCompletenessScore,
        details: profileCompleteness,
      },
      skills: {
        score: safeSkillsScore,
        details: skillBreakdown,
        totalSkills: profile.skills.length,
      },
      experience: {
        score: safeExperienceScore,
        details: experienceAnalysis,
      },
      education: {
        score: safeEducationScore,
        details: educationAnalysis,
      },
      careerAlignment: {
        score: safeCareerAlignmentScore,
        details: careerAlignment,
      },
      evidenceCoverage: {
        score: safeEvidenceCoverageScore,
        details: evidenceCoverage,
      },
    };

    // Overall LinkedIn Score
    const rawOverallScore = Math.round(
      (analytics.profileCompleteness.score * 0.15 +
       analytics.skills.score * 0.25 +
       analytics.experience.score * 0.25 +
       analytics.education.score * 0.15 +
       analytics.careerAlignment.score * 0.10 +
       analytics.evidenceCoverage.score * 0.10)
    );
    const overallScore = isNaN(rawOverallScore) ? 0 : Math.min(100, Math.max(0, rawOverallScore));

    return NextResponse.json({
      overallScore,
      analytics,
      lastAnalyzedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("LinkedIn analytics error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to calculate LinkedIn analytics" },
      { status: 500 }
    );
  }
}
