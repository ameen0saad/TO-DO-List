import { PrismaClient } from '@prisma/client';
import AppError from '../utils/AppError.js';
import ApiFeatures from '../utils/ApiFeatures.js';
const prisma = new PrismaClient();

export const getAllTeamTasks = async (req, res, next) => {
  const teamId = req.team.id;

  const features = new ApiFeatures(prisma.teamTask, req.query)
    .filter('teamId', teamId)
    .search()
    .sort()
    .select()
    .include()
    .paginate();
  const result = await features.execute();

  res.status(200).json({
    status: 'Success',
    result: result.length,
    data: {
      result,
    },
  });
};

export const getTeamTask = async (req, res, next) => {
  const teamId = req.team.id;
  const { id } = req.params;

  const teamTask = await prisma.teamTask.findFirst({
    where: { id: id, teamId },
  });
  if (!teamTask) return next(new AppError('there is no team tasks with that ID !', 404));

  res.status(200).json({
    status: 'Success',
    data: {
      teamTask,
    },
  });
};

export const createTeamTask = async (req, res, next) => {
  const team = req.team;
  const teamId = team.id;
  const { title, description, priority, status, completed, dueDate } = req.body;
  if (team.ownerId !== req.user.id) {
    return next(new AppError('You are not authorized to create tasks', 401));
  }
  const teamTask = await prisma.teamTask.create({
    data: {
      title,
      description,
      priority,
      status,
      completed,
      dueDate,
      teamId,
    },
  });

  res.status(201).json({
    status: 'Success',
    data: {
      teamTask,
    },
  });
};

export const updateTeamTask = async (req, res, next) => {
  const team = req.team;
  const { id } = req.params;
  const { title, description, priority, status, completed, dueDate } = req.body;

  const isStatusOnly =
    Object.keys(req.body).length === 1 && Object.keys(req.body).includes('status');

  if (!isStatusOnly && req.team.ownerId !== req.user.id) {
    return next(new AppError('You are not authorized to update this task', 403));
  }

  const teamTask = await prisma.teamTask.update({
    where: { id, teamId: team.id },
    data: { title, description, priority, status, completed, dueDate },
  });

  res.status(200).json({
    status: 'Success',
    data: {
      teamTask,
    },
  });
};

export const deleteTeamTask = async (req, res, next) => {
  const team = req.team;
  const { id } = req.params;

  await prisma.teamTask.delete({ where: { id, teamId: team.id } });
  res.status(204).json({});
};
