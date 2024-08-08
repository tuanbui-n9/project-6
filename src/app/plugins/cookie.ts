import fp from 'fastify-plugin'
import type { FastifyCookieOptions } from '@fastify/cookie'
import cookie from '@fastify/cookie'

export default fp(
  async (app) => {
    app.register(cookie, {
      secret: app.cfg.get('COOKIE_SECRET'),
      parseOptions: {
        sameSite: 'strict',
        httpOnly: true,
        secure: true,
      },
    } as FastifyCookieOptions)
  },
  {
    name: 'plugin-cookie',
    dependencies: ['plugin-config'],
  },
)
