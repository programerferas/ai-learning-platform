import prisma from "../../lib/prisma.js";
import crypto from "crypto";
import bcrypt from "bcrypt";




export const getAllUsersService = async () => {
  return await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      phoneNumber: true,
      role: true,
      createdAt: true,
      isVerified: true,
    },
  });
};

export const getUserByIdService = async (id) => {
  return await prisma.user.findUnique({
    where: { id: id },
    select: {
      id: true,
      name: true,
      email: true,
      phoneNumber: true,
      role: true,
      createdAt: true,
      isVerified: true,
    },
  });
};

export const updateUserService = async (id, data) => {
  return await prisma.user.update({
    where: { id: id },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });
};

export const deleteUserService = async (id) => {
  return await prisma.user.delete({
    where: { id: id },
  });
};






