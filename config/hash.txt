/**
 * Config source: https://git.io/fj1Kb
 *
 * Feel free to let us know via PR, if you find something broken in this config
 * file.
 */

import { HashConfigContract } from '@ioc:Adonis/Core/Hash'

const hashConfig: HashConfigContract = {
  /*
  |--------------------------------------------------------------------------
  | The default driver in use
  |--------------------------------------------------------------------------
  |
  | The default driver Hash provider will make for hashing and verifying
  | values.
  |
  */
  driver: 'bcrypt',

  /*
  |--------------------------------------------------------------------------
  | Bcrypt driver
  |--------------------------------------------------------------------------
  |
  | Configuration for the bcrypt driver.
  |
  | Make sure you install the underlying dependency for this driver to work.
  | https://www.npmjs.com/package/@phc/bcrypt.
  |
  | npm install @phc/bcrypt@"<2.0.0"
  |
  */
  bcrypt: {
    rounds: 10,
  },

  /*
  |--------------------------------------------------------------------------
  | Argon2 driver
  |--------------------------------------------------------------------------
  |
  | Configuration for the Argon driver.
  |
  | Make sure you install the underlying dependency for this driver to work.
  | https://www.npmjs.com/package/@phc/argon2.
  |
  | npm install @phc/argon2@"<2.0.0"
  |
  */
  argon: {
    variant: 'id',
    iterations: 3,
    memory: 4096,
    parallelism: 1,
    saltSize: 16,
  },
}

export default hashConfig
