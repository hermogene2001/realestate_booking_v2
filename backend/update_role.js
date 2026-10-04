const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.user.update({where:{email:'owner@test.com'},data:{role:'ADMIN'}})
 .then(u => console.log('Updated:', u.role))
 .catch(e => console.log(e.message))
 .finally(() => p.$disconnect());
