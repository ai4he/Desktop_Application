import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';

import Event from '../../Models/Event';

import { capitalizeFirstLetter } from '../../../utils/strings';

export default class EventsController {
  public async store({ request, response }: HttpContextContract) {
    const { name, timestamp, parameters: { tab_name, url, x, y, startsTimestamp, endsTimestamp } } = request.body();

    return await Event.create({ name, timestamp, tab_name: tab_name, url, x, y, starts_timestamp: startsTimestamp, ends_timestamp: endsTimestamp })
      .then(() => { return response.status(200).send({}) })
      .catch(() => { return response.status(500).send({}) });
  }

  public async log({ request, response }: HttpContextContract) {
    const { date } = request.params();

    // Fecha en formato YYYY-MM-DD
    const todayDate = new Date().toISOString().split('T')[0];

    const events = await Event.query().whereLike('created_at', `${date}%`);

    if (events.length === 0) {
      return response.status(500).send({
        logs: `No se encontro ningun registro en el dia ${date}. Verifica que el formato sea valido YYYY-MM-DD`
      })
    }

    const logs: string[] = [];

    events.slice().reverse().forEach((event, idx) => {
      const { name, tab_name, url, x, y, starts_timestamp, ends_timestamp, createdAt } = event;
      let text = ""

      if (date === todayDate) {
        text = `A las ` +
          `${createdAt.hour < 10 ? `0${createdAt.hour}` : createdAt.hour}` +
          `:${createdAt.minute < 10 ? `0${createdAt.minute}` : createdAt.minute}` +
          `:${createdAt.second < 10 ? `0${createdAt.second}` : createdAt.second}`;
      } else {
        if (idx === 0) {
          text = `El ${capitalizeFirstLetter(createdAt.weekdayLong)} ${createdAt.day < 10 ? `0${createdAt.day}` : createdAt.day} ` +
            `${capitalizeFirstLetter(createdAt.monthLong)} del ${createdAt.year} a las ` +
            `${createdAt.hour < 10 ? `0${createdAt.hour}` : createdAt.hour}` +
            `:${createdAt.minute < 10 ? `0${createdAt.minute}` : createdAt.minute}` +
            `:${createdAt.second < 10 ? `0${createdAt.second}` : createdAt.second}`;

        } else {
          text = `A las ` +
            `${createdAt.hour < 10 ? `0${createdAt.hour}` : createdAt.hour}` +
            `:${createdAt.minute < 10 ? `0${createdAt.minute}` : createdAt.minute}` +
            `:${createdAt.second < 10 ? `0${createdAt.second}` : createdAt.second}`;
        }
      }

      const urlBase = url.split('/');

      // Variables para el switch
      let secondsBetween = 0;
      let h = 0
      let m = 0
      let s = 0

      switch (name) {
        case 'URLChange':
          logs.push(`${text} abri "${tab_name}" ${urlBase[2]}`);
          break;

        case 'click':
          logs.push(`${text} clickee en x:${x} y:${y} en "${tab_name}" ${urlBase[2]}`);
          break;

        case 'keypress':
          secondsBetween = (ends_timestamp - starts_timestamp) / 1000;

          h = Math.floor(secondsBetween / 3600);
          m = Math.floor(secondsBetween % 3600 / 60);
          s = Math.floor(secondsBetween % 3600 % 60);

          logs.push(`${text} escribi durante ${h}h:${m}m:${s}s en "${tab_name}" ${urlBase[2]}`);
          break;

        case 'scroll':
          secondsBetween = (ends_timestamp - starts_timestamp) / 1000;

          h = Math.floor(secondsBetween / 3600);
          m = Math.floor(secondsBetween % 3600 / 60);
          s = Math.floor(secondsBetween % 3600 % 60);

          logs.push(`${text} scrollee durante ${h}h:${m}m:${s}s en "${tab_name}" ${urlBase[2]}`);
          break;

        default:
          break;
      }
    })

    return response.status(200).send({ logs });
  }
}
