import { PrismaClient } from '@prisma/client';
import AppError from '../utils/AppError.js';
import ApiFeatures from '../utils/ApiFeatures.js';
const prisma = new PrismaClient();

export const getAll = async (req, res, next) => {
  const features = new ApiFeatures(prisma.task, req.query)
    .filter(req.user.id)
    .search()
    .sort()
    .select()
    .include()
    .paginate();
  const result = await features.execute();

  res.status(200).json({
    status: 'success',
    data: { tasks: result.data },
    pagination: result.pagination,
  });
};

export const getOne = async (req, res, next) => {
  const task = await prisma.task.findFirst({
    where: {
      id: req.params.id,
      userId: req.user.id,
    },
  });
  if (!task) return next(new AppError('There is no task with that ID ', 404));
  res.status(200).json({
    status: 'Success',
    task,
  });
};

export const createTask = async (req, res, next) => {
  const { title, priority, status, completed, dueDate, description } = req.body;
  if (!title) return next(new AppError('Please provide task title', 401));
  const task = await prisma.task.create({
    data: { title, userId: req.user.id, priority, status, completed, dueDate, description },
  });
  res.status(201).json({
    status: 'Success',
    data: {
      task,
    },
  });
};

export const updateTask = async (req, res, next) => {
  const data = req.body;

  const task = await prisma.task.update({
    data,
    where: {
      id: req.params.id,
      userId: req.user.id,
    },
  });
  res.status(200).json({
    Status: 'Success',
    data: {
      task,
    },
  });
};

export const deleteTask = async (req, res, next) => {
  await prisma.task.delete({ where: { id: req.params.id, userId: req.user.id } });

  res.status(204).json({});
};

export const getCompletedTask = async (req, res, next) => {
  const completedTas = await prisma.task.findMany({
    where: {
      userId: req.user.id,
      completed: true,
    },
  });
};
