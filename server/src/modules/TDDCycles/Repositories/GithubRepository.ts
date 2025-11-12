import { Octokit } from "octokit";
import { IGithubRepository } from "../Domain/IGithubRepository";
import {
  CommitDataObject,
  CommitInformationDataObject,
} from "../Domain/CommitDataObject";
import dotenv from "dotenv";
import { JobDataObject } from "../Domain/JobDataObject";
import { TDDCycleDataObject } from "../Domain/TDDCycleDataObject";
import { MongoClient, ObjectId } from "mongodb";
import { CommitCycleData } from "../Domain/ICommitCycleData";
import { CommitHistoryData } from "../Domain/ICommitHistoryData";

dotenv.config();
export class GithubRepository implements IGithubRepository {
  octokit: Octokit;
  githubRepository: any;
  constructor() {
    const { REACT_APP_AUTH_TOKEN } = process.env;
    this.octokit = new Octokit({ auth: REACT_APP_AUTH_TOKEN });
  }
  async getCommits(
    owner: string,
    repoName: string
  ): Promise<CommitDataObject[]> {
    try {
      const response: any = await Promise.race([
        this.octokit.request(`GET /repos/${owner}/${repoName}/commits`, {
          per_page: 100,
        }),
        this.timeout(10000),
      ]);
      const commits: CommitDataObject[] = response.data.map(
        (githubCommit: any) => {
          return {
            sha: githubCommit.sha,
            node_id: githubCommit.node_id,
            url: githubCommit.url,
            html_url: githubCommit.html_url,
            comments_url: githubCommit.comments_url,
            author: githubCommit.author
              ? {
                  login: githubCommit.author.login,
                  id: githubCommit.author.id,
                  node_id: githubCommit.author.node_id,
                  avatar_url: githubCommit.author.avatar_url,
                  gravatar_id: githubCommit.author.gravatar_id,
                  url: githubCommit.author.url,
                  html_url: githubCommit.author.html_url,
                  followers_url: githubCommit.author.followers_url,
                  following_url: githubCommit.author.following_url,
                  gists_url: githubCommit.author.gists_url,
                  starred_url: githubCommit.author.starred_url,
                  subscriptions_url: githubCommit.author.subscriptions_url,
                  organizations_url: githubCommit.author.organizations_url,
                  repos_url: githubCommit.author.repos_url,
                  events_url: githubCommit.author.events_url,
                  received_events_url: githubCommit.author.received_events_url,
                  type: githubCommit.author.type,
                  site_admin: githubCommit.author.site_admin,
                }
              : null,
            committer: githubCommit.committer
              ? {
                  login: githubCommit.committer.login,
                  id: githubCommit.committer.id,
                  node_id: githubCommit.committer.node_id,
                  avatar_url: githubCommit.committer.avatar_url,
                  gravatar_id: githubCommit.committer.gravatar_id,
                  url: githubCommit.committer.url,
                  html_url: githubCommit.committer.html_url,
                  followers_url: githubCommit.committer.followers_url,
                  following_url: githubCommit.committer.following_url,
                  gists_url: githubCommit.committer.gists_url,
                  starred_url: githubCommit.committer.starred_url,
                  subscriptions_url: githubCommit.committer.subscriptions_url,
                  organizations_url: githubCommit.committer.organizations_url,
                  repos_url: githubCommit.committer.repos_url,
                  events_url: githubCommit.committer.events_url,
                  received_events_url:
                    githubCommit.committer.received_events_url,
                  type: githubCommit.committer.type,
                  site_admin: githubCommit.committer.site_admin,
                }
              : null,
            parents: githubCommit.parents.map((parent: any) => {
              return {
                sha: parent.sha,
                url: parent.url,
                html_url: parent.html_url,
              };
            }),
            commit: {
              author: {
                name: githubCommit.commit.author.name,
                email: githubCommit.commit.author.email,
                date: new Date(githubCommit.commit.author.date),
              },
              committer: {
                name: githubCommit.commit.committer.name,
                email: githubCommit.commit.committer.email,
                date: new Date(githubCommit.commit.committer.date),
              },
              message: githubCommit.commit.message,
              tree: {
                sha: githubCommit.commit.tree.sha,
                url: githubCommit.commit.tree.url,
              },
              url: githubCommit.commit.url,
              comment_count: githubCommit.commit.comment_count,
              verification: {
                verified: githubCommit.commit.verification.verified,
                reason: githubCommit.commit.verification.reason,
                signature: githubCommit.commit.verification.signature,
                payload: githubCommit.commit.verification.payload,
              },
            },
          };
        }
      );

      return commits;
    } catch (error) {
      console.error("An error occurred"); 
      throw error;
    }
  }

