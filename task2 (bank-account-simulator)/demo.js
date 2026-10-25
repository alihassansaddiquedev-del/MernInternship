import { createAccount, percentageFee } from './accounts.js';

const savings = createAccount('savings', 'Avery', 500, {
  lowBalanceThreshold: 100,
  interestRate: 0.03
});
const checking = createAccount('checking', 'Jordan', 250, {
  lowBalanceThreshold: 80,
  withdrawalFee: 1.5
});

// EventEmitter listener demonstrates a callback for low-balance alerts.
savings.on('lowBalance', alert => {
  console.log(`ALERT: ${alert.owner}'s ${alert.accountType} balance is ${alert.balance} (threshold ${alert.threshold})`);
});
checking.on('lowBalance', alert => {
  console.log(`ALERT: ${alert.owner}'s ${alert.accountType} balance is ${alert.balance} (threshold ${alert.threshold})`);
});

console.log('Opening balances:', savings.balance, savings.type, '|', checking.balance, checking.type);

// Prototype-inherited operations work across both account types.
savings.deposit(50);
checking.withdraw(20); // checking adds its configured withdrawal fee
savings.transfer(checking, 75);
savings.addInterest();

// Curried fee configuration can be supplied to an account factory.
const serviceFee = percentageFee(0.025);
const feeAccount = createAccount('checking', 'Morgan', 100, {
  withdrawalFee: 0,
  fee: serviceFee,
  lowBalanceThreshold: 80
});
feeAccount.on('lowBalance', alert => console.log(`ALERT: ${alert.owner}'s balance is ${alert.balance}`));

// call, apply, and bind provide explicit dynamic `this` for inherited methods.
const deposit = savings.deposit;
deposit.call(checking, 10);
deposit.apply(savings, [5]);
const depositToSavings = savings.deposit.bind(savings);
depositToSavings(15);

// trigger an alert on each account
savings.withdraw(410);
checking.withdraw(240);
feeAccount.withdraw(30);

console.log('Closing balances:', savings.owner, savings.balance, '|', checking.owner, checking.balance, '|', feeAccount.owner, feeAccount.balance);
