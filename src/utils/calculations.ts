export function calculateMaxRounds(numOfPlayers: number) {
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
