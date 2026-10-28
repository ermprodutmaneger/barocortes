# Baro Cortes - Barbearia do Guilherme

Site profissional e landing page mobile-first para a **Baro Cortes**, idealizado para o link da bio do Instagram ([@baro_cortes](https://www.instagram.com/baro_cortes/)) e pedidos de agendamento via WhatsApp e pagamento online via Pix (Banco do Brasil).

---

## 💈 Recursos do Site

* **Design Mobile-First:** Rápido, leve e com visual moderno (preto, grafite e detalhes em azul elétrico).
* **Seletor Rápido de Dias:** Carrossel de toque único (Hoje, Amanhã, Sex, Sáb...) sem necessidade de abrir calendário.
* **Pagamento Pix Integrado:** Geração automática de QR Code no padrão Banco Central (BACEN) e código Pix Copia e Cola com o valor exato do corte embutido, direcionado para o CPF oficial do Guilherme (`51524549800`) no Banco do Brasil.
* **Agendamento no WhatsApp:** Preenchimento automático com nome, serviço, data brasileira (`DD/MM/AAAA`), horário e status de pagamento.
* **Caixinha pro Guilherme:** Cartão dedicado com moldura dourada premium para apoio voluntário — o cliente escolhe valores fixos ou digita qualquer valor e gera o Pix na hora. Também é possível adicionar a caixinha dentro do próprio checkout de pagamento.
* **Plano Mensal (R$ 100/mês):** Cartão de destaque com botão de adesão no WhatsApp e pagamento online.
* **Tabela de Serviços:** 7 serviços com seleção rápida e pré-preenchimento no formulário.
* **Galeria de Cortes:** Portfólio horizontal com fotos reais em alta resolução preservando proporções.
* **Localização e Contato:** WhatsApp, Instagram e mapa interativo em visão de satélite com marcador na Rua dos Pintados, 85 — Parque do Lago, São Paulo–SP; botão para traçar a rota no Google Maps.

---

## 🚀 Como subir este projeto para o seu GitHub

### Opção 1: Pelo Navegador (Sem comandos)
1. Crie um novo repositório no seu GitHub (ex: `baro-cortes`).
2. Clique no botão **"upload an existing file"** ou **"Add file" > "Upload files"**.
3. Arraste todos os arquivos e pastas descompactados deste pacote para a tela do GitHub.
4. Clique em **"Commit changes"**.

---

### Opção 2: Pelo Terminal / Git
Se preferir subir usando a linha de comando no seu computador:

```bash
git init
git add .
git commit -m "feat: site oficial Baro Cortes com agendamento e Pix"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/baro-cortes.git
git push -u origin main
```

---

## 🌐 Como conectar com o Netlify automaticamente

Ao subir o código no GitHub, você pode conectar o Netlify direto ao seu repositório:
1. No [Netlify](https://app.netlify.com/), clique em **"Add new site" > "Import an existing project"**.
2. Escolha **GitHub** e selecione o repositório `baro-cortes`.
3. O Netlify detectará as configurações do `netlify.toml` automaticamente.
4. Clique em **"Deploy site"**. A cada atualização que você fizer no GitHub, o Netlify atualiza o site sozinho!
