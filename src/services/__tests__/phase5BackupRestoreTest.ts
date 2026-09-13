import { customerService } from '../customerService';
import { orderService } from '../orderService';
import { transactionService } from '../transactionService';
import { deliveryService } from '../deliveryService';
import { googleDriveService } from '../googleDriveService';
import { getDatabaseConnection } from '../../db';

export async function runPhase5BackupRestoreTest(): Promise<boolean> {
  console.log('=== Starting SolarPix Phase 5 Backup & Restore Integration Test ===');

  const validPin = '8842';
  const invalidPin = '9999';

  // Step 1: Populate Sample Database Records
  console.log('[Step 1/6] Populating sample local database...');
  const custRes = await customerService.createCustomer({
    name: 'Solar Enterprise Inc',
    phone: '+1-555-7711',
    email: 'ops@solarenterprise.com',
    address: '800 Innovation Way, San Jose, CA',
  });
  if (!custRes.success)
    throw new Error(`Customer creation failed: ${custRes.error.userFacingMessage}`);
  const customerId = custRes.data.id;

  const orderRes = await orderService.createOrder({
    customer_id: customerId,
    total_amount: 5200.0,
  });
  if (!orderRes.success)
    throw new Error(`Order creation failed: ${orderRes.error.userFacingMessage}`);

  await transactionService.recordTransaction({
    customer_id: customerId,
    type: 'DEBIT',
    amount: 5200.0,
    description: 'System installation charge',
  });

  await transactionService.recordTransaction({
    customer_id: customerId,
    type: 'CREDIT',
    amount: 2000.0,
    description: 'Initial deposit payment',
  });

  await deliveryService.createDelivery({
    order_id: orderRes.data.id,
    notes: 'Inverter array dispatch',
  });

  // Verify Pre-Wipe Balance
  const preWipeBalance = (await transactionService.getCustomerBalance(customerId)).data;
  console.log('  ✓ Pre-wipe database prepared. Net balance:', preWipeBalance);

  // Step 2: Encrypt & Export Backup Payload
  console.log('[Step 2/6] Encrypting and saving backup payload to Google Drive appdata...');
  const backupRes = await googleDriveService.createEncryptedBackup(validPin);
  if (!backupRes.success) throw new Error(`Backup failed: ${backupRes.error.userFacingMessage}`);
  console.log('  ✓ Encrypted backup package saved.');

  // Step 3: Wipe Local Database Tables
  console.log(
    '[Step 3/6] Wiping all local database tables (Simulating data loss / device wipe)...'
  );
  const conn = await getDatabaseConnection();
  await conn.execute('DELETE FROM sync_meta');
  await conn.execute('DELETE FROM deliveries');
  await conn.execute('DELETE FROM transactions');
  await conn.execute('DELETE FROM bills');
  await conn.execute('DELETE FROM orders');
  await conn.execute('DELETE FROM customers');
  await conn.execute('DELETE FROM vendors');

  // Verify Database is Empty
  const emptyCusts = (await customerService.getAllCustomers()).data || [];
  if (emptyCusts.length !== 0)
    throw new Error('Database wipe assertion failed! Records still exist.');
  console.log('  ✓ Local database completely wiped (0 customers remaining).');

  // Step 4: Attempt Restore with WRONG PIN
  console.log('[Step 4/6] Attempting restore with WRONG PIN...');
  const wrongPinRes = await googleDriveService.restoreEncryptedBackup(invalidPin);
  if (wrongPinRes.success === true) {
    throw new Error('Wrong PIN restore test failed! Restore should have been rejected.');
  }
  console.log(
    '  ✓ Wrong PIN correctly rejected with message:',
    wrongPinRes.error.userFacingMessage
  );

  const stillEmptyCusts = (await customerService.getAllCustomers()).data || [];
  if (stillEmptyCusts.length !== 0) throw new Error('Wrong PIN restore corrupted local database!');

  // Step 5: Restore with CORRECT PIN
  console.log('[Step 5/6] Restoring & decrypting database with CORRECT PIN...');
  const restoreRes = await googleDriveService.restoreEncryptedBackup(validPin);
  if (!restoreRes.success) throw new Error(`Restore failed: ${restoreRes.error.userFacingMessage}`);
  console.log('  ✓ Restore & decryption completed cleanly.');

  // Step 6: Verify Restored Data Integrity & Dynamic Ledger Balance
  console.log('[Step 6/6] Verifying restored data integrity & dynamic ledger balance...');
  const restoredCust = (await customerService.getCustomerById(customerId)).data;
  if (!restoredCust || restoredCust.name !== 'Solar Enterprise Inc') {
    throw new Error(`Customer restoration assertion failed: ${JSON.stringify(restoredCust)}`);
  }

  const restoredBalance = (await transactionService.getCustomerBalance(customerId)).data;
  if (restoredBalance !== preWipeBalance) {
    throw new Error(
      `Restored ledger balance mismatch! Expected ${preWipeBalance}, got ${restoredBalance}`
    );
  }
  console.log('  ✓ Restored customer record verified:', restoredCust.name);
  console.log(
    '  ✓ Restored dynamic ledger balance verified: $',
    restoredBalance,
    '(100% Pre-Wipe Match!)'
  );

  console.log('=== SolarPix Phase 5 Backup & Restore Integration Test Passed Successfully ===');
  return true;
}

runPhase5BackupRestoreTest().catch((err) => {
  console.error('Phase 5 Backup/Restore Test Failed:', err);
});
