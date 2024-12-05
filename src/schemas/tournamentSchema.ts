import { z } from "zod"

// TODO - esborrar quan ja ho tingui clar
// Responsabilitats
// - defineix els esquemes de validacio (zod)
// - es importat pel controlador per validar dades dentrada
// - pot incloure validacions especifiques dels camps o estructures complexes

export enum TournamentMode {
  bestOf3 = 'best-of-3',
  bestOf5 = 'best-of-5',
}

export const TournamentSchema = z.object({
  name: z.string().min(5),
  tournamentMode: z.enum([TournamentMode.bestOf3, TournamentMode.bestOf5]),
  // TODO - mirar la validacio de data
  date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid date format',
  }),
  playersInput: z
    .array(
      z.object({
        name: z.string().min(2),
        club: z.string().min(3),
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
  name: z.string().min(5),
  date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid date format',
  }),
})
