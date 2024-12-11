export type SingleSet = [number, number]

export interface Match {
  id: string
  player1Id: string
  player2Id: string
  table: number
  sets: SingleSet[]
}