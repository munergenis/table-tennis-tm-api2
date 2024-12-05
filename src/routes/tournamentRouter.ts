import { Request, Response, Router } from "express"
import { tournamentController } from '../controllers/tournamentController.js'
import RequestWithUser from "../types/express/index.js"
import { authenticate } from "../middleware/auth.js"

// TODO - borrar comentari quan ja ho tingui clar
// Responsabilitats
// - defineix rutes relacionades amb tornejos
// - conecta cada ruta amb el controlador corresponent
// - pot incloure middleware especific per rutes com autenticacio o permisos
const router = Router()

// TODO - afegir
//
// PUT actualitzar tournament
// router.put('/:id') -> req.body

router.get('/', tournamentController.getAllTournaments)

router.get('/:id', tournamentController.getTournamentById)

router.post(
  '/',
  // authenticate,
  (req: Request /* RequestWithUser per afegir middleware authenticate */, res: Response) => {
    // TODO - veure com afegir el middleware i revisar els errors de tipat
    // const userRole = req.user?.role

    // if (!userRole) {
    //   // UNAUTHORIZED
    //   res.status(401).json({ message: 'Unauthorized. Token required' })
    //   return
    //   // TODO - preguntar perque no funciona aixo
    //   // return res.status(401).json({ message: 'Unauthorized. Token required' })
    // }

    // if (userRole !== 'admin') {
    //   // FORBIDDEN
    //   res.status(403).json({ message: 'Forbidden. Role not allowed' })
    //   return
    // }

    tournamentController.createTournament(req, res)
  })


export default router
