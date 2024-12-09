
// TODO - nota - esborrar comentari quan ho tingui clar
// Responsabilitats - 
// - conte les funcions que interactuen amb la db 
// - maneja consultes CRUD (crear torneig, obtenir tornejos per id, ...)
// - no incloure logica de validacio ni manipulacio de dades (aixo es fa al controlador)

// simulacio de base de dades en entorn local
const tournaments: any[] = []  // TODO - tasca - tipar

// quant vulgui incloure la db nomes haure de cridar dbTournamentModel i adaptar el maneig de CRUD al tipus de db

export const TournamentModel = {
  async createTournament(tournamentData: any): Promise<any> { // TODO - dubte i tasca - tipar - com diferencio del tournament de db (amb db_id de database) de tournament (sense db_id)
    const newTournament = {
      db_id: crypto.randomUUID(),
      ...tournamentData,
    }

    tournaments.unshift(newTournament)

    return newTournament
  },

  async getAllTournamets(): Promise<any[]> { // TODO - tasca - tipar
    return tournaments
  },

  async getTournamentById(id: string): Promise<any> { // TODO - tasca - tipar
    const tournament = tournaments.find(tournament => tournament.id === id)

    return tournament
  },

  async updateTournament(id: string, tournamentData: any): Promise<any> { // TODO - tasca - tipar
    const tournamentIndex = tournaments.findIndex(tournament => tournament.id === id)

    tournaments[tournamentIndex] = {
      ...tournaments[tournamentIndex],
      ...tournamentData,
    }

    return tournaments[tournamentIndex]
  }
}
