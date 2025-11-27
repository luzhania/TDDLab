import { Request, Response } from 'express';
import { SaveCommitUseCase } from '../../modules/Commits/application/SaveCommitUseCase';
import { SaveTestRunsUseCase } from '../../modules/Commits/application/SaveTestRunsUseCase';
import { ICommitRepository } from '../../modules/Commits/domain/ICommitRepository';

export class CommitController {
  private readonly saveCommitUseCase: SaveCommitUseCase;
  private readonly saveTestRunsUseCase: SaveTestRunsUseCase;

  constructor(commitRepository: ICommitRepository) {
    this.saveCommitUseCase = new SaveCommitUseCase(commitRepository);
    this.saveTestRunsUseCase = new SaveTestRunsUseCase(commitRepository);
  }

  /**
   * Endpoint POST /commits
   * Recibe y guarda datos de un commit
   */
  async saveCommit(req: Request, res: Response): Promise<void> {
    try {
      const commitData = req.body;

      // Log para debugging
      console.log('Received commit data:', {
        _id: commitData._id,
        branch: commitData.branch,
        user_id: commitData.user_id,
        repo_name: commitData.repo_name,
      });

      // Ejecutar caso de uso
      const result = await this.saveCommitUseCase.execute(commitData);

      res.status(201).json(result);
    } catch (error) {
      console.error('Error in saveCommit controller:', error);
      
      if (error instanceof Error) {
        // Errores de validación
        if (error.message.includes('Missing required field') || 
            error.message.includes('Invalid')) {
          res.status(400).json({
            success: false,
            error: 'Validation error',
            message: error.message,
          });
          return;
        }
      }

      // Error genérico del servidor
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to save commit data',
      });
    }
  }

  /**
   * Endpoint POST /test-runs
   * Recibe y guarda datos de test runs
   */
  async saveTestRuns(req: Request, res: Response): Promise<void> {
    try {
      const testRunsData = req.body;

      // Log para debugging
      console.log('Received test runs data:', {
        commit_sha: testRunsData.commit_sha,
        branch: testRunsData.branch,
        user_id: testRunsData.user_id,
        repo_name: testRunsData.repo_name,
        runs_count: testRunsData.runs?.length,
      });

      // Ejecutar caso de uso
      const result = await this.saveTestRunsUseCase.execute(testRunsData);

      res.status(201).json(result);
    } catch (error) {
      console.error('Error in saveTestRuns controller:', error);
      
      if (error instanceof Error) {
        // Errores de validación
        if (error.message.includes('Missing required field') || 
            error.message.includes('Invalid') ||
            error.message.includes('must be')) {
          res.status(400).json({
            success: false,
            error: 'Validation error',
            message: error.message,
          });
          return;
        }
      }

      // Error genérico del servidor
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to save test runs data',
      });
    }
  }
}