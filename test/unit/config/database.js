module.exports = {
  mysql: {
    client: 'mysql',
    connection: {
      host: 'localhost',
      password: '',
      user: ''
    }
  },
  sqlite: {
    client: 'sqlite'
  },
  mysqlProduction: 'self::database.mysql',
  connection: false
}
