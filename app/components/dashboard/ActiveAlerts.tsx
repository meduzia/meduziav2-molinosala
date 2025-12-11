"use client";

import { useEffect, useState } from "react";
import type { DateRange as DateRangeType } from "react-day-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, AlertCircle, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale/es";
import { cn } from "@/lib/utils";

interface Alert {
  adName: string;
  cpa: number;
  spend: number;
  conversions: number;
  lastSeen: string;
}

interface ActiveAlertsProps {
  dateRange?: DateRangeType;
}

export const ActiveAlerts = ({ dateRange }: ActiveAlertsProps) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!dateRange?.from || !dateRange?.to) return;

    setLoading(true);
    const params = new URLSearchParams({
      from: dateRange.from.toISOString(),
      to: dateRange.to.toISOString(),
    });

    fetch(`/api/alerts?${params}`)
      .then((res) => res.json())
      .then((data: any) => {
        if (data.error) {
          console.error("API error fetching alerts:", data.error);
          setAlerts([]);
        } else if (Array.isArray(data)) {
          setAlerts(data);
        } else {
          setAlerts([]);
        }
      })
      .catch((err) => {
        console.error("Error fetching alerts:", err);
        setAlerts([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [dateRange]);

  const handleDismiss = (adName: string) => {
    setDismissed((prev) => new Set(prev).add(adName));
  };

  const visibleAlerts = alerts.filter((alert) => !dismissed.has(alert.adName));

  if (loading) {
    return (
      <Card className="border-red-500/50 bg-red-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            🚨 Active Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Cargando alertas...</p>
        </CardContent>
      </Card>
    );
  }

  if (visibleAlerts.length === 0) {
    return (
      <Card className="border-green-500/50 bg-green-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-500">
            <span className="text-xl">✓</span>
            Active Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">✓ All ads performing within target</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-red-500/50 bg-red-500/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-500">
          <AlertCircle className="h-5 w-5" />
          🚨 Active Alerts ({visibleAlerts.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {visibleAlerts.map((alert, index) => {
          const lastSeenDate = new Date(alert.lastSeen);
          const timeAgo = formatDistanceToNow(lastSeenDate, {
            addSuffix: true,
            locale: es,
          });

          return (
            <div
              key={index}
              className="flex items-center justify-between p-3 rounded-lg border border-red-500/30 bg-red-500/10"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm">{alert.adName}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>
                    Current CPA:{" "}
                    <span className="font-bold text-red-500">
                      ${alert.cpa.toFixed(2)}
                    </span>
                  </span>
                  <span>Spend: ${alert.spend.toLocaleString()}</span>
                  <span>Conversions: {alert.conversions}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Last seen: {timeAgo}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    // Aquí puedes agregar la navegación a detalles
                    console.log("View details for:", alert.adName);
                  }}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  View Ad Details
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => handleDismiss(alert.adName)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

