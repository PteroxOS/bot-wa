const resolveLidViaMeta = async (jid, groupJid, conn) => {
    if (!jid) return jid
    if (!jid.endsWith('@lid')) return jid
    if (!groupJid || !groupJid.endsWith('@g.us')) return jid
    let group = conn.chats[groupJid]
    if (group && group.metadata) {
        let participant = group.metadata.participants.find(v => v.lid === jid)
        if (participant) return participant.id
    }
    try {
        let metadata = await conn.groupMetadata(groupJid)
        let participant = metadata.participants.find(v => v.lid === jid)
        if (participant) return participant.id
        return jid
    } catch {
        return jid
    }
}

const fetchGroupMetadataRaw = async (jid, conn) => {
    try {
        return await conn.groupMetadata(jid)
    } catch {
        return null
    }
}

module.exports = {
    resolveLidViaMeta,
    fetchGroupMetadataRaw
}
