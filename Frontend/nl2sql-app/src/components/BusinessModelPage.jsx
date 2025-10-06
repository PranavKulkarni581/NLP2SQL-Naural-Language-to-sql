import { useState } from "react";
import { motion } from "framer-motion";

export default function BusinessModelPage() {
  const [input, setInput] = useState("");
  const [schema, setSchema] = useState(null);
  const [parsedSchema, setParsedSchema] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    const res = await fetch("http://localhost:8080/api/business-model", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ modelName: input }),
    });
    const data = await res.json();
    setSchema(data);

    try {
      const parsed = JSON.parse(data.schemaDescription); // 👈 convert string → JSON
      setParsedSchema(parsed);
    } catch (err) {
      console.error("Failed to parse schemaDescription", err);
      setParsedSchema(null);
    }

    setLoading(false);
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      {/* Title with same styling as Hero */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight text-center"
      >
        <span className="grad-text">Business Model</span> →{" "}
        <span className="">Database Schema</span>
      </motion.h1>

      {/* Input */}
      <div className="mt-10">
        <textarea
          className="w-full p-4 rounded-2xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          rows={5}
          placeholder="Describe your business model (e.g., e-commerce store with products, orders, customers)..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
      </div>

      {/* Button */}
      <div className="flex justify-center mt-20 mb-40">
        <button
          onClick={handleGenerate}
          className="px-8 py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-violet-500 text-white font-medium shadow-lg hover:scale-105 transition"
        >
          {loading ? "Generating..." : "Generate Database"}
        </button>
      </div>

      {/* Results */}
      {parsedSchema && (
        <div className="mt-14 space-y-12">
          {/* Entities */}
          <div>
            <h2 className="text-3xl font-bold mb-4 grad-text">Entities</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {parsedSchema.entities.map((entity, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className="p-6 rounded-2xl bg-white/90 dark:bg-gray-800/90 shadow-lg border border-gray-200 dark:border-gray-700"
                >
                  <h3 className="text-xl font-semibold text-indigo-600 dark:text-indigo-400">
                    {entity.name}
                  </h3>
                  <ul className="mt-3 list-disc list-inside text-gray-700 dark:text-gray-300">
                    {entity.attributes.map((attr, i) => (
                      <li key={i}>{attr}</li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Relationships */}
          <div>
            <h2 className="text-3xl font-bold mb-4 grad-text">Relationships</h2>
            <ul className="space-y-3 text-gray-700 dark:text-gray-300">
              {parsedSchema.relationships.map((rel, idx) => (
                <li key={idx} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900 shadow">
                  <strong>{rel.from}</strong> → <strong>{rel.to}</strong> ({rel.type})
                </li>
              ))}
            </ul>
          </div>

          {/* Description */}
          <div>
            <h2 className="text-3xl font-bold mb-4 grad-text">Description</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {parsedSchema.description}
            </p>
          </div>

          {/* ER Diagram (textual for now) */}
          {parsedSchema.erDiagram && (
            <div>
              <h2 className="text-3xl font-bold mb-4 grad-text">ER Diagram (Textual)</h2>
              <pre className="p-4 bg-gray-900 text-green-400 rounded-lg overflow-x-auto">
                {parsedSchema.erDiagram}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
