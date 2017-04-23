module.exports = {
  mysql: {
    client: 'mysql',
    connection: {
      host: 'localhost',
      password: '',
      user: ''
    }
  },
  mysqlProduction: 'self::database.mysql',
  connection: false
}
