import { CommitData, TestRunsData, BranchData } from './CommitData';

export interface ICommitRepository {
  /**
   * Guarda un commit en la base de datos
   * @param commitData Datos del commit a guardar
   * @returns Promise con el resultado de la operación
   */
  saveCommit(commitData: CommitData): Promise<void>;

  /**
   * Guarda múltiples test runs asociados a un commit
   * @param testRunsData Datos de los test runs a guardar
   * @returns Promise con el resultado de la operación
   */
  saveTestRuns(testRunsData: TestRunsData): Promise<void>;

  /**
   * Actualiza o crea información de una rama
   * @param branchData Datos de la rama a actualizar
   * @returns Promise con el resultado de la operación
   */
  updateBranch(branchData: BranchData): Promise<void>;
}