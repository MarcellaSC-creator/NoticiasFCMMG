const API_URL =
  "https://script.google.com/macros/s/AKfycbxvi0Re1-5Ws6U4Xtu-DLpHLqrhyGwS8ZTGhZGX59OvwH5tinKCvBcmZbBmday284R2/exec";

let todasNoticias = [];

async function carregarNoticias() {
  const container = document.getElementById("newsContainer");
  container.innerHTML = "<p>Carregando notícias...</p>";

  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error("Erro ao carregar API");
    }

    const data = await response.json();

    todasNoticias = Array.isArray(data) ? data : [];

    ordenarNoticias(todasNoticias);
    renderizarNoticias(todasNoticias);

  } catch (error) {
    console.error("Erro completo:", error);

    container.innerHTML = `
      <p>Erro ao carregar notícias.</p>
      <small>Verifique se a API do Apps Script está publicada corretamente.</small>
    `;
  }
}

function renderizarNoticias(noticias) {
  const container = document.getElementById("newsContainer");

  if (!noticias || noticias.length === 0) {
    container.innerHTML = "<p>Nenhuma notícia encontrada.</p>";
    return;
  }

  container.innerHTML = noticias
    .map(noticia => `
      <article class="news-card">
        <h2>${escaparHTML(noticia.titulo || "Sem título")}</h2>

        <div class="meta">
          <strong>Data da notícia:</strong> ${formatarDataBr(noticia.dataNoticia)}<br>
          <strong>Fonte:</strong> ${escaparHTML(noticia.fonte || "Não identificada")}<br>
          <strong>Gatilho:</strong> ${escaparHTML(noticia.palavraChave || "-")}<br>
          <strong>Status:</strong> ${escaparHTML(noticia.status || "-")}
        </div>

        ${noticia.resumo ? `<p>${escaparHTML(noticia.resumo)}</p>` : ""}

        <a href="${noticia.link || "#"}" target="_blank" rel="noopener noreferrer">
          Acessar notícia
        </a>
      </article>
    `)
    .join("");
}

function ordenarNoticias(noticias) {
  noticias.sort((a, b) => {
    const dataA = converterData(a.dataNoticia);
    const dataB = converterData(b.dataNoticia);

    return dataB - dataA;
  });
}

function converterData(data) {
  if (!data) return 0;

  if (data instanceof Date) {
    return data.getTime();
  }

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

  const d = new Date(timestamp);

  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

function filtrarNoticias() {
  const input = document.getElementById("searchInput");
  const termo = input.value.toLowerCase().trim();

  if (!termo) {
    ordenarNoticias(todasNoticias);
    renderizarNoticias(todasNoticias);
    return;
  }

  const filtradas = todasNoticias.filter(noticia => {
    const texto = [
      noticia.titulo,
      noticia.fonte,
      noticia.palavraChave,
      noticia.status,
      noticia.resumo,
      noticia.dataNoticia
    ]
      .join(" ")
      .toLowerCase();

    return texto.includes(termo);
  });

  ordenarNoticias(filtradas);
  renderizarNoticias(filtradas);
}

function escaparHTML(texto) {
  return String(texto)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("searchInput");

  if (input) {
    input.addEventListener("input", filtrarNoticias);
  }

  carregarNoticias();
});
