import { z } from "zod"
import { CreateTournament, TournamentMode } from "./Interfaces/tournamentInterface"

// TODO - nota - esborrar quan ja ho tingui clar
// Responsabilitats
// - defineix els esquemes de validacio (zod)
// - es importat pel controlador per validar dades dentrada
// - pot incloure validacions especifiques dels camps o estructures complexes

// TODO - investigar - veure com retornar un status code concret pels errors - ara es retorna 200 encara que hi hagi error
export const CreateTournamentSchema = z.object({
  name: z.string().min(5, {
    message: 'Mínim 5 caracters'
  }),
  tournamentMode: z.nativeEnum(TournamentMode),
  // TODO - investigar - mirar la validacio de data - data ara accepta data valida pero no accepta data en milisegons - a la db converteixo data a segons o la mantinc a string de data? - toLocaleString / toISOString
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

export type tournamentClientData = z.infer<typeof CreateTournamentSchema>

function isMultipleOfFour(players: any[]) {
  return players.length % 4 === 0
}

// TODO - dubte - els dos son obligatoris i sempre han d'arribar des del client - Es correcte?
export const UpdateTournamentSchema = z.object({
  name: z.string().min(5, {
    message: 'Mínim 5 caracters'
  }),
  date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'La data no es vàlida',
  }),
  visible: z.boolean()
})

export type updateTournamentClientData = z.infer<typeof UpdateTournamentSchema>