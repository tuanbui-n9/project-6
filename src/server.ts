import dotenv from 'dotenv'

dotenv.config()

import closeWithGrace from 'close-with-grace'
import Fastify, { FastifyInstance } from 'fastify'
import appService, { appOptions } from './app'

const app: FastifyInstance = Fastify({
  logger: {
    level: 'error',
  },
})

app.register(appService, appOptions)

const closeListeners = closeWithGrace(async function ({ err }) {
  if (err) {
    app.log.error(err)
  }
  await app.close()
})

app.addHook('onClose', async () => {
  closeListeners.uninstall()
})

app.ready().then(async () => {
  app.listen(
    { port: Number(process.env.PORT) || 3000, host: '0.0.0.0' },
    (err: Error | null) => {
      if (err) {
        app.log.error(err)
        process.exit(1)
      }
    },
  )
})
