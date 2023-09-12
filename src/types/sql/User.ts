// Entity from auth0
// {
//   "email": "jane@exampleco.com",
//   "email_verified": false,
//   "username": "janedoe",
//   "phone_number": "+199999999999999",
//   "phone_verified": false,
//   "user_id": "auth0|5457edea1b8f22891a000004",
//   "created_at": "",
//   "updated_at": "",
//   "identities": [
//     {
//       "connection": "Initial-Connection",
//       "user_id": "5457edea1b8f22891a000004",
//       "provider": "auth0",
//       "isSocial": false
//     }
//   ],
//   "app_metadata": {},
//   "user_metadata": {},
//   "picture": "",
//   "name": "",
//   "nickname": "",
//   "multifactor": [
//     ""
//   ],
//   "last_ip": "",
//   "last_login": "",
//   "logins_count": 0,
//   "blocked": false,
//   "given_name": "",
//   "family_name": ""
// }

import type { Connection } from "../Profile";

export interface UserTag {
  name: string;
  category: string;
}

export interface BaseUser {
  id: string;
  email: string;
  tenant_id: string;
  created_at: string;
  modified_at: string;
  given_name?: string;
  family_name?: string;
  nickname?: string;
  name?: string;
  picture?: string;
  locale?: string;
  // why do we have this in Profile but not in  User?
  // seems to be some duplication here... Also in the DOs
  // connections: Connection[];
  // TODO
  // - check planet scale SQL db - what do we have here?
  // - checkout auth0 mgmt API! - what can we send up there?
  // - also check other Auth0 profile types - SURELY we just copy them 8-0
}

export interface User extends BaseUser {
  tags?: UserTag[];
}

export interface SqlUser extends BaseUser {
  tags?: string;
}
