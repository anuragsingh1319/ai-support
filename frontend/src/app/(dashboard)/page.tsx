"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function DashboardOverviewPage() {
  const [data, setData] = useState({
    total_conversations: 1284,
    active_conversations: 3,
    resolved_conversations: 1250,
    escalated_conversations: 31,
    avg_messages_per_conversation: 5.4,
    daily_breakdown: [
      { date: "2026-07-15", conversations: 12 },
      { date: "2026-07-20", conversations: 35 },
      { date: "2026-07-25", conversations: 28 },
      { date: "2026-07-30", conversations: 50 },
      { date: "2026-08-05", conversations: 65 },
      { date: "2026-08-10", conversations: 85 },
      { date: "2026-08-12", conversations: 105 },
    ],
  });

  useEffect(() => {
    // Attempt to fetch from real API, fallback to mock data on failure
    fetch("http://localhost:8000/api/v1/analytics/overview", {
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      }
    })
      .then(res => {
        if (res.ok) return res.json();
        throw new Error("Failed to fetch");
      })
      .then(json => setData(json))
      .catch(err => console.error("Using mock analytics data (API unreachable)", err));
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Dashboard Overview</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
            <span className="text-2xl">💬</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.total_conversations}</div>
            <p className="text-xs text-muted-foreground">+20.1% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Now</CardTitle>
            <span className="text-2xl text-emerald-500">●</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.active_conversations}</div>
            <p className="text-xs text-muted-foreground">Visitors currently chatting</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Requires Attention</CardTitle>
            <span className="text-2xl">⚡</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.escalated_conversations}</div>
            <p className="text-xs text-muted-foreground">Escalated to human agents</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg. Messages</CardTitle>
            <span className="text-2xl">📊</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.avg_messages_per_conversation}</div>
            <p className="text-xs text-muted-foreground">Per conversation</p>
          </CardContent>
        </Card>
      </div>

      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Conversations Over Time</CardTitle>
          <CardDescription>Daily volume for the last 30 days</CardDescription>
        </CardHeader>
        <CardContent className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.daily_breakdown}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
              <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}`} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f0f1a', borderColor: '#333', borderRadius: '8px' }}
                itemStyle={{ color: '#8b5cf6' }}
              />
              <Line
                type="monotone"
                dataKey="conversations"
                stroke="#8b5cf6"
                strokeWidth={3}
                dot={{ r: 4, fill: "#8b5cf6", strokeWidth: 0 }}
                activeDot={{ r: 6, fill: "#6366f1", strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
