import { db } from "../../../config/firebase";
import { CommitHistoryData } from "../Domain/ICommitHistoryData";
import { IFirebaseDBBranchesCommitsRepository } from "../Domain/IFirebaseDBBranchesCommitsRepository";

export class FirebaseDBBranchesCommitsRepository implements IFirebaseDBBranchesCommitsRepository {
  
  async getCommitHistoryByBranches(owner: string, repoName: string): Promise<Record<string, CommitHistoryData[]>> {
    try {
      console.log(`Fetching branches for repo: ${repoName}, user: ${owner}`);
      const branchesRef = db.collection("branches");
      
      // Query branches by repo_name and user_id
      // Try standard field name first
      let snapshot = await branchesRef
        .where("repo_name", "==", repoName)
        .where("user_id", "==", owner)
        .get();

      // If empty, try with leading space (data ingestion issue workaround)
      if (snapshot.empty) {
        console.log("Standard query empty, trying with leading space in ' repo_name'...");
        snapshot = await branchesRef
            .where(" repo_name", "==", repoName)
            .where("user_id", "==", owner)
            .get();
      }

      if (snapshot.empty) {
        console.log(`No branches found for repo: ${repoName} and user: ${owner}`);
        return {};
      }

      const branchesData = snapshot.docs.map(doc => doc.data());
      console.log(`Found ${branchesData.length} branches`);
      const result: Record<string, CommitHistoryData[]> = {};
      
      // Collect all unique commit SHAs
      const allCommitShas = new Set<string>();
      branchesData.forEach(branch => {
        if (Array.isArray(branch.commits)) {
          branch.commits.forEach((sha: string) => allCommitShas.add(sha));
        }
      });

      console.log(`Found ${allCommitShas.size} unique commits to fetch`);

      if (allCommitShas.size === 0) {
        return {};
      }

      // Fetch commits by SHA
      // Since document IDs are NOT SHAs, we must query the 'commits' collection by the 'sha' field.
      // Firestore 'in' query is limited to 10 values (or 30 in newer versions), so we chunk it.
      const shasArray = Array.from(allCommitShas);
      const chunkSize = 10;
      const commitsMap = new Map<string, any>();

      for (let i = 0; i < shasArray.length; i += chunkSize) {
          const chunk = shasArray.slice(i, i + chunkSize);
          const commitsSnapshot = await db.collection("commits")
            .where("sha", "in", chunk)
            .get();
          
          commitsSnapshot.forEach(doc => {
              const data = doc.data();
              // Use the SHA from the data as key
              if (data.sha) {
                  commitsMap.set(data.sha, data);
              }
          });
      }
      
      console.log(`Fetched ${commitsMap.size} commit documents`);
      
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
    // Handle potential date formats (Firestore Timestamp vs String)
    let dateObj = new Date();
    if (data.commit?.date) {
        if (data.commit.date._seconds) {
            dateObj = new Date(data.commit.date._seconds * 1000);
        } else {
            dateObj = new Date(data.commit.date);
        }
    }

    return {
      html_url: data.commit?.url || "",
      sha: data.sha || sha,
      stats: {
        total: data.stats?.total || 0,
        additions: data.stats?.additions || 0,
        deletions: data.stats?.deletions || 0,
        date: data.stats?.date || "",
      },
      commit: {
        date: dateObj,
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
