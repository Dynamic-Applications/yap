// "use client";

// import { useRef, useState } from "react";
// import { X } from "lucide-react";
// import Image from "next/image";

// interface Friend {
//     id: string;
//     name: string;
//     email: string;
// }

// interface Props {
//     friends: Friend[];
//     onClose: () => void;
//     onCreated: (groupId: string, groupName: string, avatarUrl?: string) => void;
// }

// export default function CreateGroupModal({
//     friends,
//     onClose,
//     onCreated,
// }: Props) {
//     const [name, setName] = useState("");
//     const [selected, setSelected] = useState<string[]>([]);
//     const [loading, setLoading] = useState(false);
//     const [error, setError] = useState("");
//     const [avatar, setAvatar] = useState<string>("");
//     const [avatarFile, setAvatarFile] = useState<File | null>(null);
//     const inputRef = useRef<HTMLInputElement>(null);

//     const toggle = (id: string) =>
//         setSelected((prev) =>
//             prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
//         );

//     const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//         const file = e.target.files?.[0];
//         if (!file) return;
//         setAvatarFile(file);
//         setAvatar(URL.createObjectURL(file));
//     };

//     const create = async () => {
//         if (!name.trim() || selected.length === 0) {
//             setError("Enter a group name and select at least one member.");
//             return;
//         }
//         setLoading(true);

//         let avatarUrl: string | undefined;

//         // Upload avatar first if selected
//         if (avatarFile) {
//             const formData = new FormData();
//             formData.append("avatar", avatarFile);
//             const res = await fetch("/api/groups/avatar", {
//                 method: "POST",
//                 body: formData,
//             });
//             const data = await res.json();
//             if (data.success) avatarUrl = data.avatarUrl;
//         }

//         const res = await fetch("/api/groups", {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({ name, memberIds: selected, avatarUrl }),
//         });
//         const data = await res.json();
//         if (data.success) {
//             onCreated(data.groupId, name, avatarUrl);
//         } else {
//             setError(data.error);
//         }
//         setLoading(false);
//     };

//     function getInitials(name: string) {
//         return name
//             .split(" ")
//             .map((n) => n[0])
//             .join("")
//             .toUpperCase()
//             .slice(0, 2);
//     }

//     return (
//         <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
//             <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4">
//                 <div className="flex items-center justify-between">
//                     <h2 className="text-lg font-semibold">New Group</h2>
//                     <button onClick={onClose}>
//                         <X
//                             size={20}
//                             className="text-gray-400 hover:text-gray-600"
//                         />
//                     </button>
//                 </div>

//                 {/* Avatar picker */}
//                 <div className="flex justify-center">
//                     <div
//                         className="relative h-20 w-20 rounded-full cursor-pointer group"
//                         onClick={() => inputRef.current?.click()}
//                     >
//                         {avatar ? (
//                             <Image
//                                 src={avatar}
//                                 alt="Group avatar"
//                                 width={80}
//                                 height={80}
//                                 className="rounded-full object-cover w-full h-full"
//                             />
//                         ) : (
//                             <div className="h-20 w-20 rounded-full bg-purple-500 flex items-center justify-center text-white text-2xl font-semibold">
//                                 {name ? getInitials(name) : "G"}
//                             </div>
//                         )}
//                         <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
//                             <svg
//                                 className="w-6 h-6 text-white"
//                                 fill="none"
//                                 stroke="currentColor"
//                                 viewBox="0 0 24 24"
//                             >
//                                 <path
//                                     strokeLinecap="round"
//                                     strokeLinejoin="round"
//                                     strokeWidth={2}
//                                     d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
//                                 />
//                                 <path
//                                     strokeLinecap="round"
//                                     strokeLinejoin="round"
//                                     strokeWidth={2}
//                                     d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
//                                 />
//                             </svg>
//                         </div>
//                         <input
//                             ref={inputRef}
//                             type="file"
//                             accept="image/*"
//                             className="hidden"
//                             onChange={handleAvatarChange}
//                         />
//                     </div>
//                 </div>

//                 <input
//                     type="text"
//                     placeholder="Group name"
//                     value={name}
//                     onChange={(e) => setName(e.target.value)}
//                     className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 />

