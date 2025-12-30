// Plugin global untuk memaksa bot SELALU PUBLIC
// Tidak bisa jadi SELF walau owner pakai .self

module.exports = async (m, { conn }) => {
    // Pastikan variable global
    global.opts = global.opts || {}
    conn.opts = conn.opts || {}

    // FORCE selalu false
    global.opts.self = false
    global.self = false
    conn.opts.self = false

    // Tidak kirim apapun (silent)
}