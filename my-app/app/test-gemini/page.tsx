"use client";

import { useState } from "react";

export default function TestGemini() {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const testGemini = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      setResponse(data.text || data.error);
    } catch (error) {
      setResponse("Error: " + error);
    }
    setLoading(false);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl mb-4">Test Gemini API</h1>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Enter your prompt..."
        className="w-full p-2 border rounded mb-4 text-black"
        rows={3}
      />
      <button
        onClick={testGemini}
        disabled={loading || !prompt}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? "Loading..." : "Test Gemini"}
      </button>
      {response && (
        <div className="mt-4 p-4 border rounded bg-gray-100 text-black">
          <strong>Response:</strong>
          <pre className="whitespace-pre-wrap mt-2">{response}</pre>
        </div>
      )}
    </div>
  );
}