//                 <div className="space-y-2 max-h-56 overflow-y-auto">
//                     {friends.map((friend) => (
//                         <div
//                             key={friend.id}
//                             onClick={() => toggle(friend.id)}
//                             className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
//                                 selected.includes(friend.id)
//                                     ? "bg-blue-50 border border-blue-200"
//                                     : "hover:bg-gray-50 border border-transparent"
//                             }`}
//                         >
//                             <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-semibold">
//                                 {getInitials(friend.name)}
//                             </div>
//                             <div className="flex-1">
//                                 <p className="text-sm font-medium">
//                                     {friend.name}
//                                 </p>
//                                 <p className="text-xs text-gray-400">
//                                     {friend.email}
//                                 </p>
//                             </div>
//                             <div
//                                 className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
//                                     selected.includes(friend.id)
//                                         ? "border-blue-500 bg-blue-500"
//                                         : "border-gray-300"
//                                 }`}
//                             >
//                                 {selected.includes(friend.id) && (
//                                     <div className="w-2 h-2 rounded-full bg-white" />
//                                 )}
//                             </div>
//                         </div>
//                     ))}
//                 </div>

//                 {error && <p className="text-xs text-red-500">{error}</p>}

//                 <button
//                     onClick={create}
//                     disabled={loading}
//                     className="w-full py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 disabled:opacity-50"
//                 >
//                     {loading
//                         ? "Creating..."
//                         : `Create Group${selected.length > 0 ? ` (${selected.length + 1})` : ""}`}
//                 </button>
//             </div>
//         </div>
//     );
// }

"use client";

import { useRef, useState } from "react";
import { X, Pencil, UserMinus } from "lucide-react";
import Image from "next/image";

interface Friend {
    id: string;
    name: string;
    email: string;
}

interface Props {
    friends: Friend[];
    onClose: () => void;
    onCreated: (groupId: string, groupName: string, avatarUrl?: string) => void;
}

