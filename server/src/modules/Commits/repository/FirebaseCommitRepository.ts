import { db } from '../../../config/firebase';
import { ICommitRepository } from '../domain/ICommitRepository';
import { CommitData, TestRunsData, BranchData } from '../domain/CommitData';

export class FirebaseCommitRepository implements ICommitRepository {
  private readonly commitsCollection = 'commits';
  private readonly testRunsCollection = 'test-runs';
  private readonly branchesCollection = 'branches';

  /**
   * Guarda un commit en Firestore
   */
  async saveCommit(commitData: CommitData): Promise<void> {
    try {
      console.log('[Firebase] Attempting to save commit:', commitData._id);
      
      // Verificar que db esté inicializado
      if (!db) {
        throw new Error('Firestore database is not initialized');
      }

      const commitRef = db.collection(this.commitsCollection).doc(commitData._id);
      
      console.log('[Firebase] Getting existing commit...');
      // Verificar si el commit ya existe
      const existingCommit = await commitRef.get();
      
      if (existingCommit.exists) {
        console.log(`[Firebase] Commit ${commitData._id} already exists. Updating...`);
        await commitRef.update({
          ...commitData,
          updated_at: new Date(),
        });
      } else {
        console.log(`[Firebase] Creating new commit ${commitData._id}`);
        await commitRef.set({
          ...commitData,
          created_at: new Date(),
        });
      }

      console.log('[Firebase] Updating branch information...');
      // Actualizar información de la rama
      await this.updateBranchWithCommit(commitData);

      console.log(`[Firebase] Commit ${commitData._id} saved successfully`);
    } catch (error: any) {
      console.error('[Firebase] Error saving commit to Firebase:');
      console.error('[Firebase] Error details:', error);
      console.error('[Firebase] Error message:', error.message);
      console.error('[Firebase] Error stack:', error.stack);
      throw new Error(`Failed to save commit: ${error.message || error}`);
    }
  }

  /**
   * Guarda test runs en Firestore
   */
  async saveTestRuns(testRunsData: TestRunsData): Promise<void> {
    try {
      console.log('[Firebase] Attempting to save test runs for commit:', testRunsData.commit_sha);
      
      // Verificar que db esté inicializado
      if (!db) {
        throw new Error('Firestore database is not initialized');
      }

      const batch = db.batch();

      console.log(`[Firebase] Processing ${testRunsData.runs.length} test runs...`);
      
      // Generar IDs únicos para cada test run usando Firestore
      for (const run of testRunsData.runs) {
        // Usar el generador de IDs de Firestore (sin necesidad de uuid)
        const testRunRef = db.collection(this.testRunsCollection).doc();
        const testRunId = testRunRef.id;

        const testRunDocument = {
          id: testRunId,
          commit_sha: testRunsData.commit_sha,
          branch: testRunsData.branch,
          user_id: testRunsData.user_id,
          repo_name: testRunsData.repo_name,
          execution_timestamp: run.execution_timestamp,
          summary: run.summary,
          success: run.success,
          test_id: run.test_id,
          created_at: new Date(),
        };

        batch.set(testRunRef, testRunDocument);
      }

      console.log('[Firebase] Committing batch write...');
      await batch.commit();
      console.log(`[Firebase] Saved ${testRunsData.runs.length} test runs for commit ${testRunsData.commit_sha}`);
    } catch (error: any) {
      console.error('[Firebase] Error saving test runs to Firebase:');
      console.error('[Firebase] Error details:', error);
      console.error('[Firebase] Error message:', error.message);
      console.error('[Firebase] Error stack:', error.stack);
      throw new Error(`Failed to save test runs: ${error.message || error}`);
    }
  }

  /**
   * Actualiza información de una rama
   */
  async updateBranch(branchData: BranchData): Promise<void> {
    try {
      const branchRef = db.collection(this.branchesCollection).doc(branchData._id);
      
      await branchRef.set({
        ...branchData,
        updated_at: new Date(),
      }, { merge: true });

      console.log(`Branch ${branchData.branch_name} updated successfully`);
    } catch (error) {
      console.error('Error updating branch in Firebase:', error);
      throw new Error(`Failed to update branch: ${error}`);
    }
  }

  /**
   * Método auxiliar para actualizar la rama cuando se guarda un commit
   */
  private async updateBranchWithCommit(commitData: CommitData): Promise<void> {
    try {
      const branchId = `${commitData.user_id}_${commitData.repo_name}_${commitData.branch}`;
      const branchRef = db.collection(this.branchesCollection).doc(branchId);
      
      const branchDoc = await branchRef.get();

      if (branchDoc.exists) {
        // La rama existe, actualizar
        const existingData = branchDoc.data();
        const existingCommits = existingData?.commits || [];
        
        // Agregar el nuevo commit si no existe
        if (!existingCommits.includes(commitData._id)) {
          await branchRef.update({
            commits: [...existingCommits, commitData._id],
            last_commit: commitData._id,
            updated_at: new Date(),
          });
        }
      } else {
        // La rama no existe, crear
        const newBranchData: BranchData = {
          _id: branchId,
          user_id: commitData.user_id,
          repo_name: commitData.repo_name,
          branch_name: commitData.branch,
          commits: [commitData._id],
          last_commit: commitData._id,
          updated_at: new Date(),
        };
        
        await branchRef.set(newBranchData);
      }
    } catch (error) {
      console.error('Error updating branch with commit:', error);
    }
  }
}