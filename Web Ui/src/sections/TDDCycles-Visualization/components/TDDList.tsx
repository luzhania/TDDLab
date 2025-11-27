import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PropagateLoader } from "react-spinners";
import { CommitHistoryRepository } from "../../../modules/TDDCycles-Visualization/domain/CommitHistoryRepositoryInterface";
import { CommitDataObject } from "../../../modules/TDDCycles-Visualization/domain/githubCommitInterfaces";
import TDDCycleList from "./TDDCycleList";

interface CycleReportViewProps {
  port: CommitHistoryRepository;
}

function TDDList({ port }: Readonly<CycleReportViewProps>) {
  const [searchParams] = useSearchParams();
  const repoOwner: string = String(searchParams.get("repoOwner"));
  const repoName: string = String(searchParams.get("repoName"));
  const [commitsInfo, setCommitsInfo] = useState<CommitDataObject[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      console.log("Fetching commit information...");
      const branches = await port.obtainCommitsByBranches(repoOwner, repoName);
      
      // Flatten commits from all branches
      let allCommits: CommitDataObject[] = [];
      Object.values(branches).forEach(branchCommits => {
        allCommits = [...allCommits, ...branchCommits];
      });
      
      // Remove duplicates by SHA
      const uniqueCommits = Array.from(new Map(allCommits.map(c => [c.sha, c])).values());
      
      // Sort by date descending
      uniqueCommits.sort((a, b) => new Date(b.commit.date).getTime() - new Date(a.commit.date).getTime());

      setCommitsInfo(uniqueCommits);
      console.log("Página TDDList: ", uniqueCommits);
    } catch (error) {
      console.error("Error obtaining data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div style={{ marginTop: "30px" }}>
      {loading ? (
        <div className="mainInfoContainer">
          <PropagateLoader data-testid="loading-spinner" color="#36d7b7" />
        </div>
      ) : (
        <>
          {commitsInfo.length === 0 ? (
            <div className="error-message" data-testid="errorMessage">
              No se pudo cargar la información
            </div>
          ) : (
            <div style={{ width: "100%" }}>
              <TDDCycleList commitsInfo={commitsInfo} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default TDDList;