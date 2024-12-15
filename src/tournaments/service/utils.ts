import { Match, SingleSet } from "@tournaments/Interfaces/matchInterface.js";
import {
  Player,
  PlayerStats,
} from "@tournaments/Interfaces/playerInterface.js";
import {
  PlayerInput,
  Round,
  Tournament,
  TournamentMode,
  TournamentStatus,
} from "@tournaments/Interfaces/tournamentInterface.js";
import {
  RegisterMatchClientData,
  TournamentClientData,
} from "@tournaments/tournamentSchema.js";

export function randomizeArray<T>(arr: T[]): T[] {
  return arr.sort(() => Math.random() - 0.5);
}

export function arrIsMultipleOf<T>(value: number, arr: T[]): boolean {
  return arr.length % value === 0;
}

export function createTournament(
  tournamentData: TournamentClientData
): Omit<Tournament, "db_id"> {
  const { maxQualificationRounds, maxEliminationRounds } = calculateMaxRounds(
    tournamentData.playersInput.length
  );

  const players = generatePlayersList(tournamentData.playersInput);

  const initialOrderPlayersId =
    setPlayersInitialOrderAndGetOrderedIdList(players);

  const firstRound = generateRound(initialOrderPlayersId);

  const newTournament: Omit<Tournament, "db_id"> = {
    id: crypto.randomUUID(),
    name: tournamentData.name,
    tournamentMode: tournamentData.tournamentMode,
    date: tournamentData.date,
    players,
    maxQualificationRounds,
    qualificationRounds: [firstRound],
    maxEliminationRounds,
    eliminationRounds: [],
    currentRoundNum: 1,
    status: TournamentStatus.qualification,
    visible: true,
  };

  return newTournament;
}

export function calculateMaxRounds(numOfPlayers: number) {
  if (numOfPlayers % 4 !== 0) {
    throw new Error("Players must be multiple of 4");
  }
  if (numOfPlayers < 8) {
    throw new Error("Players must be at least 8");
  }

  const maxQualificationRounds = Math.floor(Math.log2(numOfPlayers));
  let maxEliminationRounds;

  if (numOfPlayers === 8) {
    maxEliminationRounds = 2;
  } else if (numOfPlayers <= 20) {
    maxEliminationRounds = 3;
  } else {
    maxEliminationRounds = 4;
  }
  return { maxQualificationRounds, maxEliminationRounds };
}

export function generatePlayersList(playersInput: PlayerInput[]): Player[] {
  const playersList: Player[] = playersInput.map((player, index) => {
    const number = index + 1;

    const newPlayer: Player = {
      id: crypto.randomUUID(),
      name: player.playerName,
      club: player.playerClub,
      number,
      initialOrder: -1,
      setsWon: 0,
      setsLost: 0,
      matchesWon: 0,
      matchesLost: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      tournamentPoints: 0,
    };

    return newPlayer;
  });

  return playersList;
}

export function generateRound(playersIdList: string[]): Round {
  const round = [];

  for (let i = 0, table = 1; i < playersIdList.length; i += 2, table++) {
    const match: Match = {
      id: crypto.randomUUID(),
      player1Id: playersIdList[i],
      player2Id: playersIdList[i + 1],
      table,
      sets: [[0, 0]],
    };
    round.push(match);
  }

  return round;
}

export function setPlayersInitialOrderAndGetOrderedIdList(
  playersList: Player[]
): string[] {
  const indexesList = playersList.map((_, index) => index);

  randomizeArray(indexesList);

  for (const player in playersList) {
    playersList[player].initialOrder = indexesList[player];
  }
  const playersIdList = [...playersList]
    .sort((a, b) => a.initialOrder - b.initialOrder)
    .map((player) => player.id);

  return playersIdList;
}

export function isAnyResultRegisteredInRounds(rounds: Round[]): boolean {
  const hasRoundWithSetResults = (round: Round) =>
    round.some(hasMatchWithSetResults);
  const hasMatchWithSetResults = (match: Match) => match.sets.some(hasResults);
  const hasResults = (set: SingleSet) => set[0] > 0 || set[1] > 0;

  return rounds.some(hasRoundWithSetResults);
}

export function resetFirstRound(tournament: Tournament): void {
  const playersList = tournament.players;
  const playersIdList = setPlayersInitialOrderAndGetOrderedIdList(playersList);
  const newFirstRound = generateRound(playersIdList);

  Object.assign(tournament, {
    palyers: playersList,
    qualificationRounds: [newFirstRound],
  });

  // TODO - tasca i test - esborrar quan verifiqui que object assign funciona igual
  // tournament = {
  //   ...tournament,
  //   players: playersList,
  //   qualificationRounds: [newFirstRound],
  // };
}

