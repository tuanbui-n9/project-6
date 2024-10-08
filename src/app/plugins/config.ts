import fp from 'fastify-plugin'

declare module 'fastify' {
  interface FastifyInstance {
    cfg: Config
  }
}

export interface IConfigOpts {
  envsWhitelist: Array<string>
}

export class Config {
  private cachedConfig: { [key: string]: string | undefined } = {}
  private opts: IConfigOpts = {
    envsWhitelist: [],
  }

  constructor(opts: IConfigOpts) {
    this.opts = Object.freeze(opts)

    Object.entries(process.env)
      .filter(([key]) => this.opts.envsWhitelist.includes(key))
      .map(([key, val]) => {
        this.cachedConfig[key] = val
      })
  }

  get(key: string) {
    if (!this.opts.envsWhitelist.includes(key)) {
      throw new Error(`⚠️  Unsupported environment variable: ${key} ⚠️`)
    }
    return this.cachedConfig[key]
  }
}

export default fp<IConfigOpts>(
  async (app, opts) => {
    app.decorate('cfg', new Config(opts))
  },
  {
    name: 'plugin-config',
  },
)