  async getCommitInfoForTDDCycle(
    owner: string,
    repoName: string,
    sha: string
  ): Promise<CommitInformationDataObject> {
    try {
      const [response, coverageResponse] = await Promise.all([
        this.octokit.request(`GET /repos/${owner}/${repoName}/commits/${sha}`),
        this.octokit.request(
          `GET /repos/${owner}/${repoName}/commits/${sha}/comments`
        ),
      ]);
      let percentageMatch = "";
      let testCount = "";
      if (coverageResponse.data.length > 0) {
        const coverageMatch = /Statements\s*\|\s*([\d.]+)%/.exec(
          coverageResponse.data[0].body
        );
        const testCountMatch = /(\d+)(?=\s*tests passing)/.exec(
          coverageResponse.data[0].body
        );
        if (coverageMatch) {
          percentageMatch = String(coverageMatch[1]);
        }
        if (testCountMatch) {
          testCount = String(testCountMatch[1]);
        }
      }
      const commitInfo: CommitInformationDataObject = {
        ...response.data,
        coveragePercentage: percentageMatch,
        test_count: testCount,
      };
      return commitInfo;
    } catch (error) {
      console.error("An error occurred"); 
      throw error;
    }
  }

  async fetchCoverageDataForCommit(owner: string, repoName: string, sha: string) {
    try {
      const coverageResponse = await this.octokit.request(
        `GET /repos/${owner}/${repoName}/commits/${sha}/comments`
      );
      let coveragePercentage = null;
  
      if (coverageResponse.data.length > 0) {
        const body = coverageResponse.data[0]?.body;
        const coverageMatch = body.match(
          /\|\s*(?:🟢|🔴|🟡)\s*\|\s*Statements\s*\|\s*([\d.]+)%\s*\|/
        );
  
        if (coverageMatch) {
          coveragePercentage = coverageMatch[1];
        } else {
          console.warn("No se encontró el patrón de cobertura en el body.");
        }
      } else {
        console.warn(`No se encontraron comentarios para el commit ${sha}`);
      }
  
      return { coveragePercentage };
    } catch (error) {
      console.error(`Error al recuperar la cobertura para commit ${sha}:`, error);
      throw error;
    }
  }
  
    

  async getCommitsInforForTDDCycle(
    owner: string,
    repoName: string,
    commits: CommitDataObject[]
  ) {
    try {
      const commitsFromSha = await Promise.all(
        commits.map((commit) =>
          this.getCommitInfoForTDDCycle(owner, repoName, commit.sha)
        )
      );

      const commitsData: TDDCycleDataObject[] = commitsFromSha.map(
        ({ html_url, stats, commit, sha, coveragePercentage, test_count }) => ({
          html_url,
          stats: {
            total: stats.total,
            additions: stats.additions,
            deletions: stats.deletions,
          },
          commit: {
            date: commit.author.date,
            message: commit.message,
            url: commit.url,
            comment_count: commit.comment_count,
          },
          sha,
          coverage: coveragePercentage,
          test_count: test_count,
        })
      );

      return commitsData;
    } catch (error) {
      throw new Error("Error getting commits from SHA");
    }
  }

