import { z } from "zod";
import { TournamentMode } from "@tournaments/Interfaces/tournamentInterface.js";
import { arrIsMultipleOf, validateSet } from "@tournaments/service/utils.js";

// CREATE TOURNAMENT SCHEMA
export type TournamentClientData = z.infer<typeof CreateTournamentSchema>;
export const CreateTournamentSchema = z.object({
  // TODO - investigar - veure com retornar un status code concret pels errors - ara es retorna 200 encara que hi hagi error
  name: z.string().min(5, {
    message: "Mínim 5 caracters",
  }),
  tournamentMode: z.nativeEnum(TournamentMode),
  // TODO - investigar - mirar la validacio de data - data ara accepta data valida pero no accepta data en milisegons - a la db converteixo data a segons o la mantinc a string de data? - toLocaleString / toISOString
  date: z.string().datetime({
    message: "La data no es vàlida",
  }),
  playersInput: z
    .array(
      z.object({
        playerName: z.string().min(2, {
          message: "Mínim 2 caracters",
        }),
        playerClub: z.string().min(3, {
          message: "Mínim 3 caracters",
        }),
      })
    )
    .min(8, {
      message: "Hi ha d'haver un mínim de 8 jugadors",
    })
    .refine((players) => arrIsMultipleOf(4, players), {
      message: "Els jugadors han de ser múltiples de 4",
    }),
});

// UPDATE TOURNAMENT SCHEMA
// TODO - dubte - els tres son obligatoris i sempre han d'arribar des del client - Es correcte?
export type UpdateTournamentClientData = z.infer<typeof UpdateTournamentSchema>;
export const UpdateTournamentSchema = z.object({
  name: z.string().min(5, {
    message: "Mínim 5 caracters",
  }),
  date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "La data no es vàlida",
  }),
  visible: z.boolean(),
});

// REGISTER MATCH SCHEMA
export type RegisterMatchClientData = z.infer<typeof RegisterMatchSchema>;
export const RegisterMatchSchema = z.object({
  sets: z
    .array(
      z
        .tuple([
          //                      (x2 min) min. best-of-3
          z.number().nonnegative().int(), // sets -> [ [int, int], [...] ]
          z.number().nonnegative().int(), //                      (x5 max) max. best-of-5
        ])
        .refine(
          (set) => validateSet(set).result,
          (set) => ({ message: validateSet(set).message })
        )
    )
    .min(2)
    .max(5),
});

export type UpdatePlayerDetailsClientData = z.infer<
  typeof UpdatePlayerDetailsSchema
>;
export const UpdatePlayerDetailsSchema = z.object({
  playerName: z.string().min(2, {
    message: "Mínim 2 caracters",
  }),
  playerClub: z.string().min(3, {
    message: "Mínim 3 caracters",
  }),
});
