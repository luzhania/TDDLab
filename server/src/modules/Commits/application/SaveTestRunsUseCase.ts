import { ICommitRepository } from '../domain/ICommitRepository';
import { TestRunsData } from '../domain/CommitData';

export class SaveTestRunsUseCase {
  constructor(private readonly commitRepository: ICommitRepository) {}

  /**
   * Valida y guarda los test runs
   */
  async execute(testRunsData: TestRunsData): Promise<{ success: boolean; message: string; count: number }> {
    try {
      this.validateTestRunsData(testRunsData);

      await this.commitRepository.saveTestRuns(testRunsData);

      return {
        success: true,
        message: `Test runs saved successfully`,
        count: testRunsData.runs.length,
      };
    } catch (error) {
      console.error('Error in SaveTestRunsUseCase:', error);
      throw error;
    }
  }

  /**
   * Valida que los datos de test runs sean correctos
   */
  private validateTestRunsData(testRunsData: TestRunsData): void {
    const requiredFields = ['commit_sha', 'branch', 'user_id', 'repo_name', 'runs'];
    
    for (const field of requiredFields) {
      if (!testRunsData[field as keyof TestRunsData]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Validar que commit_sha parezca un SHA
    if (!/^[a-f0-9]{7,40}$/i.test(testRunsData.commit_sha)) {
      throw new Error('Invalid commit SHA format');
    }

    // Validar que runs sea un array
    if (!Array.isArray(testRunsData.runs)) {
      throw new Error('runs must be an array');
    }

    // Validar que haya al menos un test run
    if (testRunsData.runs.length === 0) {
      throw new Error('runs array cannot be empty');
    }

    // Validar cada test run
    for (const run of testRunsData.runs) {
      this.validateTestRun(run);
    }
  }

  /**
   * Valida un test run individual
   */
  private validateTestRun(run: any): void {
    if (!run.execution_timestamp || typeof run.execution_timestamp !== 'number') {
      throw new Error('execution_timestamp must be a valid number');
    }

    if (!run.summary || typeof run.summary !== 'object') {
      throw new Error('summary must be an object');
    }

    const { passed, failed, total } = run.summary;

    if (typeof passed !== 'number' || passed < 0) {
      throw new Error('summary.passed must be a non-negative number');
    }

    if (typeof failed !== 'number' || failed < 0) {
      throw new Error('summary.failed must be a non-negative number');
    }

    if (typeof total !== 'number' || total < 0) {
      throw new Error('summary.total must be a non-negative number');
    }

    // Validar consistencia
    if (passed + failed !== total) {
      throw new Error('summary.total must equal passed + failed');
    }

    if (typeof run.success !== 'boolean') {
      throw new Error('success must be a boolean');
    }
  }
}