  timeout(ms: number): Promise<void> {
    return new Promise<void>((_, reject) => {
      setTimeout(() => {
        reject(new Error("Request timed out"));
      }, ms);
    });
  }
  async obtainRunsOfGithubActions(owner: string, repoName: string) {
    try {
      const response: any = await Promise.race([
        this.octokit.request(`GET /repos/${owner}/${repoName}/actions/runs`),
        this.timeout(10000),
      ]);
      return response;
    } catch (error) {
      console.error("An error occurred"); 
      throw error;
    }
  }
  async obtainJobsOfACommit(
    owner: string,
    repoName: string,
    jobId: number,
    attempt: number
  ) {
    try {
      const {
        data: { total_count, jobs },
      } = await this.octokit.request(
        `GET /repos/${owner}/${repoName}/actions/runs/${jobId}/attempts/${attempt}/jobs`
      );
      const jobData = {
        total_count,
        jobs,
      };
      return jobData;
    } catch (error) {
      console.error("An error occurred"); 
      throw error;
    }
  }
  async getRunsOfGithubActionsIds(owner: string, repoName: string) {
    const githubruns = await this.obtainRunsOfGithubActions(owner, repoName);
    const commitsWithActions: [string, number][] =
      githubruns.data.workflow_runs.map((workFlowRun: any) => {
        return [workFlowRun.head_commit.id, workFlowRun.id];
      });
    return commitsWithActions;
  }
  async getJobsDataFromGithub(
    owner: string,
    repoName: string,
    listOfCommitsWithActions: [string, number][]
  ) {
    const jobs: Record<string, JobDataObject> = {};
    await Promise.all(
      listOfCommitsWithActions.map(async (workflowInfo) => {
        const jobInfo = await this.obtainJobsOfACommit(
          owner,
          repoName,
          workflowInfo[1],
          1
        );
        jobs[workflowInfo[0]] = jobInfo;
      })
    );
    return jobs;
  }

  async fetchCommitHistoryJson(owner: string, repoName: string): Promise<any[]> {
    // 'owner' is part of the repository interface but not used by current MongoDB layout
    // reference it here to avoid TS6133 (declared but its value is never read)
    void owner;
    // Read commit history from MongoDB instead of raw JSON
    const { MONGO_URI } = process.env;
    if (!MONGO_URI) {
      throw new Error("MONGO_URI not set in environment");
    }

    const client = new MongoClient(String(MONGO_URI));
    try {
      await client.connect();
      console.log("Connected to MongoDB");
      // Allow overriding the database name via MONGO_DB_NAME env var. If not provided,
      // client.db() will use the database specified in the connection string or default to 'test'.
      const dbName = process.env.MONGO_DB_NAME;
      const db = dbName ? client.db(dbName) : client.db();
      console.log("GithubRepository.fetchCommitHistoryJson - using db:", db.databaseName || '<unknown>');
      const branchesColl = db.collection("branches");
      const commitsColl = db.collection("commits");

      // find branches for repo
      const branches = await branchesColl.find({ repo_name: repoName }).toArray();

      // collect commit ids
      const allCommitIds: string[] = [];
      for (const b of branches) {
        if (Array.isArray(b.commits)) {
          for (const c of b.commits) {
            if (c) allCommitIds.push(String(c));
          }
        }
      }

      let commitDocs: any[] = [];
      if (allCommitIds.length === 0) {
        // fallback: try commits documents with repo_name field
        commitDocs = await commitsColl.find({ repo_name: repoName }).toArray();
      } else {
        const queryIds = allCommitIds.map((id) => (ObjectId.isValid(id) ? new ObjectId(id) : id));
        commitDocs = await commitsColl.find({ _id: { $in: queryIds as any } }).toArray();
      }

      const mapped = commitDocs.map((doc: any) => ({
        sha: doc._id || doc.sha,
        commit: {
          url: doc.commit?.url || doc.url || "",
          date: doc.commit?.date || doc.stats?.date || doc.date || null,
          message: doc.commit?.message || doc.message || "",
          comment_count: doc.commit?.comment_count || doc.comment_count || 0,
        },
        stats: {
          total: doc.stats?.total ?? 0,
          additions: doc.stats?.additions ?? 0,
          deletions: doc.stats?.deletions ?? 0,
          date: doc.stats?.date ?? null,
        },
        coverage: doc.coverage ?? null,
        test_count: doc.test_count ?? null,
        conclusion: doc.conclusion ?? null,
      }));

      return mapped;
    } catch (error) {
      console.error("Error fetching commit-history from MongoDB:", error);
      throw error;
    } finally {
      await client.close();
    }
  }

