# Site — Jonatan Vale (Maestro & Palestrante)

Este é um site estático pronto para GitHub Pages.

## Publicar no GitHub Pages
1. Crie um repositório no GitHub (ex.: `jonatan-vale-site`)
2. Faça upload de TODOS os arquivos deste projeto
3. No repositório: **Settings → Pages**
4. Em *Build and deployment*: selecione **Deploy from a branch**
5. Branch: `main` • Folder: `/ (root)`
6. Salve e aguarde o link do Pages

## Atualizar fotos
- Foto principal: `assets/img/jonatan-hero.jpg`
- Fundo: `assets/img/bg-bokeh.jpg`
- Imagem de compartilhamento: `assets/img/og-cover.jpg`

## Formulário (opcional com envio direto sem backend)
Por padrão o formulário usa `mailto:` (abre o cliente de e-mail do visitante).
Se quiser receber direto no e-mail sem backend, use Formspree:

1. Crie conta no Formspree e gere um endpoint (ex.: `https://formspree.io/f/xxxxxx`)
2. Substitua o `action="mailto:..."` por `action="https://formspree.io/f/xxxxxx"` em:
   - `contato.html`
   - `contratar.html`

## Rodapé
O rodapé mantém:
- © Vale Produção — Direitos reservados.
- Build automático (data/hora do visitante)
