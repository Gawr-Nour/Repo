function exportarBancoDeDadosJSON() {
    let tx = db.transaction(["estoque", "freezer"], "readonly");
    let estoqueStore = tx.objectStore("estoque");
    let freezerStore = tx.objectStore("freezer");
    
    let dadosEstoque = [];
    let dadosFreezer = [];
    
    // Recupera todos os dados do estoque
    estoqueStore.openCursor().onsuccess = function (e) {
      let cursor = e.target.result;
      if (cursor) {
        dadosEstoque.push(cursor.value);
        cursor.continue();
      } else {
        // Quando terminar de pegar todos os dados do estoque, pega os dados do freezer
        freezerStore.openCursor().onsuccess = function (e) {
          let cursor = e.target.result;
          if (cursor) {
            dadosFreezer.push(cursor.value);
            cursor.continue();
          } else {
            // Quando terminar de pegar todos os dados do freezer, cria o arquivo JSON
            let dados = {
              estoque: dadosEstoque,
              freezer: dadosFreezer,
            };
            let json = JSON.stringify(dados, null, 2); // Formata com indentação
            baixarArquivo(json, "controle_frios_backup.json");
          }
        };
      }
    };
    }
    
    // Função para baixar o arquivo
    function baixarArquivo(conteudo, nomeArquivo) {
    let blob = new Blob([conteudo], { type: "application/json" });
    let url = URL.createObjectURL(blob);
    let a = document.createElement("a");
    a.href = url;
    a.download = nomeArquivo;
    a.click();
    URL.revokeObjectURL(url); // Libera o objeto URL após o download
    }
    
    function importarBancoJSON(){
      
      let input=document.createElement("input");
      
      input.type="file";
      
      input.accept="application/json";
      
      input.click();
      
      
      input.onchange=function(){
      
      let arquivo=input.files[0];
      
      if(!arquivo)return;
      
      
      let reader=new FileReader();
      
      
      reader.onload=function(e){
      
      try{
      
      let dados=JSON.parse(e.target.result);
      
      restaurarBanco(dados);
      
      }catch(err){
      
      alert("Arquivo inválido");
      
      }
      
      };
      
      
      reader.readAsText(arquivo);
      
      };
      
      }
      
      
      function restaurarBanco(dados){
      
      let tx=db.transaction(["estoque","freezer"],"readwrite");
      
      let estoqueStore=tx.objectStore("estoque");
      
      let freezerStore=tx.objectStore("freezer");
      
      
      // apagar dados antigos
      
      estoqueStore.clear();
      
      freezerStore.clear();
      
      
      tx.oncomplete=function(){
      
      let tx2=db.transaction(["estoque","freezer"],"readwrite");
      
      let estoqueStore2=tx2.objectStore("estoque");
      
      let freezerStore2=tx2.objectStore("freezer");
      
      
      // importar estoque
      
      if(dados.estoque){
      
      dados.estoque.forEach(item=>{
      
      estoqueStore2.add(item);
      
      });
      
      }
      
      
      // importar freezer
      
      if(dados.freezer){
      
      dados.freezer.forEach(item=>{
      
      freezerStore2.add(item);
      
      });
      
      }
      
      tx2.oncomplete=function(){
      
      alert("Backup restaurado com sucesso");
      
      mostrarEstoque();
      
      mostrarFreezer();
      
      };
      
      };
      
      }