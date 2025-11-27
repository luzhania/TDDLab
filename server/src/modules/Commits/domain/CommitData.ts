export interface CommitInfo {
  date: string;
  message: string;
  url: string;
}

export interface CommitStats {
  additions?: number;
  deletions?: number;
  total?: number;
  date?: string;
  [key: string]: any; // Para permitir otros campos de stats
}

export interface CommitData {
  _id: string; // SHA del commit
  branch: string;
  author: string;
  commit: CommitInfo;
  stats: CommitStats;
  coverage: number;
  test_count: number;
  failed_tests: number;
  conclusion: string;
  user_id: string;
  repo_name: string;
}

export interface TestRunSummary {
  passed: number;
  failed: number;
  total: number;
}

export interface TestRun {
  execution_timestamp: number;
  summary: TestRunSummary;
  success: boolean;
  test_id: number | string;
}

export interface TestRunsData {
  commit_sha: string;
  branch: string;
  user_id: string;
  repo_name: string;
  runs: TestRun[];
}

export interface BranchData {
  _id: string;
  user_id: string;
  repo_name: string;
  branch_name: string;
  commits: string[];
  last_commit: string;
  updated_at: Date;
}