import app from './app.js';
import { sequelize, User } from './models/index.js';
import logger from './utils/logger.js';
import { runSeed, runTenantMigration } from './seed.js';

const PORT = process.env.PORT || 5000;

const start = async () => {
  let retries = 10;
  while (retries) {
    try {
      await sequelize.authenticate();
      logger.info('Database connected');
      break;
    } catch (err) {
      retries -= 1;
      logger.warn(`DB connection failed, retrying... (${retries} left)`);
      await new Promise((r) => setTimeout(r, 4000));
      if (!retries) { logger.error('Could not connect to DB'); process.exit(1); }
    }
  }

  await sequelize.sync({ alter: true });
  logger.info('Models synced');

  // Fresh DB → full demo seed (incl. tenancy). Existing DB → migrate to multi-tenant.
  const userCount = await User.count();
  if (userCount === 0) {
    if (process.env.AUTO_SEED === 'true') await runSeed();
  } else {
    await runTenantMigration();
  }

  app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));
};

start();
