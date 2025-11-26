import { CommitHistoryData } from "./ICommitHistoryData";

export interface IFirebaseDBBranchesCommitsRepository {
  getCommitHistoryByBranches(owner: string, repoName: string): Promise<Record<string, CommitHistoryData[]>>;
}
