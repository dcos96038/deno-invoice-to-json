import { createWorker } from "tesseract.js";
import ollama from "ollama";

if (Deno.args.length === 0) {
  console.error("Error: Please provide the path to the PDF file.");
  console.log("Usage: deno task dev /path/to/your/invoice.pdf");
  Deno.exit(1);
}

const pdfPath = Deno.args[0];

// Validate if file exists and is readable
try {
  await Deno.stat(pdfPath);
} catch (error) {
  if (error instanceof Deno.errors.NotFound) {
    console.error(`Error: The file "${pdfPath}" does not exist.`);
  } else {
    console.error(
      `Error: Unable to access "${pdfPath}". Make sure you have read permissions.`,
    );
  }
  Deno.exit(1);
}

try {
  // Use pdftoppm to convert PDF to PNG
  const pdftoppm = new Deno.Command("pdftoppm", {
    args: [
      "-png", // Output format
      "-singlefile", // Generate a single file
      "-r",
      "300", // Increased resolution for better OCR
      pdfPath, // Input PDF
    ],
  });

  const { code, stderr, stdout } = await pdftoppm.output();

  if (code !== 0) {
    const errorMessage = new TextDecoder().decode(stderr);
    throw new Error(`Failed to convert PDF: ${errorMessage}`);
  }

  console.log("Successfully converted PDF to PNG!");

  const worker = await createWorker("spa");

  try {
    const { data: { text } } = await worker.recognize(stdout);
    console.log("\nExtracted Text:");
    console.log("------------------------");
    console.log(text);
    console.log("------------------------");

    const response = await ollama.chat({
      model: "deepseek-r1:8b-llama-distill-q4_K_M",
      messages: [{
        role: "system",
        content: `
        You are a specialized invoice data extraction system. Your task is to analyze the provided invoice text and extract specific data fields into a structured JSON format. Follow these strict rules:

        1. OUTPUT FORMAT:
{
    "comprobante": number,        // Extract from 'Comp. Nro' or 'Comprobante N°'
    "tipo": 1,                   // Always 1 for Factura
    "nombre": string,            // Extract from 'Apellido y Nombre / Razón Social' or similar field
    "fecha": string,             // Extract from 'Fecha de Emisión' - Format YYYY-MM-DD
    "fechaVto": string,          // Extract from 'Fecha de Vto. para el pago' - Format YYYY-MM-DD
    "numeroDocumento": string,    // Extract CUIT/DNI number (NOT 33712201229)
    "condicionDePago": number,   // 1 for 'Cuenta Corriente', 0 for 'Contado'
    "fechaComprobante": string,  // Same as 'fechaVto' - Format YYYY-MM-DD
    "productos": [
        {{
            "nombre": string,     // Product name or service description
            "cantidad": number,   // Quantity as decimal number
            "precio": number,     // Unit price as decimal number
            "iva": number        // IVA percentage as number (e.g., 21 for 21%)
        }}
    ]
}

2. STRICT VALIDATION RULES:
- ALL fields are required
- Dates must be in YYYY-MM-DD format
- Numbers must be parsed as actual numbers (not strings)
- Remove any currency symbols, commas, and unnecessary spaces from numbers
- IVA should be a number (21 not 21%)
- Product arrays must contain all fields for each item

3. DATA NORMALIZATION:
- Convert all dates to YYYY-MM-DD format
- Trim all strings
- Remove special characters from strings
- Convert decimal separators to dots
- Remove currency symbols
- Convert percentage values to numbers

4. ERROR HANDLING:
- If a field is not found, use these defaults:
  * tipo: 1
  * condicionDePago: 0
  * fechaComprobante: same as fechaVto
- For missing products data, provide an empty array []

Here is the invoice text to process:
        `,
      }, {
        role: "user",
        content: text,
      }],
    });

    const jsonMatch = response.message.content.match(
      /```json\s*(\{[\s\S]*?\})\s*```/,
    );

    if (!jsonMatch) {
      throw new Error("Could not find JSON in AI response");
    }

    try {
      const extractedJson = JSON.parse(jsonMatch[1]);
      console.log("\nExtracted JSON Data:");
      console.log("------------------------");
      console.log(JSON.stringify(extractedJson, null, 2));

      const jsonPath = pdfPath.replace(/\.pdf$/i, ".json");
      await Deno.writeTextFile(
        jsonPath,
        JSON.stringify(extractedJson, null, 2),
      );
      console.log(`\nJSON data saved to: ${jsonPath}`);
    } catch (parseError: unknown) {
      if (parseError instanceof Error) {
        throw new Error(`Failed to parse JSON: ${parseError.message}`);
      }
      throw new Error("Failed to parse JSON: Unknown error");
    }
  } finally {
    await worker.terminate();
  }
} catch (error: unknown) {
  if (error instanceof Error) {
    console.error("Error processing PDF:", error.message);
  } else {
    console.error("An unknown error occurred while processing the PDF");
  }
  Deno.exit(1);
}
