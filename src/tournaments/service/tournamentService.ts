import { Match } from "@tournaments/Interfaces/matchInterface.js";
import {
  Tournament,
  TournamentStatus,
} from "@tournaments/Interfaces/tournamentInterface.js";
import {
  createNextRound,
  createTournament,
  findMatchInTournament,
  findPlayerInTournament,
  isAnyResultRegisteredInRounds,
  recalculatePlayerStats,
  resetFirstRound,
  sortClassification,
  validateMatchResults,
} from "@tournaments/service/utils.js";
import { TournamentModel } from "@tournaments/tournamentModel.js";
import {
  RegisterMatchClientData,
  TournamentClientData,
  UpdateTournamentClientData,
} from "@tournaments/tournamentSchema.js";

export const tournamentService = {
  getAllTournaments(): Promise<Tournament[]> {
    return TournamentModel.getAllTournamets();
  },

  getTournamentById(tournamentId: string): Promise<Tournament | undefined> {
    return TournamentModel.getTournamentById(tournamentId);
  },

  async createTournament(
    tournamentData: TournamentClientData
  ): Promise<Tournament> {
    const computedTournament = createTournament(tournamentData);

    const newTournament =
      await TournamentModel.createTournament(computedTournament);

    return newTournament;
  },

  updateTournament(
    tournamentId: string,
    tournamentData: UpdateTournamentClientData
  ): Promise<Tournament | undefined> {
    return TournamentModel.updateTournamentDetails(
      tournamentId,
      tournamentData
    );
  },

  async randomizeFirstRound(
    tournamentId: string
  ): Promise<Tournament | undefined> {
    const tournament = await TournamentModel.getTournamentById(tournamentId);

    if (!tournament) {
      return undefined;
    }

    // TODO - test - verificar que la validacio funciona be
    if (
      tournament.status !== TournamentStatus.qualification ||
      tournament.currentRoundNum !== 1
    ) {
      throw new Error(
        "Randomize only available on Round 1 of Qualification Stage"
      );
    } else if (isAnyResultRegisteredInRounds(tournament.qualificationRounds)) {
      throw new Error("Randomize only available when no results registered");
    }

    resetFirstRound(tournament);

    const updatedTournament = TournamentModel.resetFirstRound(tournamentId, {
      classification: tournament.classification,
      qualificationRounds: tournament.qualificationRounds,
    });

    return updatedTournament;
  },

  async registerMatchResult(
    touranmentId: string,
    matchId: string,
    matchResults: RegisterMatchClientData
  ): Promise<Match | undefined> {
    // buscar tournament per verificar el tournament Mode
    const tournament = await TournamentModel.getTournamentById(touranmentId);

    if (!tournament) {
      // TODO - crear nova clase amb errors i extendre Error -> NotFoundError amb status etc al catch es fa instanceof NotFoundError i es pot filtrar errors des de service
      // 404
      const notFoundError = new Error("Tournament not found");
      notFoundError.name = "Not found";
      throw notFoundError;
    }

    // validar match
    const { error } = validateMatchResults(
      matchResults,
      tournament.tournamentMode
    );

    if (error) {
      // 400
      const validationError = new Error(error);
      validationError.name = "Validation";
      throw validationError;
    }

    // buscar match i retornar referencia
    const { match, isQualificationMatch } = findMatchInTournament(
      tournament,
      matchId
    );

    if (!match) {
      // 404
      const notFoundError = new Error("Match not found");
      notFoundError.name = "Not found";
      throw notFoundError;
    }

    // actualitzar match (actualitzem la referencia al match dintre el tournament)
    match.sets = matchResults.sets;

    // recalcular i actualitzar puntuacio players (actualitzem la referencia dels players de tournament)
    if (isQualificationMatch) {
      const player1Stats = recalculatePlayerStats(
        match.player1Id,
        tournament.qualificationRounds
      );
      const player2Stats = recalculatePlayerStats(
        match.player2Id,
        tournament.qualificationRounds
      );
      const player1 = findPlayerInTournament(
        match.player1Id,
        tournament.classification
      );
      const player2 = findPlayerInTournament(
        match.player2Id,
        tournament.classification
      );

      if (!player1 || !player2) {
        throw new Error("Players not found");
      }

      Object.assign(player1, player1Stats);
      Object.assign(player2, player2Stats);

      sortClassification(tournament.classification);
    }

    // guardar a db tournament
    const updatedTournament = await TournamentModel.updateFullTournament(
      touranmentId,
      tournament
    );

    if (!updatedTournament) {
      const notFoundError = new Error("Tournament not found");
      notFoundError.name = "Not found";
      throw notFoundError;
    }

    // retornar match
    return match;
  },

  async createNextRound(tournamentId: string): Promise<Tournament | undefined> {
    const tournament = await TournamentModel.getTournamentById(tournamentId);

    if (!tournament) {
      const notFoundError = new Error("Tournament not found");
      notFoundError.name = "Not found";
      throw notFoundError;
    }

    // crea next round o finalitza torneig
    createNextRound(tournament);

    const updatedTournament = await TournamentModel.updateFullTournament(
      tournamentId,
      tournament
    );

    if (!updatedTournament) {
      const notFoundError = new Error("Tournament not found");
      notFoundError.name = "Not found";
      throw notFoundError;
    }

    return updatedTournament;
  },
};
