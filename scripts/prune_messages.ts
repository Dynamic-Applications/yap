import { sql } from "@/lib/db";
import { pusher } from "@/lib/pusher";

async function main() {
    // delete messages older than 100 days
    const cutoff = new Date(
        Date.now() - 100 * 24 * 60 * 60 * 1000,
    ).toISOString();
    console.log("Pruning messages older than", cutoff);

    // Find affected channels and notify users
    const rows = await sql`
        SELECT id, channel, sender_id, created_at, message FROM messages WHERE created_at < ${cutoff}
    `;

    const channels = new Set<string>();
    for (const r of rows) channels.add(r.channel);

    // delete messages
    await sql`DELETE FROM messages WHERE created_at < ${cutoff}`;

    // notify users per channel
    for (const ch of Array.from(channels)) {
        try {
            if (String(ch).startsWith("group-")) {
                const groupId = ch.replace("group-", "");
                const members = await sql`
                    SELECT user_id FROM group_members WHERE group_id = ${groupId}
                `;
                for (const m of members) {
                    await pusher.trigger(
                        `user-${m.user_id}`,
                        "messages-pruned",
                        {
                            channel: ch,
                            message: "Old messages removed",
                            cutoff,
                        },
                    );
                }
            } else {
                const parts = String(ch).split("-");
                for (const p of parts) {
                    await pusher.trigger(`user-${p}`, "messages-pruned", {
                        channel: ch,
                        message: "Old messages removed",
                        cutoff,
                    });
                }
            }
        } catch (err) {
            console.error("Failed to notify users for channel", ch, err);
        }
    }

    console.log("Prune complete.");
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
