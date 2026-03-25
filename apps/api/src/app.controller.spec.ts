import { AppController } from './app.controller'

describe('AppController', () => {
  let appController: AppController

  beforeEach(() => {
    appController = new AppController()
  })

  describe('me', () => {
    it('returns the authenticated user payload', () => {
      const user = { sub: 'user-1', role: 'ADMIN' }

      expect(appController.me({ user })).toEqual(user)
    })
  })
})
