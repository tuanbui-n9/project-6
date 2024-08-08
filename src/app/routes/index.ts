import { FastifyReply, FastifyRequest } from 'fastify'
import {
  Type as T,
  FastifyPluginAsyncTypebox,
} from '@fastify/type-provider-typebox'

const verifySIdCookies = (
  request: FastifyRequest,
  reply: FastifyReply,
): string | FastifyReply => {
  const sid = request.cookies['sid']
  if (!sid) {
    return reply.unauthorized('No found sid')
  }

  const unsignCookie = request.unsignCookie(sid)
  if (!unsignCookie?.valid) {
    return reply.unauthorized('Invalid sid')
  }

  return unsignCookie.value || ''
}

const setCookiesDomain = (origin: string, environment: string) => {
  if (origin && origin.includes('localhost') && environment !== 'production') {
    return false
  }
  return true
}

const getSameSiteValue = (origin: string, environment: string) => {
  if (origin && origin.includes('localhost') && environment !== 'production') {
    return 'none'
  }
  return 'strict'
}

export default (async (app) => {
  app.get('/', () => ({ status: 'ok', date: new Date() }))

  app.post(
    '/auth',
    {
      preHandler: [
        (request, reply, next) => {
          if (!request.headers.authorization) {
            return reply.unauthorized('Invalid idToken!')
          }
          next()
        },
      ],
      schema: {
        tags: ['auth'],
        description: 'Authorize user',
        body: T.Object({}),
      },
    },
    async (request, reply) => {
      const authorization = request.headers.authorization as string

      if (!authorization.startsWith('Bearer ')) {
        return reply.unauthorized('Invalid idToken!')
      }

      const token = authorization.split(' ')[1]
      const decodedToken = await app.firebaseAdmin
        .verifyIdToken(token)
        .catch(() => null)

      if (!decodedToken?.uid) {
        return reply.unauthorized('Invalid token')
      }

      const uid = decodedToken.uid

      const userInfo = await app.firebaseAdmin.getUserByUid(uid)
      if (!userInfo) {
        return reply.unauthorized('Invalid user')
      }

      const customToken = await app.firebaseAdmin.createCustomToken(
        uid,
        userInfo.customClaims,
      )

      const origin = request.headers.origin as string
      const environment = app.cfg.get('NODE_ENV') as string
      return reply
        .setCookie('sid', uid, {
          path: '/',
          httpOnly: true,
          secure: true,
          sameSite: getSameSiteValue(origin, app.cfg.get('NODE_ENV') as string),
          ...(setCookiesDomain(origin, environment) && {
            domain: app.cfg.get('AUTH_ROOT_DOMAIN'),
          }),
          signed: true,
          expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14), // 2 weeks
        })
        .send({
          customToken,
          customClaims: userInfo.customClaims,
          uid,
        })
    },
  )

  app.post(
    '/check-session',
    {
      schema: {
        tags: ['auth'],
        description: 'Check session',
        body: T.Object({}),
      },
    },
    async (request, reply) => {
      const uid = verifySIdCookies(request, reply) as string

      if (!uid) {
        return reply.unauthorized('No found sid')
      }

      const userInfo = await app.firebaseAdmin.getUserByUid(uid)
      if (!userInfo) {
        return reply.unauthorized('Invalid user')
      }

      const customToken = await app.firebaseAdmin.createCustomToken(
        uid,
        userInfo.customClaims,
      )

      const origin = request.headers.origin as string
      const environment = app.cfg.get('NODE_ENV') as string
      return reply
        .setCookie('sid', uid, {
          path: '/',
          httpOnly: true,
          secure: true,
          sameSite: getSameSiteValue(origin, environment),
          ...(setCookiesDomain(origin, environment) && {
            domain: app.cfg.get('AUTH_ROOT_DOMAIN'),
          }),
          signed: true,
          expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14), // 2 weeks
        })
        .send({
          customToken,
          uid,
        })
    },
  )

  app.post(
    '/clear-session',
    {
      schema: {
        tags: ['auth'],
        description: 'Clear session',
        body: T.Object({}),
      },
    },
    async (request, reply) => {
      const sid = verifySIdCookies(request, reply) as string
      if (!sid) {
        return reply.unauthorized('No found sid')
      }

      const origin = request.headers.origin as string
      const environment = app.cfg.get('NODE_ENV') as string
      return reply
        .clearCookie('sid', {
          path: '/',
          ...(setCookiesDomain(origin, environment) && {
            domain: app.cfg.get('AUTH_ROOT_DOMAIN'),
          }),
        })
        .send({
          status: 'success',
        })
    },
  )
}) as FastifyPluginAsyncTypebox
