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
      select: {
        id: true,
        profileUrl: true,
        name: true,
        headline: true,
        about: true,
        location: true,
        lastSyncedAt: true,
        createdAt: true,
        skills: {
          select: {
            id: true,
            proficiency: true,
            endorsements: true,
            skill: {
              select: {
                id: true,
                name: true,
                category: true,
              },
            },
          },
          orderBy: {
            endorsements: "desc",
          },
        },
        experience: {
          select: {
            id: true,
            company: true,
            title: true,
            description: true,
            location: true,
            startDate: true,
            endDate: true,
            isCurrent: true,
          },
          orderBy: [
            { isCurrent: "desc" },
            { startDate: "desc" },
          ],
        },
        education: {
          select: {
            id: true,
            institution: true,
            degree: true,
            field: true,
            startDate: true,
            endDate: true,
          },
          orderBy: {
            startDate: "desc",
          },
        },
      },
    });

    if (!profile) {
      return NextResponse.json({ error: "LinkedIn profile not found" }, { status: 404 });
    }

    // Calculate summary metrics
    const summary = {
      totalSkills: profile.skills.length,
      totalExperience: profile.experience.length,
      totalEducation: profile.education.length,
      currentRoles: profile.experience.filter(e => e.isCurrent).length,
      endorsedSkills: profile.skills.filter(s => s.endorsements > 0).length,
    };

    return NextResponse.json({
      profile: {
        id: profile.id,
        profileUrl: profile.profileUrl,
        name: profile.name,
        headline: profile.headline,
        about: profile.about,
        location: profile.location,
        lastSyncedAt: profile.lastSyncedAt,
        importedAt: profile.createdAt,
      },
      summary,
      skills: profile.skills,
      experience: profile.experience,
      education: profile.education,
    });
  } catch (error) {
    console.error("LinkedIn profile error:", error);
    return NextResponse.json(
      { error: "Failed to fetch LinkedIn profile" },
      { status: 500 }
    );
  }
}
