"use client";
import MobileNav from "@/components/MobileNav";
// import { redirect } from "next/navigation";
import ChatLayout from "@/components/ChatLayout";

export default function Main() {
    // redirect("/friends");
    return (
        <>
            <ChatLayout />
            <MobileNav />
        </>
    );
}
