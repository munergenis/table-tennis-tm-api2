import { Request, Response } from "express"
import { TournamentModel } from "./tournamentModel"
import { CreateTournamentSchema, RegisterMatchClientData, RegisterMatchSchema, TournamentClientData, UpdateTournamentClientData, UpdateTournamentSchema } from "./tournamentSchema"
import { tournamentService } from "./service/tournamentService"

// TODO - nota - borrar comentari quan ja ho tingui clar
// Responsabilitats 
// - intermediari entre router i logica de negoci (service)
// - rep i valida dades de solicituds (zod, middlewares)
// - crida metodes del model per executar operacions a la db
// - prepara i envia resposta http al client
// - exemple: 
// --- rebre dades de torneig, validarles, computar dades adicionals i cridar al model per interaccio amb db

// TODO - dubte i investigar - s'esta gestionant tots els errors amb 500, pero s'hauria de poder filtrar el tipus d'error al catch
export const tournamentController = {
  async getAllTournaments(req: Request, res: Response) {
    try {
      const result = await TournamentModel.getAllTournamets() // TODO - dubte i tasca - manejar la possibilitat derror. Ja es suficient amb 500?

      // OK
      res.status(200).json(result)

    } catch (err) {
      // 500
      res.status(500).json({ message: err})
    }
  },

  async getTournamentById(req: Request, res: Response) {
    const { id } = req.params

    if (!id) {
      // BAD REQUEST
      res.status(400).json({ message: 'Bad request. Id is missing' })
      return
    }

    try {
      const result = await TournamentModel.getTournamentById(id) // TODO - dubte i tasca - manejar la possibilitat derror. Ja es suficient amb 500? 

      if (!result) {
        // NOT FOUND
        res.status(404).json({ message: 'Tournament not found' })
        return
      }
      
      // OK
      res.status(200).json(result)

    } catch (err) {
      // 500
      res.status(500).json({ message: err})
    }
  },

  async createTournament(req: Request, res: Response) {
    try {
      const tournamentData: TournamentClientData = CreateTournamentSchema.parse(req.body) // TODO - investigar - Aqui valida ZOD pero estem tornant un 500

      const generatedTournament = tournamentService.generateTournament(tournamentData)

      const newTournament = await TournamentModel.createTournament(generatedTournament) // TODO - dubte i tasca - manejar la possibilitat derror. Ja es suficient amb 500? 

      // CREATED
      res.status(201).json(newTournament)

    } catch (error) {
      // 500
      res.status(500).json({ message: error })
    }
  },

  async updateTournament(req: Request, res: Response) {
    const { id } = req.params

    if (!id) {
      res.status(400).json({ message: 'Bad request. Id is missing' })
      return 
    }

    try {
      const parsedData: UpdateTournamentClientData = UpdateTournamentSchema.parse(req.body) // TODO - investigar - Aqui valida ZOD pero estem tornant un 500

      const updatedTournament = await TournamentModel.updateTournamentDetails(id, parsedData) // TODO - dubte i tasca - manejar la possibilitat derror. Ja es suficient amb 500? 

      if (!updatedTournament) {
        // NOT FOUND
        res.status(404).json({ message: 'Tournament not found' })
        return 
      }
      
      // OK
      res.status(200).json(updatedTournament)

    } catch (err) {
      // 500
      res.status(500).json({ message: err })
    }
  },

  async randomizeFirstRound(req: Request, res: Response) {
    const { id } = req.params

    if (!id) {
      // BAD REQUEST
      res.status(400).json({ message: 'Bad request. Id is missing' })
      return
    }

    try {
      const tournament = await TournamentModel.getTournamentById(id) // TODO - dubte i tasca - manejar la possibilitat derror. Ja es suficient amb 500? 
      
      if (!tournament) {
        // NOT FOUND
        res.status(404).json({ message: 'Tournament not found' })
        return 
      }
      
      const tournamentWithNewFirstRound = tournamentService.randomizeFirstRound(tournament)
      
      const updatedTournament = await TournamentModel.resetFirstRound(id, { 
        players: tournamentWithNewFirstRound.players, 
        qualificationRounds: tournamentWithNewFirstRound.qualificationRounds 
      }) // TODO - dubte i tasca - manejar la possibilitat derror. Ja es suficient amb 500? 

      if (!updatedTournament) {
        // NOT FOUND
        res.status(404).json({ message: 'Tournament not found' })
        return 
      }
      
      // OK
      res.status(200).json(updatedTournament)

    } catch (err) {
      // 500
      res.status(500).json({ message: err })
    }
  },

  async registerMatchResult(req: Request, res: Response) {
    const { id } = req.params

    if (!id) {
      // BAD REQUEST
      res.status(400).json({ message: 'Bad request. Id is missing' })
      return
    }

    try {
      // const matchDetails: RegisterMatchClientData = registerMatchSchema.parse(req.body)

      // const result = tournamentService.validateMatchResults(matchDetails)

      // if (result.error) {
      //   // BAD REQUEST
      //   res.status(400).json({ message: 'Bad request. Wrong results', clientMessage: result.error }) // TODO - dubte - es correcte aquest enfoc?
      //   return
      // }

      // const tournament = await TournamentModel.getTournamentById(id)

      // if (!tournament) {
      //   // NOT FOUND
      //   res.status(404).json({ message: 'Tournament not found'})
      //   return
      // }

      // const updatedMatch = await TournamentModel.updateMatch(tournament, matchDetails)

      // TODO - dubte - segon enfoc
      const matchDetails: RegisterMatchClientData = RegisterMatchSchema.parse(req.body)

      const tournament = await TournamentModel.getTournamentById(id)
      if (!tournament) {
        // NOT FOUND
        res.status(404).json({ message: 'Tournament not found' })
        return
      }

      const result = tournamentService.validateMatchResults(matchDetails, tournament.tournamentMode)
      if (result.error) {
        // BAD REQUEST
        res.status(400).json({ message: 'Bad request. Wrong match results', clientMessage: result.error })
        return
      }

      const match = await TournamentModel.updateMatch(tournament.id, matchDetails)
      if (!match) {
        // NOT FOUND
        res.status(404).json({ message: 'Match not found' })
        return
      }

      // OK
      res.status(200).json(match)

    } catch (err) {
      // 500 
      res.status(500).json({ message: err })
    }
  }
}
