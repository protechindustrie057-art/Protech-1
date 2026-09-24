import crypto from 'crypto'
import bcrypt from 'bcryptjs'

const SCRYPT_HASH_PREFIX = 'scrypt'
const KEY_LENGTH = 64
const BCRYPT_COST = 12
export const MIN_PASSWORD_LENGTH = 8

export function hashServerPassword(password: string) {
  return bcrypt.hashSync(password, BCRYPT_COST)
}

function verifyScryptPassword(password: string, storedHash: string) {
  const [, storedSalt, hash] = storedHash.split('$')
  if (!storedSalt || !hash) return false

  const expected = Buffer.from(hash, 'hex')
  const actual = crypto.scryptSync(password, storedSalt, KEY_LENGTH)

  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual)
}

export function verifyServerPassword(password: string, storedHash: string) {
  if (!storedHash) return false
  if (storedHash.startsWith(`${SCRYPT_HASH_PREFIX}$`)) return verifyScryptPassword(password, storedHash)

  return bcrypt.compareSync(password, storedHash)
}
