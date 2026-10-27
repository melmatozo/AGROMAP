// Login: só e-mail e senha, validados no servidor (api.php + MySQL).
const formulario = document.getElementById("loginForm");
const mensagem = document.getElementById("mensagem");
 
formulario.addEventListener("submit", async function (event) {
    event.preventDefault();
    mensagem.textContent = "";
    mensagem.className = "";
 
    const botao = formulario.querySelector("button[type=submit]");
    botao.disabled = true;
 
    try {
        const resposta = await fetch("api.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                acao: "login",
                email: document.getElementById("email").value.trim(),
                senha: document.getElementById("senha").value
            })
        });
 
        const texto = await resposta.text();
        let resultado;
 
        try {
            resultado = JSON.parse(texto);
        } catch (e) {
            console.error("Resposta inesperada do servidor:", texto);
            throw new Error("O servidor não respondeu como esperado. Abra o site por http://localhost (PHP), não direto pelo arquivo.");
        }
 
        if (resultado.sucesso) {
            mensagem.textContent = "Login realizado!";
            mensagem.className = "ok";
            setTimeout(function () { window.location.href = "dashboard.html"; }, 700);
        } else {
            mensagem.textContent = resultado.mensagem;
            mensagem.className = "erro";
            botao.disabled = false;
        }
    } catch (erro) {
        console.error(erro);
        mensagem.textContent = erro.message || "Erro ao conectar ao sistema.";
        mensagem.className = "erro";
        botao.disabled = false;
    }
});
 