"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const mockTools = [
  {
    id: "1",
    name: "check_order_status",
    description: "Look up a customer's order status using their order ID.",
    api_endpoint: "https://api.store.com/v1/orders/status",
  },
  {
    id: "2",
    name: "process_refund",
    description: "Initiate a refund for a specific order ID.",
    api_endpoint: "https://api.store.com/v1/orders/refund",
  }
];

export default function ToolsPage() {
  const [tools, setTools] = useState(mockTools);
  const [isAdding, setIsAdding] = useState(false);
  const [newTool, setNewTool] = useState({ name: "", description: "", api_endpoint: "", auth_header_name: "", auth_header_value: "" });

  useEffect(() => {
    fetch("http://localhost:8000/api/v1/tools/", {
      headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
    })
      .then(res => res.ok ? res.json() : [])
      .then(json => { if (json.length > 0) setTools(json); })
      .catch(err => console.error("Using mock tools data", err));
  }, []);

  const handleAddTool = () => {
    if (!newTool.name || !newTool.api_endpoint) return;
    
    fetch("http://localhost:8000/api/v1/tools/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify(newTool)
    })
    .then(res => res.ok ? res.json() : null)
    .then(savedTool => {
      if (savedTool) {
        setTools([...tools, savedTool]);
      } else {
        setTools([...tools, { id: Math.random().toString(), ...newTool }]);
      }
    })
    .catch(() => setTools([...tools, { id: Math.random().toString(), ...newTool }]));

    setIsAdding(false);
    setNewTool({ name: "", description: "", api_endpoint: "", auth_header_name: "", auth_header_value: "" });
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Agent Tools</h1>
          <p className="text-sm text-muted-foreground mt-1">Configure external APIs that your AI agents can call.</p>
        </div>
        <Button onClick={() => setIsAdding(!isAdding)}>
          {isAdding ? "Cancel" : "+ Add Tool"}
        </Button>
      </div>

      {isAdding && (
        <Card className="border-primary/50 shadow-[0_0_15px_rgba(139,92,246,0.1)]">
          <CardHeader>
            <CardTitle className="text-lg">Add New Tool</CardTitle>
            <CardDescription>Define how the AI should call your external webhook.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Function Name (no spaces)</label>
                <input 
                  className="rounded-md border bg-muted/50 px-3 py-2 text-sm outline-none focus:border-primary/50" 
                  placeholder="e.g. get_shipping_status"
                  value={newTool.name}
                  onChange={e => setNewTool({...newTool, name: e.target.value})}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">API Endpoint (URL)</label>
                <input 
                  className="rounded-md border bg-muted/50 px-3 py-2 text-sm outline-none focus:border-primary/50" 
                  placeholder="https://api.yourdomain.com/webhook"
                  value={newTool.api_endpoint}
                  onChange={e => setNewTool({...newTool, api_endpoint: e.target.value})}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Description (Tell the AI when to use this)</label>
              <textarea 
                className="rounded-md border bg-muted/50 px-3 py-2 text-sm outline-none focus:border-primary/50 min-h-[80px]" 
                placeholder="Use this tool when a user asks where their package is. Requires an order_id."
                value={newTool.description}
                onChange={e => setNewTool({...newTool, description: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-muted-foreground">Auth Header Name (Optional)</label>
                <input 
                  className="rounded-md border bg-muted/30 px-3 py-2 text-sm outline-none focus:border-primary/50" 
                  placeholder="e.g. Authorization"
                  value={newTool.auth_header_name}
                  onChange={e => setNewTool({...newTool, auth_header_name: e.target.value})}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-muted-foreground">Auth Header Value (Optional)</label>
                <input 
                  className="rounded-md border bg-muted/30 px-3 py-2 text-sm outline-none focus:border-primary/50" 
                  placeholder="e.g. Bearer sk_12345"
                  type="password"
                  value={newTool.auth_header_value}
                  onChange={e => setNewTool({...newTool, auth_header_value: e.target.value})}
                />
              </div>
            </div>
            <div className="flex justify-end mt-2">
              <Button onClick={handleAddTool}>Save Tool</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {tools.map(tool => (
          <Card key={tool.id} className="bg-card/50">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base text-primary font-mono">{tool.name}</CardTitle>
                  <CardDescription className="mt-1">{tool.api_endpoint}</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-400/10" onClick={() => setTools(tools.filter(t => t.id !== tool.id))}>
                  Delete
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground/80">{tool.description}</p>
            </CardContent>
          </Card>
        ))}
        {tools.length === 0 && !isAdding && (
          <div className="text-center py-12 text-muted-foreground border rounded-xl border-dashed">
            No tools configured yet.
          </div>
        )}
      </div>
    </div>
  );
}
