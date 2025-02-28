# PDF Invoice Data Extractor

[![Deno](https://img.shields.io/badge/Deno-1.41-blue.svg)](https://deno.land)

This tool converts PDF invoices to text and extracts structured data using OCR and AI. It's built with Deno and uses Tesseract.js for OCR and Ollama for AI-powered data extraction.

## Prerequisites

Before you begin, you'll need to install:

1. **Deno**
   - macOS (using Homebrew):
     ```bash
     curl -fsSL https://deno.land/install.sh | sh
     ```
   - Windows (using PowerShell):
     ```powershell
     irm https://deno.land/install.ps1 | iex
     ```
   - Linux:
     ```bash
     curl -fsSL https://deno.land/x/install/install.sh | sh
     ```

2. **pdftoppm** (part of Poppler Utils - for PDF to image conversion)
   - macOS:
     ```bash
     brew install poppler
     ```
   - Ubuntu/Debian:
     ```bash
     sudo apt-get install poppler-utils
     ```
   - Windows:
     - Download from: [Poppler for Windows](http://blog.alivate.com.au/poppler-windows/)
     - Add the bin directory to your PATH environment variable
   
   To verify installation:
   ```bash
   pdftoppm -v
   ```
   You should see something like: `pdftoppm version 23.11.0`

3. **Ollama** (for AI processing)
   - Follow installation instructions at: [Ollama Installation](https://ollama.ai/download)
   - After installation, pull the required model:
     ```bash
     ollama pull deepseek-r1:8b-llama-distill-q4_K_M
     ```

## How it Works

The tool uses several components to process your invoices:

1. **pdftoppm**: Converts PDF pages to high-quality PNG images
   - Part of Poppler Utils
   - Optimized for text extraction
   - Supports various output formats and resolutions

2. **Tesseract.js**: Performs OCR on the converted images
   - Extracts text from the PNG
   - Supports Spanish language processing
   - High accuracy with proper resolution settings

3. **Ollama**: AI-powered data extraction
   - Processes the extracted text
   - Identifies invoice fields
   - Outputs structured JSON data
   - Automatically normalizes dates and numbers

## Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/deno-facturas.git
   cd deno-facturas
   ```

2. The project uses Deno's built-in dependency management, so no additional installation steps are needed!

## Usage

Run the script with a PDF invoice file:

```bash
deno run main.ts /path/to/your/invoice.pdf
```

The script will:
1. Convert the PDF to a high-resolution image using pdftoppm (300 DPI)
2. Extract text using OCR (Optical Character Recognition)
3. Process the text using AI to extract structured data
4. Parse and validate the extracted JSON data
5. Save the results in two formats:
   - Console output with formatted JSON
   - JSON file next to the PDF (e.g., if you process `invoice.pdf`, it creates `invoice.json`)

### Example Output

```json
{
    "comprobante": 1234,
    "tipo": 1,
    "nombre": "Company Name",
    "fecha": "2024-01-01",
    "fechaVto": "2024-02-01",
    "numeroDocumento": "12345678",
    "condicionDePago": 0,
    "fechaComprobante": "2024-02-01",
    "productos": [
        {
            "nombre": "Product Description",
            "cantidad": 1,
            "precio": 100.00,
            "iva": 21
        }
    ]
}
```

## Features

- PDF to image conversion with pdftoppm (300 DPI resolution)
- Text extraction using Tesseract.js
- Structured data extraction using AI
- Support for Spanish invoices
- High-resolution processing for better accuracy
- Automatic error handling and validation
- JSON data processing:
  - Automatic extraction from AI response
  - Validation and parsing of JSON structure
  - Pretty-printed console output
  - Automatic file saving with source PDF name
  - Data normalization (dates, numbers, strings)

## Troubleshooting

### Common Issues

1. **PDF conversion fails**
   - Verify pdftoppm is installed: `pdftoppm -v`
   - Check if the PDF file is accessible and not corrupted
   - Ensure proper permissions on the input/output directories

2. **OCR quality is poor**
   - Current resolution is set to 300 DPI for optimal results
   - If needed, you can increase resolution by modifying the `-r` parameter in the code
   - Ensure the PDF is clearly scanned
   - Try cleaning up the PDF before processing

3. **AI model not found**
   - Verify Ollama is running: `ollama list`
   - Check if the model is properly pulled: `ollama pull deepseek-r1:8b-llama-distill-q4_K_M`

4. **JSON extraction fails**
   - Check if the AI response contains valid JSON
   - Verify the JSON structure matches the expected format
   - Ensure you have write permissions for saving the JSON file

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
