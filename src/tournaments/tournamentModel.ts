import { Match } from "@tournaments/Interfaces/matchInterface.js";
import { Tournament } from "@tournaments/Interfaces/tournamentInterface.js";
import { findMatchInRounds } from "@tournaments/service/utils.js";
import {
  RegisterMatchClientData,
  UpdateTournamentClientData,
} from "@tournaments/tournamentSchema.js";

// simulacio de base de dades en entorn local
const tournaments: Tournament[] = [];

export const TournamentModel = {
  async createTournament(
    tournamentData: Omit<Tournament, "db_id">
  ): Promise<Tournament> {
    const newTournament: Tournament = {
      db_id: crypto.randomUUID(),
      ...tournamentData,
    };

    tournaments.unshift(newTournament);

    return newTournament;
  },

  async getAllTournamets(): Promise<Tournament[]> {
    return tournaments;
  },

  async getTournamentById(
    tournamentId: string
  ): Promise<Tournament | undefined> {
    const tournament = tournaments.find(
      (tournament) => tournament.id === tournamentId
    );

    return tournament;
  },

  async updateTournamentDetails(
    tournamentId: string,
    tournamentData: UpdateTournamentClientData
  ): Promise<Tournament | undefined> {
    const tournament = tournaments.find(
      (tournament) => tournament.id === tournamentId
    );

    if (tournament) {
      Object.assign(tournament, tournamentData);
    }

    return tournament;
  },

  async resetFirstRound(
    tournamentId: string,
    {
      classification,
      qualificationRounds,
    }: Pick<Tournament, "classification" | "qualificationRounds">
  ): Promise<Tournament | undefined> {
    const tournament = tournaments.find(
      (tournament) => tournament.id === tournamentId
    );

    if (tournament) {
      tournament.classification = classification;
      tournament.qualificationRounds = qualificationRounds;
    }

    return tournament;
  },

  // TODO - nota - borrar si no el necessito
  async getMatch(
    tournamentId: string,
    matchId: string
  ): Promise<Match | undefined> {
    const tournament = tournaments.find(
      (tournament) => tournament.id === tournamentId
    );

    if (!tournament) {
      return undefined;
    }

    for (const round of tournament.qualificationRounds) {
      const match = round.find((match) => match.id === matchId);
      if (match) return match;
    }

    for (const round of tournament.eliminationRounds) {
      const match = round.find((match) => match.id === matchId);
      if (match) return match;
    }

    return undefined;
  },

  async updateMatch(
    tournamentId: string,
    matchId: string,
    matchResults: RegisterMatchClientData
  ): Promise<Match | undefined> {
    const tournament = tournaments.find(
      (tournament) => tournament.id === tournamentId
    );

    if (!tournament) return undefined;

    let match = findMatchInRounds(tournament.qualificationRounds, matchId);

    if (!match) {
      match = findMatchInRounds(tournament.eliminationRounds, matchId);
    }

    if (!match) {
      return undefined;
    }

    match.sets = matchResults.sets;

    return match;
  },

  async updateFullTournament(
    tournamentId: string,
    updatedTournament: Tournament
  ): Promise<Tournament | undefined> {
    let tournament = tournaments.find(
      (tournament) => tournament.id === tournamentId
    );

    if (!tournament) {
      return undefined;
    }

    tournament = updatedTournament;

    return tournament;
  },
};
