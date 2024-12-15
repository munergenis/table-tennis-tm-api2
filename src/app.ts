import express from "express";
import tournamentRouter from "@tournaments/tournamentRouter.js";

const app = express();

// Middlewares
app.use(express.json());
// TODO - investigar - en teoria es per manejar formularis
app.use(express.urlencoded({ extended: true }));

app.use("/tournaments", tournamentRouter);
app.all("*", (req, res) => {
  res.status(404).json({
    message: `Can't find ${req.originalUrl} on the server.`,
  });
});

export default app;
