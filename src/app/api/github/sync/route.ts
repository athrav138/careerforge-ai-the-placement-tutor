import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { GitHubClient, detectTechnologies } from "@/lib/github-client";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.studentProfileId) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const body = await request.json();
    const { accessToken, username } = body;

    if (!accessToken || !username) {
      return NextResponse.json({ error: "Access token and username are required." }, { status: 400 });
    }

    const client = new GitHubClient(accessToken);

    // Fetch GitHub profile
    const profile = await client.getProfile();

    // Fetch repositories
    const repositories = await client.getRepositories();

    // Enrich repositories with languages and README outside transaction
    const enrichedRepos = await Promise.all(
      repositories.map(repo => client.enrichRepository(repo))
    );

    // Detect skills from repositories (in-memory, outside transaction)
    const skillMap = new Map<string, string[]>();
    for (const repo of enrichedRepos) {
      const technologies = detectTechnologies(
        repo.languages || {},
        repo.name,
        repo.topics
      );
      
      for (const tech of technologies) {
        if (!skillMap.has(tech)) {
          skillMap.set(tech, []);
        }
        skillMap.get(tech)!.push(repo.id.toString());
      }
    }

    // Ensure skill records exist in database outside interactive transaction
    const skillEntries = Array.from(skillMap.entries());
    const skillsWithIds = await Promise.all(
      skillEntries.map(async ([techName, repoIds]) => {
        const skill = await prisma.skill.upsert({
          where: { name: techName.toLowerCase() },
          create: { name: techName.toLowerCase(), category: "TECHNICAL" },
          update: {},
        });
        return { skillId: skill.id, repoIds };
      })
    );

    // Store in database using a fast batch transaction
    const result = await prisma.$transaction(
      async (tx) => {
        // Upsert GitHub connection
        const connection = await tx.gitHubConnection.upsert({
          where: { studentProfileId: user.studentProfileId! },
          create: {
            studentProfileId: user.studentProfileId!,
            username: profile.login,
            accessToken, // In production, this should be encrypted
            scope: "public_repo",
            lastSyncedAt: new Date(),
            isActive: true,
          },
          update: {
            username: profile.login,
            accessToken,
            lastSyncedAt: new Date(),
            isActive: true,
          },
        });

        // Delete old repositories
        await tx.gitHubRepository.deleteMany({
          where: { connectionId: connection.id },
        });

        // Prepare repository records
        const repoData = enrichedRepos.map((repo) => ({
          connectionId: connection.id,
          repositoryId: repo.id.toString(),
          name: repo.name,
          fullName: repo.full_name,
          description: repo.description,
          url: repo.html_url,
          primaryLanguage: repo.language,
          languages: repo.languages || {},
          stars: repo.stargazers_count,
          forks: repo.forks_count,
          topics: repo.topics,
          isPublic: repo.visibility === "public",
          hasReadme: (repo.readmeLength ?? 0) > 0,
          readmeLength: repo.readmeLength,
          hasLicense: repo.license?.key !== null,
          createdAt: new Date(repo.created_at),
          updatedAt: new Date(repo.updated_at),
          pushedAt: repo.pushed_at ? new Date(repo.pushed_at) : null,
        }));

        // Create new repositories in batch
        if (repoData.length > 0) {
          await tx.gitHubRepository.createMany({
            data: repoData,
          });
        }

        // Delete old skill evidence
        await tx.gitHubSkillEvidence.deleteMany({
          where: { connectionId: connection.id },
        });

        // Prepare skill evidence records
        const skillEvidenceData = skillsWithIds.map(({ skillId, repoIds }) => {
          const confidence = repoIds.length >= 3 ? "HIGH" : repoIds.length >= 2 ? "MEDIUM" : "LOW";
          return {
            connectionId: connection.id,
            skillId,
            repositoryIds: repoIds,
            confidence,
            evidenceCount: repoIds.length,
          };
        });

        // Create skill evidence in batch
        if (skillEvidenceData.length > 0) {
          await tx.gitHubSkillEvidence.createMany({
            data: skillEvidenceData,
          });
        }

        return {
          connection: {
            id: connection.id,
            username: connection.username,
            lastSyncedAt: connection.lastSyncedAt,
          },
          repositories: repoData.length,
          skills: skillsWithIds.length,
        };
      },
      {
        timeout: 15000,
      }
    );

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("GitHub sync error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to sync GitHub data" },
      { status: 500 }
    );
  }
}
