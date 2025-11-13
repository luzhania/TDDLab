import { IGithubRepository } from "../Domain/IGithubRepository";

export class GetAvailableBranchesUseCase {
  private readonly githubRepository: IGithubRepository;

  constructor(githubRepository: IGithubRepository) {
    this.githubRepository = githubRepository;
  }

  async execute(owner: string, repoName: string): Promise<string[]> {
    try {
      return await this.githubRepository.getAvailableBranches(owner, repoName);
    } catch (error) {
      console.error(`Error executing GetAvailableBranchesUseCase: ${error}`);
      throw error;
    }
  }
}
