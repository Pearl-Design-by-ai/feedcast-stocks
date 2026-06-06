"use client";

import React, { useState, useTransition } from "react";
import { Trash2, Bell, BellRing, RotateCcw } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { deleteAlert, reactivateAlert } from "@/lib/actions/alert.actions";

interface AlertItem {
    id: number;
    symbol: string;
    targetPrice: number;
    condition: "ABOVE" | "BELOW";
    active: boolean;
    triggered: boolean;
    expiresAt: string;
    createdAt: string;
    updatedAt: string;
}

interface AlertsPanelProps {
    alerts: AlertItem[];
    onRefresh?: () => void;
}

const conditionSymbol = (condition: AlertItem["condition"]) =>
    condition === "ABOVE" ? "≥" : "≤";

export default function AlertsPanel({ alerts, onRefresh }: AlertsPanelProps) {
    const [pendingId, setPendingId] = useState<number | null>(null);
    const [, startTransition] = useTransition();

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this alert?")) return;
        setPendingId(id);
        try {
            await deleteAlert(id);
            startTransition(() => onRefresh?.());
        } finally {
            setPendingId(null);
        }
    };

    const handleReactivate = async (id: number) => {
        setPendingId(id);
        try {
            await reactivateAlert(id);
            startTransition(() => onRefresh?.());
        } finally {
            setPendingId(null);
        }
    };

    return (
        <div className="bg-gray-900/30 rounded-lg border border-gray-800 p-4 h-full">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white flex items-center">
                    <Bell className="w-5 h-5 mr-2 text-yellow-500" />
                    Alerts
                </h2>
            </div>

            <div className="space-y-3">
                {alerts.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm">
                        No active alerts. Add one from the watchlist.
                    </div>
                ) : (
                    alerts.map((alert) => {
                        const isPending = pendingId === alert.id;
                        const expiry = new Date(alert.expiresAt);
                        return (
                            <div
                                key={alert.id}
                                className={`rounded-lg p-3 border relative group transition-colors ${
                                    alert.triggered
                                        ? "bg-green-500/10 border-green-500/40"
                                        : "bg-gray-800/40 border-gray-800"
                                } ${isPending ? "opacity-50 pointer-events-none" : ""}`}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center space-x-2">
                                            <div className="w-8 h-8 rounded bg-gray-700 flex items-center justify-center font-bold text-xs text-white">
                                                {alert.symbol[0]}
                                            </div>
                                            <div>
                                                <div className="font-bold text-white text-sm flex items-center gap-2">
                                                    {alert.symbol}
                                                    {alert.triggered ? (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-green-400 bg-green-500/15 px-1.5 py-0.5 rounded-full">
                                                            <BellRing className="w-3 h-3" /> Triggered
                                                        </span>
                                                    ) : !alert.active ? (
                                                        <span className="text-[10px] font-semibold text-gray-400 bg-gray-700/60 px-1.5 py-0.5 rounded-full">
                                                            Paused
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] font-semibold text-yellow-400/80 bg-yellow-500/10 px-1.5 py-0.5 rounded-full">
                                                            Active
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-gray-400">
                                                    Target: {formatCurrency(alert.targetPrice)}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-2 text-xs text-yellow-500 font-medium">
                                            Notify when price {conditionSymbol(alert.condition)}{" "}
                                            {formatCurrency(alert.targetPrice)}
                                        </div>
                                        <div className="text-[10px] text-gray-500 mt-1">
                                            {alert.triggered
                                                ? "Condition met — re-arm to watch again"
                                                : `Active until ${expiry.toLocaleDateString()}`}
                                        </div>
                                    </div>
                                    <div className="flex flex-col space-y-2">
                                        {alert.triggered && (
                                            <button
                                                onClick={() => handleReactivate(alert.id)}
                                                disabled={isPending}
                                                title="Re-arm alert"
                                                className="text-gray-400 hover:text-green-400 transition-colors p-1"
                                            >
                                                <RotateCcw className="w-4 h-4" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDelete(alert.id)}
                                            disabled={isPending}
                                            title="Delete alert"
                                            className="text-gray-500 hover:text-red-500 transition-colors p-1"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
