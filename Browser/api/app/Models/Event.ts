import { DateTime } from 'luxon';
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm';

export default class Event extends BaseModel {
  public static table = 'tbl_events';

  @column({ isPrimary: true })
  public id: number

  @column()
  public name: string

  @column()
  public timestamp: number

  @column()
  public tab_name: string

  @column()
  public url: string

  @column()
  public x: number

  @column()
  public y: number

  @column()
  public starts_timestamp: number

  @column()
  public ends_timestamp: number

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
