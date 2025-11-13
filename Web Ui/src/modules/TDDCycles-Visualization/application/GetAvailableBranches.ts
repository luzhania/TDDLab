import { CommitHistoryRepository } from "../domain/CommitHistoryRepositoryInterface";

export class GetAvailableBranches {
  constructor(private readonly repo: CommitHistoryRepository) {}

  async execute(owner: string, repoName: string): Promise<string[]> {
    return await this.repo.obtainAvailableBranches(owner, repoName);
  }
}
