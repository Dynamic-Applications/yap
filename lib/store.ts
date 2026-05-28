export interface Item {
    id: string;
    title: string;
    description: string;
    status: "active" | "inactive" | "pending";
    createdAt: string;
    updatedAt: string;
}

declare global {
    var __items: Item[];
    var __nextItemId: number;
}

if (!global.__items) {
    global.__items = [
        {
            id: "1",
            title: "Launch campaign",
            description: "Plan and execute Q3 product launch campaign",
            status: "active",
            createdAt: new Date("2026-04-10").toISOString(),
            updatedAt: new Date("2026-04-10").toISOString(),
        },
        {
            id: "2",
            title: "Redesign onboarding",
            description:
                "Improve new user onboarding flow with interactive steps",
            status: "pending",
            createdAt: new Date("2026-04-15").toISOString(),
            updatedAt: new Date("2026-04-18").toISOString(),
        },
        {
            id: "3",
            title: "API documentation",
            description: "Write comprehensive docs for the public REST API",
            status: "inactive",
            createdAt: new Date("2026-04-20").toISOString(),
            updatedAt: new Date("2026-04-22").toISOString(),
        },
    ];
    global.__nextItemId = 4;
}

export function getAll(): Item[] {
    return [...global.__items];
}

export function getById(id: string): Item | undefined {
    return global.__items.find((item) => item.id === id);
}

export function create(
    data: Omit<Item, "id" | "createdAt" | "updatedAt">,
): Item {
    const now = new Date().toISOString();
    const newItem: Item = {
        id: String(global.__nextItemId++),
        ...data,
        createdAt: now,
        updatedAt: now,
    };
    global.__items.push(newItem);
    return newItem;
}

export function update(
    id: string,
    data: Partial<Omit<Item, "id" | "createdAt">>,
): Item | null {
    const index = global.__items.findIndex((item) => item.id === id);
    if (index === -1) return null;
    global.__items[index] = {
        ...global.__items[index],
        ...data,
        updatedAt: new Date().toISOString(),
    };
    return global.__items[index];
}

export function remove(id: string): boolean {
    const index = global.__items.findIndex((item) => item.id === id);
    if (index === -1) return false;
    global.__items.splice(index, 1);
    return true;
}
