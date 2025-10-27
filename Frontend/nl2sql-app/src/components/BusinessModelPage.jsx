import { useState, useRef } from "react";
import { motion } from "framer-motion";
import ERDiagram from "../components/ERDiagram";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function BusinessModelPage() {
  const [input, setInput] = useState("");
  const [parsedSchema, setParsedSchema] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const contentRef = useRef(null); // Reference for PDF export

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    setParsedSchema(null);

    try {
      const res = await fetch("http://localhost:8080/api/business-model", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelName: input }),
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      const data = await res.json();
      const parsed = JSON.parse(data.schemaDescription || "{}");

      parsed.entities = parsed.entities || [];
      parsed.relationships = parsed.relationships || [];
      parsed.description = parsed.description || "No description provided.";

      parsed.relationships = parsed.relationships.map((rel, i) => ({
        from: rel.from_entity || `Entity${i}`,
        to: rel.to_entity || `Entity${i}`,
        type: rel.type || "one-to-many",
      }));

      parsed.entities = parsed.entities.map((entity) => ({
        ...entity,
        attributes: (entity.attributes || []).map((attr) => ({
          name: attr.name,
          type: attr.data_type,
          primaryKey: attr.PK,
          foreignKey: attr.FK,
          autoIncrement: attr.AI,
          unique: attr.unique,
          notNull: attr.not_null,
        })),
      }));

      setParsedSchema(parsed);
    } catch (err) {
      console.error("❌ Error fetching schema:", err);
      setError("Failed to fetch or parse schema.");
    }

    setLoading(false);
  };

  // Export PDF
  const erDiagramRef = useRef(null);
const handleExportPDF = async () => {
  if (!parsedSchema) return;

  const { entities, relationships, description } = parsedSchema;

  const pdf = new jsPDF({
    orientation: "p",
    unit: "pt",
    format: "a4",
  });

  pdf.setFont("Times", "normal");
  let y = 40;

  pdf.setFontSize(20);
  pdf.text("Business Model → Database Schema", 40, y);
  y += 30;

  // --- Entities ---
  pdf.setFontSize(16);
  pdf.text("Entities", 40, y);
  y += 20;
  pdf.setFontSize(12);

  entities.forEach((entity) => {
    pdf.setFont("Times", "bold");
    pdf.text(`• ${entity.name}`, 50, y);
    y += 16;
    pdf.setFont("Times", "normal");

    (entity.attributes || []).forEach((attr) => {
      let attrLine = `   - ${attr.name} (${attr.type || "N/A"})`;
      if (attr.primaryKey) attrLine += " [PK]";
      if (attr.foreignKey) attrLine += ` [FK → ${attr.foreignKey}]`;
      if (attr.autoIncrement) attrLine += " [AI]";
      if (attr.unique) attrLine += " [UQ]";
      if (attr.notNull) attrLine += " [NOT NULL]";

      pdf.text(attrLine, 60, y);
      y += 14;
      if (y > 780) {
        pdf.addPage();
        y = 40;
      }
    });
    y += 8;
  });

  // --- Relationships ---
  pdf.addPage();
  y = 40;
  pdf.setFontSize(16);
  pdf.text("Relationships", 40, y);
  y += 20;
  pdf.setFontSize(12);
  relationships.forEach((rel) => {
    pdf.text(`• ${rel.from} → ${rel.to} (${rel.type})`, 50, y);
    y += 16;
    if (y > 780) {
      pdf.addPage();
      y = 40;
    }
  });

  // --- Description ---
  pdf.addPage();
  y = 40;
  pdf.setFontSize(16);
  pdf.text("Description", 40, y);
  y += 20;
  pdf.setFontSize(12);
  const textLines = pdf.splitTextToSize(description, 500);
  pdf.text(textLines, 50, y);
  y += textLines.length * 14;

  // --- ER Diagram ---
  try {
    const diagram = document.querySelector(".react-flow__renderer")?.parentElement;
    if (diagram) {
      const canvas = await html2canvas(diagram, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");

      pdf.addPage();
      pdf.setFont("Times", "bold");
      pdf.setFontSize(16);
      pdf.text("ER Diagram", 40, 40);
      pdf.addImage(imgData, "PNG", 40, 60, 500, 400);
    } else {
      pdf.addPage();
      pdf.text("(ER Diagram could not be captured)", 40, 60);
    }
  } catch (err) {
    console.error("Error exporting ER diagram:", err);
    pdf.addPage();
    pdf.text("(ER Diagram export failed)", 40, 60);
  }

  pdf.save("BusinessModel.pdf");
};





  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
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

      <div className="mt-10">
        <textarea
          className="w-full p-4 rounded-2xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          rows={5}
          placeholder="Describe your business model..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
      </div>

      <div className="flex justify-center mt-10 mb-10 gap-4">
        <button
          onClick={handleGenerate}
          disabled={loading}
          className={`px-6 py-2 rounded-2xl bg-gradient-to-r from-blue-500 to-violet-500 text-white font-medium shadow-lg transition ${loading ? "opacity-70 cursor-not-allowed" : "hover:scale-105"
            }`}
        >
          {loading ? "Generating..." : "Generate Database"}
        </button>

        {parsedSchema && (
          <button
            onClick={handleExportPDF}
            className="px-6 py-2 rounded-2xl bg-gradient-to-r from-violet-500 to-blue-500 text-white font-medium shadow-lg hover:scale-105 transition"
          >
            Export All as PDF
          </button>
        )}
      </div>

      {error && <p className="text-center text-red-500 font-medium mb-10">{error}</p>}

      {parsedSchema && (
        <div ref={contentRef} className="mt-14 space-y-12">
          {/* Entities */}
          <div>
            <h2 className="text-3xl font-bold mb-4 grad-text">Entities</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {parsedSchema.entities.map((entity, idx) => (
                <div
                  key={idx}
                  className="p-6 rounded-2xl bg-white/90 dark:bg-gray-800/90 shadow-lg border border-gray-200 dark:border-gray-700"
                >
                  <h3 className="text-xl font-semibold text-indigo-600 dark:text-indigo-400">
                    {entity.name || "Unnamed Entity"}
                  </h3>
                  <ul className="mt-3 list-disc list-inside text-gray-700 dark:text-gray-300">
                    {entity.attributes.map((attr, i) => (
                      <li key={i}>
                        {attr.name} ({attr.type})
                        {attr.primaryKey && " PK"}
                        {attr.autoIncrement && " AI"}
                        {attr.unique && " UQ"}
                        {attr.foreignKey && ` FK → ${attr.foreignKey}`}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Relationships */}
          <div>
            <h2 className="text-3xl font-bold mb-4 grad-text">Relationships</h2>
            <ul className="space-y-3 text-gray-700 dark:text-gray-300">
              {parsedSchema.relationships.length > 0 ? (
                parsedSchema.relationships.map((rel, idx) => (
                  <li
                    key={idx}
                    className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900 shadow"
                  >
                    <strong>{rel.from}</strong> → <strong>{rel.to}</strong> ({rel.type})
                  </li>
                ))
              ) : (
                <li>No relationships found.</li>
              )}
            </ul>
          </div>

          {/* Description */}
          <div>
            <h2 className="text-3xl font-bold mb-4 grad-text">Description</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {parsedSchema.description}
            </p>
          </div>

          {/* ER Diagram */}
          <div id="er-diagram-container">
            <h2 className="text-3xl font-bold mb-4 grad-text">ER Diagram</h2>
          <ERDiagram ref={erDiagramRef} schema={parsedSchema} />

          </div>
        </div>
      )}
    </div>
  );
}
