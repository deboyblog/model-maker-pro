/**
 * Created by Deboy on 2017/6/20.
 */
import Sequelize from 'sequelize'
function SQLService (config = {
  host: '',
  port: '3306',
  dbName: '',
  username: '',
  password: '',
  type: 'mysql',
  options: {}
}) {
  const connect = new Sequelize(config.dbName, config.username, config.password, Object.assign({}, {
    host: config.host,
    // 'mysql'|'sqlite'|'postgres'|'mssql',
    dialect: config.type
  }, config.options)).queryInterface
  const queryInterface = connect.queryInterface
  return {
    connect: connect,
    queryInterface: queryInterface,
    auth () {
      return connect.authenticate()
    },
    dumpAllTables () {
      return new Promise(() => {
        try {
          queryInterface.showAllTables(() => {
            return Promise.resolve()
          })
        } catch (e) {
          return Promise.reject(e)
        }
      })
    },
    convertToProject () {
      // TODO: convertToProject
      console.log('convertToProject')
    }
  }
}
export default SQLService
