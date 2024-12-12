
// TODO - nota - esborrar comentari quan ho tingui clar
// Responsabilitats - 
// - conte les funcions que interactuen amb la db 
// - maneja consultes CRUD (crear torneig, obtenir tornejos per id, ...)
// - no incloure logica de validacio ni manipulacio de dades (aixo es fa al Service)

import { Match, SingleSet } from "./Interfaces/matchInterface"
import { Round, Tournament, TournamentStatus } from "./Interfaces/tournamentInterface"
import { findMatchInRounds } from "./service/utils"
import { RegisterMatchClientData, UpdateTournamentClientData } from "./tournamentSchema"

// simulacio de base de dades en entorn local
const tournaments: Tournament[] = []  // TODO - tasca - tipar

// quant vulgui incloure la db nomes haure de cridar dbTournamentModel i adaptar el maneig de CRUD al tipus de db

export const TournamentModel = {
  async createTournament(tournamentData: Omit<Tournament, 'db_id'>): Promise<Tournament> {
    const newTournament: Tournament = {
      db_id: crypto.randomUUID(),
      ...tournamentData,
    }

    tournaments.unshift(newTournament)

    return newTournament
  },

  async getAllTournamets(): Promise<Tournament[]> { 
    return tournaments
  },

  async getTournamentById(id: string): Promise<Tournament | undefined> { 
    const tournament = tournaments.find(tournament => tournament.id === id)

    return tournament
  },

  async updateTournamentDetails(id: string, tournamentData: UpdateTournamentClientData): Promise<Tournament | undefined> { 
    const tournament = tournaments.find(tournament => tournament.id === id)

    if (tournament) {
      Object.assign(tournament, tournamentData)
    }
    
    return tournament
    
    // tournaments[tournamentIndex] = {
    //   ...tournaments[tournamentIndex],
    //   ...tournamentData,
    // }

    // return tournament
  },

  async resetFirstRound(id: string, {players, qualificationRounds}: Pick<Tournament, 'players' | 'qualificationRounds'>): Promise<Tournament | undefined> {
    const tournament = tournaments.find(tournament => tournament.id === id)

    if (tournament) {
      tournament.qualificationRounds = qualificationRounds
      tournament.players = players
    }

    return tournament
  },

  // TODO - nota - borrar si no el necessito
  async getMatch(tournamentId: string, matchId: string): Promise<Match | undefined> {
    const tournament = tournaments.find(tournament => tournament.id === tournamentId)
    
    if (!tournament) {
      return undefined
    }

    for (const round of tournament.qualificationRounds) {
      const match = round.find(match => match.id === matchId)
      if (match) return match
    }

    for (const round of tournament.eliminationRounds) {
      const match = round.find(match => match.id === matchId)
      if (match) return match
    }

    return undefined
  },

  async updateMatch(tournamentId: string, matchDetails: RegisterMatchClientData): Promise<Match | undefined> {
    const tournament = tournaments.find(tournament => tournament.id === tournamentId)

    if (!tournament) return undefined

    let match = findMatchInRounds(tournament.qualificationRounds, matchDetails.id)

    if (!match) {
      match = findMatchInRounds(tournament.eliminationRounds, matchDetails.id)
    }

    if (!match) {
      return undefined
    }

    match.sets = matchDetails.sets

    return match
  }
}
