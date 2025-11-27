import { ICommitRepository } from '../domain/ICommitRepository';
import { CommitData } from '../domain/CommitData';

export class SaveCommitUseCase {
  constructor(private readonly commitRepository: ICommitRepository) {}

  /**
   * Valida y guarda los datos del commit
   */
  async execute(commitData: CommitData): Promise<{ success: boolean; message: string }> {
    try {
      this.validateCommitData(commitData);

      await this.commitRepository.saveCommit(commitData);

      return {
        success: true,
        message: `Commit ${commitData._id} saved successfully`,
      };
    } catch (error) {
      console.error('Error in SaveCommitUseCase:', error);
      throw error;
    }
  }

  /**
   * Valida que los datos del commit sean correctos
   */
  private validateCommitData(commitData: CommitData): void {
    const requiredFields = ['_id', 'branch', 'author', 'user_id', 'repo_name'];
    
    for (const field of requiredFields) {
      if (!commitData[field as keyof CommitData]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Validar que _id parezca un SHA (40 caracteres hexadecimales)
    if (!/^[a-f0-9]{7,40}$/i.test(commitData._id)) {
      throw new Error('Invalid commit SHA format');
    }

    // Validar estructura de commit
    if (!commitData.commit || !commitData.commit.date || !commitData.commit.message) {
      throw new Error('Invalid commit structure');
    }

    // Validar valores numéricos
    if (typeof commitData.coverage !== 'number' || commitData.coverage < 0 || commitData.coverage > 100) {
      throw new Error('Coverage must be a number between 0 and 100');
    }

    if (typeof commitData.test_count !== 'number' || commitData.test_count < 0) {
      throw new Error('test_count must be a non-negative number');
    }

    if (typeof commitData.failed_tests !== 'number' || commitData.failed_tests < 0) {
      throw new Error('failed_tests must be a non-negative number');
    }
  }
}