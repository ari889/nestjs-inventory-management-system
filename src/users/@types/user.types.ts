import { Prisma } from 'src/generated/prisma/client';

export type UserListItem = Prisma.UserGetPayload<{
  select: {
    id: true;
    name: true;
    email: true;
    phoneNo: true;
    avatar: true;
    gender: true;
    status: true;
    createdAt: true;
    role: {
      select: {
        id: true;
        roleName: true;
      };
    };
    creator: {
      select: {
        id: true;
        name: true;
      };
    };
  };
}>;