function getInitials(name: string) {
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

const AVATAR_COLORS = [
    "bg-blue-500",
    "bg-violet-500",
    "bg-emerald-500",
    "bg-amber-500",
    "bg-rose-500",
];

function friendColor(index: number) {
    return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

export default function CreateGroupModal({
    friends,
    onClose,
    onCreated,
}: Props) {
    const [name, setName] = useState("");
    const [isEditingName, setIsEditingName] = useState(false);
    const [draftName, setDraftName] = useState("");

    const [selected, setSelected] = useState<string[]>([]);
    const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [avatar, setAvatar] = useState<string>("");
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // ── member toggle (select/deselect from the friends list) ──────────────
    const toggle = (id: string) =>
        setSelected((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
        );

    // ── remove a selected member (called after confirmation) ───────────────
    const confirmRemove = () => {
        if (!pendingRemoveId) return;
        setSelected((prev) => prev.filter((x) => x !== pendingRemoveId));
        setPendingRemoveId(null);
    };

    // ── avatar ─────────────────────────────────────────────────────────────
    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setAvatarFile(file);
        setAvatar(URL.createObjectURL(file));
    };

    // ── rename helpers ─────────────────────────────────────────────────────
    const startEditName = () => {
        setDraftName(name);
        setIsEditingName(true);
    };

    const saveName = () => {
        const trimmed = draftName.trim();
        if (trimmed) setName(trimmed);
        setIsEditingName(false);
    };

    // ── submit ─────────────────────────────────────────────────────────────
    const create = async () => {
        if (!name.trim() || selected.length === 0) {
            setError("Enter a group name and select at least one member.");
            return;
        }
        setLoading(true);
        setError("");

        let avatarUrl: string | undefined;

        if (avatarFile) {
            const formData = new FormData();
            formData.append("avatar", avatarFile);
            const res = await fetch("/api/groups/avatar", {
                method: "POST",
                body: formData,
            });
            const data = await res.json();
            if (data.success) avatarUrl = data.avatarUrl;
        }

        const res = await fetch("/api/groups", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, memberIds: selected, avatarUrl }),
        });
        const data = await res.json();
        if (data.success) {
            onCreated(data.groupId, name, avatarUrl);
        } else {
            setError(data.error);
        }
        setLoading(false);
    };

    const selectedFriends = friends.filter((f) => selected.includes(f.id));
    const pendingFriend = friends.find((f) => f.id === pendingRemoveId);

    return (
        <>
            {/* ── Main modal ───────────────────────────────────────────────── */}
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
                <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">New Group</h2>
                        <button onClick={onClose} aria-label="Close">
                            <X
                                size={20}
                                className="text-gray-400 hover:text-gray-600"
                            />
                        </button>
                    </div>

                    {/* Avatar picker */}
                    <div className="flex justify-center">
                        <div className="relative h-20 w-20">
                            <div
                                className="h-20 w-20 rounded-full cursor-pointer overflow-hidden"
                                onClick={() => inputRef.current?.click()}
                            >
                                {avatar ? (
                                    <Image
                                        src={avatar}
                                        alt="Group avatar"
                                        width={80}
                                        height={80}
                                        className="rounded-full object-cover w-full h-full"
                                    />
                                ) : (
                                    <div className="h-full w-full rounded-full bg-purple-500 flex items-center justify-center text-white text-2xl font-semibold select-none">
                                        {name ? getInitials(name) : "G"}
                                    </div>
                                )}
                            </div>
                            {/* Edit badge */}
                            <button
                                onClick={() => inputRef.current?.click()}
                                aria-label="Edit group avatar"
                                className="absolute bottom-0 right-0 h-6 w-6 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors"
                            >
                                <Pencil size={11} className="text-gray-500" />
                            </button>
                            <input
                                ref={inputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleAvatarChange}
                            />
                        </div>
                    </div>

                    {/* Group name */}
                    {isEditingName ? (
                        <div className="space-y-2">
                            <input
                                type="text"
                                value={draftName}
                                autoFocus
                                onChange={(e) => setDraftName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") saveName();
                                    if (e.key === "Escape")
                                        setIsEditingName(false);
                                }}
                                className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Group name"
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={saveName}
                                    className="flex-1 py-1.5 bg-blue-500 text-white rounded-lg text-xs font-medium hover:bg-blue-600"
                                >
                                    Save
                                </button>
                                <button
                                    onClick={() => setIsEditingName(false)}
                                    className="flex-1 py-1.5 border border-gray-200 rounded-lg text-xs font-medium hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : name ? (
                        /* Named — show label + rename button */
                        <div className="flex items-center justify-between px-4 py-2 rounded-lg border border-gray-100 bg-gray-50">
                            <span className="text-sm font-medium text-gray-800">
                                {name}
                            </span>
                            <button
                                onClick={startEditName}
                                className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <Pencil size={11} /> Rename
                            </button>
                        </div>
                    ) : (
                        /* No name yet — plain input */
                        <input
                            type="text"
                            placeholder="Group name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    )}

                    {/* Selected members chips */}
                    {selectedFriends.length > 0 && (
                        <div className="space-y-1">
                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                                Members · {selectedFriends.length + 1}
                            </p>
                            <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
                                {selectedFriends.map((f, i) => (
                                    <div
                                        key={f.id}
                                        className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-blue-50 border border-blue-100"
                                    >
                                        <div
                                            className={`h-6 w-6 rounded-full ${friendColor(i)} flex items-center justify-center text-white text-[10px] font-semibold flex-shrink-0`}
                                        >
                                            {getInitials(f.name)}
                                        </div>
                                        <span className="flex-1 text-sm text-gray-700 truncate">
                                            {f.name}
                                        </span>
                                        <button
                                            onClick={() =>
                                                setPendingRemoveId(f.id)
                                            }
                                            aria-label={`Remove ${f.name}`}
                                            className="text-gray-300 hover:text-red-400 transition-colors"
                                        >
                                            <UserMinus size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Friends list */}
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                        {friends.map((friend, i) => (
                            <div
                                key={friend.id}
                                onClick={() => toggle(friend.id)}
                                className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                                    selected.includes(friend.id)
                                        ? "bg-blue-50 border border-blue-200"
                                        : "hover:bg-gray-50 border border-transparent"
                                }`}
                            >
                                <div
                                    className={`h-8 w-8 rounded-full ${friendColor(i)} flex items-center justify-center text-white text-xs font-semibold flex-shrink-0`}
                                >
                                    {getInitials(friend.name)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">
                                        {friend.name}
                                    </p>
                                    <p className="text-xs text-gray-400 truncate">
                                        {friend.email}
                                    </p>
                                </div>
                                <div
                                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                        selected.includes(friend.id)
                                            ? "border-blue-500 bg-blue-500"
                                            : "border-gray-300"
                                    }`}
                                >
                                    {selected.includes(friend.id) && (
                                        <div className="w-2 h-2 rounded-full bg-white" />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {error && <p className="text-xs text-red-500">{error}</p>}

                    <button
                        onClick={create}
                        disabled={loading}
                        className="w-full py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 disabled:opacity-50 transition-colors"
                    >
                        {loading
                            ? "Creating..."
                            : `Create Group${selected.length > 0 ? ` (${selected.length + 1})` : ""}`}
                    </button>
                </div>
            </div>

            {/* ── Remove confirmation dialog ────────────────────────────────── */}
            {pendingRemoveId && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] px-4">
                    <div className="bg-white rounded-2xl w-full max-w-xs p-5 space-y-4 shadow-xl">
                        <div>
                            <p className="text-sm font-semibold text-gray-900">
                                Remove {pendingFriend?.name}?
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                                They will be removed from this group.
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPendingRemoveId(null)}
                                className="flex-1 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmRemove}
                                className="flex-1 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
                            >
                                Remove
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}