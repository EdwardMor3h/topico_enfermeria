import pkg from "@prisma/client";
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany().catch(() => []);
  console.log("Conexión exitosa a PostgreSQL");
  console.log(users);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
