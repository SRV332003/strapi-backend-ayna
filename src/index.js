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


    strapi.connections = {};
    io.on('connection', async (socket) => {
      console.log('a user connected');
      const token = await socket.handshake.auth.token;
      //verify token and get user
      const resp = await strapi.plugins[("users-permissions")].services.jwt.verify(token);
      if(resp){
        const id = resp.id;
        try {
          const user = await strapi.db.query('plugin::users-permissions.user').findOne({where: {id}});
          strapi.connections[user.username] = socket;
          socket.on('disconnect', () => {
            console.log('user disconnected');
            strapi.connections[user.username] = null;
          });
          socket.on('message', (msg) => {
            // get username from token
            const jsonData = JSON.parse(msg);
            if(socket.id != strapi.connections[jsonData.data.sender].id){
              console.log('unauthorized');
              socket.disconnect();
              return;
            }
            if(strapi.connections[jsonData.data.recipient]){
              strapi.connections[jsonData.data.recipient].emit('message', JSON.stringify(jsonData));
            }else{
              console.log('Reciever not found or not online');
            }
            console.log('message: ' + msg);
          });
        } catch (error) {
          console.log(error);
        }
      }else{
        console.log('unauthorized');
        socket.disconnect();
      }
    });

  },
};
