/**
 * Simple button helper (Baileys MD)
 */
async function sendButton(conn, jid, text, buttons = [], quoted = null, footer = '') {
  return conn.sendMessage(
    jid,
    {
      text,
      footer,
      buttons: buttons.map(btn => ({
        buttonId: btn.id,
        buttonText: { displayText: btn.text },
        type: 1
      }))
    },
    { quoted }
  );
}

module.exports = { sendButton };