import express from 'express';
import * as teamTaskController from '../controller/teamTaskController.js';
import * as teamController from '../controller/teamController.js';
import * as authController from '../controller/authController.js';

const router = express.Router();

router.use(authController.protect);

router
  .route('/:teamId')
  .all(teamController.checkTeamAccess)
  .get(teamTaskController.getAllTeamTasks)
  .post(teamTaskController.createTeamTask);

router
  .route('/:teamId/:id')
  .all(teamController.checkTeamAccess)
  .get(teamController.checkTeamAccess, teamTaskController.getTeamTask)
  .patch(teamController.checkTeamAccess, teamTaskController.updateTeamTask)
  .delete(teamController.checkTeamAccess, teamTaskController.deleteTeamTask);

export default router;
