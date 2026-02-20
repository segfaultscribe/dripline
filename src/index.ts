import { startServer } from "./server";

const srv = startServer();

console.log(`Gateway active on port ${srv?.server?.port}`);


let shutDown = false;

async function gracefulShutdown(server: any){
  if(shutDown) return;
  shutDown  = true;
  console.log(`Server shutting down...\n`);
  try {
    await server.stop();
    console.log(`Bye!`);
    process.exit(0);
  } catch(err: unknown){
    console.error(err);
    process.exit(1);
  }
}

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);





