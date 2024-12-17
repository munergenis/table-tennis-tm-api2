export type PlayerStats = Omit<
  Player,
  "id" | "playerName" | "playerClub" | "number" | "initialOrder"
>;

export interface Player {
  id: string;
  playerName: string;
  playerClub: string;
  number: number;
  initialOrder: number;
  setsWon: number;
  setsLost: number;
  matchesWon: number;
  matchesLost: number;
  pointsFor: number;
  pointsAgainst: number;
  tournamentPoints: number;
}
