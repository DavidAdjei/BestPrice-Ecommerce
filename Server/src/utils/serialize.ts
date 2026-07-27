import type { User, Address } from "../generated/client.js";

type UserWithAddress = User & { address?: Address | null };

export const toPublicUser = (user: UserWithAddress) => {
  const { password: _password, paystackSecret: _paystackSecret, ...safe } = user;
  return safe;
};
