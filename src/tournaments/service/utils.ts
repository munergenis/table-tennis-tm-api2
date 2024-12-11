import { Match, SingleSet } from "../Interfaces/matchInterface";
import { Round } from "../Interfaces/tournamentInterface";

export function randomizeArray<T>(arr: T[]): T[] {
  return arr.sort(() => Math.random() - 0.5)
}

export function isAnyResultRegisteredInRounds(rounds: Round[]): boolean {
  const hasRoundWithSetResults = ( round: Round ) => round.some(hasMatchWithSetResults)
  const hasMatchWithSetResults = ( match: Match ) => match.sets.some(hasResults)
  const hasResults = ( set: SingleSet )=> set[0] > 0 || set[1] > 0

  return rounds.some(hasRoundWithSetResults)
}