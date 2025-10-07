import { PrismaClient } from '@prisma/client';

import AppError from '../utils/AppError.js';

const prisma = new PrismaClient();

export const checkTeamAccess = async (req, res, next) => {
  const teamId = req.params.teamId;
  const team = await prisma.team.findFirst({
    where: { id: teamId, user: { some: { id: req.user.id } } },
    include: {
      user: { select: { email: true, name: true, id: true } },
      owner: { select: { email: true, name: true, id: true } },
    },
  });
  if (!team) return next(new AppError('No team found with this ID or you are not part of it', 404));
  req.team = team;
  next();
};

export const getAllTeams = async (req, res, next) => {
  const teams = await prisma.team.findMany({
    where: {
      OR: [{ user: { some: { id: req.user.id } } }, { ownerId: req.user.id }],
    },
    include: { owner: { select: { email: true, name: true, id: true } } },
    include: { user: { select: { email: true, id: true, name: true } } },
  });

  res.status(200).json({
    status: 'Success',
    result: teams.length,
    data: {
      teams,
    },
  });
};

export const getOneTeam = async (req, res, next) => {
  const team = req.team;

  res.status(200).json({
    status: 'Success',
    data: {
      team,
    },
  });
};

export const createTeam = async (req, res, next) => {
  const { name, description } = req.body;
  const newTeam = await prisma.team.create({
    data: { name, description, ownerId: req.user.id, user: { connect: { id: req.user.id } } },
    include: {
      user: { select: { id: true, name: true, email: true } },
      owner: { select: { id: true, name: true, email: true } },
    },
  });
  res.status(201).json({
    status: 'Success',
    data: {
      team: newTeam,
    },
  });
};

export const updateTeam = async (req, res, next) => {
  const { name, description, emailMembers } = req.body;
  const team = req.team;
  if (team.ownerId !== req.user.id)
    return next(new AppError('You are not authorized to update this team', 403));
  let members;

  if (emailMembers?.length) {
    members = await Promise.all(
      emailMembers.filter(Boolean).map(async (email) => {
        const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
        if (!user) return { message: ` there is no user with that email : ${email}` };
        return user;
      })
    );
  }
  if (members && members.length > 0) {
    const error = members.filter((e) => e.message);
    if (error.length > 0) return next(new AppError(error[0].message, 404));
  }

  const updatedTeam = await prisma.team.update({
    where: { id: team.id },
    data: { name, description, user: { connect: members } },
    include: {
      user: { select: { id: true, name: true, email: true } },
      owner: { select: { id: true, name: true, email: true } },
    },
  });

  res.status(200).json({
    status: 'Success',
    data: {
      updatedTeam,
    },
  });
};

export const deleteTeam = async (req, res, next) => {
  const team = req.team;
  if (team.ownerId !== req.user.id)
    return next(new AppError('You are not authorized to delete this team', 403));

  await prisma.team.delete({
    where: { id: team.id },
  });

  res.status(204).json({});
};

export const deleteMembersFromTeam = async (req, res, next) => {
  const { emailMembers } = req.body;
  const team = req.team;

  if (req.user.id !== team.ownerId)
    return next(new AppError('Only the owner can remove members from the team', 403));

  if (!emailMembers?.length)
    return next(new AppError('Please provide the email members to delete', 400));

  let members;
  if (emailMembers?.length) {
    members = await Promise.all(
      emailMembers.filter(Boolean).map(async (email) => {
        const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });

        if (!user) return { message: ` there is no user with that email : ${email}` };
        if (team.ownerId == user.id)
          return { message: ` You can not delete the owner of the team : ${email}` };
        return user;
      })
    );
  }
  if (members && members.length > 0) {
    const error = members.filter((e) => e.message);
    if (error.length > 0) return next(new AppError(error[0].message, 404));
  }

  const updatedTeam = await prisma.team.update({
    where: { id: team.id },
    data: { user: { disconnect: members } },
  });
  res.status(200).json({
    status: 'Success',
    data: {
      team: updatedTeam,
    },
  });
};

export const leaveTeam = async (req, res, next) => {
  const team = req.team;

  if (req.user.id === team.ownerId) {
    return next(
      new AppError('Owner cannot leave the team. Transfer ownership or delete the team.', 403)
    );
  }

  const updatedTeam = await prisma.team.update({
    where: { id: team.id },
    data: { user: { disconnect: { id: req.user.id } } },
  });
  res.status(200).json({
    status: 'Success',
    message: 'You have left the team successfully',
    data: {
      team: updatedTeam,
    },
  });
};

export const transferOwnership = async (req, res, next) => {
  const { idMember } = req.body;
  const team = req.team;

  if (!idMember)
    return next(new AppError('Please provide the member ID to transfer ownership', 400));

  if (req.user.id !== team.ownerId)
    return next(new AppError('Only the owner can transfer ownership of the team', 403));

  if (req.user.id === idMember)
    return next(new AppError('You cannot transfer ownership to yourself', 400));

  const isMember = team.user.some((member) => member.id === idMember);
  if (!isMember) return next(new AppError('This user does not belong to this team', 403));

  const user = await prisma.user.findUnique({ where: { id: idMember } });
  if (!user) return next(new AppError(`There is no user with that ID: ${idMember}`, 404));

  const updatedTeam = await prisma.team.update({
    where: { id: team.id },
    data: { ownerId: user.id },
  });

  res.status(200).json({
    status: 'Success',
    message: 'Ownership transferred successfully',
    data: { team: updatedTeam },
  });
};
