/**
 * Config source: https://git.io/Jfefl
 *
 * Feel free to let us know via PR, if you find something broken in this config
 * file.
 */

import { AssetsConfig } from '@ioc:Adonis/Core/Static'

const staticConfig: AssetsConfig = {
  /*
  |--------------------------------------------------------------------------
  | Enabled
  |--------------------------------------------------------------------------
  |
  | A boolean to enable or disable serving static files. The static files
  | are served from the `public` directory inside the application root.
  | However, you can override the default path inside `.adonisrc.json`
  | file.
  |
  |
  */
  enabled: true,

  /*
  |--------------------------------------------------------------------------
  | Handling Dot Files
  |--------------------------------------------------------------------------
  |
  | Decide how you want the static assets server to handle the `dotfiles`.
  | By default, we ignore them as if they don't exists. However, you
  | can choose between one of the following options.
  |
  | - ignore: Behave as if the file doesn't exists. Results in 404.
  | - deny: Deny access to the file. Results in 403.
  | - allow: Serve the file contents
  |
  */
  dotFiles: 'ignore',

  /*
  |--------------------------------------------------------------------------
  | Generating Etag
  |--------------------------------------------------------------------------
  |
  | Handle whether or not to generate etags for the files. Etag allows browser
  | to utilize the cache when file hasn't been changed.
  |
  */
  etag: true,

  /*
  |--------------------------------------------------------------------------
  | Set Last Modified
  |--------------------------------------------------------------------------
  |
  | Whether or not to set the `Last-Modified` header in the response. Uses
  | the file system's last modified value.
  |
  */
  lastModified: true,
}

export default staticConfig
