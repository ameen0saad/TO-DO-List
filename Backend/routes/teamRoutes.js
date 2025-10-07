import express from 'express';
import * as teamController from '../controller/teamController.js';
import * as authController from '../controller/authController.js';

const router = express.Router();

router.use(authController.protect);
router.route('/').get(teamController.getAllTeams).post(teamController.createTeam);

router.patch(
  '/deletememper/:teamId',
  teamController.checkTeamAccess,
  teamController.deleteMembersFromTeam
);
router.patch('/leaveTeam/:teamId', teamController.checkTeamAccess, teamController.leaveTeam);

router.patch(
  '/transfareOwner/:teamId',
  teamController.checkTeamAccess,
  teamController.transferOwnership
);
router
  .route('/:teamId')
  .all(teamController.checkTeamAccess)
  .get(teamController.getOneTeam)
  .patch(teamController.updateTeam)
  .delete(teamController.deleteTeam);

export default router;
