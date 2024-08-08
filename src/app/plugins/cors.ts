/* eslint-disable @typescript-eslint/no-explicit-any */
import fp from 'fastify-plugin'
import cors, {
  FastifyCorsOptions,
  FastifyCorsOptionsDelegate,
} from '@fastify/cors'

export default fp<NonNullable<FastifyCorsOptions> | FastifyCorsOptionsDelegate>(
  async (app) => {
    app.register(cors, function () {
      return (request: any, callback: any) => {
        const allowedHosts = (app.cfg.get('ALLOWED_HOSTS') || '')
          .split(',')
          .map((host) => host.trim())
          .filter((host) => host)
        let corsOptions
        const origin = request.headers.origin
        let hostname = null
        try {
          hostname = origin ? new URL(origin).hostname : null
        } catch {
          //
        }
        const whiteListHost = [
          ...allowedHosts,
          // allow localhost in `development` environment in case we run both client and server on same machine with different ports
          app.cfg.get('NODE_ENV') !== 'production' ? 'localhost' : undefined,
        ].filter(Boolean)

        if (
          whiteListHost.includes(origin) ||
          whiteListHost.includes(hostname!)
        ) {
          corsOptions = {
            origin: true,
            credentials: true,
          }
        } else {
          corsOptions = { origin: false }
        }
        callback(null, corsOptions)
      }
    })
  },
  {
    name: 'plugin-cors',
    dependencies: ['plugin-config'],
  },
)
