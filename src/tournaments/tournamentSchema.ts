import { z } from "zod"

// TODO - esborrar quan ja ho tingui clar
// Responsabilitats
// - defineix els esquemes de validacio (zod)
// - es importat pel controlador per validar dades dentrada
// - pot incloure validacions especifiques dels camps o estructures complexes

// TODO - veure si va aqui o on posar les definicions
export enum TournamentMode {
  bestOf3 = 'best-of-3',
  bestOf5 = 'best-of-5',
}

// TODO - veure com retornar un status code concret pels errors - ara es retorna 200 encara que hi hagi error
export const CreateTournamentSchema = z.object({
  name: z.string().min(5, {
    message: 'Mínim 5 caracters'
  }),
  tournamentMode: z.enum([TournamentMode.bestOf3, TournamentMode.bestOf5]),
  // TODO - mirar la validacio de data
  date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'La data no es vàlida',
  }),
  playersInput: z
    .array(
      z.object({
        playerName: z.string().min(2, {
          message: 'Mínim 2 caracters'
        }),
        playerClub: z.string().min(3, {
          message: 'Mínim 3 caracters'
        }),
      })
    )
    .min(8, {
      message: 'Hi ha d\'haver un mínim de 8 jugadors'
    })
    .refine(isMultipleOfFour, {
      message: 'Els jugadors han de ser múltiples de 4'
    })
})

function isMultipleOfFour(players: any[]) {
  return players.length % 4 === 0
}

// TODO - fer-los opcionals, pero que si s'envien es validin
export const UpdateTournamentSchema = z.object({
  name: z.string().min(5, {
    message: 'Mínim 5 caracters'
  }),
  date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'La data no es vàlida',
  }),
})
