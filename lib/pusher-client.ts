import type PusherType from "pusher-js";

let pusherClient: PusherType | null = null;

export function getPusherClient(): PusherType {
    if (!pusherClient) {
        const PusherJS = require("pusher-js");
        pusherClient = new PusherJS(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
            cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
        }) as PusherType;
    }
    return pusherClient!;
}
