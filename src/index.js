'use strict';

const { Server } = require('socket.io');

module.exports = {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/*{ strapi }*/) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  bootstrap({ strapi }) {
    const io = new Server(strapi.server.httpServer, {
      path: '/chatws',
      cors: {
        origin: 'http://localhost:5173',methods: ["GET", "POST"]
      },
    });

    strapi.io = io;


    io.on('connection', async (socket) => {
      console.log('a user connected');
      const token = await socket.handshake.auth.token;
      //verify token and get user
      try{
        if(!token){
          console.log('unauthorized');
          socket.disconnect();
        }
        const resp = await strapi.plugins[("users-permissions")].services.jwt.verify(token);

        if(resp){
          const id = resp.id;
          try {

            socket.on('disconnect', () => {
              console.log('user disconnected');
            });


            socket.on('message', (msg) => {
            let jsonData = JSON.parse(msg);
            jsonData.data.identifier = "server";
            
            socket.emit('message', JSON.stringify(jsonData));
            console.log('message: ' + jsonData);
            });

          } catch (error) {
            console.log(error);
          }
        }else{
          console.log('unauthorized');
          socket.disconnect();
        }
      }catch(err){
        console.log(err);
        socket.disconnect();
      }
    });

  },
};
