/*
 * File: SystemHostDB2.model.ts
 * Project: starterexpress
 * File Created: Thursday, 30th January 2025 1:18:52 pm
 * Author: Rede (hamransp@gmail.com)
 * Last Modified: Thursday, 30th January 2025 1:19:30 pm
 * Copyright 2017 - 2022 10RI Dev
 */

import { Model, DataTypes, Sequelize } from 'sequelize'

interface SystemHostAttributes {
  THE_KEY: string
  OPEN_DATE: Date
  LAST_DATE: Date
  NEXT_DATE: Date
  FLG_TX: string
  FLG_OPEN: string
  FLG_CLOSE: string
  FLG_ATM: string
  FORMAT_REK_NSB: string | null
  FORMAT_REK_SSB: string | null
  FORMAT_REK_NOMI: string | null
  PESAN_GLOBAL: string | null
  LAST_UPDATE: Date | null
  SANDI_BANK: string
  ID_LEMBAGA: string
  EXPORT_IMPORT_ATM: string | null
  LEN_PASSWD: number | null
  NAMA_BANK: string | null
  BIN_CODE: string | null
  GIRO_SISKOHAT: string | null
  NOMI_SISKOHAT: string | null
  KEYV: string | null
}

class SystemHostDB2 extends Model<SystemHostAttributes> implements SystemHostAttributes {
  public THE_KEY!: string
  public OPEN_DATE!: Date
  public LAST_DATE!: Date
  public NEXT_DATE!: Date
  public FLG_TX!: string
  public FLG_OPEN!: string
  public FLG_CLOSE!: string
  public FLG_ATM!: string
  public FORMAT_REK_NSB!: string | null
  public FORMAT_REK_SSB!: string | null
  public FORMAT_REK_NOMI!: string | null
  public PESAN_GLOBAL!: string | null
  public LAST_UPDATE!: Date | null
  public SANDI_BANK!: string
  public ID_LEMBAGA!: string
  public EXPORT_IMPORT_ATM!: string | null
  public LEN_PASSWD!: number | null
  public NAMA_BANK!: string | null
  public BIN_CODE!: string | null
  public GIRO_SISKOHAT!: string | null
  public NOMI_SISKOHAT!: string | null
  public KEYV!: string | null

  static initialize(sequelize: Sequelize) {
    this.init(
      {
        THE_KEY: {
          type: DataTypes.CHAR(3),
          allowNull: false,
          primaryKey: true,
          field: 'THE_KEY'
        },
        OPEN_DATE: {
          type: DataTypes.DATEONLY,
          allowNull: false,
          field: 'OPEN_DATE'
        },
        LAST_DATE: {
          type: DataTypes.DATEONLY,
          allowNull: false,
          field: 'LAST_DATE'
        },
        NEXT_DATE: {
          type: DataTypes.DATEONLY,
          allowNull: false,
          field: 'NEXT_DATE'
        },
        FLG_TX: {
          type: DataTypes.CHAR(1),
          allowNull: false,
          field: 'FLG_TX'
        },
        FLG_OPEN: {
          type: DataTypes.CHAR(1),
          allowNull: false,
          field: 'FLG_OPEN'
        },
        FLG_CLOSE: {
          type: DataTypes.CHAR(1),
          allowNull: false,
          field: 'FLG_CLOSE'
        },
        FLG_ATM: {
          type: DataTypes.CHAR(1),
          allowNull: false,
          field: 'FLG_ATM'
        },
        FORMAT_REK_NSB: {
          type: DataTypes.CHAR(20),
          allowNull: true,
          field: 'FORMAT_REK_NSB'
        },
        FORMAT_REK_SSB: {
          type: DataTypes.CHAR(20),
          allowNull: true,
          field: 'FORMAT_REK_SSB'
        },
        FORMAT_REK_NOMI: {
          type: DataTypes.CHAR(20),
          allowNull: true,
          field: 'FORMAT_REK_NOMI'
        },
        PESAN_GLOBAL: {
          type: DataTypes.STRING(250),
          allowNull: true,
          field: 'PESAN_GLOBAL'
        },
        LAST_UPDATE: {
          type: DataTypes.DATEONLY,
          allowNull: true,
          field: 'LAST_UPDATE'
        },
        SANDI_BANK: {
          type: DataTypes.CHAR(3),
          allowNull: false,
          defaultValue: '135',
          field: 'SANDI_BANK'
        },
        ID_LEMBAGA: {
          type: DataTypes.CHAR(3),
          allowNull: false,
          defaultValue: '001',
          field: 'ID_LEMBAGA'
        },
        EXPORT_IMPORT_ATM: {
          type: DataTypes.STRING(2),
          allowNull: true,
          field: 'EXPORT_IMPORT_ATM'
        },
        LEN_PASSWD: {
          type: DataTypes.INTEGER,
          allowNull: true,
          field: 'LEN_PASSWD'
        },
        NAMA_BANK: {
          type: DataTypes.STRING(30),
          allowNull: true,
          field: 'NAMA_BANK'
        },
        BIN_CODE: {
          type: DataTypes.STRING(6),
          allowNull: true,
          field: 'BIN_CODE'
        },
        GIRO_SISKOHAT: {
          type: DataTypes.STRING(15),
          allowNull: true,
          field: 'GIRO_SISKOHAT'
        },
        NOMI_SISKOHAT: {
          type: DataTypes.STRING(15),
          allowNull: true,
          field: 'NOMI_SISKOHAT'
        },
        KEYV: {
          type: DataTypes.STRING(16),
          allowNull: true,
          field: 'KEYV'
        }
      },
      {
        sequelize,
        tableName: 'SYSTEM_HOST',
        schema: 'MASTER',
        timestamps: false,
        freezeTableName: true
      }
    )
  }
}

export default SystemHostDB2