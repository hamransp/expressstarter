/*
 * File: index.model.ts
 * File Created: Thursday, 5th September 2024 9:59:08 am
 * Url: https://arungpalakka.com
 * Author: tsi (hamransp@gmail.com)
 * Copyright @ 2024 Rede Studio
 */
import Database from '../services/pg.service'
// import SystemHost from './SystemHost.model'
import SystemHostDB2 from './SystemHostDB2.model'

const db = Database.getInstance()

export const initializeModels = async () => {
  const sequelize = await db.connect()
  // SystemHost.initialize(sequelize)
  SystemHostDB2.initialize(sequelize)

  return {
    sequelize,
    // SystemHost
    SystemHostDB2
  }
}

export default db
