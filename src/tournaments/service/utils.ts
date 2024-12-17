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

  const firstRound = generateQualificationRound(initialOrderPlayersId);

  const newTournament: Omit<Tournament, "db_id"> = {
    id: crypto.randomUUID(),
    name: tournamentData.name,
    winnerId: undefined,
    tournamentMode: tournamentData.tournamentMode,
    date: tournamentData.date,
    classification: players,
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
      playerName: player.playerName,
      playerClub: player.playerClub,
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

export function generateQualificationRound(playersIdList: string[]): Round {
  const round: Round = [];

  for (let i = 0, table = 1; i < playersIdList.length; i += 2, table++) {
    const match = generateMatch(playersIdList[i], playersIdList[i + 1], table);
    round.push(match);
  }

  return round;
}

export function generateMatch(
  player1Id: string,
  player2Id: string,
  table: number
): Match {
  return {
    id: crypto.randomUUID(),
    player1Id: player1Id,
    player2Id: player2Id,
    table,
    sets: [[0, 0]],
  };
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
  const playersList = tournament.classification;
  const playersIdList = setPlayersInitialOrderAndGetOrderedIdList(playersList);
  const newFirstRound = generateQualificationRound(playersIdList);

  tournament.classification = playersList;
  tournament.qualificationRounds = [newFirstRound];
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

export function createNextRound(tournament: Tournament): void {
  if (tournament.status === TournamentStatus.finished) {
    const badRequestError = new Error("Tournament already finished");
    badRequestError.name = "Bad request";
    throw badRequestError;
  }

  const currentRound = getCurrentRound(tournament);

  const { error } = validateRoundResults(currentRound);

  if (error) {
    const badRequestError = new Error(error);
    badRequestError.name = "Bad request";
    throw badRequestError;
  }

  if (tournament.status === TournamentStatus.qualification) {
    if (tournament.currentRoundNum < tournament.maxQualificationRounds) {
      // segueixen qualificationRounds
      const nextQualificationRound =
        getNextQualificationRoundMatches(currentRound);
      tournament.qualificationRounds.push(nextQualificationRound);
    } else {
      // acaben qualificationRounds
      tournament.status = TournamentStatus.elimination;
      tournament.currentRoundNum = 0;
      const maxQualifiedPlayersNum = Math.pow(
        2,
        tournament.maxEliminationRounds
      );
      const qualifiedPlayers = tournament.classification.slice(
        0,
        maxQualifiedPlayersNum
      );
      const firstEliminationRound =
        getFirstEliminationRoundMatches(qualifiedPlayers);

      tournament.eliminationRounds = [firstEliminationRound];
    }
  } else if (tournament.status === TournamentStatus.elimination) {
    if (tournament.currentRoundNum < tournament.maxEliminationRounds) {
      // segueixen eliminationRounds
      const nextEliminationRound = getNextEliminationRoundMatches(currentRound);
      tournament.eliminationRounds.push(nextEliminationRound);
    } else {
      // acaba torneig
      tournament.status = TournamentStatus.finished;
      tournament.winnerId = getMatchWinnerLoserId(currentRound[0]).winnerId;
      return;
    }
  }

  tournament.currentRoundNum++;
}

export function getCurrentRound(tournament: Tournament): Round {
  let currentRound: Round;

  if (tournament.status === TournamentStatus.qualification) {
    currentRound =
      tournament.qualificationRounds[tournament.currentRoundNum - 1];
  } else if (tournament.status === TournamentStatus.elimination) {
    currentRound = tournament.eliminationRounds[tournament.currentRoundNum - 1];
  } else {
    currentRound =
      tournament.eliminationRounds[tournament.eliminationRounds.length - 1];
  }

  return currentRound;
}

export function validateRoundResults(currentRound: Round): { error?: string } {
  for (const match of currentRound) {
    for (const set of match.sets) {
      if (set[0] === 0 && set[1] === 0) {
        return { error: "Tots els partits han d'estar registrats" };
      }
    }
  }
  return {};
}

export function getNextQualificationRoundMatches(currentRound: Round): Round {
  const winnersIdArr = [];
  const losersIdArr = [];

  for (const match of currentRound) {
    const { winnerId, loserId } = getMatchWinnerLoserId(match);
    winnersIdArr.push(winnerId);
    losersIdArr.push(loserId);
  }

  return generateQualificationRound([...winnersIdArr, ...losersIdArr]);
}

export function getMatchWinnerLoserId(match: Match): {
  winnerId: string;
  loserId: string;
} {
  let pl1Points = 0;
  let pl2Points = 0;
  for (const set of match.sets) {
    if (set[0] > set[1]) {
      pl1Points++;
    } else if (set[1] > set[0]) {
      pl2Points++;
    }
  }
  return {
    winnerId: pl1Points > pl2Points ? match.player1Id : match.player2Id,
    loserId: pl1Points < pl2Points ? match.player1Id : match.player2Id,
  };
}

export function getFirstEliminationRoundMatches(
  qualifiedPlayers: Player[]
): Round {
  const firstHalf: Match[] = [];
  const secondHalf: Match[] = [];
  const tableNum = qualifiedPlayers.length / 2;

  for (let i = 0, j = qualifiedPlayers.length - 1; i < tableNum; i++, j--) {
    const pl1Id = qualifiedPlayers[i].id;
    const pl2Id = qualifiedPlayers[j].id;
    if (i % 2 === 0) {
      const nextTable = firstHalf.length + 1;
      firstHalf.push(generateMatch(pl1Id, pl2Id, nextTable));
    } else {
      const nextTable = secondHalf.length + tableNum / 2 + 1;
      secondHalf.push(generateMatch(pl1Id, pl2Id, nextTable));
    }
  }
  return [...firstHalf, ...secondHalf];
}

export function getNextEliminationRoundMatches(currentRound: Round): Round {
  const nextRound: Round = [];

  for (let i = 0, table = 1; i < currentRound.length; i += 2, table++) {
    const { winnerId: pl1Id } = getMatchWinnerLoserId(currentRound[i]);
    const { winnerId: pl2Id } = getMatchWinnerLoserId(currentRound[i + 1]);
    const nextMatch = generateMatch(pl1Id, pl2Id, table);
    nextRound.push(nextMatch);
  }

  return nextRound;
}

export function sortClassification(classification: Player[]): void {
  classification.sort((a, b) => {
    // 1. Ordenar per mes PUNTS DE TORNEIG (descendent)
    if (b.tournamentPoints !== a.tournamentPoints) {
      return b.tournamentPoints - a.tournamentPoints;
    }

    // 2. Desempatar per major DIFERENCIA de SETS GUANYATS-PERDUTS (descendent)
    const aSetDifference = a.setsWon - a.setsLost;
    const bSetDifference = b.setsWon - b.setsLost;

    if (bSetDifference !== aSetDifference) {
      return bSetDifference - aSetDifference;
    }

    // 3. Desempatar per mes SETS GUANYATS (descendent)
    if (b.setsWon !== a.setsWon) {
      return b.setsWon - a.setsWon;
    }

    // 4. Desempatar per major DIFERENCIA de PUNTS (descendent)
    const aPointDifference = a.pointsFor - a.pointsAgainst;
    const bPointDifference = b.pointsFor - b.pointsAgainst;

    if (bPointDifference !== aPointDifference) {
      return bPointDifference - aPointDifference;
    }

    // 5. Desempatar per mes PUNTS GUANYATS (descendent)
    if (b.pointsFor !== a.pointsFor) {
      return b.pointsFor - a.pointsFor;
    }

    // Si segueix l'empat, es mante l'ordre original
    return 0;
  });
}
