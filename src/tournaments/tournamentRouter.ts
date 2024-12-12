import { Request, Response, Router } from "express"
import { authenticate } from "../middleware/auth"
import { tournamentController } from "./tournamentController"

// TODO - nota - borrar comentari quan ja ho tingui clar
// Responsabilitats
// - defineix rutes relacionades amb tornejos
// - conecta cada ruta amb el controlador corresponent
// - pot incloure middleware especific per rutes com autenticacio o permisos
const router = Router()

// rutes publiques
router.get('/', tournamentController.getAllTournaments)
router.get('/:id', tournamentController.getTournamentById)

// auth
router.use(authenticate)
// rutes privades
router.post('/', tournamentController.createTournament)
router.put('/:id', tournamentController.updateTournament)
router.put('/:id/randomize-first-round', tournamentController.randomizeFirstRound)
router.put('/:id/register-match-result', tournamentController.registerMatchResult)

export default router
