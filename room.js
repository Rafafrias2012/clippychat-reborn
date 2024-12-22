 class Room {
   constructor(name) {
       this.name = name;
       this.users = new Map();
   }

   addUser(user) {
       this.users.set(user.id, user);
   }

   removeUser(user) {
       this.users.delete(user.id);
   }

   getUsers() {
       return Array.from(this.users.values());
   }
 }

 module.exports = Room; 