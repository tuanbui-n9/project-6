import fp from 'fastify-plugin'
import * as admin from 'firebase-admin'

export type FirebaseUtils = ReturnType<typeof getFirebaseUtils>
import type { UserRecord } from 'firebase-admin/lib/auth/user-record'

declare module 'fastify' {
  interface FastifyInstance {
    firebaseAdmin: FirebaseUtils
  }
}

const getFirebaseUtils = () => {
  return {
    async getUserByUid(uid: string): Promise<UserRecord | null> {
      return admin
        .auth()
        .getUser(uid)
        .catch(() => null)
    },

    async verifyIdToken(token: string) {
      return admin.auth().verifyIdToken(token, true)
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async createCustomToken(uid: string, customClaims?: any) {
      return admin.auth().createCustomToken(uid, customClaims)
    },
  }
}

export default fp(
  async (app) => {
    const firebaseServiceAccount = app.cfg.get('FIREBASE_SERVICE_ACCOUNT')
    if (!firebaseServiceAccount) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT is missing')
    }
    const adminConfig = JSON.parse(
      Buffer.from(firebaseServiceAccount, 'base64').toString(),
    )
    admin.initializeApp({
      credential: admin.credential.cert(adminConfig),
    })

    app.decorate('firebaseAdmin', getFirebaseUtils())
  },
  {
    name: 'firebase-admin',
    dependencies: ['plugin-config'],
  },
)
