import app from './app.js';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
dotenv.config();
process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});
const port = process.env.PORT || 3000;

const prisma = new PrismaClient();

prisma
  .$connect()
  .then(() => {
    console.log('DB connected successfully');
  })
  .catch((err) => {
    console.log(err);
  });

app.listen(port, () => {
  console.log(`server is runing on port ${port}`);
});

process.on('unhandledRejection', (err) => {
  console.log('unhandled Rejection! 💥 Shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
