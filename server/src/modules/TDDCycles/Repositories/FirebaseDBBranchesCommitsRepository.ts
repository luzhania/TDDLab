import { db } from "../../../config/firebase";
import { CommitHistoryData } from "../Domain/ICommitHistoryData";

export class FirebaseDBBranchesCommitsRepository {
  
  async getCommitHistoryByBranches(owner: string, repoName: string): Promise<Record<string, CommitHistoryData[]>> {
    try {
      const branchesRef = db.collection("branches");
      // Query branches by repo_name and user_id
      const snapshot = await branchesRef
        .where("repo_name", "==", repoName)
        .where("user_id", "==", owner)
        .get();

      if (snapshot.empty) {
        console.log(`No branches found for repo: ${repoName} and user: ${owner}`);
        return {};
      }

      const branchesData = snapshot.docs.map(doc => doc.data());
      const result: Record<string, CommitHistoryData[]> = {};
      
      // Collect all unique commit SHAs to fetch them in batch (or parallel)
      const allCommitShas = new Set<string>();
      branchesData.forEach(branch => {
        if (Array.isArray(branch.commits)) {
          branch.commits.forEach((sha: string) => allCommitShas.add(sha));
        }
      });

      if (allCommitShas.size === 0) {
        return {};
      }

      // Fetch all commits
      // Firestore getAll supports up to 100 arguments? No, admin SDK getAll supports many.
      // But let's be safe and fetch them.
      const commitRefs = Array.from(allCommitShas).map(sha => db.collection("commits").doc(sha));
      
      // Use getAll to fetch documents in parallel
      const commitDocs = await db.getAll(...commitRefs);
      
      const commitsMap = new Map<string, any>();
      commitDocs.forEach(doc => {
        if (doc.exists) {
          commitsMap.set(doc.id, doc.data());
        }
      });

      // Build the result
      for (const branch of branchesData) {
        const branchName = branch.branch_name;
        const branchCommits: CommitHistoryData[] = [];

        if (Array.isArray(branch.commits)) {
          for (const sha of branch.commits) {
            const commitData = commitsMap.get(sha);
            if (commitData) {
              branchCommits.push(this.mapToCommitHistoryData(commitData, sha));
            }
          }
        }

        // Sort commits by date descending
        branchCommits.sort((a, b) => b.commit.date.getTime() - a.commit.date.getTime());
        
        result[branchName] = branchCommits;
      }

      return result;

    } catch (error) {
      console.error("Error getting commit history by branches from Firebase:", error);
      throw error;
    }
  }

  private mapToCommitHistoryData(data: any, sha: string): CommitHistoryData {
    return {
      html_url: data.commit?.url || "",
      sha: data._id || sha,
      stats: {
        total: data.stats?.total || 0,
        additions: data.stats?.additions || 0,
        deletions: data.stats?.deletions || 0,
        date: data.stats?.date || "",
      },
      commit: {
        date: new Date(data.commit?.date || new Date().toISOString()),
        message: data.commit?.message || "",
        url: data.commit?.url || "",
        comment_count: data.commit?.comment_count || 0,
      },
      coverage: data.coverage || 0,
      test_count: data.test_count || 0,
      conclusion: data.conclusion || "pending",
    };
  }
}
