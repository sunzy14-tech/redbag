const { AppError } = require('../utils/errors');

function cents(amount) {
  return Math.round(Number(amount) * 100);
}

function yuan(centsValue) {
  return Number((Number(centsValue) / 100).toFixed(2));
}

function randomCents(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickPrize(strategy) {
  if (!strategy || strategy.status !== 'enabled') {
    throw new AppError('红包策略未启用', 400, 'STRATEGY_DISABLED');
  }
  const winRate = Number(strategy.win_rate || 100);
  if (Math.random() * 100 > winRate) return { won: false, amountCents: 0 };
  if (strategy.type === 'fixed') {
    return { won: true, amountCents: Number(strategy.fixed_amount_cents) };
  }
  if (strategy.type === 'random') {
    return {
      won: true,
      amountCents: randomCents(Number(strategy.min_amount_cents), Number(strategy.max_amount_cents))
    };
  }
  if (strategy.type === 'probability') {
    const rules = JSON.parse(strategy.probability_rules || '[]');
    const roll = Math.random() * 100;
    let cursor = 0;
    for (const rule of rules) {
      cursor += Number(rule.rate);
      if (roll <= cursor) return { won: true, amountCents: cents(rule.amount) };
    }
    return {
      won: true,
      amountCents: randomCents(Number(strategy.min_amount_cents), Number(strategy.max_amount_cents))
    };
  }
  throw new AppError('未知红包策略类型', 400, 'INVALID_STRATEGY');
}

module.exports = { pickPrize, cents, yuan };

