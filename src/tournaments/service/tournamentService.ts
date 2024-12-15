import { Match } from "@tournaments/Interfaces/matchInterface.js";
import {
  Tournament,
  TournamentStatus,
} from "@tournaments/Interfaces/tournamentInterface.js";
import {
  createTournament,
  findMatchInTournament,
  findPlayerInTournament,
  isAnyResultRegisteredInRounds,
  recalculatePlayerStats,
  resetFirstRound,
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
      players: tournament.players,
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
      return undefined;
    }

    // validar match
    const { error } = validateMatchResults(
      matchResults,
      tournament.tournamentMode
    );

    if (error) {
      throw new Error(error);
    }

    // buscar match i retornar referencia
    const { match, isQualificationMatch } = findMatchInTournament(
      tournament,
      matchId
    );

    if (!match) {
      return undefined;
    }

    // actualitzar match (actualitzem la referencia al match dintre el tournament)
    match.sets = matchResults.sets;

    // recalcular i actualitzar puntuacio players
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
        tournament.players
      );
      const player2 = findPlayerInTournament(
        match.player2Id,
        tournament.players
      );

      if (!player1 || !player2) {
        throw new Error("Players not found");
      }

      Object.assign(player1, player1Stats);
      Object.assign(player2, player2Stats);
    }

    // guardar a db tournament
    TournamentModel.updateFullTournament(touranmentId, tournament);

    // tornar match
    return match;
  },
};
