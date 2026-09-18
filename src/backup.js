// Abrir e fechar modal de Backup
function abrirModalBackup() {
  document.getElementById("modalBackup").style.display = "flex";
}

function fecharModalBackup() {
  document.getElementById("modalBackup").style.display = "none";
}

// Exportar base de dados completa em JSON
function exportarBancoJSON() {
  let tx = db.transaction("prateleira", "readonly");
  let store = tx.objectStore("prateleira");
  let dados = [];

  store.openCursor().onsuccess = function (e) {
    let cursor = e.target.result;
    if (cursor) {
      dados.push(cursor.value);
      cursor.continue();
    } else {
      let jsonString = JSON.stringify(dados, null, 2);
      baixarArquivoJSON(jsonString, "backup_controle_estoque.json");
      fecharModalBackup();
    }
  };
}

// Auxiliar para acionar o download no dispositivo
function baixarArquivoJSON(conteudo, nomeArquivo) {
  let blob = new Blob([conteudo], { type: "application/json" });
  let url = URL.createObjectURL(blob);
  let a = document.createElement("a");
  a.href = url;
  a.download = nomeArquivo;
  a.click();
  URL.revokeObjectURL(url);
}

// Importar base de dados JSON via explorador de arquivos
function importarBancoJSON() {
  let input = document.createElement("input");
  input.type = "file";
  input.accept = "application/json";

  input.onchange = function (e) {
    let arquivo = e.target.files[0];
    if (!arquivo) return;

    let reader = new FileReader();
    reader.onload = function (evt) {
      try {
        let dados = JSON.parse(evt.target.result);
        if (Array.isArray(dados)) {
          restaurarBancoDados(dados);
        } else {
          alert("Estrutura de arquivo JSON inválida.");
        }
      } catch (err) {
        alert("Erro ao ler o arquivo JSON selecionado.");
      }
    };
    reader.readAsText(arquivo);
  };

  input.click();
}

// Substitui a base de dados pela do backup
function restaurarBancoDados(dados) {
  let tx = db.transaction("prateleira", "readwrite");
  let store = tx.objectStore("prateleira");

  store.clear(); // Limpa a base antiga

  tx.oncomplete = function () {
    let tx2 = db.transaction("prateleira", "readwrite");
    let store2 = tx2.objectStore("prateleira");

    dados.forEach((item) => {
      delete item.id; // Garante geração de novos IDs no autoIncrement
      store2.add(item);
    });

    tx2.oncomplete = function () {
      alert("Backup restaurado com sucesso!");
      fecharModalBackup();
      carregarPrateleira();
    };
  };
}