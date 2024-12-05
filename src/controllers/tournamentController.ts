import { Request, Response } from "express"
import { TournamentModel } from "../models/tournamentModel"
import { CreateTournamentSchema, UpdateTournamentSchema } from "../schemas/tournamentSchema"
import { calculateMaxRounds } from "../utils/calculations"

// TODO - borrar comentari quan ja ho tingui clar
// Responsabilitats 
// - intermediari entre router i logica de negoci
// - rep i valida dades de solicituds (zod, middlewares)
// - crida metodes del model per executar operacions a la db
// - prepara i envia resposta http al client
// - exemple: 
// --- rebre dades de torneig, validarles, computar dades adicionals i cridar al model per interaccio amb db
export const tournamentController = {
  async getAllTournaments(req: Request, res: Response) {

    // TODO - manejar errors
    // try
    const result = await TournamentModel.getAllTournamets() // TODO - manejar la possibilitat derror // ja es maneja amb el try catch? seria un 500?
    // catch

    // OK
    res.status(200).json(result)
  },

  async getTournamentById(req: Request, res: Response) {
    const { id } = req.params

    if (!id) {
      // BAD REQUEST
      res.status(400).json({ message: 'Bad request. Id is missing' })
      return
    }

    // TODO - manejar errors
    // try
    const result = await TournamentModel.getTournamentById(id) // TODO - manejar la possibilitat derror // ja es maneja amb el try catch? seria un 500?

    if (!result) {
      // NOT FOUND
      res.status(404).json({ message: 'Tournament not found' })
      // TODO - no funciona -> return res.status(404).json({ message: 'Tournament not found' })
      return
    }

    // OK
    res.status(200).json(result)
    return
    // catch
  },

  async createTournament(req: Request, res: Response) {
    // TODO - manejar errors
    try {

      const tournamentData = CreateTournamentSchema.parse(req.body)

      const { maxQualificationRounds, maxEliminationRounds } = calculateMaxRounds(tournamentData.playersInput.length)

      const computedData = {
        ...tournamentData,
        maxQualificationRounds,
        maxEliminationRounds,
        currentRoundNum: 0,
        status: 'pending', // TODO - treure de ts enum TournamentStatus
      }

      const newTournament = await TournamentModel.createTournament(computedData) // TODO - manejar la possibilitat derror // ja es maneja amb el try catch? seria un 500?

      // CREATED
      res.status(201).json(newTournament)
      // catch (error)

    } catch (error) {
      return res.json({ message: error })
    }
    // -- next(error)
  },

  async updateTournament(req: Request, res: Response) {
    const { id } = req.params

    if (!id) {
      return res.status(400).json({ message: 'Bad request. Id is missing' })
    }

    // TODO - manejar errors
    // try
    const parsedData = UpdateTournamentSchema.parse(req.body)

    const tournament = await TournamentModel.getTournamentById(id) // TODO - manejar la possibilitat derror // ja es maneja amb el try catch? seria un 500?

    if (!tournament) {
      // NOT FOUND
      return res.status(404).json({ message: 'Tournament not found' })
    }

    const updatedTournament = await TournamentModel.updateTournament(id, parsedData) // TODO - manejar la possibilitat derror // ja es maneja amb el try catch? seria un 500?

    // OK
    res.status(200).json(updatedTournament)
    // catch
  }
}
