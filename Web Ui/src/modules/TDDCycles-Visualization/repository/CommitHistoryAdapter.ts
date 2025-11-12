import { CommitDataObject } from "../domain/githubCommitInterfaces.ts";
//import { GithubAPIRepository } from "../domain/GithubAPIRepositoryInterface.ts";
import { CommitHistoryRepository } from "../domain/CommitHistoryRepositoryInterface.ts";
import { CommitCycle } from "../domain/TddCycleInterface.ts";
import axios from "axios";
import { VITE_API } from "../../../../config.ts";
import { TDDLogEntry } from "../domain/TDDLogInterfaces.ts";

export class CommitHistoryAdapter implements CommitHistoryRepository {
  backAPI: string;

  constructor() {
    // If VITE_API is not provided, fall back to same-origin API prefix '/api'
    const base = (VITE_API as any) || "/api";
    this.backAPI = base.replace(/\/$/, "") + "/TDDCycles"; // ensures no duplicate slashes
  }
  

  // function for obtain TDD_log.json
  private getTDDLogUrl(owner: string, repoName: string): string {
    return `https://raw.githubusercontent.com/${owner}/${repoName}/main/script/tdd_log.json`;
  }

  async obtainUserName(owner: string): Promise<string> {
    try {
      // Use the public GitHub REST API via axios in the browser instead of Octokit (which pulls Node modules)
      const url = `https://api.github.com/users/${owner}`;
      const response = await axios.get(url);
      if (response.status !== 200) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const userName = response.data?.name;
      return userName || owner;
    } catch (error) {
      console.error("Error obtaining user name:", error);
      // On error return the owner as fallback to avoid breaking the UI
      return owner;
    }
  }

  async obtainCommitsOfRepo(
    owner: string,
    repoName: string,
  ): Promise<CommitDataObject[]> {
    try {
      // Now request our backend endpoint which centralizes this logic
      const url = `${this.backAPI}/commits-history`;
      const response = await axios.get(url, { params: { owner, repoName } });

      if (response.status !== 200) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      // Backend already returns the mapped array, just ensure dates are Date objects on client
      const commits: CommitDataObject[] = (response.data || []).map((c: any) => ({
        ...c,
        commit: {
          ...c.commit,
          date: new Date(c.commit.date),
        },
      }));
      console.debug("CommitHistoryAdapter.obtainCommitsOfRepo - commits (count):", commits.length, commits.slice(0,3));
      return commits;
    } catch (error) {
      console.error("Error obteniendo commits desde GitHub:", error);
      throw error;
    }
  }


  async obtainCommitTddCycle(
    owner: string,
    repoName: string,
  ): Promise<CommitCycle[]> {
    try {
      const url = `${this.backAPI}/commit-cycles`;
      const response = await axios.get(url, { params: { owner, repoName } });

      if (response.status !== 200) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      // Map server shape to current UI Contract (note: UI uses property tddCycle)
      const commits: CommitCycle[] = (response.data || []).map((item: any) => ({
        url: item.url,
        sha: item.sha,
        tddCycle: item.tddCycle ?? "null",
        coverage: item.coverage,
      }));
      return commits;
    } catch (error) {
      console.error("Error obtaining commit TDD cycles:", error);
      throw error;
    }
  }

  async obtainTDDLogs(
    owner: string,
    repoName: string,
  ): Promise<TDDLogEntry[]> {
    try {
      const tddLogUrl = this.getTDDLogUrl(owner, repoName);
      const response = await axios.get<TDDLogEntry[]>(tddLogUrl);

      if (response.status !== 200) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      console.debug("CommitHistoryAdapter.obtainTDDLogs - tddLogUrl:", tddLogUrl, "size:", (response.data || []).length || 0);
      return response.data;

    } catch (error) {
      // If the raw file is not present return empty logs instead of throwing
      const status = (error as any)?.response?.status;
      if (status === 404) {
        console.warn("TDD log not found for", owner, repoName);
        return [];
      }
      console.error("Error obtaining TDD logs:", error);
      throw error;
    }
  }

  async obtainCommitsByBranches(owner: string, repoName: string): Promise<Record<string, CommitDataObject[]>> {
    try {
      const url = `${this.backAPI}/commits-history-by-branches`;
      const response = await axios.get(url, { params: { owner, repoName } });

      if (response.status !== 200) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = response.data || {};
      const mapped: Record<string, CommitDataObject[]> = {};
      for (const branchName of Object.keys(data)) {
        mapped[branchName] = (data[branchName] || []).map((c: any) => ({
          ...c,
          commit: {
            ...c.commit,
            date: new Date(c.commit.date),
          },
        }));
      }
      console.debug("CommitHistoryAdapter.obtainCommitsByBranches - branches:", Object.keys(mapped), Object.fromEntries(Object.entries(mapped).slice(0,5)));
      return mapped;
    } catch (error) {
      console.error("Error obtaining commits by branches:", error);
      throw error;
    }
  }
}