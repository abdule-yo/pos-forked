"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    Home,
    ShoppingBag,
    ReceiptText,
    Package,
    Wallet,
    ChartNoAxesColumn,
    Users,
    UserCog,
    LogOut,
    Gem,
    X,
    ChevronsUpDown,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * Navigation is written the way the shop talks, not the way the database is
 * built: "Sell", not "Point of Sale"; "Products", not "Inventory"; "Staff",
 * not "Users".
 *
 * Overview leads, because it answers the owner's first question of the day.
 * Cashiers never see it — what the shop earns, what it spends and who works
 * here belong to the owner, and hiding them makes the app smaller to learn.
 */
const NAV = [
    { href: "/", label: "Overview", icon: Home, adminOnly: true },
    { href: "/pos", label: "Sell", icon: ShoppingBag, adminOnly: false },
    { href: "/sales", label: "Sales", icon: ReceiptText, adminOnly: false },
    { href: "/customers", label: "Customers", icon: Users, adminOnly: false },
    { href: "/inventory", label: "Products", icon: Package, adminOnly: false },
    { href: "/expenses", label: "Expenses", icon: Wallet, adminOnly: true },
    { href: "/reports", label: "Reports", icon: ChartNoAxesColumn, adminOnly: true },
    { href: "/users", label: "Staff", icon: UserCog, adminOnly: true },
];

function NavLink({
    href,
    label,
    icon: Icon,
    isActive,
    onClose,
    isCollapsed,
}: {
    href: string;
    label: string;
    icon: typeof Home;
    isActive: boolean;
    onClose?: () => void;
    isCollapsed?: boolean;
}) {
    const link = (
        <Link
            href={href}
            onClick={onClose}
            aria-current={isActive ? "page" : undefined}
            className={cn(
                "group relative flex items-center gap-3 rounded-xl text-sm font-medium transition-colors duration-150",
                isCollapsed ? "size-11 justify-center" : "h-11 px-3",
                isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
        >
            {/* The active page is marked by a bar in the brand colour, echoing
                the category spines used throughout the app. */}
            {isActive && !isCollapsed && (
                <span
                    aria-hidden
                    className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary"
                />
            )}
            <Icon className="size-[18px] shrink-0" strokeWidth={isActive ? 2.2 : 1.8} />
            {!isCollapsed && <span>{label}</span>}
        </Link>
    );

    if (!isCollapsed) return link;

    return (
        <Tooltip>
            <TooltipTrigger render={link} />
            <TooltipContent side="right">{label}</TooltipContent>
        </Tooltip>
    );
}

export function Sidebar({
    onClose,
    isCollapsed,
}: {
    onClose?: () => void;
    isCollapsed?: boolean;
    onToggleCollapse?: () => void;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const { data: session } = authClient.useSession();

    if (pathname === "/login") return null;

    const isAdmin = (session?.user as { role?: string } | undefined)?.role === "admin";
    const items = NAV.filter((item) => !item.adminOnly || isAdmin);

    const handleLogout = async () => {
        await authClient.signOut();
        router.push("/login");
        router.refresh();
    };

    return (
        <aside className="flex h-full w-full flex-col overflow-hidden border border-border bg-sidebar shadow-card md:rounded-2xl">
            <div
                className={cn(
                    "flex h-16 items-center gap-3 border-b border-border/60 px-4",
                    isCollapsed && "justify-center px-2"
                )}
            >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    <Gem className="size-4.5" strokeWidth={1.8} />
                </span>
                {!isCollapsed && (
                    <div className="min-w-0 flex-1">
                        <p className="truncate font-heading text-sm font-semibold tracking-tight">
                            Boutique
                        </p>
                        <p className="truncate text-xs text-muted-foreground">Shop counter</p>
                    </div>
                )}
                {!isCollapsed && onClose && (
                    <button
                        onClick={onClose}
                        aria-label="Close menu"
                        className="-mr-1 flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground md:hidden"
                    >
                        <X className="size-5" />
                    </button>
                )}
            </div>

            <nav className={cn("flex-1 space-y-1 overflow-y-auto py-4", isCollapsed ? "px-2" : "px-3")}>
                {items.map((item) => (
                    <NavLink
                        key={item.href}
                        href={item.href}
                        label={item.label}
                        icon={item.icon}
                        isActive={pathname === item.href}
                        onClose={onClose}
                        isCollapsed={isCollapsed}
                    />
                ))}
            </nav>

            {session?.user && (
                <div className={cn("border-t border-border/60 p-3", isCollapsed && "px-2")}>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                className={cn(
                                    "flex items-center gap-3 rounded-xl text-left outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring",
                                    isCollapsed ? "size-11 justify-center" : "w-full p-2"
                                )}
                            >
                                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
                                    {session.user.name?.charAt(0).toUpperCase() || "U"}
                                </span>
                                {!isCollapsed && (
                                    <>
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate text-sm font-medium">
                                                {session.user.name}
                                            </span>
                                            <span className="block truncate text-xs text-muted-foreground">
                                                {isAdmin ? "Owner" : "Cashier"}
                                            </span>
                                        </span>
                                        <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
                                    </>
                                )}
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align={isCollapsed ? "end" : "center"}
                            side={isCollapsed ? "right" : "top"}
                            sideOffset={8}
                            className="min-w-56"
                        >
                            <DropdownMenuLabel className="font-normal">
                                <p className="text-sm font-medium">{session.user.name}</p>
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                    {session.user.email}
                                </p>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={handleLogout}
                                className="cursor-pointer gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive"
                            >
                                <LogOut className="size-4" />
                                Sign out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )}
        </aside>
    );
}
