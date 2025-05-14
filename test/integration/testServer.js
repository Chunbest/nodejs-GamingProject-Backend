const supertest = require('supertest')

const { dataSource } = require('../../db/data-source')
const app = require('../../app')

class TestServer {
  constructor () {
    this.server = supertest.agent(app)
  }

  setAllHeader () {
    this.setAccept()
    this.setOrigin()
  }

  setAccept () {
    this.server = this.server.set('Accept', 'application/json')
    this.server = this.server.set('Content-Type', 'application/json')
  }

  setOrigin () {
    this.server = this.server.set('Origin', 'http://localhost')
  }

  async getServer () {
    await dataSource.initialize()
    return this.server
  }

  // eslint-disable-next-line class-methods-use-this
  async close () {
    await dataSource.destroy()
  }
}
module.exports = new TestServer()
