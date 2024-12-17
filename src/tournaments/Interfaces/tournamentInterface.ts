import { Match } from "@tournaments/Interfaces/matchInterface.js";
import { Player } from "@tournaments/Interfaces/playerInterface.js";

export enum TournamentMode {
  bestOf3 = "best-of-3",
  bestOf5 = "best-of-5",
}

export enum TournamentStatus {
  qualification = "qualification",
  elimination = "elimination",
  finished = "finished",
}

export type PlayerInput = {
  playerName: string;
  playerClub: string;
};

export interface CreateTournament {
  name: string;
  tournamentMode: TournamentMode;
  date: Date;
  playersInput: PlayerInput[];
}

export type Round = Match[];

// TODO - nota - esborrar comentaris
export interface Tournament {
  db_id: string;
  id: string;
  name: string;
  winnerId: string | undefined;
  tournamentMode: TournamentMode;
  date: string;
  classification: Player[];
  // nombre maxim de rondes de classificatoria
  maxQualificationRounds: number;
  // aqui es guarden els partits amb els resultats. Es vindra aqui a calcular i recalcular puntuacions
  qualificationRounds: Round[];
  // nombre maxim de rondes eliminatories
  maxEliminationRounds: number;
  // aqui es guarden els partits amb els resultats. Es vindra aqui a determinar guanyador i si passa o no a la seguent ronda
  eliminationRounds: Round[];
  // numero actual de ronda. Determina la ronda i serveix per verificar si hem arribat al maxim de rondes de fase. Juntament amb status, sabem en quin punt del torneig ens trobem. Quan passem d'una fase a l'altra (qualification -> elimination) es reinicia a 0 (o 1)
  currentRoundNum: number;
  // ens determina l'estat del torneig. qualification | elimination | finished
  status: TournamentStatus;
  visible: boolean;
}
