import Route from '@ioc:Adonis/Core/Route';

Route.group(() => {
    Route.post('/store', 'EventsController.store');
}).prefix('events');

