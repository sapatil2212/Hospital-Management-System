import prisma from "../config/db";
import { Prisma } from "@prisma/client";

export const createUser = async (data: Prisma.UserCreateInput) => {
  return await prisma.user.create({ data });
};

export const findUserByEmail = async (email: string) => {
  return await prisma.user.findUnique({
    where: { email },
    include: { hospital: true },
  });
};

export const findUserById = async (id: string, hospitalId?: string) => {
  return await prisma.user.findUnique({
    where: {
      id,
      ...(hospitalId ? { hospitalId } : {}),
    },
    include: { hospital: true },
  });
};

export const findAllUsers = async (hospitalId: string) => {
  return await prisma.user.findMany({
    where: { hospitalId },
  });
};

export const updateUser = async (id: string, data: Prisma.UserUpdateInput, hospitalId?: string) => {
  return await prisma.user.update({
    where: {
      id,
      ...(hospitalId ? { hospitalId } : {}),
    },
    data,
  });
};

export const deleteUser = async (id: string, hospitalId?: string) => {
  return await prisma.user.delete({
    where: {
      id,
      ...(hospitalId ? { hospitalId } : {}),
    },
  });
};
