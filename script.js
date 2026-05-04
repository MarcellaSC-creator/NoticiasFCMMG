const API_URL =
  "https://script.google.com/macros/s/AKfycbxvi0Re1-5Ws6U4Xtu-DLpHLqrhyGwS8ZTGhZGX59OvwH5tinKCvBcmZbBmday284R2/exec";

let todasNoticias = [];
let rankingVeiculos = [];

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("refreshButton").addEventListener("click", carregarTudo);
  document.getElementById("searchInput").addEventListener("input", aplicarFiltros);
  document.getElementById("sentimentFilter").addEventListener("change", aplicarFiltros);
  document.getElementById("categoryFilter").addEventListener("change", aplicarFiltros);

  carregarTudo();
});

async function carregarTudo() {
  await Promise.all([
    carregarNoticias(),
    carregarRanking()
  ]);
}

async function carregarNoticias() {
  const container = document.getElementById("newsContainer");
  container.innerHTML = "<p>Carregando notícias...</p>";

  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error("Erro ao carregar notícias.");
    }

    const data = await response.json();

    todasNoticias = Array.isArray(data) ? data : [];

    ordenarNoticias(todasNoticias);
    atualizarResumo(todasNoticias);
    aplicarFiltros();

  } catch (error) {
    console.error("Erro ao carregar notícias:", error);
    container.innerHTML = `
      <div class="error">
        Erro ao carregar notícias. Verifique se a API do Apps Script está publicada corretamente.
      </div>
    `;
  }
}

async function carregarRanking() {
  const container = document.getElementById("rankingContainer");
  container.innerHTML = "<p>Carregando ranking...</p>";

  try {
    const response = await fetch(`${API_URL}?action=ranking`);

    if (!response.ok) {
      throw new Error("Erro ao carregar ranking.");
    }

    const data = await response.json();

    rankingVeiculos = Array.isArray(data) ? data : [];

    renderizarRanking(rankingVeiculos);

  } catch (error) {
    console.error("Erro ao carregar ranking:", error);
    container.innerHTML = `
      <div class="error">
        Erro ao carregar ranking. Verifique a rota ?action=ranking da API.
      </div>
    `;
  }
}

function aplicarFiltros() {
  const termo = document.getElementById("searchInput").value.toLowerCase().trim();
  const sentimento = document.getElementById("sentimentFilter").value.toLowerCase();
  const categoria = document.getElementById("categoryFilter").value.toLowerCase();

  let filtradas = [...todasNoticias];

  if (termo) {
    filtradas = filtradas.filter(noticia => {
      const texto = [
        noticia.titulo,
        noticia.fonte,
        noticia.palavraChave,
        noticia.status,
        noticia.resumo,
        noticia.origem,
        noticia.sentimento,
        noticia.categoria,
        noticia.dataNoticia
      ]
        .join(" ")
        .toLowerCase();

      return texto.includes(termo);
    });
  }

  if (sentimento) {
    filtradas = filtradas.filter(noticia =>
      normalizar(noticia.sentimento) === sentimento
    );
  }

  if (categoria) {
    filtradas = filtradas.filter(noticia =>
      normalizar(noticia.categoria) === categoria
    );
  }

  ordenarNoticias(filtradas);
  renderizarNoticias(filtradas);
}

function renderizarNoticias(noticias) {
  const container = document.getElementById("newsContainer");

  if (!noticias || noticias.length === 0) {
    container.innerHTML = `<div class="empty">Nenhuma notícia encontrada.</div>`;
    return;
  }

  container.innerHTML = noticias.map(noticia => {
    const sentimento = noticia.sentimento || "Neutro";
    const categoria = noticia.categoria || "Outros";

    return `
      <article class="news-card">
        <h3>${escaparHTML(noticia.titulo || "Sem título")}</h3>

        <div class="meta">
          <strong>Data da notícia:</strong> ${formatarDataBr(noticia.dataNoticia)}<br>
          <strong>Fonte:</strong> ${escaparHTML(noticia.fonte || "Não identificada")}<br>
          <strong>Origem da captura:</strong> ${escaparHTML(noticia.origem || "-")}<br>
          <strong>Gatilho:</strong> ${escaparHTML(noticia.palavraChave || "-")}
        </div>

        <div class="badges">
          <span class="badge ${normalizar(sentimento)}">${escaparHTML(sentimento)}</span>
          <span class="badge">${escaparHTML(categoria)}</span>
        </div>

        ${noticia.resumo ? `<p>${escaparHTML(noticia.resumo)}</p>` : ""}

        <a href="${noticia.link || "#"}" target="_blank" rel="noopener noreferrer">
          Acessar notícia
        </a>
      </article>
    `;
  }).join("");
}

function renderizarRanking(ranking) {
  const container = document.getElementById("rankingContainer");

  if (!ranking || ranking.length === 0) {
    container.innerHTML = `<div class="empty">Nenhum dado de ranking disponível.</div>`;
    return;
  }

  container.innerHTML = `
    <table class="ranking-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Veículo</th>
          <th>Total</th>
          <th>Positivas</th>
          <th>Neutras</th>
          <th>Negativas</th>
        </tr>
      </thead>
      <tbody>
        ${ranking.map((item, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${escaparHTML(item.fonte || "-")}</td>
            <td>${item.total || 0}</td>
            <td>${item.positivas || 0}</td>
            <td>${item.neutras || 0}</td>
            <td>${item.negativas || 0}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function atualizarResumo(noticias) {
  const total = noticias.length;

  const positivas = noticias.filter(n => normalizar(n.sentimento) === "positivo").length;
  const neutras = noticias.filter(n => normalizar(n.sentimento) === "neutro").length;
  const negativas = noticias.filter(n => normalizar(n.sentimento) === "negativo").length;

  document.getElementById("totalNoticias").textContent = total;
  document.getElementById("totalPositivas").textContent = positivas;
  document.getElementById("totalNeutras").textContent = neutras;
  document.getElementById("totalNegativas").textContent = negativas;
}

function ordenarNoticias(lista) {
  lista.sort((a, b) => converterData(b.dataNoticia) - converterData(a.dataNoticia));
}

function converterData(data) {
  if (!data) return 0;

  const texto = String(data).trim();
  let d = new Date(texto);

  if (!isNaN(d.getTime())) {
    return d.getTime();
  }

  const match = texto.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?$/
  );

  if (match) {
    const [, ano, mes, dia, hora = "00", minuto = "00", segundo = "00"] = match;

    d = new Date(
      Number(ano),
      Number(mes) - 1,
      Number(dia),
      Number(hora),
      Number(minuto),
      Number(segundo)
    );

    return d.getTime();
  }

  return 0;
}

function formatarDataBr(data) {
  const timestamp = converterData(data);

  if (!timestamp) {
    return data || "Data não informada";
  }

  return new Date(timestamp).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

function normalizar(texto) {
  return String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function escaparHTML(texto) {
  return String(texto)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
