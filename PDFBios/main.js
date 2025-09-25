const { Liquid } = require("liquidjs");
const juice = require("juice");
const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const readline = require("readline");

function askFileName(callback) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question("Digite o nome do arquivo de saída (ex: relatorio): ", (answer) => {
    rl.close();
    callback(answer || "PDF gerado.pdf");
  });
}

async function gerarPDF(htmlPath, cssPath, jsonPath, outputPath) {
  // 1) Ler HTML e CSS
  const htmlTemplate = fs.readFileSync(path.resolve(htmlPath), "utf8");
  const cssCode = fs.readFileSync(path.resolve(cssPath), "utf8");

  // 2) Ler JSON (se existir conteúdo válido)
  let jsonData = {};
  try {
    const rawJson = fs.readFileSync(path.resolve(jsonPath), "utf8").trim();
    if (rawJson) {
      jsonData = JSON.parse(rawJson);
    }
  } catch (err) {
    jsonData = {};
  }

  // 3) LiquidJS
  const engine = new Liquid();
  const renderedHtml = await engine.parseAndRender(htmlTemplate, jsonData);

  // 4) Injetar CSS inline
  const finalHtml = juice.inlineContent(renderedHtml, cssCode);

  // 5) Puppeteer
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(finalHtml, { waitUntil: "networkidle0" });

  await page.pdf({
    path: outputPath,
    format: "A4",
    printBackground: true,
  });

  await browser.close();
  console.log(`✅ PDF gerado em: ${outputPath}`);
}

askFileName((outputFile) => {
  gerarPDF("template.html", "style.css", "var.json", outputFile + '.pdf');
});