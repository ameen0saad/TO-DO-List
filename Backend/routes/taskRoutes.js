import express from 'express';
import * as taskController from '../controller/taskController.js';
import * as authController from '../controller/authController.js';

const router = express.Router();

router.use(authController.protect);
router.route('/').get(taskController.getAll).post(taskController.createTask);
router.get('/completedTask', taskController.getCompletedTask);
router
  .route('/:id')
  .get(taskController.getOne)
  .patch(taskController.updateTask)
  .delete(taskController.deleteTask);

export default router;
