require("dotenv").config();

const fastify = require("fastify");
const cors = require("@fastify/cors");
const helmet = require("@fastify/helmet");
const Web3Token = require("web3-token");

/**
 * Environment variables.
 */

const SERVER_PORT = process.env.SERVER_PORT || 8080;

/**
 * Instances
 */

const app = fastify({
  logger: true,
});

/**
 * Middlewares
 */

app.register(helmet);
app.register(cors, { origin: "*" });

/**
 * Hooks
 */

const userGuardHook = async (request, reply) => {
  try {
    const token = request.headers["authorization"];
    if (!token) {
      return reply.status(401).send({
        error: "Unauthorized",
      });
    }

    const { address } = await Web3Token.verify(token);
    request["user-address"] = address;
  } catch (err) {
    return reply.status(403).send({
      error: "Forbidden",
    });
  }
};

/**
 * Handlers
 */

app.register(
  (instance, _, done) => {
    instance.addHook("preHandler", userGuardHook);

    instance.get("/me", async (request, reply) => {
      return { address: request["user-address"] };
    });

    done();
  },
  { prefix: "/user" }
);

app.get("/", async (request, reply) => {
  await reply.send({ hello: "world" });
});

/**
 * Application
 */

const start = async () => {
  try {
    await app.listen(SERVER_PORT);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};
start();
