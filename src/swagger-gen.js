import swaggerAutogen from "swagger-autogen";

const doc = {
  info: {
    title: "LeetLab Api",
    description: "Comprehensive API documentation for the LeetLab platform.",
  },
  host: "localhost:5000",
};

const outputFile = "./swagger-output.json";
const routes = [
  "./dist/routes/auth.routes.js",
  "./dist/routes/healthcheck.routes.js",
  "./dist/routes/project.routes.js",
  "./dist/routes/note.routes.js",
  "./dist/routes/task.routes.js",
];

swaggerAutogen(outputFile, routes, doc);
