AWS RDS PostgreSQL added parameter group and changed rds.force_ssl to 0 make sure public is enabled and choose a public subnet

drizzle-kit migrate error ran drizzle-kit export to create SQL file, then ran SQL manually in DbVisualizer pnpm run db:export > export.sql

error: drizzle-kit migrate --config=drizzle/drizzle.config.ts

Reading config file '/Users/jonaddamsnutrient/SE/code/sign/drizzle/drizzle.config.ts' Using 'pg' driver for database querying [⣯] applying migrations...Error:
self-signed certificate in certificate chain at
/Users/jonaddamsnutrient/SE/code/sign/node*modules/.pnpm/pg-pool@3.8.0_pg@8.14.1/node_modules/pg-pool/index.js:45:11 at process.processTicksAndRejections
(node:internal/process/task_queues:105:5) at async PgDialect.migrate
(/Users/jonaddamsnutrient/SE/code/sign/node_modules/.pnpm/drizzle-orm@0.41.0*@aws-sdk+client-rds-data@3.775.0_@neondatabase+serverless@1.0.0_@typ*f9132be99cbe4233dcdf76ebc73e32be/node_modules/src/pg-core/dialect.ts:85:3)
at async migrate
(/Users/jonaddamsnutrient/SE/code/sign/node_modules/.pnpm/drizzle-orm@0.41.0*@aws-sdk+client-rds-data@3.775.0_@neondatabase+serverless@1.0.0_@typ_f9132be99cbe4233dcdf76ebc73e32be/node_modules/src/node-postgres/migrator.ts:10:2)
{ code: 'SELF_SIGNED_CERT_IN_CHAIN' }  ELIFECYCLE  Command failed with exit code 1.
