import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  try {
    const user = await getCurrentUser();
    if (!user || !user.studentProfileId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resumeId = params.id;

    const resume = await prisma.resume.findUnique({
      where: { id: resumeId },
      include: {
        targetCareer: {
          include: {
            skillRelations: true,
          }
        },
      },
    });

    if (!resume) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }

    if (resume.studentProfileId !== user.studentProfileId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!resume.targetCareer) {
      return NextResponse.json({ error: "No target career found to analyze against" }, { status: 400 });
    }

    const text = (resume.extractedText || "").toLowerCase();

    // 1. Skill Matching
    const requiredSkills = resume.targetCareer.skillRelations.map(s => s.name);
    
    // Also fetch all available skills for keyword detection
    const allSkills = await prisma.skill.findMany();
    
    const matchedSkills: string[] = [];
    const missingSkills: string[] = [];
    const detectedSkills: string[] = [];
    
    // Detect all skills in resume
    for (const skill of allSkills) {
      if (text.includes(skill.name.toLowerCase())) {
        detectedSkills.push(skill.name);
      }
    }

    // Determine match vs missing for required skills
    for (const reqSkill of requiredSkills) {
      if (detectedSkills.includes(reqSkill)) {
        matchedSkills.push(reqSkill);
      } else {
        missingSkills.push(reqSkill);
      }
    }

    // 2. Sections Detection
    const sections = [
      { name: "Education", keywords: ["education", "academic", "university", "college", "school"] },
      { name: "Experience", keywords: ["experience", "employment", "work history", "jobs"] },
      { name: "Projects", keywords: ["projects", "personal projects", "academic projects"] },
      { name: "Skills", keywords: ["skills", "technologies", "core competencies", "technical skills"] },
      { name: "Summary", keywords: ["summary", "objective", "profile", "about me"] },
    ];

    let detectedSectionsCount = 0;
    const recommendations: string[] = [];

    for (const section of sections) {
      const found = section.keywords.some(kw => text.includes(kw));
      if (found) {
        detectedSectionsCount++;
      } else {
        recommendations.push(`Consider adding an explicit "${section.name}" section to your resume.`);
      }
    }

    const sectionScore = Math.round((detectedSectionsCount / sections.length) * 100);

    // 3. Keyword Match (just treating skills as keywords for this phase)
    const keywords = detectedSkills;
    
    if (missingSkills.length > 0) {
      recommendations.push(`Add the following critical skills if you possess them: ${missingSkills.slice(0, 3).join(', ')}.`);
    }

    // 4. Calculate ATS Score
    const skillScore = requiredSkills.length > 0 ? Math.round((matchedSkills.length / requiredSkills.length) * 100) : 100;
    
    // Weighted ATS Score (e.g., Skills 60%, Sections 40%)
    const atsScore = Math.round((skillScore * 0.6) + (sectionScore * 0.4));

    // Save Analysis
    const analysis = await prisma.resumeAnalysis.upsert({
      where: { resumeId: resume.id },
      create: {
        resumeId: resume.id,
        atsScore,
        matchedSkills,
        missingSkills,
        detectedSkills,
        keywords,
        recommendations,
        sectionScore,
      },
      update: {
        atsScore,
        matchedSkills,
        missingSkills,
        detectedSkills,
        keywords,
        recommendations,
        sectionScore,
      }
    });

    await prisma.resume.update({
      where: { id: resume.id },
      data: { status: "ANALYZED" }
    });

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error("Resume analyze error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
