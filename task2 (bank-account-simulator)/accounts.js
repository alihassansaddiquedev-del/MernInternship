import { EventEmitter } from 'node:events';

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD'
});

// Both maps are module-private closures: neither balance nor event emitter is
// exposed as a writable property on an account.
const balances = new WeakMap();
const emitters = new WeakMap();

function cents(amount) {
  if (!Number.isFinite(amount) || amount < 0) {
    throw new TypeError('Amount must be a finite, non-negative number');
  }
  return Math.round(amount * 100);
}

function formatCents(value) {
  return money.format(value / 100);
}

function Account(owner, openingBalance = 0, options = {}) {
  if (!owner || typeof owner !== 'string') throw new TypeError('Owner is required');
  const openingCents = cents(openingBalance);
  balances.set(this, openingCents);
  emitters.set(this, new EventEmitter());
  this.owner = owner;
  this.type = options.type ?? 'Account';
  this.lowBalanceThreshold = cents(options.lowBalanceThreshold ?? 100);
  this.fee = options.fee ?? (() => 0);
}

Object.defineProperty(Account.prototype, 'balance', {
  get() { return formatCents(balances.get(this)); }
});

Account.prototype.on = function (eventName, callback) {
  emitters.get(this).on(eventName, callback);
  return this;
};

Account.prototype.deposit = function (amount) {
  const value = cents(amount);
  if (value === 0) return this.balance;
  balances.set(this, balances.get(this) + value);
  return this.balance;
};

Account.prototype.withdraw = function (amount) {
  const value = cents(amount);
  const current = balances.get(this);
  const fee = cents(this.fee(amount));
  const total = value + fee;
  if (total > current) throw new Error('Insufficient funds');
  balances.set(this, current - total);
  this._checkLowBalance();
  return this.balance;
};

Account.prototype.transfer = function (destination, amount) {
  if (!destination || typeof destination.deposit !== 'function') {
    throw new TypeError('Destination must be an account');
  }
  const value = cents(amount);
  if (value > balances.get(this)) throw new Error('Insufficient funds');
  balances.set(this, balances.get(this) - value);
  destination.deposit(amount);
  this._checkLowBalance();
  return this.balance;
};

Account.prototype._checkLowBalance = function () {
  const balance = balances.get(this);
  if (balance <= this.lowBalanceThreshold) {
    emitters.get(this).emit('lowBalance', {
      owner: this.owner,
      accountType: this.type,
      balance: formatCents(balance),
      threshold: formatCents(this.lowBalanceThreshold)
    });
  }
};

function SavingsAccount(owner, openingBalance = 0, options = {}) {
  Account.call(this, owner, openingBalance, {
    ...options,
    type: 'Savings',
    fee: options.fee ?? (() => 0)
  });
  this.interestRate = options.interestRate ?? 0.02;
}
SavingsAccount.prototype = Object.create(Account.prototype);
SavingsAccount.prototype.constructor = SavingsAccount;
SavingsAccount.prototype.addInterest = function () {
  const interest = Math.round(balances.get(this) * this.interestRate) / 100;
  return this.deposit(interest);
};

function CheckingAccount(owner, openingBalance = 0, options = {}) {
  const withdrawalFee = options.withdrawalFee ?? 1.5;
  Account.call(this, owner, openingBalance, {
    ...options,
    type: 'Checking',
    fee: options.fee ?? (() => withdrawalFee)
  });
  this.withdrawalFee = withdrawalFee;
}
CheckingAccount.prototype = Object.create(Account.prototype);
CheckingAccount.prototype.constructor = CheckingAccount;

// Curried fee calculator: percentageFee(rate)(amount), useful for configuring
// a custom checking fee or service charge.
export const percentageFee = rate => amount => Math.max(0, amount * rate);

export function createAccount(kind, owner, openingBalance = 0, options = {}) {
  switch (kind.toLowerCase()) {
    case 'savings': return new SavingsAccount(owner, openingBalance, options);
    case 'checking': return new CheckingAccount(owner, openingBalance, options);
    default: return new Account(owner, openingBalance, options);
  }
}

export { Account, SavingsAccount, CheckingAccount, formatCents };
