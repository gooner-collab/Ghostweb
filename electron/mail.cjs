const { randomBytes, randomUUID } = require('node:crypto');

const aliases = new Map();
const mailboxes = new Map();

function createAlias() {
  const alias = {
    id: randomUUID(),
    address: `${randomBytes(5).toString('hex')}@alias.ghostweb.local`,
    forwardingTarget: null,
    createdAt: Date.now(),
  };
  aliases.set(alias.id, alias);
  return alias;
}

function deleteAlias(aliasId) {
  aliases.delete(aliasId);
}

function configureForwarding(aliasId, targetEmail) {
  const alias = aliases.get(aliasId);
  if (!alias || !targetEmail.includes('@')) throw new Error('Invalid alias or target email');
  alias.forwardingTarget = targetEmail;
  return alias;
}

function listAliases() {
  return [...aliases.values()];
}

function createMailbox(expiresInMinutes) {
  if (!Number.isInteger(expiresInMinutes) || expiresInMinutes < 1 || expiresInMinutes > 1440) throw new Error('Mailbox expiry must be 1-1440 minutes');
  const mailbox = {
    id: randomUUID(),
    address: `${randomBytes(5).toString('hex')}@temp.ghostweb.local`,
    createdAt: Date.now(),
    expiresAt: Date.now() + expiresInMinutes * 60 * 1000,
    messages: [],
  };
  mailboxes.set(mailbox.id, mailbox);
  return mailbox;
}

function getActiveMailbox(mailboxId) {
  const mailbox = mailboxes.get(mailboxId);
  if (!mailbox) throw new Error('Mailbox not found');
  if (mailbox.expiresAt <= Date.now()) {
    mailboxes.delete(mailboxId);
    throw new Error('Mailbox expired');
  }
  return mailbox;
}

function listMailboxes() {
  for (const [id, mailbox] of mailboxes) if (mailbox.expiresAt <= Date.now()) mailboxes.delete(id);
  return [...mailboxes.values()].map(({ messages, ...mailbox }) => ({ ...mailbox, messageCount: messages.length }));
}

function deleteMailbox(mailboxId) {
  mailboxes.delete(mailboxId);
}

module.exports = { createAlias, deleteAlias, configureForwarding, listAliases, createMailbox, listMailboxes, deleteMailbox, getActiveMailbox };
