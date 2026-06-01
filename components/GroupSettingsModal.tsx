"use client";

import { useRef, useState } from "react";
import {
    X,
    Pencil,
    UserMinus,
    LogOut,
    ShieldCheck,
    Trash2,
} from "lucide-react";
import Image from "next/image";

interface Member {
    id: string;
    name: string;
    email: string;
    isCreator: boolean;
    avatar_url?: string | null;
}

interface Props {
    groupId: string;
    groupName: string;
    groupAvatarUrl?: string;
    groupCreatedByName?: string;
    groupCreatedAt?: string;
    members: Member[];
    currentUserId: string;
    isCreator: boolean;
    onClose: () => void;
    onLeft: () => void;
    onDeleted: () => void;
    onUpdated: (changes: {
        name?: string;
        avatarUrl?: string;
        newAdminId?: string;
    }) => void;
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

function memberColor(index: number) {
    return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

type ConfirmAction =
    | { type: "remove"; memberId: string; memberName: string }
    | { type: "leave" }
    | { type: "makeAdmin"; memberId: string; memberName: string }
    | { type: "deleteGroup" };

export default function GroupSettingsModal({
    groupId,
    groupName,
    groupAvatarUrl,
    groupCreatedByName,
    groupCreatedAt,
    members,
    currentUserId,
    isCreator,
    onClose,
    onLeft,
    onDeleted,
    onUpdated,
}: Props) {
    const [name, setName] = useState(groupName);
    const [isEditingName, setIsEditingName] = useState(false);
    const [draftName, setDraftName] = useState("");
    const [savingName, setSavingName] = useState(false);

    const [avatarPreview, setAvatarPreview] = useState(groupAvatarUrl ?? "");
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const [memberList, setMemberList] = useState<Member[]>(members);
    const [currentIsCreator, setCurrentIsCreator] = useState(isCreator);

    const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(
        null,
    );
    const [actionLoading, setActionLoading] = useState(false);
    const [actionError, setActionError] = useState("");

    const handleAvatarChange = async (
        e: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setAvatarPreview(URL.createObjectURL(file));
        setUploadingAvatar(true);
        try {
            const formData = new FormData();
            formData.append("avatar", file);
            const res = await fetch(`/api/groups/${groupId}/avatar`, {
                method: "POST",
                body: formData,
            });
            const data = await res.json();
            if (data.success) onUpdated({ avatarUrl: data.avatarUrl });
        } finally {
            setUploadingAvatar(false);
        }
    };

    const startEditName = () => {
        setDraftName(name);
        setIsEditingName(true);
    };

    const saveName = async () => {
        const trimmed = draftName.trim();
        if (!trimmed || trimmed === name) {
            setIsEditingName(false);
            return;
        }
        setSavingName(true);
        try {
            const res = await fetch(`/api/groups/${groupId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: trimmed }),
            });
            const data = await res.json();
            if (data.success) {
                setName(trimmed);
                onUpdated({ name: trimmed });
            }
        } finally {
            setSavingName(false);
            setIsEditingName(false);
        }
    };

    const handleConfirm = async () => {
        if (!confirmAction) return;
        setActionLoading(true);
        setActionError("");

        try {
            if (confirmAction.type === "deleteGroup") {
                const res = await fetch(`/api/groups/${groupId}`, {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ deleteGroup: true }),
                });
                const data = await res.json();
                if (data.success) {
                    onDeleted();
                } else {
                    setActionError(data.error ?? "Failed to delete group.");
                }
            } else if (confirmAction.type === "makeAdmin") {
                const res = await fetch(`/api/groups/${groupId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        newAdminId: confirmAction.memberId,
                    }),
                });
                const data = await res.json();
                if (data.success) {
                    setMemberList((prev) =>
                        prev.map((m) => ({
                            ...m,
                            isCreator: m.id === confirmAction.memberId,
                        })),
                    );
                    setCurrentIsCreator(false);
                    onUpdated({ newAdminId: confirmAction.memberId });
                    setConfirmAction(null);
                } else {
                    setActionError(data.error ?? "Failed to transfer admin.");
                }
            } else if (confirmAction.type === "remove") {
                const res = await fetch(`/api/groups/${groupId}`, {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ memberId: confirmAction.memberId }),
                });
                const data = await res.json();
                if (data.success) {
                    if (data.groupDeleted) {
                        onDeleted();
                        return;
                    }
                    setMemberList((prev) =>
                        prev.filter((m) => m.id !== confirmAction.memberId),
                    );
                    setConfirmAction(null);
                } else {
                    setActionError(data.error ?? "Failed to remove member.");
                }
            } else {
                // leave
                const res = await fetch(`/api/groups/${groupId}/leave`, {
                    method: "DELETE",
                });
                const data = await res.json();
                if (data.success) {
                    data.groupDeleted ? onDeleted() : onLeft();
                } else {
                    setActionError(data.error ?? "Failed to leave group.");
                }
            }
        } catch {
            setActionError("Something went wrong. Please try again.");
        } finally {
            setActionLoading(false);
        }
    };

    const confirmDialogText = () => {
        if (!confirmAction) return { title: "", desc: "", btn: "" };
        if (confirmAction.type === "deleteGroup")
            return {
                title: "Delete group?",
                desc: "This will permanently delete the group and all its messages. This cannot be undone.",
                btn: "Delete",
            };
        if (confirmAction.type === "makeAdmin")
            return {
                title: `Make ${confirmAction.memberName} admin?`,
                desc: "They'll be able to manage the group. You'll become a regular member.",
                btn: "Transfer",
            };
        if (confirmAction.type === "remove")
            return {
                title: `Remove ${confirmAction.memberName}?`,
                desc: `${confirmAction.memberName} will be removed from the group.`,
                btn: "Remove",
            };
        return {
            title: "Leave group?",
            desc: "You'll no longer have access to this group's messages.",
            btn: "Leave",
        };
    };

    const { title, desc, btn } = confirmDialogText();

    const formattedDate = groupCreatedAt
        ? new Date(groupCreatedAt).toLocaleDateString(undefined, {
              year: "numeric",
              month: "long",
              day: "numeric",
          })
        : null;

    return (
        <>
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
                <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-5">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">Group Info</h2>
                        <button onClick={onClose} aria-label="Close">
                            <X
                                size={20}
                                className="text-gray-400 hover:text-gray-600"
                            />
                        </button>
                    </div>

                    {/* Avatar */}
                    <div className="flex justify-center">
                        <div className="relative h-20 w-20">
                            <div
                                className="h-20 w-20 rounded-full overflow-hidden cursor-pointer"
                                onClick={() =>
                                    currentIsCreator &&
                                    inputRef.current?.click()
                                }
                            >
                                {avatarPreview ? (
                                    <Image
                                        src={avatarPreview}
                                        alt="Group avatar"
                                        width={80}
                                        height={80}
                                        className="rounded-full object-cover w-full h-full"
                                    />
                                ) : (
                                    <div className="h-full w-full rounded-full bg-purple-500 flex items-center justify-center text-white text-2xl font-semibold select-none">
                                        {getInitials(name)}
                                    </div>
                                )}
                                {uploadingAvatar && (
                                    <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                                        <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    </div>
                                )}
                            </div>
                            {currentIsCreator && (
                                <button
                                    onClick={() => inputRef.current?.click()}
                                    aria-label="Edit group avatar"
                                    className="absolute bottom-0 right-0 h-6 w-6 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors"
                                >
                                    <Pencil
                                        size={11}
                                        className="text-gray-500"
                                    />
                                </button>
                            )}
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
                    {currentIsCreator && isEditingName ? (
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
                                    disabled={savingName}
                                    className="flex-1 py-1.5 bg-blue-500 text-white rounded-lg text-xs font-medium hover:bg-blue-600 disabled:opacity-50"
                                >
                                    {savingName ? "Saving…" : "Save"}
                                </button>
                                <button
                                    onClick={() => setIsEditingName(false)}
                                    className="flex-1 py-1.5 border border-gray-200 rounded-lg text-xs font-medium hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between px-4 py-2 rounded-lg border border-gray-100 bg-gray-50">
                            <span className="text-sm font-medium text-gray-800 truncate">
                                {name}
                            </span>
                            {currentIsCreator && (
                                <button
                                    onClick={startEditName}
                                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors ml-2 flex-shrink-0"
                                >
                                    <Pencil size={11} /> Rename
                                </button>
                            )}
                        </div>
                    )}

                    {/* Created by / created at */}
                    {(groupCreatedByName || formattedDate) && (
                        <div className="px-4 py-2.5 rounded-lg border border-gray-100 bg-gray-50 space-y-0.5">
                            {groupCreatedByName && (
                                <p className="text-xs text-gray-500">
                                    Created by{" "}
                                    <span className="font-medium text-gray-700">
                                        {groupCreatedByName}
                                    </span>
                                </p>
                            )}
                            {formattedDate && (
                                <p className="text-xs text-gray-400">
                                    {formattedDate}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Members list */}
                    <div className="space-y-1">
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                            Members · {memberList.length}
                        </p>
                        <div className="flex flex-col gap-1 max-h-44 overflow-y-auto">
                            {memberList.map((member, i) => {
                                const isCurrentUser =
                                    member.id === currentUserId;
                                const canRemove =
                                    currentIsCreator &&
                                    !isCurrentUser &&
                                    !member.isCreator;
                                const canMakeAdmin =
                                    currentIsCreator &&
                                    !isCurrentUser &&
                                    !member.isCreator;
                                return (
                                    <div
                                        key={member.id}
                                        className="flex items-center gap-2 px-2 py-1.5 rounded-lg border border-transparent hover:bg-gray-50"
                                    >
                                        <div className="h-8 w-8 rounded-full overflow-hidden flex-shrink-0">
                                            {member.avatar_url ? (
                                                <Image
                                                    src={member.avatar_url}
                                                    alt={member.name}
                                                    width={32}
                                                    height={32}
                                                    className="object-cover w-full h-full"
                                                />
                                            ) : (
                                                <div
                                                    className={`h-8 w-8 rounded-full ${memberColor(i)} flex items-center justify-center text-white text-xs font-semibold`}
                                                >
                                                    {getInitials(member.name)}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">
                                                {member.name}
                                                {isCurrentUser && (
                                                    <span className="ml-1.5 text-xs text-gray-400 font-normal">
                                                        you
                                                    </span>
                                                )}
                                            </p>
                                            <p className="text-xs text-gray-400 truncate">
                                                {member.email}
                                            </p>
                                        </div>
                                        {member.isCreator ? (
                                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-500 border border-blue-100 flex-shrink-0">
                                                Admin
                                            </span>
                                        ) : (
                                            <div className="flex items-center gap-1 flex-shrink-0">
                                                {canMakeAdmin && (
                                                    <button
                                                        onClick={() =>
                                                            setConfirmAction({
                                                                type: "makeAdmin",
                                                                memberId:
                                                                    member.id,
                                                                memberName:
                                                                    member.name,
                                                            })
                                                        }
                                                        aria-label={`Make ${member.name} admin`}
                                                        className="text-gray-300 hover:text-blue-400 transition-colors"
                                                        title="Make admin"
                                                    >
                                                        <ShieldCheck
                                                            size={15}
                                                        />
                                                    </button>
                                                )}
                                                {canRemove && (
                                                    <button
                                                        onClick={() =>
                                                            setConfirmAction({
                                                                type: "remove",
                                                                memberId:
                                                                    member.id,
                                                                memberName:
                                                                    member.name,
                                                            })
                                                        }
                                                        aria-label={`Remove ${member.name}`}
                                                        className="text-gray-300 hover:text-red-400 transition-colors"
                                                    >
                                                        <UserMinus size={15} />
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Leave group (non-admin) */}
                    {!currentIsCreator && (
                        <button
                            onClick={() => setConfirmAction({ type: "leave" })}
                            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-red-100 text-red-500 text-sm font-medium hover:bg-red-50 transition-colors"
                        >
                            <LogOut size={15} />
                            Leave group
                        </button>
                    )}

                    {/* Admin actions */}
                    {currentIsCreator && (
                        <div className="space-y-2">
                            <p className="text-xs text-center text-gray-400">
                                Transfer admin to a member before leaving the
                                group.
                            </p>
                            <button
                                onClick={() =>
                                    setConfirmAction({ type: "deleteGroup" })
                                }
                                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-red-100 text-red-500 text-sm font-medium hover:bg-red-50 transition-colors"
                            >
                                <Trash2 size={15} />
                                Delete group
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Confirm dialog */}
            {confirmAction && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] px-4">
                    <div className="bg-white rounded-2xl w-full max-w-xs p-5 space-y-4 shadow-xl">
                        <div>
                            <p className="text-sm font-semibold text-gray-900">
                                {title}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">{desc}</p>
                            {actionError && (
                                <p className="text-xs text-red-500 mt-2">
                                    {actionError}
                                </p>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    setConfirmAction(null);
                                    setActionError("");
                                }}
                                disabled={actionLoading}
                                className="flex-1 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirm}
                                disabled={actionLoading}
                                className={`flex-1 py-2 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                                    confirmAction.type === "makeAdmin"
                                        ? "bg-blue-500 hover:bg-blue-600"
                                        : "bg-red-500 hover:bg-red-600"
                                }`}
                            >
                                {actionLoading ? "…" : btn}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
