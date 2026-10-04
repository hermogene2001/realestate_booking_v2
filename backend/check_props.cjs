const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.property.findMany({ take: 5, orderBy: { id: 'desc' } }).then(r => {
  r.forEach(x => console.log(x.id, x.title, 'status:', x.status, 'approved:', x.isApproved));
  p.$disconnect();
}).catch(e => { console.error(e); p.$disconnect(); });
