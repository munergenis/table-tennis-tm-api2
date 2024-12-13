import { Request, Response } from "express";
import { tournamentService } from "@tournaments/service/tournamentService.js";
import {
  CreateTournamentSchema,
  RegisterMatchClientData,
  RegisterMatchSchema,
  TournamentClientData,
  UpdatePlayerDetailsClientData,
  UpdatePlayerDetailsSchema,
  UpdateTournamentClientData,
  UpdateTournamentSchema,
} from "@tournaments/tournamentSchema.js";
import { ZodError } from "zod";
import { Player } from "@tournaments/Interfaces/playerInterface.js";

// TODO - dubte i investigar - s'esta gestionant tots els errors amb 500, pero s'hauria de poder filtrar el tipus d'error al catch
export const tournamentController = {
  async getAllTournaments(req: Request, res: Response) {
    let tournaments;

    try {
      tournaments = await tournamentService.getAllTournaments();
    } catch (err) {
      // 500
      res.status(500).json(err);
      return;
    }

    // OK
    res.status(200).json(tournaments);
  },

  async getTournamentById(req: Request, res: Response) {
    const { tournamentId } = req.params;

    let tournament;

    try {
      tournament = await tournamentService.getTournamentById(tournamentId);
    } catch (err) {
      // 500
      res.status(500).json(err);
      return;
    }

    if (!tournament) {
      // NOT FOUND
      res.status(404).json({ message: "Tournament not found" });
      return;
    }

    // OK
    res.status(200).json(tournament);
  },

  async createTournament(req: Request, res: Response) {
    let tournamentData: TournamentClientData;
    let newTournament;

    try {
      tournamentData = CreateTournamentSchema.parse(req.body);
    } catch (err) {
      if (err instanceof ZodError) {
        // BAD REQUEST
        res.status(400).json(err);
        return;
      }
      res.status(500).json(err);
      return;
    }

    try {
      newTournament = await tournamentService.createTournament(tournamentData);
    } catch (err) {
      // 500
      res.status(500).json(err);
      return;
    }

    // CREATED
    res.status(201).json(newTournament);
  },

  async updateTournament(req: Request, res: Response) {
    const { tournamentId } = req.params;
    let tournamentData: UpdateTournamentClientData;
    let updatedTournament;

    try {
      tournamentData = UpdateTournamentSchema.parse(req.body);
    } catch (err) {
      if (err instanceof ZodError) {
        // BAD REQUEST
        res.status(400).json(err);
        return;
      }
      // 500
      res.status(500).json(err);
      return;
    }

    try {
      updatedTournament = tournamentService.updateTournament(
        tournamentId,
        tournamentData
      );
    } catch (err) {
      // 500
      res.status(500).json(err);
      return;
    }

    if (!updatedTournament) {
      // NOT FOUND
      res.status(404).json({ message: "Tournament not found" });
      return;
    }

    // OK
    res.status(200).json(updatedTournament);
  },

  async randomizeFirstRound(req: Request, res: Response) {
    const { touranmentId } = req.params;
    let updatedTournament;

    try {
      updatedTournament =
        await tournamentService.randomizeFirstRound(touranmentId);
    } catch (err) {
      // 500
      res.status(500).json(err);
      return;
    }

    if (!updatedTournament) {
      // NOT FOUND
      res.status(404).json({ message: "Tournament not found" });
      return;
    }

    // CREATED - TODO - dubte - seria 201 CREATED o 200 OK?
    res.status(201).json(updatedTournament);
  },

  async registerMatchResult(req: Request, res: Response) {
    const { tournamentId, matchId } = req.params;
    let matchResults: RegisterMatchClientData;
    let updatedMatch;

    try {
      // TODO - dubte - segon enfoc
      matchResults = RegisterMatchSchema.parse(req.body);
    } catch (err) {
      // BAD REQUEST
      res.status(400).json(err);
      return;
    }

    try {
      updatedMatch = await tournamentService.registerMatchResult(
        tournamentId,
        matchId,
        matchResults
      );
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === "Not found") {
          // Not found
          res.status(404).json(err.message);
          return;
        }
        if (err.name === "Validation") {
          // Bad request
          res.status(400).json(err.message);
          return;
        }
      }

      // 500
      res.status(500).json(err);
      return;
    }

    // OK
    res.status(200).json(updatedMatch);
  },

  async createNextRound(req: Request, res: Response) {
    const { tournamentId } = req.params;
    let tournamentWithNextRound;

    try {
      tournamentWithNextRound = tournamentService.createNextRound(tournamentId);
    } catch (err) {
      let status = 500;
      let message = "Server error";

      if (err instanceof Error) {
        if (err.name === "Bad request") {
          status = 400;
          message = err.message;
        }
      }

      // filter error
      res.status(status).json({ error: err, message });
      return;
    }

    // CREATED
    res.status(201).json(tournamentWithNextRound);
  },

  async updatePlayerDetails(req: Request, res: Response) {
    const { tournamentId, playerId } = req.params;
    let playerDetails: UpdatePlayerDetailsClientData;
    let updatedPlayer: Player;

    try {
      playerDetails = UpdatePlayerDetailsSchema.parse(req.body);
    } catch (err) {
      if (err instanceof ZodError) {
        // Bad request
        res.status(400).json(err);
        return;
      }
      // 500
      res.status(500).json(err);
      return;
    }

    try {
      updatedPlayer = await tournamentService.updatePlayerDetails(
        tournamentId,
        playerId,
        playerDetails
      );
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === "Not found") {
          // Not found
          res.status(404).json(err.message);
          return;
        }
      }
      // 500
      res.status(500).json(err);
      return;
    }

    // OK
    res.status(200).json(updatedPlayer);
  },
};
