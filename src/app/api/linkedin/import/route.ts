import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    // 1. Authentication Check
    const user = await getCurrentUser();
    if (!user || !user.studentProfileId) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    // 2. Input Parsing & Validation (BEFORE Transaction)
    const body = await request.json();
    const { profileUrl, name, headline, about, location, skills, experience, education } = body;

    if (!profileUrl || typeof profileUrl !== "string" || profileUrl.trim() === "") {
      return NextResponse.json({ error: "Profile URL is required." }, { status: 400 });
    }

    const cleanProfileUrl = profileUrl.trim();
    const cleanName = name?.trim() || null;
    const cleanHeadline = headline?.trim() || null;
    const cleanAbout = about?.trim() || null;
    const cleanLocation = location?.trim() || null;

    // Helper function for safe date parsing
    const parseSafeDate = (val: any): Date | null => {
      if (!val) return null;
      if (typeof val !== "string" && !(val instanceof Date)) return null;
      if (typeof val === "string" && val.trim() === "") return null;
      const d = new Date(val);
      return isNaN(d.getTime()) ? null : d;
    };

    // 3. Data Preparation & Pre-processing (BEFORE Transaction)
    
    // Process & deduplicate skills
    const uniqueSkillsMap = new Map<string, { name: string; proficiency?: string; endorsements?: number }>();
    if (skills && Array.isArray(skills)) {
      for (const s of skills) {
        if (s && typeof s.name === "string" && s.name.trim().length > 0) {
          const cleanSkillName = s.name.trim().toLowerCase();
          if (!uniqueSkillsMap.has(cleanSkillName)) {
            uniqueSkillsMap.set(cleanSkillName, {
              name: cleanSkillName,
              proficiency: s.proficiency || undefined,
              endorsements: typeof s.endorsements === "number" && !isNaN(s.endorsements) ? s.endorsements : 0,
            });
          }
        }
      }
    }

    // Pre-upsert Skill entries outside transaction to avoid holding transaction open
    const skillDataList = Array.from(uniqueSkillsMap.values());
    const skillsWithIds = await Promise.all(
      skillDataList.map(async (sData) => {
        const skill = await prisma.skill.upsert({
          where: { name: sData.name },
          create: { name: sData.name, category: "PROFESSIONAL" },
          update: {},
        });
        return {
          skillId: skill.id,
          proficiency: sData.proficiency || null,
          endorsements: sData.endorsements || 0,
        };
      })
    );

    // Process & sanitize experience items
    const cleanedExperienceList: Array<{
      company: string;
      title: string;
      description: string | null;
      location: string | null;
      startDate: Date | null;
      endDate: Date | null;
      isCurrent: boolean;
    }> = [];

    if (experience && Array.isArray(experience)) {
      for (const exp of experience) {
        if (!exp) continue;
        const company = typeof exp.company === "string" ? exp.company.trim() : "";
        const title = typeof exp.title === "string" ? exp.title.trim() : "";
        
        if (company.length > 0 || title.length > 0) {
          cleanedExperienceList.push({
            company: company || "Not specified",
            title: title || "Not specified",
            description: exp.description?.trim() || null,
            location: exp.location?.trim() || null,
            startDate: parseSafeDate(exp.startDate),
            endDate: exp.isCurrent ? null : parseSafeDate(exp.endDate),
            isCurrent: !!exp.isCurrent,
          });
        }
      }
    }

    // Process & sanitize education items
    const cleanedEducationList: Array<{
      institution: string;
      degree: string | null;
      field: string | null;
      startDate: Date | null;
      endDate: Date | null;
    }> = [];

    if (education && Array.isArray(education)) {
      for (const edu of education) {
        if (!edu) continue;
        const institution = typeof edu.institution === "string" ? edu.institution.trim() : "";
        if (institution.length > 0) {
          cleanedEducationList.push({
            institution,
            degree: edu.degree?.trim() || null,
            field: edu.field?.trim() || null,
            startDate: parseSafeDate(edu.startDate),
            endDate: parseSafeDate(edu.endDate),
          });
        }
      }
    }

    // 4. Atomic Database Writes Transaction (DB Writes ONLY)
    const result = await prisma.$transaction(
      async (tx) => {
        // Upsert LinkedIn profile
        const profile = await tx.linkedInProfile.upsert({
          where: { studentProfileId: user.studentProfileId! },
          create: {
            studentProfileId: user.studentProfileId!,
            profileUrl: cleanProfileUrl,
            name: cleanName,
            headline: cleanHeadline,
            about: cleanAbout,
            location: cleanLocation,
            lastSyncedAt: new Date(),
          },
          update: {
            profileUrl: cleanProfileUrl,
            name: cleanName,
            headline: cleanHeadline,
            about: cleanAbout,
            location: cleanLocation,
            lastSyncedAt: new Date(),
          },
        });

        // Delete existing records
        await tx.linkedInSkill.deleteMany({ where: { profileId: profile.id } });
        await tx.linkedInExperience.deleteMany({ where: { profileId: profile.id } });
        await tx.linkedInEducation.deleteMany({ where: { profileId: profile.id } });

        // Batch insert new skills
        if (skillsWithIds.length > 0) {
          await tx.linkedInSkill.createMany({
            data: skillsWithIds.map((s) => ({
              profileId: profile.id,
              skillId: s.skillId,
              proficiency: s.proficiency,
              endorsements: s.endorsements,
            })),
          });
        }

        // Batch insert new experience
        if (cleanedExperienceList.length > 0) {
          await tx.linkedInExperience.createMany({
            data: cleanedExperienceList.map((exp) => ({
              profileId: profile.id,
              company: exp.company,
              title: exp.title,
              description: exp.description,
              location: exp.location,
              startDate: exp.startDate,
              endDate: exp.endDate,
              isCurrent: exp.isCurrent,
            })),
          });
        }

        // Batch insert new education
        if (cleanedEducationList.length > 0) {
          await tx.linkedInEducation.createMany({
            data: cleanedEducationList.map((edu) => ({
              profileId: profile.id,
              institution: edu.institution,
              degree: edu.degree,
              field: edu.field,
              startDate: edu.startDate,
              endDate: edu.endDate,
            })),
          });
        }

        return {
          profile: {
            id: profile.id,
            name: profile.name,
            headline: profile.headline,
            location: profile.location,
          },
          skillsCreated: skillsWithIds.length,
          experienceCreated: cleanedExperienceList.length,
          educationCreated: cleanedEducationList.length,
        };
      },
      {
        timeout: 15000, // 15 seconds safety timeout
      }
    );

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("LinkedIn import error:", error);
    return NextResponse.json(
      { error: "Failed to import LinkedIn profile" },
      { status: 500 }
    );
  }
}
