import { customerService } from '../customerService';
import { orderService } from '../orderService';
import { transactionService } from '../transactionService';
import { deliveryService } from '../deliveryService';

export async function runServiceLayerTest(): Promise<boolean> {
  console.log('--- Starting SolarPix Service Layer Architecture Test ---');

  // Test 1: Forced Validation Error Case (empty name)
  console.log('[1/4] Testing forced validation error case...');
  const errorRes = await customerService.createCustomer({ name: '   ' });

  if (errorRes.success !== false) {
    throw new Error('Service validation error assertion failed: Expected success=false');
  }

  if (errorRes.error.code !== 'CUSTOMER_NAME_REQUIRED') {
    throw new Error(`Unexpected error code: ${errorRes.error.code}`);
  }

  if (
    typeof errorRes.error.userFacingMessage !== 'string' ||
    errorRes.error.userFacingMessage.length === 0
  ) {
    throw new Error('User facing message assertion failed: Expected friendly text string');
  }

  console.log(
    '  ✓ Forced error case correctly returned ServiceResult with userFacingMessage:',
    errorRes.error.userFacingMessage
  );

  // Test 2: Valid Customer Creation Success Case
  console.log('[2/4] Testing valid customer creation success case...');
  const successRes = await customerService.createCustomer({
    name: 'Helios Solar Tech',
    phone: '+1-555-8833',
    email: 'info@heliostech.com',
  });

  if (!successRes.success) {
    throw new Error(
      `Customer creation failed unexpectedly: ${successRes.error?.userFacingMessage}`
    );
  }

  console.log(
    '  ✓ Customer created successfully:',
    successRes.data.name,
    'ID:',
    successRes.data.id
  );

  // Test 3: Order Creation & Fetching
  console.log('[3/4] Testing order service...');
  const orderRes = await orderService.createOrder({
    customer_id: successRes.data.id,
    total_amount: 4500.0,
  });

  if (!orderRes.success) {
    throw new Error(`Order creation failed unexpectedly: ${orderRes.error?.userFacingMessage}`);
  }
  console.log('  ✓ Order created successfully: Total $', orderRes.data.total_amount);

  // Test 4: Transaction Ledger Service
  console.log('[4/4] Testing ledger transaction service...');
  const txRes = await transactionService.recordTransaction({
    customer_id: successRes.data.id,
    type: 'CREDIT',
    amount: 2000.0,
    description: 'Advance deposit for solar array installation',
  });

  if (!txRes.success) {
    throw new Error(`Transaction creation failed: ${txRes.error?.userFacingMessage}`);
  }
  console.log('  ✓ Ledger transaction recorded successfully: $', txRes.data.amount);

  const balanceRes = await transactionService.getCustomerBalance(successRes.data.id);
  if (!balanceRes.success || balanceRes.data !== 2000.0) {
    throw new Error(`Balance assertion failed: Expected 2000.0, got ${balanceRes.data}`);
  }
  console.log('  ✓ Calculated customer balance verified: $', balanceRes.data);

  console.log('--- All SolarPix Service Layer Architecture Tests Passed Cleanly ---');
  return true;
}

runServiceLayerTest().catch((err) => {
  console.error('Service Layer Test Failed:', err);
});
