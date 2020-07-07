import storage from "../db/storage";

const findUserByEmail = (email) => storage.users.all().find(user => user.email === email);

const findAccount = async (ctx, sub) => {
  const user = await findUserByEmail(sub);
  return {
    accountId: user.email,
    async claims() {
      return {
        sub: user.email, email: user.email, id: user.id, custom_scope: 'some custom scope',
      };
    },
  };
};

export { findUserByEmail, findAccount };
