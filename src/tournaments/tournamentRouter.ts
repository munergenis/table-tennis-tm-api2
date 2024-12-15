import { Router } from "express";
import { authenticate } from "@middleware/auth.js";
import { tournamentController } from "@tournaments/tournamentController.js";

// TODO - nota - borrar comentari quan ja ho tingui clar
// Responsabilitats
// - defineix rutes relacionades amb tornejos
// - conecta cada ruta amb el controlador corresponent
// - pot incloure middleware especific per rutes com autenticacio o permisos
const router = Router();

// rutes publiques
router.get("/", tournamentController.getAllTournaments);
router.get("/:tournamentId", tournamentController.getTournamentById);

// rutes privades
router.post("/", authenticate, tournamentController.createTournament);
router.patch(
  "/:tournamentId",
  authenticate,
  tournamentController.updateTournament
);
router.post(
  "/:tournamentId/randomize-first-round",
  authenticate,
  tournamentController.randomizeFirstRound
);
router.patch(
  "/:tournamentId/matches/:matchId",
  authenticate,
  tournamentController.registerMatchResult
);
// router.post(
//   "/:tournamentId/rounds",
//   authenticate,
//   tournamentController.createNextRound
// );

// TODO - tasca
// router.patch('/:tournamentId/players/:playerId', authenticate, tournamentController.updatePlayerDetails )

export default router;
