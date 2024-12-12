import { Match, SingleSet } from "../Interfaces/matchInterface";
import { Round } from "../Interfaces/tournamentInterface";

export function randomizeArray<T>(arr: T[]): T[] {
  return arr.sort(() => Math.random() - 0.5)
}

export function arrIsMultipleOf<T>(value: number, arr: T[]): boolean {
  return arr.length % value === 0
}

export function isAnyResultRegisteredInRounds(rounds: Round[]): boolean {
  const hasRoundWithSetResults = ( round: Round ) => round.some(hasMatchWithSetResults)
  const hasMatchWithSetResults = ( match: Match ) => match.sets.some(hasResults)
  const hasResults = ( set: SingleSet )=> set[0] > 0 || set[1] > 0

  return rounds.some(hasRoundWithSetResults)
}

export function validateSet(set: SingleSet): { result: boolean, message?: string } {
  const [pl1Points, pl2Points] = set
  const diff = Math.abs(pl1Points - pl2Points)

  if (pl1Points < 11 && pl2Points < 11) {
    return { result: false, message: 'El guanyador ha de tenir 11 punts o més' }
  }

  if (diff < 2) {
    return { result: false, message: 'La diferència de punts ha de ser de 2 mínim'}
  }

  if ((pl1Points > 11 || pl2Points > 11) && diff !== 2) {
    return { result: false, message: 'Si es passen els 11 punts, la diferència de punts ha de ser de 2'}
  }

  return { result: true }
}


export function findMatchInRounds(rounds: Round[], matchId: string): Match | undefined {
  for (const round of rounds) {
    const match = round.find(match => match.id === matchId)
    if (match) return match
  }
}