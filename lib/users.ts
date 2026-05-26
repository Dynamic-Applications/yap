import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

const sql = neon(process.env.DATABASE_URL!);

export interface User {
    id: string;
    email: string;
    name: string;
    passwordHash: string;
    createdAt: string;
}

export interface SafeUser {
    id: string;
    email: string;
    name: string;
    createdAt: string;
}

export async function createTable() {
    await sql`
        CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            email TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'user',
            created_at TIMESTAMPTZ DEFAULT NOW()
        )
    `;
    await sql`
    AlTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT`;
    await sql`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user'`;
}

export async function findUserByEmail(
    email: string,
): Promise<User | undefined> {
    await createTable();
    const rows = await sql`
        SELECT id, email, name, password_hash, avatar_url, role, created_at
        FROM users WHERE email = ${email.toLowerCase().trim()}
    `;
    if (!rows[0]) return undefined;
    return {
        id: rows[0].id,
        email: rows[0].email,
        name: rows[0].name,
        passwordHash: rows[0].password_hash,
        avatarUrl: rows[0].avatar_url ?? undefined,
        role: rows[0].role,
        createdAt: rows[0].created_at,
    };
}

export async function findUserById(id: string): Promise<User | undefined> {
    await createTable();
    const rows = await sql`
        SELECT id, email, name, password_hash, avatar_url, role, created_at
        FROM users WHERE id = ${id}
    `;
    if (!rows[0]) return undefined;
    return {
        id: rows[0].id,
        email: rows[0].email,
        name: rows[0].name,
        passwordHash: rows[0].password_hash,
        avatarUrl: rows[0].avatar_url ?? undefined,
        role: rows[0].role,
        createdAt: rows[0].created_at,
    };
}

export async function getAllUsers(): Promise<SafeUser[]> {
    await createTable();
    const rows = await sql`
        SELECT id, email, name, avatar_url, role, created_at FROM users
    `;
    return rows.map((r) => ({
        id: r.id,
        email: r.email,
        name: r.name,
        avatarUrl: r.avatar_url ?? undefined,
        role: r.role,
        createdAt: r.created_at,
    }));
}

export async function createUser(
    email: string,
    name: string,
    password: string,
): Promise<SafeUser> {
    await createTable();
    const passwordHash = await bcrypt.hash(password, 10);
    const rows = await sql`
        INSERT INTO users (email, name, password_hash)
        VALUES (${email.toLowerCase().trim()}, ${name.trim()}, ${passwordHash})
        RETURNING id, email, name, avatar_url, role, created_at
    `;
    return {
        id: rows[0].id,
        email: rows[0].email,
        name: rows[0].name,
        avatarUrl: rows[0].avatar_url ?? undefined,
        role: rows[0].role,
        createdAt: rows[0].created_at,
    };
}

export async function emailExists(email: string): Promise<boolean> {
    await createTable();
    const rows = await sql`
        SELECT 1 FROM users WHERE email = ${email.toLowerCase().trim()}
    `;
    return rows.length > 0;
}

export async function verifyPassword(
    user: User,
    password: string,
): Promise<boolean> {
    return bcrypt.compare(password, user.passwordHash);
}

export function safeUser(user: User): SafeUser {
    const { passwordHash: _, ...safe } = user;
    return safe;
}

export interface User {
    id: string;
    email: string;
    name: string;
    passwordHash: string;
    avatarUrl?: string;
    role: "User" | "Admin" | "SuperAdmin";
    createdAt: string;
}

export interface SafeUser {
    id: string;
    email: string;
    name: string;
    avatarUrl?: string;
    role: "User" | "Admin" | "SuperAdmin";
    createdAt: string;
}


export async function updateUserRole(
    id: string,
    role: "User" | "Admin" | "SuperAdmin",
): Promise<void> {
    await sql`UPDATE users SET role = ${role} WHERE id = ${id}`;
}

export async function updateUserAvatar(
    id: string,
    avatarUrl: string,
): Promise<void> {
    await sql`UPDATE users SET avatar_url = ${avatarUrl} WHERE id = ${id}`;
}