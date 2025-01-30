/*
 * File: generateRSA.ts
 * File Created: Thursday, 24th October 2024 3:49:22 pm
 * Url: https://arungpalakka.com
 * Author: tsi (hamransp@gmail.com)
 * Copyright @ 2024 Rede Studio
 */
import NodeRSA from 'node-rsa'
import fs from 'fs/promises'
import path from 'path'

// Define types for key formats
type PublicKeyFormat =
  | 'pkcs1-public-pem'
  | 'pkcs8-public-pem'
  | 'pkcs1-public'
  | 'pkcs8-public'
  | 'openssh-public'
type PrivateKeyFormat =
  | 'pkcs1-private-pem'
  | 'pkcs8-private-pem'
  | 'pkcs1-private'
  | 'pkcs8-private'

// Constants
const DEFAULT_KEY_SIZE = 2048
const DEFAULT_PUBLIC_FORMAT: PublicKeyFormat = 'pkcs8-public-pem'
const DEFAULT_PRIVATE_FORMAT: PrivateKeyFormat = 'pkcs8-private-pem'
const DEFAULT_FILENAME = 'rsa.config.ts'

/**
 * Generates RSA key pair with custom format options
 * @param keySize - Size of the key in bits
 * @param publicFormat - Format of the public key
 * @param privateFormat - Format of the private key
 * @returns Object containing public and private keys
 * @throws Error if key generation fails
 */
function generateRSAKeys(
  keySize: number = DEFAULT_KEY_SIZE,
  publicFormat: PublicKeyFormat = DEFAULT_PUBLIC_FORMAT,
  privateFormat: PrivateKeyFormat = DEFAULT_PRIVATE_FORMAT
): { publicKey: string; privateKey: string } {
  try {
    if (keySize < 512) {
      throw new Error('Key size must be at least 512 bits')
    }
    const key = new NodeRSA({ b: keySize })
    return {
      publicKey: key.exportKey(publicFormat),
      privateKey: key.exportKey(privateFormat),
    }
  } catch (error) {
    throw new Error(`Failed to generate RSA keys: ${(error as Error).message}`)
  }
}

/**
 * Saves keys to file
 * @param publicKey - Public key to save
 * @param privateKey - Private key to save
 * @param filename - Name of the file to save keys to
 * @throws Error if saving keys fails
 */
async function saveKeysToFile(
  publicKey: string,
  privateKey: string,
  filename: string = DEFAULT_FILENAME
): Promise<void> {
  const configDir = path.join(__dirname, 'configs')
  const filePath = path.join(configDir, filename)

  try {
    // Ensure the configs directory exists
    await fs.mkdir(configDir, { recursive: true })

    const content = `
export const rsaKeys = {
  publicKey: \`${publicKey}\`,
  privateKey: \`${privateKey}\`
};
`

    await fs.writeFile(filePath, content, 'utf8')
    console.log(`RSA keys have been saved to ${filePath}`)
  } catch (error) {
    throw new Error(`Failed to save RSA keys: ${(error as Error).message}`)
  }
}

/**
 * Main function to generate and save RSA keys
 */
async function main() {
  try {
    const { publicKey, privateKey } = generateRSAKeys()
    await saveKeysToFile(publicKey, privateKey)
  } catch (error) {
    console.error((error as Error).message)
    process.exit(1)
  }
}

// Run the main function
main()