export function validateSet(set: SingleSet): {
  result: boolean;
  message?: string;
} {
  const [pl1Points, pl2Points] = set;
  const diff = Math.abs(pl1Points - pl2Points);

  if (pl1Points < 11 && pl2Points < 11) {
    return {
      result: false,
      message: "El guanyador ha de tenir 11 punts o més",
    };
  }

  if (diff < 2) {
    return {
      result: false,
      message: "La diferència de punts ha de ser de 2 mínim",
    };
  }

  if ((pl1Points > 11 || pl2Points > 11) && diff !== 2) {
    return {
      result: false,
      message:
        "Si es passen els 11 punts, la diferència de punts ha de ser de 2",
    };
  }

  return { result: true };
}

export function findMatchInTournament(
  tournament: Tournament,
  matchId: string
): { match: Match | undefined; isQualificationMatch: boolean } {
  let match = findMatchInRounds(tournament.qualificationRounds, matchId);
  let isQualificationMatch = true;

  if (!match) {
    match = findMatchInRounds(tournament.eliminationRounds, matchId);
    isQualificationMatch = false;
  }

  return { match, isQualificationMatch };
}

export function findPlayerInTournament(
  playerId: string,
  playersList: Player[]
): Player | undefined {
  return playersList.find((player) => player.id === playerId);
}

export function findMatchInRounds(
  rounds: Round[],
  matchId: string
): Match | undefined {
  for (const round of rounds) {
    const match = round.find((match) => match.id === matchId);
    if (match) return match;
  }
  return undefined;
}

export function validateMatchResults(
  matchResults: RegisterMatchClientData,
  tournamentMode: TournamentMode
): { error?: string } {
  const { sets } = matchResults;

  const setsCount = sets.length;
  let setsPlayed = 0;
  let pl1WinCount = 0;
  let pl2WinCount = 0;
  const minWins = tournamentMode === TournamentMode.bestOf3 ? 2 : 3;
  let winnerExists = false;

  for (const set of sets) {
    setsPlayed++;

    if (set[0] > set[1]) {
      pl1WinCount++;
    } else {
      pl2WinCount++;
    }

    if (pl1WinCount === minWins || pl2WinCount === minWins) {
      winnerExists = true;
      break;
    }
  }

  if (!winnerExists) {
    return { error: `No es detecta cap guanyador amb ${minWins} victòries` };
  }

  if (setsPlayed < setsCount) {
    // TODO - nota - evitar entrar partits extres (es detecta victoria amb menys partits)
    return {
      error: `Es detecta victòria amb menys partits. Al set ${setsPlayed}. El jugador ${pl1WinCount > pl2WinCount ? "1" : "2"} aconsegueix victòria`,
    };
  }

  return {};

  // TODO - dubte - cal que validi tambe els sets si ja ho he fet amb zod?
  // for (const set of matchSets) {
  //   const pl1Points = set[0]
  //   const pl2Points = set[1]
  //   if (pl1Points >= 11 )
  // }
  // return {}
}

export function recalculatePlayerStats(
  playerId: string,
  qualificationRounds: Round[]
): PlayerStats {
  let setsWon: number = 0;
  let setsLost: number = 0;
  let matchesWon: number = 0;
  let matchesLost: number = 0;
  let pointsFor: number = 0;
  let pointsAgainst: number = 0;
  let tournamentPoints: number = 0;

  // recorrem totes les rondes
  for (const round of qualificationRounds) {
    // per cada ronda recorrem els partits per buscar en quin ha participat el player
    for (const match of round) {
      if (playerId !== match.player1Id && playerId !== match.player2Id) {
        continue; // si el jugador no esta en aquest partit continuem buscant
      }

      // si el jugador esta al partit
      const playerIndex = playerId === match.player1Id ? 0 : 1;
      const oponentIndex = playerIndex === 0 ? 1 : 0;
      let setsWonInMatch: number = 0;
      let setsLostInMatch: number = 0;

      // recorrem els sets del partit per definir si es juganyador, sets juganyats o perduts, punts totals a favor i en contra i punts totals de torneig
      for (const set of match.sets) {
        // juganyador del set?
        const setPointsFor = set[playerIndex];
        const setPointsAgainst = set[oponentIndex];
        const isSetWinner = setPointsFor > setPointsAgainst;

        // sets juanyats i perduts
        if (isSetWinner) {
          setsWon++;
          setsWonInMatch++;
        } else {
          setsLost++;
          setsLostInMatch++;
        }

        // punts favor i en contra
        pointsFor += set[playerIndex];
        pointsAgainst += set[oponentIndex];
      }

      const isMatchWinner = setsWonInMatch > setsLostInMatch;

      if (isMatchWinner) {
        matchesWon++;
        tournamentPoints += 3;
      } else {
        matchesLost++;
        tournamentPoints += 1;
      }

      break;
    }
  }

  return {
    setsWon,
    setsLost,
    matchesWon,
    matchesLost,
    pointsFor,
    pointsAgainst,
    tournamentPoints,
  };
}
