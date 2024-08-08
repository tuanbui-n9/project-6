import { join } from 'path'
import AutoLoad, { AutoloadPluginOptions } from '@fastify/autoload'
import { FastifyPluginAsync, FastifyServerOptions } from 'fastify'
import { IConfigOpts } from './plugins/config'

export interface AppOptions
  extends FastifyServerOptions,
    Partial<AutoloadPluginOptions> {
  envsWhitelist: IConfigOpts['envsWhitelist']
}
const appOptions: AppOptions = {
  envsWhitelist: [
    'PORT',
    'FIREBASE_SERVICE_ACCOUNT',
    'NODE_ENV',
    'API_VERSION',
    'COOKIE_SECRET',
    'FIREBASE_API_KEY',
    'ALLOWED_HOSTS',
    'AUTH_ROOT_DOMAIN',
  ],
}

const app: FastifyPluginAsync<AppOptions> = async (
  fastify,
  opts,
): Promise<void> => {
  // This loads all plugins defined in plugins
  // those should be support plugins that are reused
  // through your application
  void fastify.register(AutoLoad, {
    dir: join(__dirname, 'plugins'),
    options: opts,
  })

  // This loads all plugins defined in routes
  // define your routes in one of these
  void fastify.register(AutoLoad, {
    dir: join(__dirname, 'routes'),
    options: Object.assign({ prefix: `/v${process.env.API_VERSION}` }, opts),
  })
}

export default app
export { app, appOptions }
