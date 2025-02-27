/*
 * File: index.model.ts
 * File Created: Thursday, 5th September 2024 9:59:08 am
 * Url: https://arungpalakka.com
 * Author: tsi (hamransp@gmail.com)
 * Copyright @ 2024 Rede Studio
 */
import Database from '../services/database.service'
// import SystemHost from './SystemHost.model'
import SystemHostDB2 from './SystemHostDB2.model'
import SystemHost from './SystemHost.model'


const db = Database.getInstance()

export const initializeModels = async () => {
  const pgSequelize = await db.connect('samsatdb')
  SystemHost.initialize(pgSequelize)

  const db2Sequelize = await db.connect('DBQA')
  SystemHostDB2.initialize(db2Sequelize)

  const samsatnewSequelize = await db.connect('samsatnew')

  return {
    pgSequelize,
    db2Sequelize,
    samsatnewSequelize,
    SystemHost,
    SystemHostDB2
  }
}

export default db
