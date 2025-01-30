/*
 * File: SystemHost.model.ts
 * Project: starterexpress
 * File Created: Thursday, 30th January 2025 11:57:14 am
 * Author: Rede (hamransp@gmail.com)
 * Last Modified: Thursday, 30th January 2025 11:57:32 am
 * Copyright 2017 - 2022 10RI Dev
 */
import { Model, DataTypes, Sequelize } from 'sequelize'

interface SystemHostAttributes {
  the_key: string
  open_date: Date
  last_date: Date
  next_date: Date
  flg_tx: string
  flg_open: string
  flg_close: string
  pesan_global: string | null
  last_update: Date | null
  nama_bank: string | null
  giro_polri: string | null
  giro_jasa_raharja: string | null
  keyv: string | null
  max_thn_tungg: number | null
  max_bln_denda: number | null
  max_hari_denda: number | null
  max_hari_denda_js: number | null
  max_thn_denda_js: number | null
  max_jml_denda_js: number | null
  min_bln_pajak_berlaku: number | null
  max_bln_faktur: number | null
  giro_dispenda: string | null
  pro_ret_upah_pungut: number | null
  pro_ret_provinsi: number | null
  pro_ret_kab_kota: number | null
  giro_induk_js: string | null
  kd_user_close: string | null
  tgl_close: Date | null
}

class SystemHost extends Model<SystemHostAttributes> implements SystemHostAttributes {
  public the_key!: string
  public open_date!: Date
  public last_date!: Date
  public next_date!: Date
  public flg_tx!: string
  public flg_open!: string
  public flg_close!: string
  public pesan_global!: string | null
  public last_update!: Date | null
  public nama_bank!: string | null
  public giro_polri!: string | null
  public giro_jasa_raharja!: string | null
  public keyv!: string | null
  public max_thn_tungg!: number | null
  public max_bln_denda!: number | null
  public max_hari_denda!: number | null
  public max_hari_denda_js!: number | null
  public max_thn_denda_js!: number | null
  public max_jml_denda_js!: number | null
  public min_bln_pajak_berlaku!: number | null
  public max_bln_faktur!: number | null
  public giro_dispenda!: string | null
  public pro_ret_upah_pungut!: number | null
  public pro_ret_provinsi!: number | null
  public pro_ret_kab_kota!: number | null
  public giro_induk_js!: string | null
  public kd_user_close!: string | null
  public tgl_close!: Date | null

  static initialize(sequelize: Sequelize) {
    this.init(
      {
        the_key: {
          type: DataTypes.CHAR(3),
          allowNull: false,
          primaryKey: true
        },
        open_date: {
          type: DataTypes.DATEONLY,
          allowNull: false
        },
        last_date: {
          type: DataTypes.DATEONLY,
          allowNull: false
        },
        next_date: {
          type: DataTypes.DATEONLY,
          allowNull: false
        },
        flg_tx: {
          type: DataTypes.CHAR(1),
          allowNull: false
        },
        flg_open: {
          type: DataTypes.CHAR(1),
          allowNull: false
        },
        flg_close: {
          type: DataTypes.CHAR(1),
          allowNull: false
        },
        pesan_global: {
          type: DataTypes.STRING(250),
          allowNull: true
        },
        last_update: {
          type: DataTypes.DATEONLY,
          allowNull: true
        },
        nama_bank: {
          type: DataTypes.STRING(30),
          allowNull: true
        },
        giro_polri: {
          type: DataTypes.STRING(15),
          allowNull: true
        },
        giro_jasa_raharja: {
          type: DataTypes.STRING(15),
          allowNull: true
        },
        keyv: {
          type: DataTypes.STRING(16),
          allowNull: true
        },
        max_thn_tungg: {
          type: DataTypes.DECIMAL(5),
          allowNull: true
        },
        max_bln_denda: {
          type: DataTypes.DECIMAL(5),
          allowNull: true
        },
        max_hari_denda: {
          type: DataTypes.DECIMAL(5),
          allowNull: true
        },
        max_hari_denda_js: {
          type: DataTypes.DECIMAL(5),
          allowNull: true
        },
        max_thn_denda_js: {
          type: DataTypes.DECIMAL(5),
          allowNull: true
        },
        max_jml_denda_js: {
          type: DataTypes.DECIMAL(15),
          allowNull: true
        },
        min_bln_pajak_berlaku: {
          type: DataTypes.DECIMAL(5),
          allowNull: true
        },
        max_bln_faktur: {
          type: DataTypes.DECIMAL(5),
          allowNull: true
        },
        giro_dispenda: {
          type: DataTypes.STRING(14),
          allowNull: true
        },
        pro_ret_upah_pungut: {
          type: DataTypes.DECIMAL(5),
          allowNull: true
        },
        pro_ret_provinsi: {
          type: DataTypes.DECIMAL(5),
          allowNull: true
        },
        pro_ret_kab_kota: {
          type: DataTypes.DECIMAL(5),
          allowNull: true
        },
        giro_induk_js: {
          type: DataTypes.STRING(14),
          allowNull: true
        },
        kd_user_close: {
          type: DataTypes.STRING(5),
          allowNull: true
        },
        tgl_close: {
          type: DataTypes.DATE,
          allowNull: true
        }
      },
      {
        sequelize,
        tableName: 'system_host',
        schema: 'samsat',
        timestamps: false
      }
    )
  }
}

export default SystemHost