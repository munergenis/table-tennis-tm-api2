// TODO - nota - borrar comentari quan ja ho tingui clar
// Responsabilitats 
// - logica de negoci 
// - calculs i computacio

import { Match } from "../Interfaces/matchInterface"
import { Player } from "../Interfaces/playerInterface"
import { PlayerInput, Round, Tournament, TournamentStatus } from "../Interfaces/tournamentInterface"
import { tournamentClientData } from "../tournamentSchema"
import { isAnyResultRegisteredInRounds, randomizeArray } from "./utils"

export const tournamentService = {
  generateTournament(tournamentData: tournamentClientData): Tournament {
    const {
      maxQualificationRounds,
      maxEliminationRounds,
    } = this.calculateMaxRounds(tournamentData.playersInput.length)

    const players = this.generatePlayersList(tournamentData.playersInput)
    
    const initialOrderPlayersId = this.setPlayersInitialOrderAndGetOrderedIdList(players)
    
    const firstRound = this.generateRound(initialOrderPlayersId) 

    const newTournament: Tournament = {
      id: crypto.randomUUID(),
      name: tournamentData.name,
      tournamentMode: tournamentData.tournamentMode,
      date: new Date(tournamentData.date),
      players,
      maxQualificationRounds,
      qualificationRounds: [firstRound],
      maxEliminationRounds,
      eliminationRounds: [],
      currentRoundNum: 1,
      status: TournamentStatus.qualification,
      visible: true,
    }

    return newTournament
  },

  generateRound(playersIdList: string[]): Round {
    const round = []

    for (let i = 0, table = 1; i < playersIdList.length; i += 2, table++) {
      const match: Match = {
        id: crypto.randomUUID(),
        player1Id: playersIdList[i],
        player2Id: playersIdList[i + 1],
        table,
        sets: [[0, 0]]
      }
      round.push(match)
    }

    return round
  },

  randomizeFirstRound(tournament: Tournament): Tournament {
    // TODO - test - verificar que la validacio funciona be
    if (tournament.status !== TournamentStatus.qualification || tournament.currentRoundNum !== 1) {
      throw new Error('Randomize only available on Round 1 of Qualification Stage')
    } else if (isAnyResultRegisteredInRounds(tournament.qualificationRounds)) {
      throw new Error('Randomize only available when no results registered')
    }

    const playersList = tournament.players
    const playersIdList = this.setPlayersInitialOrderAndGetOrderedIdList(playersList)
    const newFirstRound = this.generateRound(playersIdList)

    tournament = {
      ...tournament,
      players: playersList,
      qualificationRounds: [newFirstRound],
    }

    return tournament
  },

  setPlayersInitialOrderAndGetOrderedIdList(playersList: Player[]): string[] {
    const indexesList = playersList.map((_, index) => index)
    
    randomizeArray(indexesList)
    
    for (let player in playersList) {
      playersList[player].initialOrder = indexesList[player]
    }
    const playersIdList = [...playersList].sort((a, b) => a.initialOrder - b.initialOrder).map(player => player.id)

    return playersIdList
  },

  generatePlayersList(playersInput: PlayerInput[]): Player[] {
    const playersList: Player[] = playersInput.map(( player, index ) => {
      const number = index + 1

      const newPlayer: Player = {
        id: crypto.randomUUID(),
        name: player.playerName,
        club: player.playerClub,
        number,
        initialOrder: -1,
        setsWon: 0,
        setsLost: 0,
        matchesWon: 0,
        matchesLost: 0,
        pointsFor: 0,
        pointsAgainst: 0,
        tournamentPoints: 0,
      }

      return newPlayer
    })

    return playersList
  },
  
  calculateMaxRounds(numOfPlayers: number) {
    if (numOfPlayers % 4 !== 0) {
      throw new Error('Players must be multiple of 4')
    }
    if (numOfPlayers < 8) {
      throw new Error('Players must be at least 8')
    }

    const maxQualificationRounds = Math.floor(Math.log2(numOfPlayers))
    let maxEliminationRounds

    if (numOfPlayers === 8) {
      maxEliminationRounds = 2
    } else if (numOfPlayers <= 20) {
      maxEliminationRounds = 3
    } else {
      maxEliminationRounds = 4
    }
    return { maxQualificationRounds, maxEliminationRounds }
  }
}