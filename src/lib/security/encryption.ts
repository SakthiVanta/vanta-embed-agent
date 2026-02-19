import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16
const SALT_LENGTH = 32
const KEY_LENGTH = 32

export class EncryptionService {
  private masterKey: Buffer

  constructor(masterKeyHex: string) {
    if (!masterKeyHex || masterKeyHex.length !== 64) {
      throw new Error('Invalid encryption key. Must be 64 hex characters (32 bytes).')
    }
    this.masterKey = Buffer.from(masterKeyHex, 'hex')
  }

  encrypt(text: string): string {
    const salt = randomBytes(SALT_LENGTH)
    const iv = randomBytes(IV_LENGTH)
    
    const key = scryptSync(this.masterKey, salt, KEY_LENGTH)
    
    const cipher = createCipheriv(ALGORITHM, key, iv)
    
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    const authTag = cipher.getAuthTag()
    
    const result = Buffer.concat([
      salt,
      iv,
      authTag,
      Buffer.from(encrypted, 'hex'),
    ])
    
    return result.toString('base64')
  }

  decrypt(encryptedData: string): string {
    const data = Buffer.from(encryptedData, 'base64')
    
    const salt = data.subarray(0, SALT_LENGTH)
    const iv = data.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH)
    const authTag = data.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH)
    const encrypted = data.subarray(SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH)
    
    const key = scryptSync(this.masterKey, salt, KEY_LENGTH)
    
    const decipher = createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)
    
    let decrypted = decipher.update(encrypted)
    decrypted = Buffer.concat([decrypted, decipher.final()])
    
    return decrypted.toString('utf8')
  }

  static generateKey(): string {
    return randomBytes(32).toString('hex')
  }

  getKeyHint(encryptedKey: string): string {
    try {
      const decrypted = this.decrypt(encryptedKey)
      if (decrypted.length <= 8) {
        return '*'.repeat(decrypted.length)
      }
      return decrypted.slice(0, 4) + '****' + decrypted.slice(-4)
    } catch {
      return '****'
    }
  }
}

export const createEncryptionService = (): EncryptionService => {
  const key = process.env.ENCRYPTION_KEY
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is required')
  }
  return new EncryptionService(key)
}
