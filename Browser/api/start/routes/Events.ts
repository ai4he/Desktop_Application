import Route from '@ioc:Adonis/Core/Route';

Route.group(() => {
    Route.get('/log/:date', 'EventsController.log');
    Route.post('/store', 'EventsController.store');
}).prefix('events');

