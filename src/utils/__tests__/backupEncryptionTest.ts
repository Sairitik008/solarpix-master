import { encryptBackupPayload, decryptBackupPayload, BackupPackage } from '../backupEncryption';

export async function runBackupEncryptionTest(): Promise<boolean> {
  console.log('=== Starting SolarPix Backup Encryption & HMAC Integrity Test ===');

  const testPin = '8842';
  const wrongPin = '1234';

  const sampleDataBlob = JSON.stringify({
    vendor: 'SolarPix Admin',
    customersCount: 5,
    ledgerTotal: 15400.5,
    timestamp: new Date().toISOString(),
  });

  // Step 1: Encrypt Sample Data Blob
  console.log('[Step 1/4] Encrypting sample data blob with vendor PIN...');
  const encryptedPkg: BackupPackage = encryptBackupPayload(sampleDataBlob, testPin);

  if (!encryptedPkg.salt || !encryptedPkg.iv || !encryptedPkg.ciphertext || !encryptedPkg.hmac) {
    throw new Error('Encryption output assertion failed: Missing package components.');
  }
  console.log('  ✓ Package encrypted cleanly: Algorithm =', encryptedPkg.algorithm);
  console.log('    HMAC Signature:', encryptedPkg.hmac.substring(0, 16) + '...');

  // Step 2: Decrypt with Correct PIN
  console.log('[Step 2/4] Decrypting package with CORRECT PIN...');
  const correctDec = decryptBackupPayload(encryptedPkg, testPin);

  if (!correctDec.success || correctDec.data !== sampleDataBlob) {
    throw new Error(`Correct PIN decryption failed! ${correctDec.error?.userFacingMessage}`);
  }
  console.log('  ✓ Correct PIN decryption verified! Output matches original sample JSON payload.');

  // Step 3: Decrypt with WRONG PIN
  console.log('[Step 3/4] Attempting decryption with WRONG PIN...');
  const wrongDec = decryptBackupPayload(encryptedPkg, wrongPin);

  if (wrongDec.success === true) {
    throw new Error('Wrong PIN test failed! Decryption should have failed.');
  }
  console.log('  ✓ Wrong PIN correctly rejected with message:', wrongDec.error.userFacingMessage);

  // Step 4: Data Tampering & HMAC Integrity Rejection Test
  console.log('[Step 4/4] Tampering with ciphertext & verifying HMAC rejection...');

  // Tamper ciphertext
  const tamperedCiphertext =
    encryptedPkg.ciphertext.substring(0, 10) +
    (encryptedPkg.ciphertext.charAt(10) === 'a' ? 'b' : 'a') +
    encryptedPkg.ciphertext.substring(11);

  const tamperedPkg: BackupPackage = {
    ...encryptedPkg,
    ciphertext: tamperedCiphertext,
  };

  const tamperedDec = decryptBackupPayload(tamperedPkg, testPin);

  if (tamperedDec.success === true) {
    throw new Error('Tamper test failed! HMAC verification should have rejected tampered package.');
  }

  if (tamperedDec.error.code !== 'HMAC_VERIFICATION_FAILED') {
    throw new Error(`Unexpected error code for tampered payload: ${tamperedDec.error.code}`);
  }
  console.log('  ✓ HMAC signature check successfully detected tampering and rejected payload!');
  console.log('    User message:', tamperedDec.error.userFacingMessage);

  console.log('=== All SolarPix Cryptographic Backup & HMAC Verification Tests Passed Cleanly ===');
  return true;
}

runBackupEncryptionTest().catch((err) => {
  console.error('Backup Encryption Test Failed:', err);
});
