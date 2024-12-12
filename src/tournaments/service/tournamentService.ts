// TODO - nota - borrar comentari quan ja ho tingui clar
// Responsabilitats 
// - logica de negoci 
// - calculs i computacio
// - validacio de tournament

import { Match } from "../Interfaces/matchInterface"
import { Player } from "../Interfaces/playerInterface"
import { PlayerInput, Round, Tournament, TournamentMode, TournamentStatus } from "../Interfaces/tournamentInterface"
import { RegisterMatchClientData, TournamentClientData } from "../tournamentSchema"
import { isAnyResultRegisteredInRounds, randomizeArray } from "./utils"

export const tournamentService = {
  generateTournament(tournamentData: TournamentClientData): Omit<Tournament, 'db_id'> {
    const {
      maxQualificationRounds,
      maxEliminationRounds,
    } = this.calculateMaxRounds(tournamentData.playersInput.length)

    const players = this.generatePlayersList(tournamentData.playersInput)
    
    const initialOrderPlayersId = this.setPlayersInitialOrderAndGetOrderedIdList(players)
    
    const firstRound = this.generateRound(initialOrderPlayersId) 

    const newTournament: Omit<Tournament, 'db_id'> = {
      id: crypto.randomUUID(),
      name: tournamentData.name,
      tournamentMode: tournamentData.tournamentMode,
      date: tournamentData.date,
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
  },

  validateMatchResults(matchDetails: RegisterMatchClientData, tournamentMode: TournamentMode): { error?: string } {
    const { sets } = matchDetails
    
    const setsCount = sets.length
    let setsPlayed = 0
    let pl1WinCount = 0
    let pl2WinCount = 0
    const minWins = tournamentMode === TournamentMode.bestOf3 ? 2 : 3
    let winnerExists = false

    for (const set in sets) {
      setsPlayed++

      if (set[0] > set[1]) {
        pl1WinCount++
      } else {
        pl2WinCount++
      }

      if (pl1WinCount === minWins || pl2WinCount === minWins) {
        winnerExists = true
        break
      }
    }

    if (!winnerExists) {
      return { error: `No es detecta cap guanyador amb ${minWins} victòries`}
    }

    if (setsPlayed < setsCount) { // TODO - nota - evitar entrar partits extres (es detecta victoria amb menys partits)
      return { error: `Es detecta victòria amb menys partits. Al set ${setsPlayed}. El jugador ${pl1WinCount > pl2WinCount ? '1' : '2'} aconsegueix victòria`}
    }

    return {}

    // TODO - dubte - cal que validi tambe els sets si ja ho he fet amb zod?
    // for (const set of matchSets) {
    //   const pl1Points = set[0]
    //   const pl2Points = set[1]
    //   if (pl1Points >= 11 )
    // }
    // return {}
  },
}