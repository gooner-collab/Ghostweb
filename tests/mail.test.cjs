const assert = require('node:assert/strict');
const test = require('node:test');
const mail = require('../electron/mail.cjs');

test('creates aliases with unique addresses and deletes them', () => {
  const first = mail.createAlias();
  const second = mail.createAlias();
  assert.notEqual(first.address, second.address);
  assert.equal(mail.listAliases().length >= 2, true);
  mail.deleteAlias(first.id);
  assert.equal(mail.listAliases().some((alias) => alias.id === first.id), false);
});

test('creates temporary mailboxes with bounded expiry', () => {
  const mailbox = mail.createMailbox(60);
  assert.match(mailbox.address, /@temp\.ghostweb\.local$/);
  assert.equal(mail.listMailboxes().some((item) => item.id === mailbox.id), true);
  mail.deleteMailbox(mailbox.id);
  assert.equal(mail.listMailboxes().some((item) => item.id === mailbox.id), false);
});

test('rejects invalid mailbox expiry and forwarding targets', () => {
  assert.throws(() => mail.createMailbox(0), /expiry/);
  const alias = mail.createAlias();
  assert.throws(() => mail.configureForwarding(alias.id, 'not-an-email'), /target email/);
  mail.deleteAlias(alias.id);
});
