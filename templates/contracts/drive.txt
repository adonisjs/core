/**
 * Contract source: https://git.io/JBt3I
 *
 * Feel free to let us know via PR, if you find something broken in this contract
 * file.
 */

declare module '@ioc:Adonis/Core/Drive' {
  interface DisksList {
    local: {
      config: LocalDriverConfig
      implementation: LocalDriverContract
    }
    // s3: {
    //   config: S3DriverConfig
    //   implementation: S3DriverContract
    // }
    // gcs: {
    //   config: GcsDriverConfig
    //   implementation: GcsDriverContract
    // }
  }
}
