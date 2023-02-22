import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Event from '../../Models/Event';

export default class EventsController {
  public async store({ request, response }: HttpContextContract) {
    const { name, timestamp, parameters: { tab_name, url, x, y, startsTimestamp, endsTimestamp } } = request.body();

    return await Event.create({ name, timestamp, tab_name: tab_name, url, x, y, starts_timestamp: startsTimestamp, ends_timestamp: endsTimestamp })
      .then(() => { return response.status(200).send({}) })
      .catch(() => { return response.status(500).send({}) });
  }
}
