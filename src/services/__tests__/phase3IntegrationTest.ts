import { customerService } from '../customerService';
import { orderService } from '../orderService';
import { transactionService } from '../transactionService';
import { deliveryService } from '../deliveryService';

export async function runPhase3FullFlowIntegrationTest(): Promise<boolean> {
  console.log('=== Starting SolarPix Phase 3 Full Flow Integration Test ===');

  // Step 1: Add Customer
  console.log('[Step 1/5] Adding new customer record...');
  const custRes = await customerService.createCustomer({
    name: 'Apex Solar Logistics',
    phone: '+1-555-0921',
    email: 'contact@apexsolar.com',
    address: '500 Sun Boulevard, Austin, TX',
  });

  if (!custRes.success) {
    throw new Error(`Step 1 Failed: ${custRes.error.userFacingMessage}`);
  }
  const customerId = custRes.data.id;
  console.log('  ✓ Customer created successfully:', custRes.data.name, '(ID:', customerId, ')');

  // Step 2: Add Order
  console.log('[Step 2/5] Creating customer order for $4,500.00...');
  const orderRes = await orderService.createOrder({
    customer_id: customerId,
    total_amount: 4500.0,
  });

  if (!orderRes.success) {
    throw new Error(`Step 2 Failed: ${orderRes.error.userFacingMessage}`);
  }
  const orderId = orderRes.data.id;
  console.log('  ✓ Order created successfully:', orderId);

  // Step 3: Record Transactions in Immutable Ledger (Charge & Payment)
  console.log(
    '[Step 3/5] Recording ledger transactions (Charge $4,500 DEBIT & Payment $2,500 CREDIT)...'
  );

  const debitRes = await transactionService.recordTransaction({
    customer_id: customerId,
    type: 'DEBIT',
    amount: 4500.0,
    description: 'Invoice charge for Order #' + orderId.slice(-6).toUpperCase(),
  });
  if (!debitRes.success)
    throw new Error(`Debit transaction failed: ${debitRes.error.userFacingMessage}`);

  const creditRes = await transactionService.recordTransaction({
    customer_id: customerId,
    type: 'CREDIT',
    amount: 2500.0,
    description: 'Partial advance payment received',
  });
  if (!creditRes.success)
    throw new Error(`Credit transaction failed: ${creditRes.error.userFacingMessage}`);

  console.log('  ✓ Ledger transactions recorded cleanly.');

  // Step 4: Confirm Dynamic Ledger Balance Calculation
  console.log('[Step 4/5] Verifying dynamic net balance computed from transaction ledger...');
  const balanceRes = await transactionService.getCustomerBalance(customerId);
  if (!balanceRes.success)
    throw new Error(`Balance query failed: ${balanceRes.error.userFacingMessage}`);

  // Expected Net Balance: +2500 (CREDIT) - 4500 (DEBIT) = -2000 (Net DEBIT of 2000)
  const expectedBalance = -2000.0;
  if (balanceRes.data !== expectedBalance) {
    throw new Error(
      `Dynamic balance mismatch! Expected ${expectedBalance}, got ${balanceRes.data}`
    );
  }
  console.log(
    '  ✓ Dynamic calculated balance verified: $',
    balanceRes.data,
    '(Immutable Ledger Math Correct!)'
  );

  // Step 5: Schedule & Complete Delivery
  console.log('[Step 5/5] Scheduling delivery and marking complete...');
  const delRes = await deliveryService.createDelivery({
    order_id: orderId,
    notes: 'Solar array panels dispatch',
  });
  if (!delRes.success)
    throw new Error(`Delivery creation failed: ${delRes.error.userFacingMessage}`);

  const updateDelRes = await deliveryService.updateDeliveryStatus(delRes.data.id, 'DELIVERED');
  if (!updateDelRes.success)
    throw new Error(`Delivery update failed: ${updateDelRes.error.userFacingMessage}`);
  console.log('  ✓ Delivery scheduled and marked DELIVERED successfully.');

  console.log('=== SolarPix Phase 3 Integration Test Completed Successfully ===');
  return true;
}

runPhase3FullFlowIntegrationTest().catch((err) => {
  console.error('Phase 3 Integration Test Failed:', err);
});
