let handler = async (m, { conn, args }) => {
  try {
    // pastikan db ada
    let chats = global.db && global.db.data && global.db.data.chats
      ? global.db.data.chats
      : {};

    // bikin array [id, chatObj] yg sedang di-mute (isBanned === true)
    let mutedChats = Object.entries(chats).filter(([id, chat]) => chat && chat.isBanned);

    // jika gak ada argumen -> tampilkan daftar
    if (!args || args.length === 0) {
      if (mutedChats.length === 0) return m.reply('Tidak ada grup yang di-mute saat ini.');
      let list = mutedChats.map(([id, chat], i) => {
        // coba ambil nama group kalau ada, fallback ke "Unknown"
        let name = chat?.name || chat?.subject || 'Unknown';
        return `${i + 1}. ${name}\n   id: ${id}`;
      }).join('\n\n');

      return m.reply(
        `Daftar grup yang sedang di-mute:\n\n${list}\n\nGunakan:\n- *${prefix || '!'}listmute [nomor]* untuk unmute berdasarkan nomor\n- *${prefix || '!'}listmute id <groupid>* untuk unmute langsung pakai id\n- *${prefix || '!'}listmute all* untuk unmute semua`
      );
    }

    // ada argumen -> proses unmute
    let cmd = args[0].toLowerCase();

    // unmute all
    if (cmd === 'all') {
      if (mutedChats.length === 0) return m.reply('Tidak ada grup untuk di-unmute.');
      for (const [id] of mutedChats) {
        if (chats[id]) chats[id].isBanned = false;
      }
      return m.reply('Sukses: semua grup yang di-mute telah di-unmute.');
    }

    // unmute by "id <groupid>"
    if (cmd === 'id') {
      let idArg = args[1];
      if (!idArg) return m.reply('Kirim: listmute id <groupid>');
      // normalisasi: jika user kirim nomor tanpa @g.us
      if (!idArg.includes('@g.us')) idArg = idArg.includes('@s.whatsapp.net') ? idArg : `${idArg}@g.us`;
      if (!chats[idArg]) return m.reply('ID grup tidak ditemukan pada database bot.');
      chats[idArg].isBanned = false;
      return m.reply(`Berhasil unmute grup: ${idArg}`);
    }

    // kalau argumen angka -> unmute berdasarkan nomor urut dari daftar
    if (/^\d+$/.test(cmd)) {
      let index = parseInt(cmd, 10) - 1;
      if (index < 0 || index >= mutedChats.length) return m.reply('Nomor tidak valid.');
      let id = mutedChats[index][0];
      if (!chats[id]) return m.reply('Data grup tidak ditemukan.');
      chats[id].isBanned = false;
      return m.reply(`Berhasil unmute grup: ${id}`);
    }

    // fallback: user mungkin langsung kirim id tanpa kata 'id'
    let possibleId = cmd;
    if (!possibleId.includes('@g.us')) possibleId = `${possibleId}@g.us`;
    if (chats[possibleId]) {
      chats[possibleId].isBanned = false;
      return m.reply(`Berhasil unmute grup: ${possibleId}`);
    }

    // kalau sampai sini berarti argumen nggak dikenali
    return m.reply('Argumen tidak dikenali. Gunakan tanpa argumen untuk melihat daftar atau gunakan "id <groupid>" atau nomor atau "all".');

  } catch (e) {
    console.error(e);
    return m.reply('Terjadi kesalahan saat mencoba unmute. Cek console server.');
  }
};

// metadata command (sesuaikan prefix/framework lu)
handler.help = ['listmutes', 'unmute'];
handler.tags = ['owner'];
handler.command = ['listmutes', 'unmute'];
handler.owner = true;

module.exports = handler;