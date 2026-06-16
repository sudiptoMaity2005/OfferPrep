import { prisma } from 'database';

async function main() {
  const users = await prisma.user.findMany();
  console.log("Users:", users);
  
  const sessions = await prisma.interviewSession.findMany();
  console.log("Sessions:", sessions.map(s => ({ id: s.id, userId: s.userId })));
}

main().catch(console.error).finally(() => prisma.$disconnect());
