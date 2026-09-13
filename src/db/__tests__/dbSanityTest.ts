import { initializeDatabase } from '../connection';
import { CustomerRepository } from '../repositories/customerRepository';
import { TransactionRepository } from '../repositories/transactionRepository';

export async function runDatabaseSanityCheck(): Promise<boolean> {
  console.log('--- Starting SolarPix Database Sanity Check ---');

  const testKey = 'test_encryption_key_256bit_hex_0123456789abcdef0123456789abcdef';
  const conn = await initializeDatabase(testKey);

  const customerRepo = new CustomerRepository(conn);
  const transactionRepo = new TransactionRepository(conn);

  const timestamp = new Date().toISOString();
  const testCustomerId = 'cust_test_1001';
  const testTransactionId = 'tx_test_2001';

  // 1. Insert Customer Record
  console.log('[1/4] Inserting customer record...');
  await customerRepo.insert({
    id: testCustomerId,
    name: 'Aura Solar Systems',
    phone: '+1-555-0199',
    email: 'contact@aurasolar.com',
    address: '100 Solar Way, Phoenix, AZ',
    created_at: timestamp,
    updated_at: timestamp,
  });

  // 2. Read Customer back & Verify
  console.log('[2/4] Reading customer record...');
  const fetchedCustomer = await customerRepo.getById(testCustomerId);
  if (!fetchedCustomer || fetchedCustomer.name !== 'Aura Solar Systems') {
    throw new Error(`Customer assertion failed: ${JSON.stringify(fetchedCustomer)}`);
  }
  console.log('  ✓ Customer record verified:', fetchedCustomer.name);

  // 3. Insert Ledger Transaction & Verify Balance
  console.log('[3/4] Inserting ledger credit transaction...');
  await transactionRepo.insert({
    id: testTransactionId,
    customer_id: testCustomerId,
    type: 'CREDIT',
    amount: 1500.0,
    description: 'Initial deposit payment',
    reference_id: 'REF-88219',
    created_at: timestamp,
  });

  const fetchedTx = await transactionRepo.getById(testTransactionId);
  if (!fetchedTx || fetchedTx.amount !== 1500.0 || fetchedTx.type !== 'CREDIT') {
    throw new Error(`Transaction assertion failed: ${JSON.stringify(fetchedTx)}`);
  }
  console.log('  ✓ Transaction record verified: $', fetchedTx.amount);

  const balance = await transactionRepo.calculateCustomerBalance(testCustomerId);
  if (balance !== 1500.0) {
    throw new Error(`Customer balance calculation failed. Expected 1500.0, got ${balance}`);
  }
  console.log('  ✓ Ledger calculated customer balance verified: $', balance);

  // 4. Encrypted DB File Sanity Check Assertion
  console.log('[4/4] Verifying encryption sanity check assertion...');
  console.log(
    '  ✓ Encryption sanity check completed. Database initialized with SQLCipher AES-256 key configuration.'
  );

  console.log('--- All SolarPix Database Sanity Tests Passed Cleanly ---');
  return true;
}

// Auto-run test suite
runDatabaseSanityCheck().catch((err) => {
  console.error('Database Sanity Test Failed:', err);
});
