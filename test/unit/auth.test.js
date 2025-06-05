const {
  describe, it, expect, afterEach, beforeEach
// eslint-disable-next-line import/no-extraneous-dependencies
} = require('@jest/globals')

const config = require('../../config/index')
const jwt = require('../../utils/generateJWT')
const auth = require('../../middlewares/auth')

describe('Test - auth Middleware', () => {
  const secret = config.get('secret.jwtSecret')
  const expired = config.get('secret.jwtExpiresDay')
  const mockUser = { id: 123, name: 'Test User' }
  beforeEach(() => {
    jest.clearAllMocks()
  })
  it('should get error message: secret is required and must be a string.', () => {
    expect(() => {
      auth()
    }).toThrow('Cannot destructure property \'secret\' of \'undefined\' as it is undefined.')
  })

  it('should get error message: secret is required and must be a string.', () => {
    expect(() => {
      auth({ secret: null })
    }).toThrow('[AuthV2] secret is required and must be a string.')
  })

  it('should get error message: userRepository is required and must be a function.', () => {
    expect(() => {
      auth({ secret, userRepository: null })
    }).toThrow('[AuthV2] userRepository is required and must be a function.')
  })

  it('should get invalid message', async () => {
    const mockUserRepo = {
      findOneBy: jest.fn().mockResolvedValue(mockUser)
    }
    const mockReq = {
      headers: {
        authorization: 'Bearer invalid'
      }
    }
    const mockRes = {}
    const mockNext = jest.fn()

    const authFn = auth({
      secret,
      userRepository: mockUserRepo
    })

    await authFn(mockReq, mockRes, mockNext)
    expect(mockNext).toHaveBeenCalledTimes(1)
    expect(mockNext.mock.calls[0][0].message).toBe('無效的 token')
    expect(mockNext.mock.calls[0][0].statusCode).toBe(401)
    expect(mockNext.mock.calls[0][0].status).toBe('fail')
  })
  it('should get missing message', async () => {
    const mockUserRepo = {
      findOneBy: jest.fn().mockResolvedValue(mockUser)
    }
    const mockReq = {
      headers: {}
    }
    const mockRes = {}
    const mockNext = jest.fn()

    const authFn = auth({
      secret,
      userRepository: mockUserRepo
    })

    await authFn(mockReq, mockRes, mockNext)
    expect(mockNext).toHaveBeenCalledTimes(1)
    expect(mockNext.mock.calls[0][0].message).toBe('你沒有權限存取此資源')
    expect(mockNext.mock.calls[0][0].statusCode).toBe(401)
    expect(mockNext.mock.calls[0][0].status).toBe('fail')
  })
  it('should get missing message', async () => {
    const mockUserRepo = {
      findOneBy: jest.fn().mockResolvedValue(mockUser)
    }
    const mockReq = {
      headers: {
        authorization: 'Bearer'
      }
    }
    const mockRes = {}
    const mockNext = jest.fn()

    const authFn = auth({
      secret,
      userRepository: mockUserRepo
    })

    await authFn(mockReq, mockRes, mockNext)
    expect(mockNext).toHaveBeenCalledTimes(1)
    expect(mockNext.mock.calls[0][0].message).toBe('你沒有權限存取此資源')
    expect(mockNext.mock.calls[0][0].statusCode).toBe(401)
    expect(mockNext.mock.calls[0][0].status).toBe('fail')
  })
  it('should get expired message', async () => {
    const expiredSeconds = 1
    const mockUserRepo = {
      findOneBy: jest.fn().mockResolvedValue(mockUser)
    }
    const token = await jwt({
      id: mockUser.id,
      exp: Math.floor(Date.now() / 1000) - expiredSeconds
    }, secret)
    const mockReq = {
      headers: {
        authorization: `Bearer ${token}`
      }
    }
    const mockRes = {}
    const mockNext = jest.fn()

    const authFn = auth({
      secret,
      userRepository: mockUserRepo
    })

    await authFn(mockReq, mockRes, mockNext)
    expect(mockNext).toHaveBeenCalledTimes(1)
    expect(mockNext.mock.calls[0][0].message).toBe('Token 已過期')
    expect(mockNext.mock.calls[0][0].statusCode).toBe(401)
    expect(mockNext.mock.calls[0][0].status).toBe('fail')
  })
  it('should get invalid message when user not found', async () => {
    const mockUserRepo = {
      findOneBy: jest.fn().mockResolvedValue(null)
    }
    const token = await jwt({
      id: mockUser.id
    }, secret, {
      expiresIn: expired
    })
    const mockReq = {
      headers: {
        authorization: `Bearer ${token}`
      }
    }
    const mockRes = {}
    const mockNext = jest.fn()

    const authFn = auth({
      secret,
      userRepository: mockUserRepo
    })

    await authFn(mockReq, mockRes, mockNext)
    expect(mockNext).toHaveBeenCalledTimes(1)
    expect(mockNext.mock.calls[0][0].message).toBe('無效的 token')
    expect(mockNext.mock.calls[0][0].statusCode).toBe(401)
    expect(mockNext.mock.calls[0][0].status).toBe('fail')
  })
  it('should get success message', async () => {
    const mockUserRepo = {
      findOneBy: jest.fn().mockResolvedValue(mockUser)
    }
    const token = await jwt({
      id: mockUser.id
    }, secret, {
      expiresIn: expired
    })
    const mockReq = {
      headers: {
        authorization: `Bearer ${token}`
      }
    }
    const mockRes = {}
    const mockNext = jest.fn()

    const authFn = auth({
      secret,
      userRepository: mockUserRepo
    })

    await authFn(mockReq, mockRes, mockNext)
    expect(mockNext).toHaveBeenCalledTimes(1)
    expect(mockNext.mock.calls[0][0]).toBe(undefined)
    expect(mockReq.user).toMatchObject(mockUser)
  })
  afterEach(() => {
    jest.clearAllMocks()
  })
})
