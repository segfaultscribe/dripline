import { serve } from "bun";

serve({
  port: 3000,
  fetch(req) {
    return new Response("Hello Bun + Typescript!", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  },
});

console.log("Server running at http://localhost:3000");

