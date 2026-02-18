import { Elysia } from "elysia";

const app = new Elysia();

// Helper to read JSON body safely
async function readJsonBody(req: Request) {
  try {
    return await req.json();
  } catch {
    return null;
  }
}
 // Normal fast endpoint
app.post("/ai/test", async ({ request, query }) => {
  const body = await readJsonBody(request);

  console.log("----- UPSTREAM HIT -----");
  console.log("Path: /ai/test");
  console.log("Query:", query);
  console.log("Method:", request.method);
  console.log("Headers:", Object.fromEntries(request.headers.entries()));
  console.log("Body:", body);
  console.log("------------------------");

  return {
    message: "Hello from upstream",
    query,
    received: body,
  };
});

// Slow endpoint (for timeout testing)
app.post("/ai/slow", async ({ request }) => {
  const body = await readJsonBody(request);

  console.log("----- SLOW ENDPOINT HIT -----");
  console.log("Simulating 10s delay...");
  console.log("Body:", body);

  await new Promise((resolve) => setTimeout(resolve, 10000));

  return {
    message: "Slow response complete",
    received: body,
  };
});

// Streaming endpoint
app.get("/ai/stream", () => {
  console.log("----- STREAM ENDPOINT HIT -----");

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue("chunk 1\n");

      setTimeout(() => {
        controller.enqueue("chunk 2\n");
      }, 1000);

      setTimeout(() => {
        controller.enqueue("chunk 3\n");
        controller.close();
      }, 2000);
    },
  });

  

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain",
    },
  });
});

  app.get("/healthz", () => {
    return {
      status: "ok",
      uptime: process.uptime(),
      timestamp: Date.now(),
    };
  });


const server = app.listen(4000);

// console.log("Upstream test server running at http://localhost:4000");

if (server) {
  console.log(`Upstream running at http://localhost:4000`);
} else {
  console.error("❌ Failed to start upstream server");
}