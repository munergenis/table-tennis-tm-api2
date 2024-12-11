import { Request, Response } from "express"
import { TournamentModel } from "./tournamentModel"
import { CreateTournamentSchema, tournamentClientData, UpdateTournamentSchema } from "./tournamentSchema"
import { tournamentService } from "./service/tournamentService"

// TODO - nota - borrar comentari quan ja ho tingui clar
// Responsabilitats 
// - intermediari entre router i logica de negoci (service)
// - rep i valida dades de solicituds (zod, middlewares)
// - crida metodes del model per executar operacions a la db
// - prepara i envia resposta http al client
// - exemple: 
// --- rebre dades de torneig, validarles, computar dades adicionals i cridar al model per interaccio amb db
export const tournamentController = {
  async getAllTournaments(req: Request, res: Response) {

    // TODO - tasca - manejar errors
    // try
    const result = await TournamentModel.getAllTournamets() // TODO - dubte i tasca - manejar la possibilitat derror // ja es maneja amb el try catch? seria un 500?
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

    // TODO - tasca - manejar errors
    // try
    const result = await TournamentModel.getTournamentById(id) // TODO - dubte i tasca - manejar la possibilitat derror // ja es maneja amb el try catch? seria un 500?

    if (!result) {
      // NOT FOUND
      res.status(404).json({ message: 'Tournament not found' })
      return
    }

    // OK
    res.status(200).json(result)
    return
    // catch
  },

  async createTournament(req: Request, res: Response) {
    // TODO - tasca - manejar errors
    try {

      const tournamentData: tournamentClientData = CreateTournamentSchema.parse(req.body)

      const generatedTournament = tournamentService.generateTournament(tournamentData)

      const newTournament = await TournamentModel.createTournament(generatedTournament) // TODO - dubte i tasca - manejar la possibilitat derror // ja es maneja amb el try catch? seria un 500?

      // CREATED
      res.status(201).json(newTournament)

    } catch (error) {
      res.json({ message: error })
    }
  },

  async updateTournament(req: Request, res: Response) {
    const { id } = req.params

    if (!id) {
      res.status(400).json({ message: 'Bad request. Id is missing' })
      return 
    }

    // TODO - tasca - manejar errors
    // try
    const parsedData = UpdateTournamentSchema.parse(req.body)

    const tournament = await TournamentModel.getTournamentById(id) // TODO - dubte i tasca - manejar la possibilitat derror // ja es maneja amb el try catch? seria un 500?

    if (!tournament) {
      // NOT FOUND
      res.status(404).json({ message: 'Tournament not found' })
      return 
    }

    const updatedTournament = await TournamentModel.updateTournament(id, parsedData) // TODO - dubte i tasca - manejar la possibilitat derror // ja es maneja amb el try catch? seria un 500?

    // OK
    res.status(200).json(updatedTournament)
    // catch
  },

  async randomizeFirstRound(req: Request, res: Response) {
    const { id } = req.params
    console.log(req.params)

    if (!id) {
      res.status(400).json({ message: 'Bad request. Id is missing' })
      return
    }

    // TODO - tasca - manejar errors
    // try
    const tournament = await TournamentModel.getTournamentById(id)

    if (!tournament) {
      res.status(404).json({ message: 'Tournament not found' })
    }

    const tournamentWithNewFirstRound = tournamentService.randomizeFirstRound(tournament)

    const updatedTournament = await TournamentModel.updateTournament(id, { 
      players: tournamentWithNewFirstRound.players, 
      qualificationRounds: tournamentWithNewFirstRound.qualificationRounds 
    })
    
    res.status(200).json(updatedTournament)
    // catch
  }
}
