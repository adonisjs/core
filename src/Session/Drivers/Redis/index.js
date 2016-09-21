'use strict'

/**
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

/**
 * Redis session driver to store sessions within
 * redis.
 * @class
 * @alias SessionRedisDriver
 */
class Redis {

  /**
   * Injects ['Adonis/Src/Helpers', 'Adonis/Src/Config']
   */
  static get inject () {
    return ['Adonis/Src/Helpers', 'Adonis/Src/Config', 'Adonis/Addons/RedisFactory']
  }

  /**
   * @constructor
   */
  constructor (Helpers, Config, RedisFactory) {
    const redisConfig = Config.get('session.redis')
    this.ttl = Config.get('session.age')
    this.redis = new RedisFactory(redisConfig, Helpers, false) // do not use cluster for sessions
  }

  /**
   * Reads values for a session id from redis.
   *
   * @param  {String} sessionId
   *
   * @return {Object}
   */
  * read (sessionId) {
    try {
      const sessionValues = yield this.redis.get(sessionId)
      yield this.redis.expire(sessionId, this.ttl) // updating expiry after activity
      return JSON.parse(sessionValues)
    } catch (e) {
      return {}
    }
  }

  /**
   * Writes values for a session id to redis.
   *
   * @param  {String} sessionId
   * @param  {Object} values
   *
   * @return {Boolean}
   */
  * write (sessionId, values) {
    const response = yield this.redis.set(sessionId, JSON.stringify(values))
    yield this.redis.expire(sessionId, this.ttl)
    return !!response
  }

  /**
   * Destorys the record of a given sessionId
   *
   * @param  {String} sessionId
   *
   * @return {Boolean}           [description]
   */
  * destroy (sessionId) {
    const response = yield this.redis.del(sessionId)
    return !!response
  }

}

module.exports = Redis
