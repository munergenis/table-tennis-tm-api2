import { Router } from "express"
import { tournamentController } from '../controllers/tournamentController.js'

// TODO - borrar comentari quan ja ho tingui clar
// Responsabilitats
// - defineix rutes relacionades amb tornejos
// - conecta cada ruta amb el controlador corresponent
// - pot incloure middleware especific per rutes com autenticacio o permisos
const router = Router()

router.post('/', tournamentController.createTournament)


export default router
