import express from "express";
import { Liquid } from "liquidjs";
import juice from "juice";
import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";

const app = express();
app.use(express.json());
app.use(express.static(".")); // serve template.html, style.css, var.json, etc.

const __dirname = path.resolve();

app.post("/gerar", async (req, res) => {
  try {
    const { html = "template.html", css = "style.css", json = "var.json", nome = "relatorio" } = req.body;

    // Ler arquivos
    const htmlTemplate = fs.readFileSync(path.resolve(html), "utf8");
    const cssCode = fs.readFileSync(path.resolve(css), "utf8");
    const jsonData = JSON.parse(fs.readFileSync(path.resolve(json), "utf8"));

    // LiquidJS
    const engine = new Liquid();
    const renderedHtml = await engine.parseAndRender(htmlTemplate, jsonData);

    // Inserir CSS inline
    const finalHtml = juice.inlineContent(renderedHtml, cssCode);

    // Gerar PDF com Puppeteer
    const outputFile = `${nome}.pdf`;
    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"], // necessário no Cloud Run
    });
    const page = await browser.newPage();
    await page.setContent(finalHtml, { waitUntil: "networkidle0" });
    await page.pdf({
      path: outputFile,
      format: "A4",
      printBackground: true,
    });
    await browser.close();

    res.download(outputFile, outputFile, () => fs.unlinkSync(outputFile));
  } catch (error) {
    console.error(error);
    res.status(500).send("Erro ao gerar PDF");
  }
});

// Rota raiz só pra testar!!!!!!!!!!!
app.get("/", (req, res) => {
  res.send(`<h1>Servidor rodando ✅</h1><p>Hello World</p>`);
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
