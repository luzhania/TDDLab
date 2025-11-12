import { IGithubRepository } from "../Domain/IGithubRepository";
import { CommitHistoryData } from "../Domain/ICommitHistoryData";

export class GetCommitHistoryByBranchesUseCase {
  private readonly githubRepository: IGithubRepository;

  constructor(githubRepository: IGithubRepository) {
    this.githubRepository = githubRepository;
  }

  async execute(owner: string, repoName: string): Promise<Record<string, CommitHistoryData[]>> {
    try {
      return await this.githubRepository.getCommitHistoryByBranches(owner, repoName);
    } catch (error) {
      console.error(`Error executing GetCommitHistoryByBranchesUseCase: ${error}`);
      throw error;
    }
  }
}
