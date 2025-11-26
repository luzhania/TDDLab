import { Request, Response } from "express";
import { GetCommitHistoryByBranchesUseCase } from "../../modules/TDDCycles/Application/getCommitHistoryByBranchesUseCase";
import { IFirebaseDBBranchesCommitsRepository } from "../../modules/TDDCycles/Domain/IFirebaseDBBranchesCommitsRepository";

export class CommitHistoryByBranchesController {
  private getCommitHistoryByBranchesUseCase: GetCommitHistoryByBranchesUseCase;

  constructor(repository: IFirebaseDBBranchesCommitsRepository) {
    this.getCommitHistoryByBranchesUseCase = new GetCommitHistoryByBranchesUseCase(repository);
  }

  async getCommitHistoryByBranches(req: Request, res: Response) {
    try {
      const { owner, repoName } = req.query;
      if (!owner || !repoName) {
        return res.status(400).json({ error: "Bad request, missing owner or repoName" });
      }

      const data = await this.getCommitHistoryByBranchesUseCase.execute(String(owner), String(repoName));
      return res.status(200).json(data);
    } catch (error) {
      console.error("Error fetching commit history by branches:", error);
      return res.status(500).json({ error: "Server error" });
    }
  }
}
