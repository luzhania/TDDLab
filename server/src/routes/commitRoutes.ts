import { Router } from 'express';
import { CommitController } from '../controllers/CommitController/CommitController';
import { FirebaseCommitRepository } from '../modules/Commits/repository/FirebaseCommitRepository';

const router = Router();

// Inicializar repositorio y controlador
const commitRepository = new FirebaseCommitRepository();
const commitController = new CommitController(commitRepository);

/**
 * POST /commits
 * Endpoint para recibir datos de commits desde el proyecto base
 */
router.post('/commits', (req, res) => commitController.saveCommit(req, res));

/**
 * POST /test-runs
 * Endpoint para recibir datos de test runs desde el proyecto base
 */
router.post('/test-runs', (req, res) => commitController.saveTestRuns(req, res));

export default router;