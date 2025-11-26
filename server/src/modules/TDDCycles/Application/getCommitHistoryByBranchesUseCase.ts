import { IFirebaseDBBranchesCommitsRepository } from "../Domain/IFirebaseDBBranchesCommitsRepository";
import { CommitHistoryData } from "../Domain/ICommitHistoryData";

export class GetCommitHistoryByBranchesUseCase {
  private repository: IFirebaseDBBranchesCommitsRepository;

  constructor(repository: IFirebaseDBBranchesCommitsRepository) {
    this.repository = repository;
  }

  async execute(owner: string, repoName: string): Promise<Record<string, CommitHistoryData[]>> {
    try {
      return await this.repository.getCommitHistoryByBranches(owner, repoName);
    } catch (error) {
      console.error("Error executing GetCommitHistoryByBranchesUseCase:", error);
      throw error;
    }
  }
}
