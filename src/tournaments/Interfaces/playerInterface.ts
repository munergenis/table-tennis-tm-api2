export interface Player {
  id: string
  name: string
  club: string
  number: number
  initialOrder: number
  setsWon: number
  setsLost: number
  matchesWon: number
  matchesLost: number
  pointsFor: number
  pointsAgainst: number
  tournamentPoints: number
}