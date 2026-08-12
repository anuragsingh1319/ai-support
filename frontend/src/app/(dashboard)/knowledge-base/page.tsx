"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function KnowledgeBasePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Dummy data for presentation before real API integration
  const documents = [
    { id: "1", filename: "company_policies.pdf", status: "COMPLETED", date: "2026-08-12" },
    { id: "2", filename: "product_manual.md", status: "PROCESSING", date: "2026-08-13" },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate RAG vector search
    setSearchResults([
      { id: "s1", content: "Our return policy allows returns within 30 days of purchase..." },
      { id: "s2", content: "To reset your password, navigate to the settings page..." }
    ]);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Knowledge Base</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upload Document</CardTitle>
            <CardDescription>
              Upload PDF or text files to train your AI agent.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="file">File</Label>
                <Input id="file" type="file" accept=".pdf,.txt,.md,.csv" />
              </div>
              <Button type="button" className="w-full">Upload and Process</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test AI Retrieval (RAG)</CardTitle>
            <CardDescription>
              Ask a question to see what chunks the AI retrieves from your documents.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="grid gap-4">
              <div className="flex gap-2">
                <Input 
                  placeholder="e.g. What is the return policy?" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button type="submit">Search</Button>
              </div>
            </form>
            
            {searchResults.length > 0 && (
              <div className="mt-4 flex flex-col gap-3">
                <h3 className="text-sm font-medium text-muted-foreground">Top Retrieved Chunks:</h3>
                {searchResults.map((result) => (
                  <div key={result.id} className="rounded-md border p-3 text-sm bg-muted/20">
                    {result.content}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Processed Documents</CardTitle>
          <CardDescription>
            Manage the documents currently in your organization's vector database.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Filename</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date Uploaded</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium">{doc.filename}</TableCell>
                  <TableCell>
                    <Badge variant={doc.status === "COMPLETED" ? "default" : "secondary"}>
                      {doc.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{doc.date}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="text-destructive">
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
