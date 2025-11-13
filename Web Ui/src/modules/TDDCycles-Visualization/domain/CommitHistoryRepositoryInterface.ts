import { CommitDataObject } from "./githubCommitInterfaces";
import { CommitCycle } from "./TddCycleInterface";
import { TDDLogEntry } from "./TDDLogInterfaces"; // add 

export interface CommitHistoryRepository {
  obtainCommitsOfRepo(owner: string, repoName: string, branch: string): Promise<CommitDataObject[]>;
  obtainCommitTddCycle(owner: string, repoName: string, branch: string): Promise<CommitCycle[]>; 
  obtainTDDLogs(owner: string, repoName: string, branch: string): Promise<TDDLogEntry[]>; // add
  obtainAvailableBranches(owner: string, repoName: string): Promise<string[]>;
}