  async getCommitHistoryByBranches(owner: string, repoName: string): Promise<Record<string, any[]>> {
    // 'owner' parameter exists to satisfy IGithubRepository signature.
    // It's not required for current DB queries; reference it to silence TS6133.
    void owner;
    const { MONGO_URI } = process.env;
    if (!MONGO_URI) throw new Error("MONGO_URI not set in environment");

    const client = new MongoClient(String(MONGO_URI));
    try {
      await client.connect();
      // Allow overriding the database name via MONGO_DB_NAME env var. If not provided,
      // client.db() will use the database specified in the connection string or default to 'test'.
      const dbName = process.env.MONGO_DB_NAME;
      const db = dbName ? client.db(dbName) : client.db();
      // Diagnostic: print the resolved database name so we know where we're querying
      try {
        console.debug("GithubRepository.getCommitHistoryByBranches - connected db:", db.databaseName || '<unknown>');
      } catch (e) {
        console.debug("GithubRepository.getCommitHistoryByBranches - could not read db.databaseName");
      }
      const branchesColl = db.collection("branches");
      // Diagnostic: count and sample branches to verify collection contents
      try {
        const totalBranches = await branchesColl.countDocuments();
        console.debug("GithubRepository.getCommitHistoryByBranches - branches total count:", totalBranches);
        if (totalBranches > 0) {
          const sample = await branchesColl.find({}).limit(5).toArray();
          console.debug("GithubRepository.getCommitHistoryByBranches - sample branches:", sample.map((b:any) => ({ branch_name: b.branch_name, repo_name: b.repo_name, commits_count: Array.isArray(b.commits) ? b.commits.length : 0 })));
        }
      } catch (diagE) {
        console.debug("GithubRepository.getCommitHistoryByBranches - diagnostic branches read failed:", diagE);
      }
  const commitsColl = db.collection("commits");

      // Use aggregation with $lookup to join commits referenced by each branch
      // Match repo_name case-insensitively to be robust to stored owner/repo casing
      const pipeline = [
        { $match: { $expr: { $eq: [{ $toLower: "$repo_name" }, String(repoName).toLowerCase()] } } },
        {
          $lookup: {
            from: "commits",
            let: { commitIds: "$commits" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $or: [
                      { $in: ["$_id", "$$commitIds"] },
                      { $in: [{ $toString: "$_id" }, "$$commitIds"] }
                    ]
                  }
                }
              }
            ],
            as: "commit_docs"
          }
        }
      ];

      const branchesWithCommits = await branchesColl.aggregate(pipeline).toArray();
      console.debug("GithubRepository.getCommitHistoryByBranches - repoName:", repoName, "aggregation matched branches:", branchesWithCommits.map((b: any) => b.branch_name));

      // If aggregation returned nothing, provide diagnostic info and try fallbacks
      if (!branchesWithCommits || branchesWithCommits.length === 0) {
        console.warn("GithubRepository.getCommitHistoryByBranches - aggregation returned no branches for repoName:", repoName);
        try {
          const exact = await branchesColl.find({ repo_name: repoName }).toArray();
          console.debug("Branches exact match count:", exact.length, exact.slice(0,5).map((x:any) => ({ branch_name: x.branch_name, repo_name: x.repo_name, commits_count: Array.isArray(x.commits)? x.commits.length:0 })));
          const regex = await branchesColl.find({ repo_name: { $regex: repoName, $options: 'i' } }).toArray();
          console.debug("Branches regex(i) match count:", regex.length, regex.slice(0,5).map((x:any) => ({ branch_name: x.branch_name, repo_name: x.repo_name, commits_count: Array.isArray(x.commits)? x.commits.length:0 })));

          const fallbackBranches = exact.length > 0 ? exact : regex;
          if (fallbackBranches && fallbackBranches.length > 0) {
            // Build result by resolving commit docs for each branch
            const fallbackResult: Record<string, any[]> = {};
            for (const bdoc of fallbackBranches) {
              const ids = Array.isArray(bdoc.commits) ? bdoc.commits : [];
              const commitDocs: any[] = [];
              for (const id of ids) {
                const conditions: any[] = [];
                if (ObjectId.isValid(String(id))) {
                  try {
                    conditions.push({ _id: new ObjectId(String(id)) });
                  } catch (e) {
                    // ignore
                  }
                }
                // match string _id or sha
                conditions.push({ _id: String(id) });
                conditions.push({ sha: String(id) });
                const found = await commitsColl.find({ $or: conditions }).toArray();
                if (found && found.length > 0) {
                  commitDocs.push(...found);
                } else {
                  console.debug("No commit doc found for id", id, "in branch", bdoc.branch_name);
                }
              }
              const mapped = commitDocs.map((doc: any) => ({
                html_url: doc.commit?.url || doc.url || "",
                sha: doc._id || doc.sha,
                stats: {
                  total: doc.stats?.total ?? 0,
                  additions: doc.stats?.additions ?? 0,
                  deletions: doc.stats?.deletions ?? 0,
                  date: doc.stats?.date ?? null,
                },
                commit: {
                  date: new Date(doc.commit?.date || doc.stats?.date || doc.date),
                  message: doc.commit?.message || doc.message || "",
                  url: doc.commit?.url || doc.url || "",
                  comment_count: doc.commit?.comment_count || doc.comment_count || 0,
                },
                coverage: doc.coverage ?? null,
                test_count: doc.test_count ?? null,
                conclusion: doc.conclusion ?? null,
              }));
              mapped.sort((a,b)=> (b.commit.date?.getTime?.()||0) - (a.commit.date?.getTime?.()||0));
              fallbackResult[bdoc.branch_name] = mapped;
            }
            console.debug("GithubRepository.getCommitHistoryByBranches - returning fallback result for branches:", Object.keys(fallbackResult));
            return fallbackResult;
          }
        } catch (diagErr) {
          console.error("Error during branches diagnostic/fallback:", diagErr);
        }
      }
      const result: Record<string, any[]> = {};

      for (const b of branchesWithCommits) {
        const commitDocs = Array.isArray(b.commit_docs) ? b.commit_docs : [];
        const mapped = commitDocs.map((doc: any) => ({
          html_url: doc.commit?.url || doc.url || "",
          sha: doc._id || doc.sha,
          stats: {
            total: doc.stats?.total ?? 0,
            additions: doc.stats?.additions ?? 0,
            deletions: doc.stats?.deletions ?? 0,
            date: doc.stats?.date ?? null,
          },
          commit: {
            date: new Date(doc.commit?.date || doc.stats?.date || doc.date),
            message: doc.commit?.message || doc.message || "",
            url: doc.commit?.url || doc.url || "",
            comment_count: doc.commit?.comment_count || doc.comment_count || 0,
          },
          coverage: doc.coverage ?? null,
          test_count: doc.test_count ?? null,
          conclusion: doc.conclusion ?? null,
        }));

        mapped.sort((a, b) => b.commit.date.getTime() - a.commit.date.getTime());
        result[b.branch_name] = mapped;
      }

      return result;
    } catch (error) {
      console.error("Error fetching commits by branches (aggregation):", error);
      throw error;
    } finally {
      await client.close();
    }
  }

  async getCommitHistoryData(owner: string, repoName: string): Promise<CommitHistoryData[]> {
    const commitHistory = await this.fetchCommitHistoryJson(owner, repoName);
    const commits: CommitHistoryData[] = commitHistory.map((commitData: any) => ({
      html_url: commitData.commit.url,
      sha: commitData.sha,
      stats: {
        total: commitData.stats.total,
        additions: commitData.stats.additions,
        deletions: commitData.stats.deletions,
        date: commitData.stats.date,
      },
      commit: {
        date: new Date(commitData.commit.date),
        message: commitData.commit.message,
        url: commitData.commit.url,
        comment_count: commitData.commit.comment_count,
      },
      coverage: commitData.coverage,
      test_count: commitData.test_count,
      conclusion: commitData.conclusion,
    }));
    commits.sort((a, b) => b.commit.date.getTime() - a.commit.date.getTime());
    return commits;
  }

  async getCommitCyclesData(owner: string, repoName: string): Promise<CommitCycleData[]> {
    const commitHistory = await this.fetchCommitHistoryJson(owner, repoName);
    return commitHistory.map((commitData: any) => ({
      url: commitData.commit.url,
      sha: commitData.sha,
      tddCycle: commitData.tdd_cycle ?? "null",
      coverage: commitData.coverage,
    }));
  }
}
